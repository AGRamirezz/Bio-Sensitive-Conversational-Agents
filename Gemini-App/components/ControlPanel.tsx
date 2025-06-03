
import React from 'react';

interface ControlPanelProps {
  isListening: boolean;
  isLoadingAI: boolean;
  onToggleListening: () => void;
  disabled?: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ isListening, isLoadingAI, onToggleListening, disabled }) => {
  let buttonContent;
  let buttonClass = "p-5 rounded-full shadow-xl transition-all duration-300 ease-in-out focus:outline-none focus:ring-4";

  if (isLoadingAI) {
    buttonContent = <i className="fas fa-spinner fa-spin text-3xl"></i>;
    buttonClass += " bg-yellow-500 text-white cursor-not-allowed";
  } else if (isListening) {
    buttonContent = <i className="fas fa-microphone-slash text-3xl"></i>;
    buttonClass += " bg-red-600 hover:bg-red-700 text-white focus:ring-red-400";
  } else {
    buttonContent = <i className="fas fa-microphone text-3xl"></i>;
    buttonClass += " bg-green-500 hover:bg-green-600 text-white focus:ring-green-300";
  }
  
  if (disabled && !isLoadingAI) {
     buttonClass += " bg-gray-500 cursor-not-allowed opacity-50";
  }


  return (
    <div className="flex flex-col items-center justify-center p-4 w-full max-w-3xl">
      <button
        onClick={onToggleListening}
        disabled={isLoadingAI || disabled}
        className={buttonClass}
        aria-label={isListening ? "Stop listening" : "Start listening"}
      >
        {buttonContent}
      </button>
      {isLoadingAI && <p className="mt-3 text-sm text-yellow-400">AI is thinking...</p>}
      {isListening && !isLoadingAI && <p className="mt-3 text-sm text-green-400">Listening...</p>}
    </div>
  );
};
