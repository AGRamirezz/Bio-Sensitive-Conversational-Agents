
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Message, Sender, Emotion, DetectedEmotionResult } from './types';
import { MessageBubble } from './components/MessageBubble';
import { ControlPanel } from './components/ControlPanel';
import { EmotionDisplay } from './components/EmotionDisplay';
import { 
  analyzeTextEmotionViaGemini, 
  analyzeFacialEmotionViaGemini, 
  generateResponseFromGemini 
} from './services/geminiService';
import { 
    startListening, 
    stopListening, 
    speakText, 
    isSpeechRecognitionSupported, 
    isSpeechSynthesisSupported,
    cancelCurrentSpeech 
} from './services/speechService';
import { splitIntoSentences, groupSentencesIntoChunks } from './services/textUtils';

// Constants for dynamic watchdog timeout
const MIN_SPEECH_WATCHDOG_TIMEOUT_MS = 5000; // Minimum 5 seconds
const MAX_SPEECH_WATCHDOG_TIMEOUT_MS = 28000; // Maximum 28 seconds
const CHARS_PER_SECOND_ESTIMATE = 10; // Estimated characters spoken per second
const WATCHDOG_BUFFER_MS = 1000; // Additional buffer for safety (reduced from 3000ms)

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isLoadingAI, setIsLoadingAI] = useState<boolean>(false);
  const [currentEmotion, setCurrentEmotion] = useState<Emotion>(Emotion.Neutral);
  const [error, setError] = useState<string | null>(null);
  const [apiKeyExists, setApiKeyExists] = useState<boolean>(true);
  const [webcamEnabled, setWebcamEnabled] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const [synthesisSupported, setSynthesisSupported] = useState<boolean>(true);


  const messagesEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null); 
  const speechWatchdogTimerRef = useRef<number | null>(null);
  const completedChunks = useRef(new Set<number>());

  useEffect(() => {
    if (typeof process.env.API_KEY !== 'string' || process.env.API_KEY === '') {
      setError("Gemini API Key is not configured. Please set the API_KEY environment variable.");
      setApiKeyExists(false);
    }
    if (!isSpeechRecognitionSupported()) {
        setError(prevError => prevError ? `${prevError} Speech recognition is also not supported.` : "Speech recognition is not supported by your browser. Please try a different browser like Chrome or Edge.");
        setSpeechSupported(false);
    }
    if (!isSpeechSynthesisSupported()) {
        setError(prevError => prevError ? `${prevError} Speech synthesis is also not supported.` : "Speech synthesis is not supported by your browser.");
        setSynthesisSupported(false);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startWebcam = useCallback(async () => {
    if (!apiKeyExists || !videoRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        setWebcamEnabled(true);
        console.log("Webcam started successfully.");
      };
    } catch (err) {
      console.error("Error accessing webcam:", err);
      setError("Could not access webcam. Please ensure permission is granted and no other app is using it.");
      setWebcamEnabled(false);
    }
  }, [apiKeyExists]);

  useEffect(() => {
    if (apiKeyExists && speechSupported) { 
        startWebcam();
    }
    return () => { 
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      if (speechWatchdogTimerRef.current) {
        clearTimeout(speechWatchdogTimerRef.current);
      }
    };
  }, [apiKeyExists, speechSupported, startWebcam]);

  // Simplified function to add message to state, speech is handled by caller context
  const addMessage = (
    text: string, 
    sender: Sender, 
    emotionForAIReply?: Emotion,
    isAnnotation: boolean = false,
    annotationDetails?: { overallEmotion: Emotion; textEmotion: Emotion; facialEmotion?: Emotion | null },
    customId?: string
  ) => {
    setMessages(prev => [...prev, { 
      id: customId || Date.now().toString(), 
      text, 
      sender, 
      emotion: sender === Sender.AI && !isAnnotation ? emotionForAIReply : undefined, 
      timestamp: new Date(),
      isAnnotation,
      annotationDetails
    }]);
  };


  useEffect(() => {
    if (apiKeyExists && messages.length === 0) { // synthesisSupported check removed for initial visual message
      const greeting = "Hello! I'm your AI Upskilling Tutor. I'm here to help you learn about business analytics, sales CRM, project management, and more. What topic are you interested in exploring today?";
      
      addMessage(greeting, Sender.AI, Emotion.Neutral);

      const USE_HYPOTHETICAL_GEMINI_TTS_VIA_GENERATE_CONTENT = false; 
      
      if (USE_HYPOTHETICAL_GEMINI_TTS_VIA_GENERATE_CONTENT && synthesisSupported) {
        speakText(greeting, Emotion.Neutral);
      } else if (synthesisSupported) {
        console.log("Initial greeting displayed. Auto-speak via browser TTS skipped for initial greeting to prevent 'not-allowed' error. User-triggered AI responses will be spoken.");
      }
    }
  }, [apiKeyExists, synthesisSupported, messages.length]); 

  const captureFrameAsBase64 = (): string | null => {
    if (!webcamEnabled || !videoRef.current || !canvasRef.current || videoRef.current.readyState < videoRef.current.HAVE_METADATA) {
      console.warn("Webcam not ready or canvas not available for frame capture.");
      return null;
    }
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');
    if (!context) return null;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.8); 
  };
  
  const determineCombinedEmotion = (
    textEmotionResult: DetectedEmotionResult, 
    facialEmotionResult?: DetectedEmotionResult | null
  ): Emotion => {
    let combinedEmotion = textEmotionResult.emotion;
    let analysisText = `Text emotion: ${textEmotionResult.emotion}`;

    if (facialEmotionResult) {
      analysisText += `, Facial emotion: ${facialEmotionResult.emotion}`;
      if (facialEmotionResult.emotion === Emotion.Positive || facialEmotionResult.emotion === Emotion.Negative) {
        if (textEmotionResult.emotion === Emotion.Neutral || textEmotionResult.emotion === facialEmotionResult.emotion) {
            combinedEmotion = facialEmotionResult.emotion;
        } else if ( (textEmotionResult.emotion === Emotion.Positive && facialEmotionResult.emotion === Emotion.Negative) ||
                    (textEmotionResult.emotion === Emotion.Negative && facialEmotionResult.emotion === Emotion.Positive) ) {
             combinedEmotion = facialEmotionResult.emotion; 
        }
      }
    } else {
      analysisText += ", Facial emotion: N/A";
    }
    
    analysisText += ` => Combined: ${combinedEmotion}`;
    console.log("Emotion Analysis:", analysisText);
    return combinedEmotion;
  };

  const handleSpeechResult = useCallback(async (transcript: string) => {
    if (!transcript.trim()) return;
    
    const userMessageId = Date.now().toString();
    addMessage(transcript, Sender.User, undefined, false, undefined, userMessageId);
    setIsLoadingAI(true);
    setError(null);
    completedChunks.current.clear(); // Reset for new AI response

    let combinedEmotionForResponse: Emotion = Emotion.Neutral; 

    try {
      const frameData = webcamEnabled ? captureFrameAsBase64() : null;
      
      const textEmotionPromise = analyzeTextEmotionViaGemini(transcript);
      const facialEmotionPromise = frameData 
        ? analyzeFacialEmotionViaGemini(frameData)
        : Promise.resolve(null);

      const [textEmotionResult, facialEmotionResult] = await Promise.all([
        textEmotionPromise,
        facialEmotionPromise
      ]);
      
      const determinedOverallEmotion = determineCombinedEmotion(textEmotionResult, facialEmotionResult);
      setCurrentEmotion(determinedOverallEmotion);
      combinedEmotionForResponse = determinedOverallEmotion; 
      
      addMessage(
        "Emotion analysis complete", 
        Sender.AI, 
        undefined, 
        true, 
        { 
          overallEmotion: determinedOverallEmotion, 
          textEmotion: textEmotionResult.emotion, 
          facialEmotion: facialEmotionResult ? facialEmotionResult.emotion : null 
        },
        `${userMessageId}-annotation`
      );
      
      const fullAiResponseText = await generateResponseFromGemini(transcript, determinedOverallEmotion);

      let acknowledgementPrefix = "";
      let coreResponseText = fullAiResponseText;

      if (determinedOverallEmotion === Emotion.Positive) {
        const prefix = "It's great to see that you're feeling positive! ";
        if (fullAiResponseText.startsWith(prefix)) {
          acknowledgementPrefix = prefix;
          coreResponseText = fullAiResponseText.substring(prefix.length);
        }
      } else if (determinedOverallEmotion === Emotion.Negative) {
        const prefix = "I see that you might be feeling a bit negative, and that's okay. Let's work through this. ";
         if (fullAiResponseText.startsWith(prefix)) {
          acknowledgementPrefix = prefix;
          coreResponseText = fullAiResponseText.substring(prefix.length);
        }
      }

      const sentences = splitIntoSentences(coreResponseText);
      const MAX_SENTENCES_PER_CHUNK = 2;
      const responseChunks = groupSentencesIntoChunks(sentences, MAX_SENTENCES_PER_CHUNK);
      
      if (responseChunks.length === 0 && acknowledgementPrefix) {
          responseChunks.push(""); 
      } else if (responseChunks.length === 0 && !acknowledgementPrefix) {
          responseChunks.push("I don't have anything specific to add to that right now."); 
      }

      const processNextChunk = (chunkIndex: number) => {
        if (speechWatchdogTimerRef.current) { // Clear previous watchdog, if any from a prior chunk
          clearTimeout(speechWatchdogTimerRef.current);
          speechWatchdogTimerRef.current = null;
        }

        if (chunkIndex >= responseChunks.length) {
          setIsLoadingAI(false); 
          return;
        }

        let chunkText = responseChunks[chunkIndex];
        if (chunkIndex === 0 && acknowledgementPrefix) {
          chunkText = acknowledgementPrefix + chunkText;
        }
        
        if (!chunkText.trim() && chunkIndex === 0 && !acknowledgementPrefix && responseChunks.length === 1) {
           setIsLoadingAI(false);
           return;
        }
         if (!chunkText.trim() && !(chunkIndex === 0 && acknowledgementPrefix)) {
          if (!completedChunks.current.has(chunkIndex)) {
            completedChunks.current.add(chunkIndex);
          }
          processNextChunk(chunkIndex + 1);
          return;
        }

        addMessage(
          chunkText, 
          Sender.AI, 
          determinedOverallEmotion, 
          false, 
          undefined, 
          `${userMessageId}-ai-chunk-${chunkIndex}`
        );

        const handleChunkCompletionInternal = () => {
          if (speechWatchdogTimerRef.current) { 
            clearTimeout(speechWatchdogTimerRef.current);
            speechWatchdogTimerRef.current = null;
          }

          if (completedChunks.current.has(chunkIndex)) {
            console.warn(`[App] handleChunkCompletionInternal for chunk ${chunkIndex} called again. Ignoring to prevent duplicate processing.`);
            return;
          }
          completedChunks.current.add(chunkIndex);
          processNextChunk(chunkIndex + 1);
        };

        if (synthesisSupported) {
          speakText(chunkText, determinedOverallEmotion, handleChunkCompletionInternal);
          
          // Dynamic watchdog timeout calculation
          const estimatedDurationMs = (chunkText.length / CHARS_PER_SECOND_ESTIMATE) * 1000;
          const timeoutDuration = Math.max(
            MIN_SPEECH_WATCHDOG_TIMEOUT_MS,
            Math.min(MAX_SPEECH_WATCHDOG_TIMEOUT_MS, estimatedDurationMs + WATCHDOG_BUFFER_MS)
          );
          
          console.log(`[App] Watchdog for chunk ${chunkIndex} set to ${timeoutDuration}ms for text: "${chunkText.substring(0,30)}..."`);

          speechWatchdogTimerRef.current = setTimeout(() => {
            console.warn(`[App] Speech watchdog timed out for chunk ${chunkIndex} (after ${timeoutDuration}ms). Forcing progression.`);
            cancelCurrentSpeech(); 
          }, timeoutDuration);

        } else {
          // No synthesis, simulate chunk progression for UI
          if(chunkIndex < responseChunks.length - 1) {
             if (!completedChunks.current.has(chunkIndex)) {
                completedChunks.current.add(chunkIndex);
             }
            setTimeout(() => processNextChunk(chunkIndex + 1), 50); 
          } else {
             if (!completedChunks.current.has(chunkIndex)) {
                completedChunks.current.add(chunkIndex);
             }
            setIsLoadingAI(false);
          }
        }
      };
      
      if (responseChunks.length > 0) {
        processNextChunk(0);
      } else {
        addMessage("Hmm, I'm not sure how to respond to that.", Sender.AI, Emotion.Neutral);
        if(synthesisSupported) speakText("Hmm, I'm not sure how to respond to that.", Emotion.Neutral, () => setIsLoadingAI(false));
        else setIsLoadingAI(false);
      }

    } catch (e: any) {
      console.error("Error processing speech or AI response:", e);
      if (speechWatchdogTimerRef.current) {
        clearTimeout(speechWatchdogTimerRef.current);
        speechWatchdogTimerRef.current = null;
      }
      const errorMessage = e.message || "An error occurred with the AI services.";
      setError(errorMessage);
      addMessage(errorMessage, Sender.AI, Emotion.Neutral);
      if (synthesisSupported) speakText(errorMessage, Emotion.Neutral, () => setIsLoadingAI(false));
      else setIsLoadingAI(false);
    } 
  }, [webcamEnabled, determineCombinedEmotion, synthesisSupported]); 

  const handleToggleListening = useCallback(() => {
    if (!apiKeyExists || !speechSupported) {
      const message = !apiKeyExists ? "API Key is not configured." : "Speech recognition not supported.";
      if (synthesisSupported) speakText(message, Emotion.Neutral);
      setError(message);
      return;
    }
    if (isListening) {
      stopListening();
      setIsListening(false);
    } else {
      setError(null); 
      startListening(
        () => {}, 
        (finalTranscript) => { 
          setIsListening(false); 
          if (finalTranscript) {
            handleSpeechResult(finalTranscript);
          }
        },
        (err) => {
          console.error("Speech recognition error:", err);
          setError(`Speech recognition error: ${err.error || 'Unknown error'}`);
          setIsListening(false);
        }
      );
      setIsListening(true);
    }
  }, [isListening, apiKeyExists, speechSupported, synthesisSupported, handleSpeechResult]);
  
  return (
    <div className="flex flex-col h-screen max-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-gray-100 items-center p-4 font-sans">
      <header className="w-full max-w-3xl mb-4 text-center">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
          AI Upskilling Tutor
        </h1>
        {(!apiKeyExists || !speechSupported || !synthesisSupported) && (
           <p className="text-red-400 text-sm mt-2">
            { !apiKeyExists && "Gemini API Key is missing. Please configure the API_KEY environment variable. " }
            { !speechSupported && "Speech recognition not supported. " }
            { !synthesisSupported && "Speech synthesis not supported. " }
           </p>
        )}
      </header>

      <video ref={videoRef} autoPlay playsInline muted className="absolute w-px h-px opacity-0 -z-10"></video>
      <canvas ref={canvasRef} className="absolute w-px h-px opacity-0 -z-10"></canvas>

      <EmotionDisplay currentEmotion={currentEmotion} isLoadingAI={isLoadingAI}/>

      <div className="flex-grow w-full max-w-3xl bg-gray-800 bg-opacity-50 rounded-lg shadow-xl overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-purple-600 scrollbar-track-gray-700 mb-4">
        {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="w-full max-w-3xl p-3 mb-4 bg-red-700 bg-opacity-80 text-white rounded-lg text-center">
          {error}
        </div>
      )}

      <ControlPanel
        isListening={isListening}
        isLoadingAI={isLoadingAI}
        onToggleListening={handleToggleListening}
        disabled={!apiKeyExists || !speechSupported || !synthesisSupported}
      />
       <footer className="mt-4 text-xs text-gray-500 text-center">
        <p>AI Tutor for Professional Upskilling. Speak clearly and face the camera (if enabled).</p>
        <p>Emotion detection helps tailor the tutor's approach. {webcamEnabled ? "Using webcam & text analysis." : "Using text analysis."}</p>
        <p>Uses Gemini API & Browser Speech/Camera Capabilities.</p>
      </footer>
    </div>
  );
};

export default App;
