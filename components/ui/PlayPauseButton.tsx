'use client';

import { Play, Pause, Loader2 } from 'lucide-react';

interface PlayPauseButtonProps {
  isPlaying: boolean;
  isLoading?: boolean;
  progress?: number;
  onClick: (e: React.MouseEvent) => void;
  size?: number;
  className?: string;
}

export default function PlayPauseButton({
  isPlaying,
  isLoading = false,
  progress = 0,
  onClick,
  size = 48,
  className = '',
}: PlayPauseButtonProps) {
  const strokeWidth = 2;
  const radius = 8;
  
  // Calculate perimeter for the rounded rect
  // For a rect with rounded corners: perimeter ≈ 4 * (side - 2*radius) + 2*π*radius
  const side = size - 8; // Accounting for padding
  const straightPart = side - 2 * radius;
  const perimeter = 4 * straightPart + 2 * Math.PI * radius;
  
  // Calculate the stroke dash offset based on progress (0-100)
  const progressOffset = perimeter - (progress / 100) * perimeter;

  return (
    <button
      onClick={onClick}
      className={`relative flex items-center justify-center flex-shrink-0 transition-transform active:scale-95 ${className}`}
      style={{ 
        width: size, 
        height: size,
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
      }}
      aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background rounded square - subtle outline */}
        <rect
          x={strokeWidth}
          y={strokeWidth}
          width={size - strokeWidth * 2}
          height={size - strokeWidth * 2}
          rx={radius}
          fill="transparent"
          stroke="rgba(255, 255, 255, 0.15)"
          strokeWidth={strokeWidth}
        />
        
        {/* Progress indicator - animated stroke around border */}
        {isPlaying && !isLoading && (
          <rect
            x={strokeWidth}
            y={strokeWidth}
            width={size - strokeWidth * 2}
            height={size - strokeWidth * 2}
            rx={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={perimeter}
            strokeDashoffset={progressOffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.1s linear',
              transformOrigin: 'center',
            }}
          />
        )}
        
        {/* Center icon container with dark background */}
        <rect
          x={8}
          y={8}
          width={size - 16}
          height={size - 16}
          rx={radius - 2}
          fill="rgba(28, 25, 23, 0.95)"
        />
      </svg>
      
      {/* Play/Pause/Loading icon - positioned absolutely over SVG */}
      <div className="absolute inset-0 flex items-center justify-center text-white">
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isPlaying ? (
          <Pause className="w-5 h-5" />
        ) : (
          <Play className="w-5 h-5 relative left-[0.5px]" />
        )}
      </div>
    </button>
  );
}
