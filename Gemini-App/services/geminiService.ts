
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Emotion, DetectedEmotionResult } from '../types';
import {
    GEMINI_TEXT_MODEL,
    GEMINI_TTS_MODEL,
    GEMINI_TTS_DEFAULT_VOICE,
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
            acknowledgementPrefix = "It's great to see that you're feeling positive! ";
            break;
        case Emotion.Negative:
            acknowledgementPrefix = "I see that you might be feeling a bit negative, and that's okay. Let's work through this. ";
            break;
        case Emotion.Neutral:
            // No prefix for neutral emotion
            break;
    }

    return `${acknowledgementPrefix}${coreResponseText}`;

  } catch (error) {
    console.error('Error generating response from Gemini:', error);
    throw new Error(`Failed to generate AI response: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Flag to control usage of Gemini Native TTS
const USE_GEMINI_NATIVE_TTS = true;

export const generateSpeechAudioFromGemini = async (text: string, emotion: Emotion): Promise<string | null> => {
  if (!USE_GEMINI_NATIVE_TTS) {
    console.log("[Gemini TTS] Native Gemini TTS is disabled. Falling back to browser synthesis if available in speechService.");
    return null;
  }

  initializeAi();
  if (!ai) {
    console.error("[Gemini TTS] Gemini AI client not initialized.");
    return null;
  }

  let ttsPrompt: string;
  switch (emotion) {
    case Emotion.Positive:
      ttsPrompt = `Say in a genuinely cheerful, upbeat, and encouraging tone: ${text}`;
      break;
    case Emotion.Negative:
      ttsPrompt = `Say in a genuinely gentle, empathetic, and patient tone: ${text}`;
      break;
    case Emotion.Neutral:
    default:
      ttsPrompt = `Say in a clear, informative, and standard professional tone: ${text}`;
      break;
  }

  try {
    console.log(`[Gemini TTS] Requesting speech for: "${text.substring(0, 70)}..." with emotion: ${emotion}`);
    
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: GEMINI_TTS_MODEL,
        contents: ttsPrompt,
        config: {
            responseModalities: ["AUDIO"],
            speechConfig: { 
                voiceConfig: { 
                    prebuiltVoiceConfig: { // Corrected: prebuilt_voice_config -> prebuiltVoiceConfig
                        voice_name: GEMINI_TTS_DEFAULT_VOICE,
                    }
                }
            },
            // As per TTS docs, other parameters like temperature are not typically used here.
        }
    });

    // Extract base64 encoded PCM data as per official TTS documentation
    const pcmDataBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (pcmDataBase64 && typeof pcmDataBase64 === 'string' && pcmDataBase64.length > 100) {
        console.log(`[Gemini TTS] Received base64 PCM data. Length: ${pcmDataBase64.length}.`);
        return pcmDataBase64;
    } else {
        console.warn(`[Gemini TTS] Did not receive valid base64 PCM data. Response part:`, response.candidates?.[0]?.content?.parts?.[0]);
        return null;
    }

  } catch (error) {
    console.error('[Gemini TTS] Error during native speech audio generation:', error);
    // Log the full error object for more details
    if (error && typeof error === 'object' && 'message' in error) {
       console.error(`[Gemini TTS] Error message: ${(error as Error).message}`);
    }
    // It's helpful to see the full structure if the API returns a complex error
    try {
        console.error('[Gemini TTS] Full error object (stringified):', JSON.stringify(error));
    } catch (e) {
        console.error('[Gemini TTS] Could not stringify full error object.');
    }
    return null;
  }
};