
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
import { startListening, stopListening, speakText, isSpeechRecognitionSupported, isSpeechSynthesisSupported } from './services/speechService';

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
    };
  }, [apiKeyExists, speechSupported, startWebcam]);

  const addMessageAndSpeak = useCallback((
    text: string, 
    sender: Sender, 
    emotionForAIReply?: Emotion,
    isAnnotation: boolean = false,
    annotationDetails?: { overallEmotion: Emotion; textEmotion: Emotion; facialEmotion?: Emotion | null }
  ) => {
    setMessages(prev => [...prev, { 
      id: Date.now().toString(), 
      text, 
      sender, 
      emotion: sender === Sender.AI && !isAnnotation ? emotionForAIReply : undefined, 
      timestamp: new Date(),
      isAnnotation,
      annotationDetails
    }]);

    if (sender === Sender.AI && !isAnnotation && synthesisSupported) {
      // For AI's conversational replies, use the emotion that guided the response.
      // For annotations or user messages, speech is handled elsewhere or not applicable.
      speakText(text, emotionForAIReply || Emotion.Neutral);
    }
  }, [synthesisSupported]);


  useEffect(() => {
    if (apiKeyExists && synthesisSupported && messages.length === 0) {
      const greeting = "Hello! I'm your AI Upskilling Tutor. I'm here to help you learn about business analytics, sales CRM, project management, and more. What topic are you interested in exploring today?";
      
      // Add message to display
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        text: greeting, 
        sender: Sender.AI, 
        emotion: Emotion.Neutral, 
        timestamp: new Date()
      }]);

      // Conditionally speak the greeting
      // This constant should ideally be shared or imported if it's a global config.
      // For now, redeclaring to match the one in geminiService.ts for this specific logic.
      const USE_HYPOTHETICAL_GEMINI_TTS_VIA_GENERATE_CONTENT = false; 
      
      if (USE_HYPOTHETICAL_GEMINI_TTS_VIA_GENERATE_CONTENT && synthesisSupported) {
        // If Gemini TTS is intended and supported, try speaking.
        speakText(greeting, Emotion.Neutral);
      } else if (synthesisSupported) {
        // If falling back to browser TTS, log that we're skipping auto-speech for the initial greeting.
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
        // Give precedence to clear facial positive/negative over text, unless text is also strongly emotional
        if (textEmotionResult.emotion === Emotion.Neutral || textEmotionResult.emotion === facialEmotionResult.emotion) {
            combinedEmotion = facialEmotionResult.emotion;
        } else if ( (textEmotionResult.emotion === Emotion.Positive && facialEmotionResult.emotion === Emotion.Negative) ||
                    (textEmotionResult.emotion === Emotion.Negative && facialEmotionResult.emotion === Emotion.Positive) ) {
            // Conflicting strong emotions - might be nuanced. For now, default to text or a more complex rule.
            // Or consider making it Neutral if truly conflicting, or weighted.
            // For simplicity, let's allow facial to override if it's strong.
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
    // Add user message (no speech for user message itself)
    setMessages(prev => [...prev, { id: Date.now().toString(), text: transcript, sender: Sender.User, timestamp: new Date() }]);
    setIsLoadingAI(true);
    setError(null);

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
      
      const combinedEmotion = determineCombinedEmotion(textEmotionResult, facialEmotionResult);
      setCurrentEmotion(combinedEmotion);
      
      // Add the annotation message (no speech for annotation)
      setMessages(prev => [...prev, {
        id: Date.now().toString() + "-annotation", 
        text: "Emotion analysis complete", 
        sender: Sender.AI, 
        timestamp: new Date(),
        isAnnotation: true,
        annotationDetails: { 
          overallEmotion: combinedEmotion, 
          textEmotion: textEmotionResult.emotion, 
          facialEmotion: facialEmotionResult ? facialEmotionResult.emotion : null 
        }
      }]);
      

      const aiResponseText = await generateResponseFromGemini(transcript, combinedEmotion);
      addMessageAndSpeak(aiResponseText, Sender.AI, combinedEmotion); // This will handle speaking

    } catch (e: any) {
      console.error("Error processing speech or AI response:", e);
      const errorMessage = e.message || "An error occurred with the AI services.";
      setError(errorMessage);
      addMessageAndSpeak(errorMessage, Sender.AI, Emotion.Neutral); // Speak error with neutral emotion
    } finally {
      setIsLoadingAI(false);
    }
  }, [webcamEnabled, determineCombinedEmotion, addMessageAndSpeak]); 

  const handleToggleListening = useCallback(() => {
    if (!apiKeyExists || !speechSupported) {
      const message = !apiKeyExists ? "API Key is not configured." : "Speech recognition not supported.";
      if (synthesisSupported) speakText(message, Emotion.Neutral); // Speak alert with neutral emotion
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
