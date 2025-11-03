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
  const isPearl = message.sender === 'hw';

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

  // Typing indicator (Pearl is composing)
  if (message.type === 'typing') {
    return (
      <>
        <div className="flex justify-start">
          <div className="max-w-[75%]">
            {/* Sender label */}
            <div className="mb-1 px-3 text-xs font-medium">
              <span className="shimmer-text">Pearl</span>
            </div>
            {/* Bubble with typing dots */}
            <div
              className="px-5 py-3 rounded-3xl rounded-tl-sm bg-white shadow-md"
              style={{
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
            >
              <div className="flex items-center gap-1">
                <div className="typing-dot"></div>
                <div className="typing-dot" style={{ animationDelay: '0.2s' }}></div>
                <div className="typing-dot" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        </div>

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

          .typing-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: #D1D5DB;
            animation: typing 1.4s infinite;
          }

          @keyframes typing {
            0%, 60%, 100% {
              transform: translateY(0);
              background-color: #D1D5DB;
            }
            30% {
              transform: translateY(-10px);
              background-color: #9CA3AF;
            }
          }
        `}</style>
      </>
    );
  }

  // Question bubbles (Pearl - left side)
  if (message.type === 'question') {
    return (
      <div className="flex justify-start">
        <div className="max-w-[78%]">
          {/* Sender label */}
          <div className="mb-1 px-3 text-[13px] font-medium text-slate-600">
            Pearl
          </div>
          {/* Bubble */}
          <div
            className="rounded-2xl px-4 py-3 shadow-sm ring-1 bg-[#E8D5F2] text-[#2C2C2C] ring-[#8B5CF6]/30"
            role="text"
            aria-label={`Pearl says ${message.content}`}
          >
            <p className="text-[16px] leading-relaxed">
              {message.content}
            </p>
          </div>
          {/* Timestamp */}
          <div className="mt-1 px-3 text-[12px] text-[#6B7280]">
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
        <div className="max-w-[78%]">
          {/* Sender label */}
          <div className="mb-1 px-3 text-[13px] font-medium text-slate-600 text-right">
            You
          </div>
          {/* Bubble */}
          <div
            className="rounded-2xl px-4 py-3 shadow-sm ring-1 bg-white text-[#2C2C2C] ring-black/5"
            role="text"
            aria-label={`You said ${message.content}`}
          >
            <AudioPlayer
              audioBlob={message.audioBlob}
              duration={message.audioDuration || 0}
            />
            {message.content && (
              <p className="text-[16px] leading-relaxed mt-2">
                {message.content}
              </p>
            )}
          </div>
          {/* Timestamp */}
          <div className="mt-1 px-3 text-[12px] text-[#6B7280] text-right">
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
        <div className="max-w-[78%]">
          {/* Sender label */}
          <div className="mb-1 px-3 text-[13px] font-medium text-slate-600 text-right">
            You
          </div>
          {/* Bubble */}
          <div
            className="rounded-2xl px-4 py-3 shadow-sm ring-1 bg-white text-[#2C2C2C] ring-black/5"
            role="text"
            aria-label={`You said ${message.content}`}
          >
            <p className="text-[16px] leading-relaxed">
              {message.content}
            </p>
          </div>
          {/* Timestamp */}
          <div className="mt-1 px-3 text-[12px] text-[#6B7280] text-right">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    );
  }

  return null;
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
    <div className="flex items-center gap-3">
      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors flex-shrink-0"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 text-slate-700 fill-slate-700" />
        ) : (
          <Play className="w-4 h-4 text-slate-700 fill-slate-700 ml-0.5" />
        )}
      </button>

      {/* Waveform Visualization */}
      <div className="flex items-center gap-0.5 flex-1 h-8">
        {bars.map((height, i) => (
          <div
            key={i}
            className="w-1 bg-slate-300 rounded-full transition-all"
            style={{
              height: `${height * 100}%`,
              opacity: isPlaying ? 1 : 0.7,
            }}
          />
        ))}
      </div>

      {/* Duration */}
      <div className="text-sm font-medium tabular-nums flex-shrink-0 text-slate-600">
        {formatTime(isPlaying ? currentTime : duration)}
      </div>

      {/* Hidden Audio Element */}
      {audioUrl && (
        <audio ref={audioRef} src={audioUrl} preload="metadata" />
      )}
    </div>
  );
}
