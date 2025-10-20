"use client";

export function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="max-w-[75%]">
        {/* Sender label */}
        <div className="mb-1 px-3 text-xs text-gray-500 font-medium">
          Pearl
        </div>
        {/* Bubble */}
        <div
          className="px-5 py-4 rounded-3xl rounded-tl-sm bg-white shadow-md inline-flex items-center gap-1"
          style={{
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          {/* Animated dots */}
          <div className="flex items-center gap-1">
            <div
              className="w-2 h-2 rounded-full bg-gray-400"
              style={{
                animation: 'typing-dot 1.4s infinite',
                animationDelay: '0s',
              }}
            />
            <div
              className="w-2 h-2 rounded-full bg-gray-400"
              style={{
                animation: 'typing-dot 1.4s infinite',
                animationDelay: '0.2s',
              }}
            />
            <div
              className="w-2 h-2 rounded-full bg-gray-400"
              style={{
                animation: 'typing-dot 1.4s infinite',
                animationDelay: '0.4s',
              }}
            />
          </div>

          <style jsx>{`
            @keyframes typing-dot {
              0%, 60%, 100% {
                transform: translateY(0);
                opacity: 0.7;
              }
              30% {
                transform: translateY(-8px);
                opacity: 1;
              }
            }
          `}</style>
        </div>
        {/* Helper text */}
        <div className="mt-1 px-3 text-xs text-gray-400 italic">
          Thinking...
        </div>
      </div>
    </div>
  );
}
