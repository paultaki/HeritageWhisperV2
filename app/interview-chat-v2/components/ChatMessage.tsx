"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";
import { Message } from "../page";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.sender === 'user';
  const isSystem = message.sender === 'system';

  // System messages (centered)
  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="max-w-md px-4 py-2 rounded-full bg-gray-100 text-sm text-gray-600 text-center">
          {message.content}
        </div>
      </div>
    );
  }

  // Question bubbles (HW - left side)
  if (message.type === 'question') {
    return (
      <div className="flex justify-start">
        <div className="max-w-[75%]">
          {/* Sender label */}
          <div className="mb-1 px-3 text-xs font-medium flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-xs font-bold">
              P
            </div>
            <span className="text-amber-900/60 font-serif italic">Pearl</span>
          </div>
          {/* Bubble */}
          <div
            className="px-6 py-4 rounded-3xl rounded-tl-none bg-[#fffdf5] border border-amber-100/50 shadow-sm"
            style={{
              boxShadow: '0 4px 12px rgba(251, 191, 36, 0.05)',
            }}
          >
            <p
              className="leading-relaxed"
              style={{
                fontFamily: 'var(--font-serif)',
                color: '#2d1810',
                fontSize: '22px', // Larger for seniors
                lineHeight: '1.5',
              }}
            >
              {message.content}
            </p>
          </div>
          {/* Timestamp */}
          <div className="mt-1 px-3 text-xs text-gray-400">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    );
  }

  // Audio response bubbles (User - right side)
  if (message.type === 'audio-response') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%]">
          {/* Sender label */}
          <div className="mb-1 px-3 text-xs text-gray-500 font-medium text-right">
            You
          </div>
          {/* Bubble */}
          <div
            className="px-4 py-3 rounded-3xl rounded-tr-sm text-white"
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #f43f5e 100%)',
              boxShadow: '0 2px 8px rgba(245,158,11,0.3)',
            }}
          >
            {/* Always show audio player for V1 (interview-chat-v2 after swap) */}
            {message.audioBlob && (
              <>
                <AudioPlayer
                  audioBlob={message.audioBlob}
                  duration={message.audioDuration || 0}
                />
                {message.content && (
                  <p className="text-base mt-2 opacity-90" style={{ fontSize: '16px' }}>
                    {message.content}
                  </p>
                )}
              </>
            )}
            {/* When no audio, just show text */}
            {!message.audioBlob && message.content && (
              <p className="text-base leading-relaxed" style={{ fontSize: '18px' }}>
                {message.content}
              </p>
            )}
          </div>
          {/* Timestamp */}
          <div className="mt-1 px-3 text-xs text-gray-400 text-right">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    );
  }

  // Text response bubbles (User - right side)
  if (message.type === 'text-response') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%]">
          {/* Sender label */}
          <div className="mb-1 px-3 text-xs text-gray-500 font-medium text-right">
            You
          </div>
          {/* Bubble */}
          <div
            className="px-5 py-3 rounded-3xl rounded-tr-sm text-white"
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #f43f5e 100%)',
              boxShadow: '0 2px 8px rgba(245,158,11,0.3)',
            }}
          >
            <p className="text-base leading-relaxed" style={{ fontSize: '18px' }}>
              {message.content}
            </p>
          </div>
          {/* Timestamp */}
          <div className="mt-1 px-3 text-xs text-gray-400 text-right">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {null}
      <style jsx>{`
        .shimmer-text {
          background: linear-gradient(
            90deg,
            #D97706 0%,
            #F59E0B 25%,
            #FBBF24 50%,
            #F59E0B 75%,
            #D97706 100%
          );
          background-size: 200% auto;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 3s linear infinite;
          font-weight: 600;
        }

        @keyframes shimmer {
          0% {
            background-position: 200% center;
          }
          100% {
            background-position: -200% center;
          }
        }
      `}</style>
    </>
  );
}

// Audio Player Component (simplified waveform)
interface AudioPlayerProps {
  audioBlob?: Blob;
  duration: number;
}

function AudioPlayer({ audioBlob, duration }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [audioBlob]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Simple waveform bars (static visualization)
  const bars = [0.3, 0.7, 0.5, 0.9, 0.6, 0.4, 0.8, 0.5, 0.7, 0.3, 0.6, 0.8, 0.5, 0.4, 0.7];

  return (
    <>
      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors flex-shrink-0"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 text-white fill-white" />
          ) : (
            <Play className="w-4 h-4 text-white fill-white ml-0.5" />
          )}
        </button>

        {/* Waveform Visualization */}
        <div className="flex items-center gap-0.5 flex-1 h-8">
          {bars.map((height, i) => (
            <div
              key={i}
              className="w-1 bg-white/70 rounded-full transition-all"
              style={{
                height: `${height * 100}%`,
                opacity: isPlaying ? 1 : 0.7,
              }}
            />
          ))}
        </div>

        {/* Duration */}
        <div className="text-sm font-medium tabular-nums flex-shrink-0">
          {formatTime(isPlaying ? currentTime : duration)}
        </div>

        {/* Hidden Audio Element */}
        {audioUrl && (
          <audio ref={audioRef} src={audioUrl} preload="metadata" />
        )}
      </div>
    </>
  );
}
