
import React from 'react';
import { Message, Sender, Emotion } from '../types';

const emotionTextColors: Record<Emotion, string> = {
  [Emotion.Positive]: 'text-green-400',
  [Emotion.Negative]: 'text-red-400',
  [Emotion.Neutral]: 'text-blue-400',
  [Emotion.Unknown]: 'text-gray-400',
};

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.sender === Sender.User;

  if (message.isAnnotation && message.annotationDetails) {
    const { overallEmotion, textEmotion, facialEmotion } = message.annotationDetails;
    let details = `Text: ${textEmotion}`;
    if (facialEmotion) {
      details += `, Face: ${facialEmotion}`;
    }

    // Annotations are always from AI and appear on the left, without a "AI Instructor" label.
    return (
      <div className="flex justify-start items-center my-1 px-2 py-1">
        <i className="fas fa-cogs text-slate-500 mr-2 text-xs" aria-hidden="true"></i>
        <span className="text-slate-400 text-xs">
          System Analysis: Overall mood <span className={emotionTextColors[overallEmotion] || emotionTextColors[Emotion.Unknown]}>{overallEmotion}</span>. ({details})
        </span>
      </div>
    );
  }

  // Regular chat bubble with sender label
  const senderLabel = isUser ? "User" : "AI Instructor";
  const labelColor = isUser ? 'text-purple-300' : 'text-slate-400';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Sender Label */}
        <div className={`text-xs ${labelColor} mb-1`}>
          {senderLabel}
        </div>
        
        {/* Message Bubble Content */}
        <div
          className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-xl shadow-md ${
            isUser
              ? 'bg-purple-600 text-white rounded-br-none'
              : 'bg-gray-700 text-gray-200 rounded-bl-none'
          }`}
          aria-live={message.sender === Sender.AI ? "polite" : "off"}
        >
          <p className="text-sm break-words">{message.text}</p>
          <p className={`text-xs mt-1 ${isUser ? 'text-purple-200 text-right' : 'text-gray-400 text-left'}`}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    </div>
  );
};
