"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, BookOpen, Edit2, Play, Pause } from "lucide-react";
import type { Story } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface MemoryOverlayProps {
  story: Story;
  stories: Story[]; // All stories for navigation
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (storyId: string) => void;
  originPath?: string; // Where to return after editing
}

export function MemoryOverlay({
  story,
  stories,
  isOpen,
  onClose,
  onNavigate,
  originPath,
}: MemoryOverlayProps) {
  const router = useRouter();
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // Find current story index
  const currentIndex = stories.findIndex((s) => s.id === story.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < stories.length - 1;

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      } else if (e.key === "ArrowLeft" && hasPrev) {
        handlePrevStory();
      } else if (e.key === "ArrowRight" && hasNext) {
        handleNextStory();
      } else if (e.key === " " && audioRef.current) {
        e.preventDefault();
        toggleAudio();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, hasPrev, hasNext, story.id]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !overlayRef.current) return;

    const focusableElements = overlayRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleTab);
    firstElement?.focus();

    return () => document.removeEventListener("keydown", handleTab);
  }, [isOpen]);

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Reset audio state and photo index when story changes
  useEffect(() => {
    console.log('[MemoryOverlay] Story changed, resetting state for story:', story.id);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setCurrentPhotoIndex(0);

    // Reset audio element if it exists
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      console.log('[MemoryOverlay] Audio element reset');
    }
  }, [story.id]);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      const time = audio.currentTime;
      setCurrentTime(time);
      console.log('[MemoryOverlay] Time update:', time, 'Duration:', audio.duration);
    };

    const updateDuration = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
        console.log('[MemoryOverlay] Duration set:', audio.duration);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      console.log('[MemoryOverlay] Audio ended');
    };

    const handleCanPlay = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
        console.log('[MemoryOverlay] Can play - duration:', audio.duration);
      }
    };

    const handlePlay = () => {
      console.log('[MemoryOverlay] Audio started playing');
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", handlePlay);

    // Initial duration check
    if (audio.duration && !isNaN(audio.duration)) {
      setDuration(audio.duration);
      console.log('[MemoryOverlay] Initial duration:', audio.duration);
    }

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", handlePlay);
    };
  }, [story.id]);

  // Touch gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const deltaX = e.changedTouches[0].clientX - touchStart.x;
    const deltaY = e.changedTouches[0].clientY - touchStart.y;

    // Swipe down to close (from top 100px of modal)
    if (deltaY > 80 && Math.abs(deltaX) < 50 && touchStart.y < 100) {
      handleClose();
    }
    // Swipe left for next
    else if (deltaX < -80 && Math.abs(deltaY) < 50 && hasNext) {
      handleNextStory();
    }
    // Swipe right for previous
    else if (deltaX > 80 && Math.abs(deltaY) < 50 && hasPrev) {
      handlePrevStory();
    }

    setTouchStart(null);
  };

  const handleClose = useCallback(() => {
    setIsClosing(true);
    // Pause audio
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  }, [onClose]);

  const handlePrevStory = () => {
    if (!hasPrev) return;
    const prevStory = stories[currentIndex - 1];
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    onNavigate?.(prevStory.id);
  };

  const handleNextStory = () => {
    if (!hasNext) return;
    const nextStory = stories[currentIndex + 1];
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    onNavigate?.(nextStory.id);
  };

  const toggleAudio = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
      // Immediately sync currentTime to ensure progress bar updates right away
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleViewInBook = () => {
    // Navigate to book view at this story's page
    router.push(`/book?storyId=${story.id}`);
  };

  const handleEdit = () => {
    // Use the origin path if provided, otherwise default to book view at this story
    const returnPath = originPath || `/book?storyId=${story.id}`;
    router.push(`/review/book-style?id=${story.id}&returnPath=${encodeURIComponent(returnPath)}`);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isOpen) return null;

  // Get all photos (prefer photos array, fallback to legacy photoUrl)
  const allPhotos = story.photos && story.photos.length > 0
    ? story.photos
    : story.photoUrl
    ? [{ id: 'legacy', url: story.photoUrl, transform: story.photoTransform, isHero: true }]
    : [];

  const hasPhotos = allPhotos.length > 0;
  const hasMultiplePhotos = allPhotos.length > 1;
  const currentPhoto = hasPhotos ? allPhotos[currentPhotoIndex] : null;

  const handlePrevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev > 0 ? prev - 1 : allPhotos.length - 1));
  };

  const handleNextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev < allPhotos.length - 1 ? prev + 1 : 0));
  };

  // Touch gestures for photo gallery
  const [photoTouchStart, setPhotoTouchStart] = useState<{ x: number; y: number } | null>(null);

  const handlePhotoTouchStart = (e: React.TouchEvent) => {
    setPhotoTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    });
  };

  const handlePhotoTouchEnd = (e: React.TouchEvent) => {
    if (!photoTouchStart || !hasMultiplePhotos) return;

    const deltaX = e.changedTouches[0].clientX - photoTouchStart.x;
    const deltaY = Math.abs(e.changedTouches[0].clientY - photoTouchStart.y);

    // Only swipe if horizontal movement is greater than vertical (to avoid interfering with scroll)
    if (Math.abs(deltaX) > 50 && deltaY < 30) {
      if (deltaX < 0) {
        // Swipe left - next photo
        handleNextPhoto();
      } else {
        // Swipe right - previous photo
        handlePrevPhoto();
      }
    }

    setPhotoTouchStart(null);
  };

  return (
    <div
      ref={overlayRef}
      className={`memory-overlay ${isClosing ? "memory-overlay-closing" : ""}`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="memory-title"
    >
      <div
        ref={contentRef}
        className="memory-overlay-content"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed Header */}
        <div className="memory-overlay-header">
          <div className="memory-overlay-year">
            {story.storyYear}
            {story.lifeAge !== undefined && story.lifeAge !== null && (
              <>
                <span className="memory-overlay-year-divider">•</span>
                <span className="memory-overlay-age-inline">
                  {story.lifeAge > 0
                    ? `Age ${story.lifeAge}`
                    : story.lifeAge === 0
                      ? "Birth"
                      : "Before birth"}
                </span>
              </>
            )}
          </div>
          <button
            onClick={handleClose}
            className="memory-overlay-close"
            aria-label="Close story"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="memory-overlay-body">
          {/* Photo Gallery */}
          {hasPhotos && currentPhoto && (
            <div
              className="relative w-full aspect-[3/2] overflow-hidden rounded-xl my-6 shadow-lg bg-gray-100"
              onTouchStart={handlePhotoTouchStart}
              onTouchEnd={handlePhotoTouchEnd}
            >
              {/* Photo */}
              <img
                src={currentPhoto.url}
                alt={currentPhoto.caption || story.title}
                className="absolute inset-0 w-full h-full select-none"
                style={
                  currentPhoto.transform
                    ? {
                        transform: `scale(${currentPhoto.transform.zoom}) translate(${currentPhoto.transform.position.x / currentPhoto.transform.zoom}px, ${currentPhoto.transform.position.y / currentPhoto.transform.zoom}px)`,
                        transformOrigin: "center center",
                        objectFit: "cover",
                      }
                    : {
                        objectFit: "cover",
                      }
                }
              />

              {/* Navigation Arrows (only show if multiple photos) */}
              {hasMultiplePhotos && (
                <>
                  <button
                    onClick={handlePrevPhoto}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all"
                    aria-label="Previous photo"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={handleNextPhoto}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all"
                    aria-label="Next photo"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}

              {/* Photo Indicators (dots) */}
              {hasMultiplePhotos && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                  {allPhotos.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPhotoIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentPhotoIndex
                          ? "bg-white w-6"
                          : "bg-white/50 hover:bg-white/75"
                      }`}
                      aria-label={`Go to photo ${index + 1}`}
                    />
                  ))}
                </div>
              )}

              {/* Photo Caption */}
              {currentPhoto.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <p className="text-white text-sm text-center">
                    {currentPhoto.caption}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Title */}
          <h2 id="memory-title" className="memory-overlay-title">
            {story.title}
          </h2>

          {/* Lesson Learned Card */}
          {story.wisdomClipText && (
            <div className="memory-overlay-lesson">
              <div className="memory-overlay-lesson-label">Lesson Learned</div>
              <p className="memory-overlay-lesson-text">
                {story.wisdomClipText}
              </p>
            </div>
          )}

          {/* Audio Player */}
          {story.audioUrl && (
            <div className="memory-overlay-audio">
              <audio
                key={story.id}
                ref={audioRef}
                src={story.audioUrl}
                preload="metadata"
              />

              <div className="memory-overlay-audio-controls">
                <button
                  onClick={toggleAudio}
                  className="memory-overlay-audio-play"
                  aria-label={isPlaying ? "Pause audio" : "Play audio"}
                >
                  {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                </button>

                <div className="memory-overlay-audio-progress">
                  {/* Progress Bar */}
                  <div
                    className="memory-overlay-audio-bar"
                    onClick={(e) => {
                      if (!audioRef.current || !duration) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickX = e.clientX - rect.left;
                      const clickRatio = clickX / rect.width;
                      const newTime = clickRatio * duration;
                      audioRef.current.currentTime = newTime;
                      setCurrentTime(newTime);
                    }}
                  >
                    <div
                      className="memory-overlay-audio-bar-fill"
                      style={{
                        width: duration && currentTime > 0
                          ? `${(currentTime / duration) * 100}%`
                          : '0%',
                      }}
                    />
                  </div>
                  {/* Time Display */}
                  <div className="memory-overlay-audio-times">
                    <span className="memory-overlay-audio-time">
                      {formatTime(currentTime)}
                    </span>
                    <span className="memory-overlay-audio-time">
                      {duration ? formatTime(duration) : "--:--"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Full Transcription */}
          {story.transcription && (
            <div className="memory-overlay-transcript">
              <h3 className="memory-overlay-transcript-heading">Story</h3>
              <p className="memory-overlay-transcript-text">
                {story.transcription}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="memory-overlay-actions">
            <button
              onClick={handleViewInBook}
              className="memory-overlay-action-btn"
            >
              <BookOpen size={20} />
              View in Book
            </button>
            <button onClick={handleEdit} className="memory-overlay-action-btn">
              <Edit2 size={20} />
              Edit Story
            </button>
          </div>
        </div>

        {/* Fixed Footer with Navigation */}
        <div className="memory-overlay-footer">
          <button
            onClick={handlePrevStory}
            disabled={!hasPrev}
            className="memory-overlay-nav-btn"
            aria-label="Previous story"
          >
            <ChevronLeft size={24} />
          </button>

          <button
            onClick={handleNextStory}
            disabled={!hasNext}
            className="memory-overlay-nav-btn"
            aria-label="Next story"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}
