
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Emotion, DetectedEmotionResult } from '../types';
import { 
    GEMINI_TEXT_MODEL, 
    TEXT_EMOTION_ANALYSIS_PROMPT_PREFIX, 
    TEXT_EMOTION_ANALYSIS_PROMPT_SUFFIX, 
    FACIAL_EMOTION_ANALYSIS_PROMPT,
    getAIMessageSystemInstruction 
} from '../constants';

let ai: GoogleGenAI | null = null;

const initializeAi = () => {
  if (ai) return;
  
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("Gemini API Key (process.env.API_KEY) is not defined.");
    throw new Error("API Key is not configured. Please set the API_KEY environment variable.");
  }
  ai = new GoogleGenAI({ apiKey });
};

const parseEmotionResponse = (rawEmotionText: string): Emotion => {
    const emotionText = rawEmotionText.toLowerCase().trim();
    if (emotionText.includes('positive')) {
      return Emotion.Positive;
    } else if (emotionText.includes('negative')) {
      return Emotion.Negative;
    } else if (emotionText.includes('neutral')) {
      return Emotion.Neutral;
    }
    console.warn(`Unexpected emotion analysis response: "${rawEmotionText}". Defaulting to Neutral.`);
    return Emotion.Neutral;
};

export const analyzeTextEmotionViaGemini = async (text: string): Promise<DetectedEmotionResult> => {
  initializeAi();
  if (!ai) throw new Error("Gemini AI client not initialized.");

  const prompt = `${TEXT_EMOTION_ANALYSIS_PROMPT_PREFIX}${text}${TEXT_EMOTION_ANALYSIS_PROMPT_SUFFIX}`;
  
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: GEMINI_TEXT_MODEL,
        contents: prompt,
        config: {
            temperature: 0.2, 
            topK: 5,
            topP: 0.9,
        }
    });

    const rawEmotionText = response.text.trim();
    const detectedEmotion = parseEmotionResponse(rawEmotionText);
    
    return { emotion: detectedEmotion, analysis: rawEmotionText };

  } catch (error) {
    console.error('Error analyzing text emotion with Gemini:', error);
    throw new Error(`Failed to analyze text emotion: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const analyzeFacialEmotionViaGemini = async (base64ImageData: string): Promise<DetectedEmotionResult> => {
  initializeAi();
  if (!ai) throw new Error("Gemini AI client not initialized.");

  const imageData = base64ImageData.startsWith('data:') ? base64ImageData.split(',')[1] : base64ImageData;

  const imagePart = {
    inlineData: {
      mimeType: 'image/jpeg', 
      data: imageData,
    },
  };
  const textPart = {
    text: FACIAL_EMOTION_ANALYSIS_PROMPT
  };

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: GEMINI_TEXT_MODEL, 
        contents: { parts: [textPart, imagePart] }, 
        config: {
            temperature: 0.3, 
            topK: 5,
            topP: 0.9,
        }
    });

    const rawEmotionText = response.text.trim();
    const detectedEmotion = parseEmotionResponse(rawEmotionText);
    
    return { emotion: detectedEmotion, analysis: rawEmotionText };

  } catch (error) {
    console.error('Error analyzing facial emotion with Gemini:', error);
    throw new Error(`Failed to analyze facial emotion: ${error instanceof Error ? error.message : String(error)}`);
  }
};


export const generateResponseFromGemini = async (userText: string, userEmotion: Emotion): Promise<string> => {
  initializeAi();
  if (!ai) throw new Error("Gemini AI client not initialized.");

  const systemInstruction = getAIMessageSystemInstruction(userEmotion);

  try {
    const geminiResponse: GenerateContentResponse = await ai.models.generateContent({
        model: GEMINI_TEXT_MODEL,
        contents: userText, 
        config: {
            systemInstruction: systemInstruction,
            temperature: 0.7, 
            topP: 0.95,
            topK: 40,
        }
    });
    
    let coreResponseText = geminiResponse.text.trim();
    let acknowledgementPrefix = "";

    switch (userEmotion) {
        case Emotion.Positive:
            acknowledgementPrefix = "It's great that you're feeling positive! ";
            break;
        case Emotion.Negative:
            acknowledgementPrefix = "I sense you might be feeling a bit negative, and that's okay. Let's work through this. ";
            break;
        case Emotion.Neutral:
            break;
    }
    
    return `${acknowledgementPrefix}${coreResponseText}`;

  } catch (error) {
    console.error('Error generating response from Gemini:', error);
    throw new Error(`Failed to generate AI response: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const generateSpeechAudioFromGemini = async (text: string, emotion: Emotion): Promise<string | null> => {
  initializeAi();
  if (!ai) {
    console.error("[Gemini TTS] Gemini AI client not initialized.");
    return null;
  }

  let systemInstructionForTTS: string;
  switch (emotion) {
    case Emotion.Positive:
      systemInstructionForTTS = "You are an advanced voice generation model. Generate audio for the following text in a genuinely cheerful, upbeat, and encouraging tone. The output should be only the audio, no other text or explanations.";
      break;
    case Emotion.Negative:
      systemInstructionForTTS = "You are an advanced voice generation model. Generate audio for the following text in a genuinely gentle, empathetic, and patient tone. The output should be only the audio, no other text or explanations.";
      break;
    case Emotion.Neutral:
    default:
      systemInstructionForTTS = "You are an advanced voice generation model. Generate audio for the following text in a clear, informative, and standard professional tone. The output should be only the audio, no other text or explanations.";
      break;
  }

  // This flag controls whether the hypothetical Gemini TTS call is attempted.
  // Set to true ONLY if the @google/genai SDK and model support audio output
  // through a mechanism like 'responseMimeType' and a specific audio field in the response.
  const USE_HYPOTHETICAL_GEMINI_TTS_VIA_GENERATE_CONTENT = false; 

  if (!USE_HYPOTHETICAL_GEMINI_TTS_VIA_GENERATE_CONTENT) {
    console.warn("[Gemini TTS] Hypothetical API call for speech generation is currently disabled in `generateSpeechAudioFromGemini`. This is due to the lack of specific SDK documentation for direct audio output from `ai.models.generateContent` in the provided guidelines. Falling back to browser synthesis if available in `speechService`.");
    return null;
  }

  try {
    console.log(`[Gemini TTS] Requesting speech for: "${text}" with emotion: ${emotion}`);
    console.log(`[Gemini TTS] System Instruction: ${systemInstructionForTTS}`);

    // HYPOTHETICAL API CALL STRUCTURE:
    // The actual method for getting audio might be different (e.g., a dedicated TTS model or API method).
    // This assumes `generateContent` can be configured to output audio and that audio
    // would appear in a field like `response.audioBytes` or similar.
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: GEMINI_TEXT_MODEL, // This might need to be a specific TTS-enabled model
        contents: [{ role: "user", parts: [{ text: text }] }], // Text to synthesize
        config: {
            systemInstruction: systemInstructionForTTS,
            // HYPOTHETICAL: Parameter to request audio output.
            // This would depend on actual API specification.
            // responseMimeType: "audio/mp3", 
            // temperature: 0.7, // May or may not apply to TTS
        }
    });

    // HYPOTHETICAL: How audio data might be extracted from the response.
    // This is purely speculative. The 'GenerateContentResponse' type would need to support this.
    // e.g., const audioBase64 = (response as any).audioContent; 
    // For this example, we'll log the text response and return null, as `response.text` is for text.
    
    console.log("[Gemini TTS] Hypothetical call made. Response text (not audio):", response.text);
    // If audioBase64 were available:
    // if (audioBase64 && typeof audioBase64 === 'string' && audioBase64.length > 100) {
    //   console.log("[Gemini TTS] Received hypothetical audio data (base64). Length:", audioBase64.length);
    //   return audioBase64;
    // } else {
    //   console.warn("[Gemini TTS] Hypothetical call made, but no audio data found in expected (speculative) location.");
    //   return null;
    // }
    return null; // Returning null as we don't have a confirmed way to get audio bytes.

  } catch (error) {
    console.error('[Gemini TTS] Error during hypothetical speech audio generation:', error);
    return null;
  }
};
