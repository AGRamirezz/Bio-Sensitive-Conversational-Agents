
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
  }
};

if (synthesis) {
    loadVoices();
    if (synthesis.onvoiceschanged !== undefined) {
        synthesis.onvoiceschanged = loadVoices;
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

const playWithBrowserTTS = (text: string, emotion: Emotion, onEnd?: () => void): void => {
  if (!synthesis) {
    console.warn("[Speech Service] Browser Speech Synthesis API not supported. Cannot play TTS.");
    if (onEnd) onEnd();
    return;
  }
  // Ensure any previous synthesis utterance is stopped.
  synthesis.cancel();

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

  if (preferredVoices.length > 0) {
    utterance.voice = preferredVoices[0]; 
  } else {
    const englishVoices = (synthesis.getVoices() || []).filter(v => v.lang.startsWith('en'));
    const femaleVoice = englishVoices.find(v => v.name.toLowerCase().includes('female')) || 
                        englishVoices.find(v => (v as any).gender === 'female');
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    } else if (englishVoices.length > 0) {
      utterance.voice = englishVoices[0];
    }
  }

  if (onEnd) {
    utterance.onend = onEnd;
  }
  utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
    if (event.error === 'canceled' || event.error === 'interrupted') {
      console.log(`[Speech Service] Browser speech synthesis utterance ${event.error}.`);
    } else {
      console.error(`[Speech Service] Browser speech synthesis error - Code: ${event.error}`, event);
    }
    if (onEnd) onEnd(); 
  };
  
  try {
    console.log(`[Speech Service] Playing audio via browser TTS with emotion: ${emotion} (Pitch: ${utterance.pitch}, Rate: ${utterance.rate})`);
    synthesis.speak(utterance);
  } catch (e) {
    console.error("[Speech Service] Error calling browser synthesis.speak:", e);
    if (onEnd) onEnd();
  }
};

export const speakText = async (text: string, emotion: Emotion, onEnd?: () => void): Promise<void> => {
  if (!text || text.trim() === "") {
    console.log("[Speech Service] speakText called with empty or whitespace-only text. Skipping synthesis.");
    if (onEnd) onEnd();
    return;
  }

  if (synthesis) {
    synthesis.cancel(); // Cancel any existing browser speech first
  }

  let audioPlayedViaGemini = false;
  try {
    const audioBase64 = await generateSpeechAudioFromGemini(text, emotion);
    if (audioBase64) {
      const audioPlayer = new Audio(`data:audio/mp3;base64,${audioBase64}`); // Assuming MP3 for now
      
      audioPlayer.oncanplaythrough = () => {
        audioPlayer.play().catch(e => {
          console.error("[Speech Service] Error playing Gemini TTS audio from play() promise:", e);
          playWithBrowserTTS(text, emotion, onEnd); // Fallback on playback error
        });
      };
      audioPlayedViaGemini = true;
      console.log("[Speech Service] Playing audio via Gemini TTS.");
      
      audioPlayer.onended = () => {
        if (onEnd) onEnd();
      };
      audioPlayer.onerror = (e) => {
        console.error("[Speech Service] Error with Gemini TTS audio element:", e);
        playWithBrowserTTS(text, emotion, onEnd); // Fallback on audio element error
      };
      return; 
    } else {
      console.log("[Speech Service] Gemini TTS did not provide audio, falling back to browser synthesis.");
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
