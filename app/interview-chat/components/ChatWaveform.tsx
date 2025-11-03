"use client";

import { useEffect, useState } from "react";

interface ChatWaveformProps {
  isActive: boolean;
  isPearl?: boolean;
}

export function ChatWaveform({ isActive, isPearl = false }: ChatWaveformProps) {
  const [animationTick, setAnimationTick] = useState(0);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setAnimationTick(prev => prev + 1);
    }, 100);

    return () => clearInterval(interval);
  }, [isActive]);

  const barHeights = Array.from({ length: 16 }, (_, i) => {
    if (!isActive) {
      return 0.2;
    }

    const time = animationTick * 0.1;
    const wave1 = Math.sin(time + i * 0.5) * 0.3;
    const wave2 = Math.sin(time * 1.3 + i * 0.3) * 0.2;
    const wave3 = Math.sin(time * 0.7 + i * 0.7) * 0.15;

    const combined = 0.4 + wave1 + wave2 + wave3;
    return Math.max(0.15, Math.min(0.85, combined));
  });

  const gradientClass = isPearl
    ? 'bg-gradient-to-b from-purple-500 via-purple-400 to-indigo-500'
    : 'bg-gradient-to-b from-slate-400 via-slate-300 to-slate-400';

  return (
    <div className="flex items-center justify-center gap-1 px-2 py-3 min-h-[60px]">
      {barHeights.map((height, index) => (
        <div
          key={index}
          className="relative flex items-center"
          style={{
            width: '3px',
            height: '40px',
          }}
        >
          <div
            className={'w-full rounded-full transition-all duration-200 ease-out ' + gradientClass}
            style={{
              height: height * 100 + '%',
              opacity: isActive ? 0.9 : 0.4,
            }}
          />
        </div>
      ))}
    </div>
  );
}
