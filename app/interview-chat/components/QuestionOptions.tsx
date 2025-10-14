"use client";

import { CheckCircle2 } from "lucide-react";

interface QuestionOptionsProps {
  messageId: string;
  options: string[];
  selectedOption?: number;
  onSelect: (messageId: string, optionIndex: number, questionText: string) => void;
}

export function QuestionOptions({ messageId, options, selectedOption, onSelect }: QuestionOptionsProps) {
  const hasSelected = selectedOption !== undefined;

  return (
    <div className="flex flex-col items-center space-y-3 py-2">
      {/* Header */}
      <div className="text-center mb-2">
        <p className="text-sm font-medium text-gray-600">
          Choose a follow-up question
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Pick the one that speaks to you
        </p>
      </div>

      {/* Option cards */}
      <div className="w-full max-w-xl space-y-3">
        {options.map((option, index) => {
          const isSelected = selectedOption === index;
          const isDisabled = hasSelected && !isSelected;

          return (
            <button
              key={index}
              onClick={() => !hasSelected && onSelect(messageId, index, option)}
              disabled={isDisabled}
              className={`
                w-full px-5 py-4 rounded-2xl text-left transition-all duration-200
                ${isSelected
                  ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-lg scale-[1.02]'
                  : isDisabled
                    ? 'bg-gray-50 text-gray-400 cursor-not-allowed opacity-50'
                    : 'bg-white hover:bg-gray-50 text-gray-800 shadow-md hover:shadow-lg hover:scale-[1.01] border-2 border-gray-200 hover:border-amber-400'
                }
              `}
            >
              <div className="flex items-start gap-3">
                {/* Radio/Check indicator */}
                <div
                  className={`
                    w-6 h-6 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center transition-all
                    ${isSelected
                      ? 'bg-white/20'
                      : 'border-2 border-gray-300'
                    }
                  `}
                >
                  {isSelected && (
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  )}
                </div>

                {/* Question text */}
                <p
                  className={`
                    flex-1 leading-relaxed
                    ${isSelected
                      ? 'font-medium'
                      : 'font-normal'
                    }
                  `}
                  style={{
                    fontFamily: isSelected ? 'var(--font-sans)' : 'var(--font-serif)',
                    fontSize: '16px',
                  }}
                >
                  {option}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Helper text */}
      {!hasSelected && (
        <p className="text-xs text-gray-400 text-center mt-2 animate-pulse">
          Or continue with your own thoughts
        </p>
      )}
    </div>
  );
}
