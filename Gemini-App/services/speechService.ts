
// @ts-nocheck // Disable TypeScript checking for SpeechRecognition vendor prefixes

import { generateSpeechAudioFromGemini } from './geminiService';
import { Emotion } from '../types';

let recognition: SpeechRecognition | null = null;
let synthesis = window.speechSynthesis;
let preferredVoices: SpeechSynthesisVoice[] = [];

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
    // console.log("[Speech Service] Preferred voices loaded:", preferredVoices.map(v => v.name));
  } else {
    // console.log("[Speech Service] No voices available yet in loadVoices.");
  }
};

if (synthesis) {
    loadVoices(); // Initial attempt
    if (synthesis.onvoiceschanged !== undefined) {
        synthesis.onvoiceschanged = loadVoices;
    } else {
        // Fallback for browsers that don't support onvoiceschanged well
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


// --- Enhanced Speech Synthesis Logic ---
let activeUtterance: SpeechSynthesisUtterance | null = null;
let appLevelActiveCallback: (() => void) | null = null; // Callback for the utterance App.tsx thinks is active

export const cancelCurrentSpeech = (): void => {
  if (!synthesis) return;
  const textOfCancelled = activeUtterance ? activeUtterance.text.substring(0, 30) : "N/A";
  console.log(`[Speech Service] cancelCurrentSpeech called. Targeting utterance: "${textOfCancelled}..."`);

  const callbackToExecute = appLevelActiveCallback; // Store the callback for the utterance that was active
  const utteranceThatWasActive = activeUtterance;

  // 1. Clear global state that tracks the "active" utterance from app's perspective
  activeUtterance = null;
  appLevelActiveCallback = null;

  // 2. Detach handlers from the specific utterance that *was* active, to prevent latent firing
  if (utteranceThatWasActive) {
    console.log(`[Speech Service] Detaching handlers from utterance during cancel: "${utteranceThatWasActive.text.substring(0,30)}..."`)
    utteranceThatWasActive.onend = null;
    utteranceThatWasActive.onerror = null;
  }
  
  // 3. Cancel any speech currently happening or queued in the browser's synthesis engine
  if (synthesis.speaking || synthesis.pending) {
    console.log("[Speech Service] Instructing browser synthesis to cancel.");
    synthesis.cancel(); 
  } else {
    console.log("[Speech Service] Browser synthesis not speaking or pending, no explicit cancel sent.");
  }

  // 4. Execute the completion callback associated with the utterance we intended to cancel.
  // This tells App.tsx to proceed to the next chunk or finish loading.
  if (callbackToExecute) {
    console.log("[Speech Service] Executing app-level completion callback due to cancelCurrentSpeech.");
    callbackToExecute(); 
  } else {
    console.log("[Speech Service] No app-level callback was set to execute upon cancelCurrentSpeech.");
  }
};

const playWithBrowserTTS = (text: string, emotion: Emotion, onSpeechEndCallbackForThisUtterance?: () => void): void => {
  if (!synthesis) {
    console.warn("[Speech Service] Browser Speech Synthesis API not supported. Cannot play TTS.");
    if (onSpeechEndCallbackForThisUtterance) {
      onSpeechEndCallbackForThisUtterance();
    }
    return;
  }
  
  const textSnippet = text.substring(0, 30);
  console.log(`[Speech Service] playWithBrowserTTS called for: "${textSnippet}..."`);

  // --- Handling currently active/previous speech ---
  if (activeUtterance) {
    const oldUtteranceText = activeUtterance.text.substring(0, 30);
    console.log(`[Speech Service] Replacing active utterance "${oldUtteranceText}" with new request for "${textSnippet}".`);
    
    const callbackForOldUtterance = appLevelActiveCallback; // Store callback for the utterance being replaced

    // Detach handlers of the old utterance
    if (activeUtterance) { // Check again in case it was nulled by an async event
        activeUtterance.onend = null;
        activeUtterance.onerror = null;
    }
    
    // Clear global state related to the old utterance
    activeUtterance = null; 
    appLevelActiveCallback = null;

    // IMPORTANT: Call the completion callback of the utterance being replaced.
    // This signals that the previous chunk is "done" from the app's perspective.
    if (callbackForOldUtterance) {
      console.log(`[Speech Service] Calling completion callback for REPLACED utterance "${oldUtteranceText}".`);
      callbackForOldUtterance();
    }
  }

  // Cancel any synthesis activity in the browser's queue.
  // This should happen *after* we've programmatically "ended" the previous chunk from the app's perspective.
  if (synthesis.speaking || synthesis.pending) {
    console.log("[Speech Service] Browser synthesis is speaking or pending. Cancelling before new TTS request.");
    synthesis.cancel(); // This clears browser's internal queue.
  }
  // --- End handling currently active/previous speech ---

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.volume = 1;

  switch (emotion) {
    case Emotion.Positive:
      utterance.pitch = 1.2;
      utterance.rate = 1.05;
      break;
    case Emotion.Negative:
      utterance.pitch = 0.85;
      utterance.rate = 0.95;
      break;
    case Emotion.Neutral:
    default:
      utterance.pitch = 1;
      utterance.rate = 1;
      break;
  }

  if (preferredVoices.length === 0) {
    loadVoices();
  }

  if (preferredVoices.length > 0) {
    utterance.voice = preferredVoices[0]; 
  } else {
    const englishVoices = (synthesis.getVoices() || []).filter(v => v.lang.startsWith('en'));
    const femaleVoice = englishVoices.find(v => v.name.toLowerCase().includes('female')) || 
                        englishVoices.find(v => (v as any).gender === 'female');
    if (femaleVoice) utterance.voice = femaleVoice;
    else if (englishVoices.length > 0) utterance.voice = englishVoices[0];
    else console.warn(`[Speech Service] No English voices found for "${textSnippet}". Using browser default.`);
  }

  // This new utterance is now the "active" one from the app's perspective.
  activeUtterance = utterance; 
  appLevelActiveCallback = onSpeechEndCallbackForThisUtterance || null;

  let hasFiredCallbackForThisSpecificUtterance = false;

  const makeSafeCallbackCaller = (eventType: 'onend' | 'onerror') => {
    return (event?: SpeechSynthesisEvent | SpeechSynthesisErrorEvent) => {
      const currentSnippet = utterance.text.substring(0, 30);
      if (event instanceof SpeechSynthesisErrorEvent) {
        console.error(`[Speech Service] ${eventType} fired for: "${currentSnippet}" - Error: ${event.error}`, event);
      } else {
        console.log(`[Speech Service] ${eventType} fired for: "${currentSnippet}"`);
      }

      if (hasFiredCallbackForThisSpecificUtterance) {
        console.log(`[Speech Service] ${eventType} for "${currentSnippet}" - callback already fired. Ignoring.`);
        return;
      }
      hasFiredCallbackForThisSpecificUtterance = true;
      
      console.log(`[Speech Service] Processing ${eventType} for "${currentSnippet}". Current global activeUtterance is: "${activeUtterance ? activeUtterance.text.substring(0,30) : "null"}"`);

      // If this utterance (the one the event fired for) is still the one the app considers globally active,
      // it means it completed/errored naturally (not cancelled by watchdog, not replaced by a new speak call before its natural end).
      // So, clear the global state associated with it.
      if (utterance === activeUtterance) {
        console.log(`[Speech Service] Natural ${eventType} for globally active utterance "${currentSnippet}". Clearing global active state.`);
        activeUtterance = null;
        appLevelActiveCallback = null;
      } else {
        console.log(`[Speech Service] ${eventType} for "${currentSnippet}", but it's no longer the global activeUtterance. Global state for it might have been cleared by replacement or cancellation logic.`);
      }

      // ALWAYS call the specific callback for this utterance if it exists and hasn't been fired yet.
      if (onSpeechEndCallbackForThisUtterance) {
        console.log(`[Speech Service] Calling specific completion callback for "${currentSnippet}" from ${eventType}.`);
        onSpeechEndCallbackForThisUtterance();
      }
    };
  };

  console.log(`[Speech Service] Attaching event handlers for utterance: "${textSnippet}"`);
  utterance.onend = makeSafeCallbackCaller('onend');
  utterance.onerror = makeSafeCallbackCaller('onerror');
  
  try {
    console.log(`[Speech Service] Attempting to speak: "${textSnippet}" (Emotion: ${emotion}, Pitch: ${utterance.pitch}, Rate: ${utterance.rate})`);
    synthesis.speak(utterance);
  } catch (e) {
    console.error("[Speech Service] Error calling browser synthesis.speak:", e);
    // Ensure callback is fired even if .speak() itself throws an error.
    if (!hasFiredCallbackForThisSpecificUtterance) {
        hasFiredCallbackForThisSpecificUtterance = true;
        // Check if this was the intended active utterance before nullifying global state
        if (utterance === activeUtterance) { 
            activeUtterance = null;
            appLevelActiveCallback = null;
        }
        if(onSpeechEndCallbackForThisUtterance) {
            console.log(`[Speech Service] Calling specific completion callback for "${textSnippet}" due to speak() exception.`);
            onSpeechEndCallbackForThisUtterance();
        }
    }
  }
};

export const speakText = async (text: string, emotion: Emotion, onEnd?: () => void): Promise<void> => {
  if (!text || text.trim() === "") {
    if (onEnd) onEnd();
    return;
  }

  let audioPlayedViaGemini = false;
  // const USE_HYPOTHETICAL_GEMINI_TTS_VIA_GENERATE_CONTENT = false; 
  try {
      const audioBase64 = await generateSpeechAudioFromGemini(text, emotion); 
      if (audioBase64) {
        const audioPlayer = new Audio(`data:audio/mp3;base64,${audioBase64}`);
        
        let onEndedCalled = false; 
        const handleEnd = () => {
          if (!onEndedCalled) {
            onEndedCalled = true;
            if (onEnd) onEnd();
          }
        };

        audioPlayer.oncanplaythrough = () => {
          audioPlayer.play().catch(e => {
            console.error("[Speech Service] Error playing Gemini TTS audio from play() promise:", e);
            playWithBrowserTTS(text, emotion, onEnd); 
          });
        };
        audioPlayedViaGemini = true;
        audioPlayer.onended = handleEnd;
        audioPlayer.onerror = (e) => {
          console.error("[Speech Service] Error with Gemini TTS audio element:", e);
          playWithBrowserTTS(text, emotion, onEnd); 
        };
        return; 
      }
  } catch (geminiError) {
    console.error("[Speech Service] Error attempting Gemini TTS, falling back to browser synthesis:", geminiError);
  }

  if (!audioPlayedViaGemini) {
    playWithBrowserTTS(text, emotion, onEnd);
  }
};

export const isSpeechRecognitionSupported = (): boolean => !!recognition;
export const isSpeechSynthesisSupported = (): boolean => !!synthesis;
