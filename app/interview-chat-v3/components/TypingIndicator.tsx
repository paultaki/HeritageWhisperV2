"use client";

export function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="max-w-[75%]">
        {/* Sender label */}
        <div className="mb-1 px-3 text-xs text-[var(--hw-text-secondary)] font-medium flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[var(--hw-primary)] flex items-center justify-center text-white text-xs font-bold">
            P
          </div>
          <span className="font-serif italic">Pearl</span>
        </div>
        {/* Bubble */}
        <div
          className="px-5 py-4 rounded-3xl rounded-tl-none bg-[var(--hw-primary-soft)] border border-[var(--hw-border-subtle)] shadow-sm inline-flex items-center gap-1"
        >
          {/* Animated dots */}
          <div className="flex items-center gap-1">
            <div
              className="w-2 h-2 rounded-full bg-[var(--hw-primary)]"
              style={{
                animation: 'typing-dot 1.4s infinite',
                animationDelay: '0s',
              }}
            />
            <div
              className="w-2 h-2 rounded-full bg-[var(--hw-primary)]"
              style={{
                animation: 'typing-dot 1.4s infinite',
                animationDelay: '0.2s',
              }}
            />
            <div
              className="w-2 h-2 rounded-full bg-[var(--hw-primary)]"
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
        <div className="mt-1 px-3 text-xs text-[var(--hw-text-muted)] italic">
          Thinking...
        </div>
      </div>
    </div>
  );
}
