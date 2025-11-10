'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Loader2, ChevronLeft, ChevronRight, Volume2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { normalizeYear } from '@/lib/utils';

interface Photo {
  url: string;
  isHero?: boolean;
  transform?: any;
}

interface Story {
  id: string;
  title: string;
  storyYear: string | number;
  lifeAge?: number;
  storyDate?: string;
  audioUrl?: string;
  durationSeconds?: number;
  photos?: Photo[];
  photoUrl?: string;
  photoTransform?: any;
}

interface TimelineCardV2Props {
  story: Story;
  birthYear: number;
  audioManager: any;
}

export default function TimelineCardV2({ story, birthYear, audioManager }: TimelineCardV2Props) {
  // CHANGE 1: Audio state with progress tracking
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(story.durationSeconds || 0);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // CHANGE 3: Photo carousel state
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Get all photos
  const photos = story.photos || (story.photoUrl ? [{ url: story.photoUrl, transform: story.photoTransform }] : []);
  const hasMultiplePhotos = photos.length > 1;

  // CHANGE 1: Format duration helper
  const formatDuration = (seconds?: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // CHANGE 1: Audio playback handler
  const handlePlayAudio = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      audioManager.pause(story.id);
      return;
    }

    if (story.audioUrl && story.audioUrl.trim() !== '') {
      setIsLoading(true);

      const audio = new Audio(story.audioUrl);
      audio.crossOrigin = 'anonymous';

      audioManager.play(story.id, audio);
      audioRef.current = audio;

      audio.addEventListener('loadstart', () => {
        setIsLoading(true);
      });

      audio.addEventListener('canplay', () => {
        setIsLoading(false);
        setDuration(audio.duration);
      });

      audio.addEventListener('timeupdate', () => {
        const progressPercent = (audio.currentTime / audio.duration) * 100;
        setProgress(progressPercent);
        setCurrentTime(audio.currentTime);
      });

      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime(0);
        audioManager.pause(story.id);
      });

      audio.addEventListener('error', (error) => {
        console.error('Audio playback error:', error);
        setIsPlaying(false);
        setIsLoading(false);
        audioManager.pause(story.id);
      });

      audio
        .play()
        .then(() => {
          setIsPlaying(true);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error('Error playing audio:', error);
          setIsPlaying(false);
          setIsLoading(false);
        });
    }
  };

  // Register with audio manager
  useEffect(() => {
    const handleAudioStateChange = (playing: boolean) => {
      if (!playing && audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime(0);
      }
    };

    audioManager.register(story.id, handleAudioStateChange);

    return () => {
      audioManager.unregister(story.id);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [story.id, audioManager]);

  // CHANGE 3: Photo carousel handlers
  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) {
      // Swiped left
      handleNextPhoto({} as React.MouseEvent);
    }

    if (touchStart - touchEnd < -75) {
      // Swiped right
      handlePrevPhoto({} as React.MouseEvent);
    }
  };

  // CHANGE 4: Format metadata (Age 7 • Summer 1962)
  const formatMetadata = () => {
    const year = normalizeYear(story.storyYear);
    const age = story.lifeAge !== null && story.lifeAge !== undefined 
      ? story.lifeAge > 0 
        ? `Age ${story.lifeAge}` 
        : story.lifeAge === 0 
          ? 'Birth' 
          : 'Before birth'
      : null;

    // Extract season from storyDate if available
    let season = '';
    if (story.storyDate) {
      const date = new Date(story.storyDate);
      const month = date.getMonth();
      if (month >= 2 && month <= 4) season = 'Spring';
      else if (month >= 5 && month <= 7) season = 'Summer';
      else if (month >= 8 && month <= 10) season = 'Fall';
      else season = 'Winter';
    }

    const yearPart = season ? `${season} ${year}` : year;

    return age ? `${age} • ${yearPart}` : yearPart;
  };

  const currentPhoto = photos[currentPhotoIndex];

  return (
    <Card className="hw-card relative overflow-hidden transition-all hover:shadow-lg border-0 md:border" style={{ "--title-offset": "180px" } as React.CSSProperties}>
      {/* Year badge */}
      <span className="hw-year">
        {normalizeYear(story.storyYear)}
      </span>

      {/* Photo section with carousel */}
      {photos.length > 0 && (
        <div 
          className="relative w-full aspect-[16/10] bg-gray-100"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <img
            src={currentPhoto.url}
            alt={story.title}
            className="w-full h-full object-cover"
            style={
              currentPhoto.transform
                ? {
                    transform: `scale(${currentPhoto.transform.zoom}) translate(${currentPhoto.transform.position.x}%, ${currentPhoto.transform.position.y}%)`,
                    transformOrigin: 'center center',
                  }
                : undefined
            }
          />

          {/* CHANGE 3: Photo count indicator */}
          {hasMultiplePhotos && (
            <div className="absolute top-3 right-3 bg-black/70 text-white px-2.5 py-1 rounded-full text-xs font-semibold">
              {currentPhotoIndex + 1} of {photos.length}
            </div>
          )}

          {/* CHANGE 3: Arrow buttons for seniors (44x44px for easy tapping) */}
          {hasMultiplePhotos && (
            <>
              <button
                onClick={handlePrevPhoto}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-11 h-11 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-all"
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={handleNextPhoto}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-all"
                aria-label="Next photo"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* CHANGE 3: Dot indicators */}
          {hasMultiplePhotos && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
              {photos.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentPhotoIndex ? 'bg-white w-4' : 'bg-white/60'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Card content - Compact horizontal layout */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Title and metadata stacked */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-serif font-semibold text-gray-800 mb-0.5 truncate">
              {story.title}
            </h3>
            <p className="text-sm text-gray-600">
              {formatMetadata()}
            </p>
          </div>

          {/* Right: Audio player */}
          {story.audioUrl && (
            <button
              onClick={handlePlayAudio}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0"
              aria-label={isPlaying ? "Pause audio" : "Play audio"}
            >
              {/* Circular progress ring */}
              <div className="relative w-10 h-10">
                <svg className="w-10 h-10 -rotate-90">
                  {/* Background circle */}
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    fill="none"
                    stroke="#FDE68A"
                    strokeWidth="2.5"
                  />
                  {/* Progress circle */}
                  {isPlaying && (
                    <circle
                      cx="20"
                      cy="20"
                      r="16"
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="2.5"
                      strokeDasharray={`${2 * Math.PI * 16}`}
                      strokeDashoffset={`${2 * Math.PI * 16 * (1 - progress / 100)}`}
                      strokeLinecap="round"
                      className="transition-all duration-300"
                    />
                  )}
                </svg>
                {/* Icon in center */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
                  ) : isPlaying ? (
                    <Pause className="w-5 h-5 text-amber-600 fill-amber-600" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-amber-600" />
                  )}
                </div>
              </div>

              {/* Text label - Hidden on mobile for compactness */}
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-sm font-semibold text-amber-800">
                  {isPlaying ? 'Playing...' : `${formatDuration(duration)}`}
                </span>
                {isPlaying && (
                  <span className="text-xs text-gray-600">
                    {formatDuration(currentTime)} / {formatDuration(duration)}
                  </span>
                )}
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Hover provenance */}
      <div className="absolute bottom-0 left-0 right-0 bg-white/98 border-t border-gray-200 px-4 py-2 text-xs text-gray-500 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
        Recorded with Heritage Whisper
      </div>
    </Card>
  );
}

