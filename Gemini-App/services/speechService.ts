// @ts-nocheck // Disable TypeScript checking for SpeechRecognition vendor prefixes

import { generateSpeechAudioFromGemini } from './geminiService';
import { Emotion } from '../types';

let recognition: SpeechRecognition | null = null;
let synthesis = window.speechSynthesis;
let preferredVoices: SpeechSynthesisVoice[] = [];

let audioContext: AudioContext | null = null;

interface SpeechLifecycleCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error?: any) => void;
}

let currentSpeechLifecycleCallbacks: SpeechLifecycleCallbacks | null = null;
let activePcmSourceNode: AudioBufferSourceNode | null = null;
let activeBrowserUtterance: SpeechSynthesisUtterance | null = null;


const getAudioContext = (): AudioContext | null => {
  if (audioContext && audioContext.state !== 'closed') {
    return audioContext;
  }
  try {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    return audioContext;
  } catch (e) {
    console.error("[Speech Service] Error creating AudioContext:", e);
    return null;
  }
};


if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.lang = 'en-US';
  recognition.interimResults = false;
} else {
  console.warn("Speech Recognition API not supported in this browser.");
}

const loadVoices = () => {
  if (!synthesis) return;
  let voices = synthesis.getVoices();
  if (voices.length > 0) {
    preferredVoices = voices.filter(voice =>
      voice.lang.startsWith('en') &&
      (voice.name.toLowerCase().includes('female') ||
       voice.name.toLowerCase().includes('zira') ||
       voice.name.toLowerCase().includes('susan') ||
       voice.name.toLowerCase().includes('joanna') ||
       voice.name.toLowerCase().includes('kendra') ||
       voice.name.toLowerCase().includes('kimberly') ||
       voice.name.toLowerCase().includes('salli') ||
       voice.name.toLowerCase().includes('google us english')
      )
    ).sort((a, b) => {
      const aIsPreferred = a.name.toLowerCase().includes('natural') || a.name.toLowerCase().includes('enhanced');
      const bIsPreferred = b.name.toLowerCase().includes('natural') || b.name.toLowerCase().includes('enhanced');
      if (aIsPreferred && !bIsPreferred) return -1;
      if (!aIsPreferred && bIsPreferred) return 1;
      return 0;
    });
    if (preferredVoices.length === 0) {
        preferredVoices = voices.filter(voice => voice.lang.startsWith('en')).slice(0, 5);
    }
  }
};

if (synthesis) {
    loadVoices(); 
    if (synthesis.onvoiceschanged !== undefined) {
        synthesis.onvoiceschanged = loadVoices;
    } else {
        setTimeout(loadVoices, 500);
    }
}

export const startListening = (
  onResult: (transcript: string) => void,
  onFinalResult: (transcript: string) => void,
  onError: (error: SpeechRecognitionErrorEvent) => void
): void => {
  if (!recognition) {
    onError({ error: 'Speech recognition not supported' } as SpeechRecognitionErrorEvent);
    return;
  }

  let finalTranscript = '';

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      }
    }
  };

  recognition.onend = () => {
    onFinalResult(finalTranscript.trim());
    finalTranscript = '';
  };

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    onError(event);
  };

  try {
    recognition.start();
  } catch (e) {
    console.error("Error starting speech recognition:", e);
    onError({ error: 'Failed to start recognition' } as SpeechRecognitionErrorEvent);
  }
};

export const stopListening = (): void => {
  if (recognition) {
    recognition.stop();
  }
};

const triggerSpeechLifecycleEnd = (reason: string) => {
  if (currentSpeechLifecycleCallbacks?.onEnd) {
    console.log(`[Speech Service] Triggering onEnd callback due to: ${reason}`);
    const callback = currentSpeechLifecycleCallbacks.onEnd;
    currentSpeechLifecycleCallbacks = null; 
    activePcmSourceNode = null;
    activeBrowserUtterance = null;
    callback();
  } else {
    // console.log(`[Speech Service] Wanted to trigger onEnd (reason: ${reason}), but no onEnd callback was set or already cleared.`);
    currentSpeechLifecycleCallbacks = null; // Ensure cleared anyway
    activePcmSourceNode = null;
    activeBrowserUtterance = null;
  }
};

const triggerSpeechLifecycleError = (reason: string, errorDetails?: any) => {
  if (currentSpeechLifecycleCallbacks?.onError) {
    console.log(`[Speech Service] Triggering onError callback due to: ${reason}`, errorDetails);
    const callback = currentSpeechLifecycleCallbacks.onError;
    currentSpeechLifecycleCallbacks = null;
    activePcmSourceNode = null;
    activeBrowserUtterance = null;
    callback(errorDetails);
  } else if (currentSpeechLifecycleCallbacks?.onEnd) { // Fallback to onEnd if onError is not provided
    console.warn(`[Speech Service] onError triggered (reason: ${reason}), but no onError callback. Falling back to onEnd.`);
    triggerSpeechLifecycleEnd(`error fallback: ${reason}`);
  } else {
    // console.log(`[Speech Service] Wanted to trigger onError (reason: ${reason}), but no onError/onEnd callback was set or already cleared.`);
    currentSpeechLifecycleCallbacks = null; // Ensure cleared anyway
    activePcmSourceNode = null;
    activeBrowserUtterance = null;
  }
};


export const cancelCurrentSpeech = (): void => {
  console.log("[Speech Service] cancelCurrentSpeech invoked.");
  let speechWasActive = false;

  if (activePcmSourceNode) {
    console.log("[Speech Service] cancelCurrentSpeech: Stopping active PCM playback.");
    speechWasActive = true;
    try {
      activePcmSourceNode.onended = null; 
      activePcmSourceNode.stop();
    } catch (e) { console.warn("[Speech Service] Error stopping PCM source node during cancel:", e); }
  }

  if (activeBrowserUtterance) {
    console.log("[Speech Service] cancelCurrentSpeech: Cancelling active browser TTS utterance.");
    speechWasActive = true;
    activeBrowserUtterance.onend = null; 
    activeBrowserUtterance.onerror = null;
    if (synthesis && (synthesis.speaking || synthesis.pending)) {
      synthesis.cancel();
    }
  }
  
  // If speech was active OR a callback set exists, trigger the onEnd (treating cancellation as a form of completion).
  if (speechWasActive || currentSpeechLifecycleCallbacks) {
    triggerSpeechLifecycleEnd("explicit cancellation via cancelCurrentSpeech");
  } else {
    // console.log("[Speech Service] cancelCurrentSpeech found no active speech to cancel and no pending callback.");
  }
};

const playPcmData = (base64PcmData: string): void => {
  const localAudioContext = getAudioContext();
  if (!localAudioContext) {
    console.error("[Speech Service] Cannot play PCM data: AudioContext not available.");
    triggerSpeechLifecycleError("PCM play error - no AudioContext");
    return;
  }

  try {
    const byteCharacters = atob(base64PcmData);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const pcmArrayBuffer = byteArray.buffer;

    const sampleRate = 24000;
    const numChannels = 1;
    const bytesPerSample = 2; 
    const numFrames = pcmArrayBuffer.byteLength / (numChannels * bytesPerSample);

    const audioBuffer = localAudioContext.createBuffer(numChannels, numFrames, sampleRate);
    const pcmDataView = new DataView(pcmArrayBuffer);
    const float32Data = new Float32Array(numFrames);
    for (let i = 0; i < numFrames; i++) {
      const sample = pcmDataView.getInt16(i * bytesPerSample, true); 
      float32Data[i] = sample / 32768.0; 
    }
    audioBuffer.copyToChannel(float32Data, 0);

    const pcmSourceNode = localAudioContext.createBufferSource();
    pcmSourceNode.buffer = audioBuffer;
    pcmSourceNode.connect(localAudioContext.destination);
    
    activePcmSourceNode = pcmSourceNode; 

    // Call onStart lifecycle callback
    if (currentSpeechLifecycleCallbacks?.onStart) {
        console.log("[Speech Service] PCM playback is about to start. Triggering onStart.");
        currentSpeechLifecycleCallbacks.onStart();
    }

    pcmSourceNode.onended = () => {
      if (activePcmSourceNode === pcmSourceNode) { // Check if it's still the active node
        console.log("[Speech Service] PCM playback naturally ended for the active source.");
        triggerSpeechLifecycleEnd("PCM natural end");
      }
    };

    pcmSourceNode.start(0);
    console.log("[Speech Service] Started Gemini TTS (PCM) playback.");

  } catch (error) {
    console.error("[Speech Service] Error playing PCM data:", error);
    triggerSpeechLifecycleError("PCM play error - exception during setup/start", error);
  }
};

const playWithBrowserTTS = (text: string, emotion: Emotion): void => {
  if (!synthesis) {
    console.warn("[Speech Service] Browser Speech Synthesis API not supported.");
    triggerSpeechLifecycleError("Browser TTS error - API not supported");
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.volume = 1;

  switch (emotion) {
    case Emotion.Positive: utterance.pitch = 1.2; utterance.rate = 1.05; break;
    case Emotion.Negative: utterance.pitch = 0.85; utterance.rate = 0.95; break;
    default: utterance.pitch = 1; utterance.rate = 1; break;
  }

  if (preferredVoices.length === 0) loadVoices();
  if (preferredVoices.length > 0) utterance.voice = preferredVoices[0];

  activeBrowserUtterance = utterance;

  const makeSafeCallbackCaller = (eventType: 'onstart' | 'onend' | 'onerror') => {
    return (event?: SpeechSynthesisEvent | SpeechSynthesisErrorEvent) => {
      if (activeBrowserUtterance === utterance) { // Check if it's still the active utterance
        if (eventType === 'onstart') {
          if (currentSpeechLifecycleCallbacks?.onStart) {
            console.log("[Speech Service] Browser TTS playback started (onstart event). Triggering onStart.");
            currentSpeechLifecycleCallbacks.onStart();
          }
        } else if (eventType === 'onend') {
          console.log("[Speech Service] Browser TTS naturally ended.");
          triggerSpeechLifecycleEnd("Browser TTS natural end");
        } else if (eventType === 'onerror') {
          console.error(`[Speech Service] Browser TTS Error: ${event instanceof SpeechSynthesisErrorEvent ? event.error : 'Unknown'}`, event);
          triggerSpeechLifecycleError("Browser TTS error event", event);
        }
      }
    };
  };

  utterance.onstart = makeSafeCallbackCaller('onstart');
  utterance.onend = makeSafeCallbackCaller('onend');
  utterance.onerror = makeSafeCallbackCaller('onerror');
  
  // Fallback onStart trigger if browser's onstart is unreliable or fires too late for some.
  // We are calling it more directly before `speak` for some browsers that might not fire `onstart` quickly.
  // The `onstart` handler itself also calls it, so this might lead to double calls if not careful.
  // For now, let `utterance.onstart` be the primary source for `onStart` call.
  // if (currentSpeechLifecycleCallbacks?.onStart) {
  //   console.log("[Speech Service] Browser TTS playback is about to start (before speak call). Triggering onStart.");
  //   currentSpeechLifecycleCallbacks.onStart();
  // }


  try {
    synthesis.speak(utterance);
  } catch (e) {
    console.error("[Speech Service] Error calling browser synthesis.speak:", e);
    triggerSpeechLifecycleError("Browser TTS error - speak exception", e);
  }
};

export const speakText = async (
    text: string, 
    emotion: Emotion, 
    lifecycleCallbacks?: SpeechLifecycleCallbacks
): Promise<void> => {
  if (!text || text.trim() === "") {
    lifecycleCallbacks?.onEnd?.(); // Call immediately if no text
    return;
  }

  console.log(`[Speech Service] speakText called for: "${text.substring(0,30)}...". Cancelling any prior speech.`);
  cancelCurrentSpeech(); 
  
  currentSpeechLifecycleCallbacks = lifecycleCallbacks || null;
  activePcmSourceNode = null; 
  activeBrowserUtterance = null;

  let audioPlayedViaGemini = false;
  try {
      const pcmDataBase64 = await generateSpeechAudioFromGemini(text, emotion);
      if (pcmDataBase64) {
        playPcmData(pcmDataBase64);
        audioPlayedViaGemini = true;
        return; 
      }
  } catch (geminiError) {
    console.error("[Speech Service] Error attempting Gemini TTS, falling back to browser synthesis:", geminiError);
    // If Gemini TTS generation itself fails, trigger onError if available, otherwise onEnd
    triggerSpeechLifecycleError("Gemini TTS generation failed", geminiError);
    // No return here, so it can fall through to browser TTS if desired, but an error was already signaled.
    // However, if an error is signaled, the caller (App.tsx) will likely stop.
    // If we want a robust fallback even on Gemini generation error, we'd not call triggerSpeechLifecycleError here
    // and let it fall to browser TTS. For now, let's assume error means stop.
    // To enable fallback: comment out triggerSpeechLifecycleError above if pcmDataBase64 is null
    // and let it proceed to browser TTS.
    // For current design, if Gemini fails to generate, that's an error.
    return;
  }

  if (!audioPlayedViaGemini) {
    console.log("[Speech Service] Gemini TTS did not produce audio or was skipped, using browser TTS.");
    // Check if an error was already triggered (e.g., Gemini explicitly disabled and returned null, not an error)
    if (currentSpeechLifecycleCallbacks) { 
        playWithBrowserTTS(text, emotion);
    } else {
        console.log("[Speech Service] Callbacks were cleared (likely by a preceding error), skipping browser TTS fallback.");
    }
  }
};

export const isSpeechRecognitionSupported = (): boolean => !!recognition;
export const isSpeechSynthesisSupported = (): boolean => !!synthesis;