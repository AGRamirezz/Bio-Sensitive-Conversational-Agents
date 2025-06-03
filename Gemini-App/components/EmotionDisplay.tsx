
import React from 'react';
import { Emotion } from '../types';

interface EmotionDisplayProps {
  currentEmotion: Emotion;
  isLoadingAI: boolean;
}

const emotionStyles: Record<Emotion, { icon: string; color: string; text: string }> = {
  [Emotion.Positive]: { icon: 'fa-smile-beam', color: 'text-green-400', text: 'Feeling Positive' },
  [Emotion.Negative]: { icon: 'fa-frown', color: 'text-red-400', text: 'Feeling Negative' },
  [Emotion.Neutral]: { icon: 'fa-meh', color: 'text-blue-400', text: 'Feeling Neutral' },
  [Emotion.Unknown]: { icon: 'fa-question-circle', color: 'text-gray-400', text: 'Emotion Unknown' },
};

export const EmotionDisplay: React.FC<EmotionDisplayProps> = ({ currentEmotion, isLoadingAI }) => {
  const style = emotionStyles[currentEmotion] || emotionStyles[Emotion.Unknown];

  return (
    <div className="w-full max-w-3xl mb-3 p-3 bg-gray-800 bg-opacity-70 rounded-lg text-center shadow">
      {isLoadingAI && currentEmotion === Emotion.Neutral ? (
        <p className="text-sm text-yellow-400">Analyzing emotion...</p>
      ) : (
        <div className={`flex items-center justify-center space-x-2 ${style.color}`}>
          <i className={`fas ${style.icon} text-xl`}></i>
          <span className="text-sm font-medium">{style.text}</span>
        </div>
      )}
    </div>
  );
};
