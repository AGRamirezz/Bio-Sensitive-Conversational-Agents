
export enum Sender {
  User = 'user',
  AI = 'ai',
}

export enum Emotion {
  Positive = 'Positive',
  Negative = 'Negative',
  Neutral = 'Neutral',
  Unknown = 'Unknown',
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  emotion?: Emotion; // For the main AI response, this is the emotion *used* to generate it
  timestamp: Date;
  isAnnotation?: boolean; // True if this message is an emotion analysis annotation
  annotationDetails?: { // Specific details for the annotation message
    overallEmotion: Emotion;
    textEmotion: Emotion;
    facialEmotion?: Emotion | null;
  };
}

export interface DetectedEmotionResult {
  emotion: Emotion;
  confidence?: number; 
  analysis?: string; 
}