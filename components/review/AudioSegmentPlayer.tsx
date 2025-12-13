"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, AlertCircle } from "lucide-react";
import { formatDuration } from "@/lib/audioSlicer";

interface AudioSegmentPlayerProps {
  url: string;
  durationSeconds: number;
  disabled?: boolean;
}

/**
 * Audio player that handles WebM files with broken duration metadata.
 * 
 * WebM files from MediaRecorder often have incorrect duration in the header
 * (e.g., 0.059s instead of 158s). This player works around this by:
 * 1. Fetching the full audio file as a blob
 * 2. Creating an object URL from the blob
 * 3. Using the provided durationSeconds for display (not relying on audio.duration)
 */
export function AudioSegmentPlayer({
  url,
  durationSeconds,
  disabled = false,
}: AudioSegmentPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Blob URL for the fetched audio (fixes WebM duration issues)
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loadProgress, setLoadProgress] = useState(0);

  // Use provided duration - don't trust audio.duration for WebM files
  const displayDuration = durationSeconds > 0 ? durationSeconds : 0;

  // Fetch the audio file as a blob to work around WebM duration issues
  useEffect(() => {
    if (!url) {
      setHasError(true);
      setErrorMessage("No audio URL");
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    
    const fetchAudio = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        setErrorMessage(null);
        
        console.log('[AudioSegmentPlayer] Fetching audio file:', url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const contentLength = response.headers.get('content-length');
        const total = contentLength ? parseInt(contentLength, 10) : 0;
        
        if (response.body && total > 0) {
          // Stream the response to track progress
          const reader = response.body.getReader();
          const chunks: BlobPart[] = [];
          let received = 0;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            // Convert Uint8Array to ArrayBuffer for BlobPart compatibility
            chunks.push(value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength));
            received += value.length;
            
            if (!cancelled) {
              setLoadProgress(Math.round((received / total) * 100));
            }
          }

          if (cancelled) return;

          // Combine chunks into a single blob
          const blob = new Blob(chunks, { type: 'audio/webm' });
          const objectUrl = URL.createObjectURL(blob);
          
          console.log('[AudioSegmentPlayer] Audio loaded, size:', (blob.size / 1024).toFixed(1), 'KB');
          setBlobUrl(objectUrl);
        } else {
          // Fallback: just get the blob directly
          const blob = await response.blob();
          if (cancelled) return;
          
          const objectUrl = URL.createObjectURL(blob);
          console.log('[AudioSegmentPlayer] Audio loaded (no progress), size:', (blob.size / 1024).toFixed(1), 'KB');
          setBlobUrl(objectUrl);
        }
        
        setIsLoading(false);
      } catch (err) {
        if (cancelled) return;
        
        console.error('[AudioSegmentPlayer] Error fetching audio:', err);
        setHasError(true);
        setErrorMessage(err instanceof Error ? err.message : 'Failed to load audio');
        setIsLoading(false);
      }
    };

    fetchAudio();

    return () => {
      cancelled = true;
      // Clean up blob URL when component unmounts or URL changes
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [url]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !blobUrl) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      console.log('[AudioSegmentPlayer] Audio ended at:', audio.currentTime);
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = (e: Event) => {
      const audioEl = e.target as HTMLAudioElement;
      console.error('[AudioSegmentPlayer] Audio error:', audioEl.error);
      setHasError(true);
      setErrorMessage('Playback error');
    };

    const handleLoadedMetadata = () => {
      console.log('[AudioSegmentPlayer] Blob audio loaded, browser duration:', audio.duration);
      // Even with blob, WebM might have bad duration - we still use durationSeconds
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [blobUrl]);

  const togglePlayPause = useCallback(async () => {
    if (disabled || hasError || !blobUrl) return;

    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (err) {
        console.error('[AudioSegmentPlayer] Play error:', err);
        setHasError(true);
        setErrorMessage('Unable to play');
      }
    }
  }, [disabled, hasError, blobUrl, isPlaying]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled || hasError || !blobUrl) return;

    const audio = audioRef.current;
    if (!audio) return;

    const time = parseFloat(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  }, [disabled, hasError, blobUrl]);

  // Calculate progress
  const progress = displayDuration > 0 ? (currentTime / displayDuration) * 100 : 0;

  // Format time display
  const formatTime = (seconds: number): string => {
    if (!seconds || !isFinite(seconds) || isNaN(seconds) || seconds < 0) return "0:00";
    return formatDuration(seconds);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-[var(--hw-primary-soft)] flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-[var(--hw-primary)] border-t-transparent rounded-full animate-spin" />
        </div>
        <div className="flex-1">
          <div className="h-2 bg-[var(--hw-section-bg)] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[var(--hw-primary)]/50 rounded-full transition-all" 
              style={{ width: `${loadProgress}%` }} 
            />
          </div>
          <span className="text-xs text-[var(--hw-text-muted)] mt-1">
            Loading audio... {loadProgress > 0 ? `${loadProgress}%` : ''}
          </span>
        </div>
      </div>
    );
  }

  // Error state
  if (hasError) {
    return (
      <div className="flex items-center gap-3 text-[var(--hw-error)]">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
          <AlertCircle className="w-5 h-5" />
        </div>
        <span className="text-sm">{errorMessage || 'Audio unavailable'}</span>
      </div>
    );
  }

  return (
    <div className={`${disabled ? "opacity-50" : ""}`}>
      {/* Audio element uses blob URL for reliable playback */}
      <audio ref={audioRef} src={blobUrl || undefined} preload="auto" />

      <div className="flex items-center gap-3">
        {/* Play/Pause button */}
        <button
          onClick={togglePlayPause}
          disabled={disabled || !blobUrl}
          className={`
            w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0
            ${disabled || !blobUrl ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
            ${isPlaying
              ? "bg-[var(--hw-primary)] text-white"
              : "bg-[var(--hw-primary-soft)] text-[var(--hw-primary)]"
            }
            transition-colors
          `}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5 ml-0.5" />
          )}
        </button>

        {/* Progress bar */}
        <div className="flex-1 flex items-center gap-3">
          <div className="flex-1 relative">
            {/* Track background */}
            <div className="h-2 bg-[var(--hw-section-bg)] rounded-full overflow-hidden">
              {/* Progress fill */}
              <div
                className="h-full bg-[var(--hw-primary)] rounded-full transition-all"
                style={{ width: `${Math.min(100, progress)}%` }}
              />
            </div>
            
            {/* Range input (invisible, for interaction) */}
            <input
              type="range"
              min="0"
              max={displayDuration || 100}
              step="0.1"
              value={currentTime}
              onChange={handleSeek}
              disabled={disabled || displayDuration === 0}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              aria-label="Seek"
            />
          </div>

          {/* Time display */}
          <span className="text-sm font-medium text-[var(--hw-text-secondary)] tabular-nums min-w-[80px] text-right">
            {formatTime(currentTime)} / {formatTime(displayDuration)}
          </span>
        </div>
      </div>
    </div>
  );
}
