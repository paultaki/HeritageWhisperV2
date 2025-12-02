"use client";

/**
 * PhotoLightbox Component
 *
 * A premium full-screen photo lightbox for viewing photos in the book view.
 * Features:
 * - Full-screen overlay with dark backdrop
 * - Carousel navigation for multiple photos
 * - Smooth motion animations
 * - Touch swipe gestures on mobile
 * - Keyboard navigation (Escape to close, Arrow keys for carousel)
 * - iOS-compatible body scroll lock
 * - Focus trap for accessibility
 * - Large touch targets (48x48px) for senior-friendly UX
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface LightboxPhoto {
  url: string;
  displayUrl?: string;
  caption?: string;
  transform?: { zoom: number; position: { x: number; y: number } };
  width?: number;
  height?: number;
}

interface PhotoLightboxProps {
  photos: LightboxPhoto[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  alt?: string;
}

// Animation variants
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const photoVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

const buttonVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { delay: 0.1 } },
  exit: { opacity: 0 },
};

const transition = { type: "spring" as const, damping: 25, stiffness: 300 };

export function PhotoLightbox({
  photos,
  initialIndex = 0,
  isOpen,
  onClose,
  alt = "Photo",
}: PhotoLightboxProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  // Only render portal on client side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync currentIndex with initialIndex when lightbox opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  const hasMultiplePhotos = photos.length > 1;
  const currentPhoto = photos[currentIndex];
  const photoUrl = currentPhoto?.displayUrl || currentPhoto?.url;

  // Navigation handlers
  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  }, [photos.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  }, [photos.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft" && hasMultiplePhotos) {
        e.preventDefault();
        goToPrev();
      } else if (e.key === "ArrowRight" && hasMultiplePhotos) {
        e.preventDefault();
        goToNext();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, hasMultiplePhotos, goToPrev, goToNext, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !overlayRef.current) return;

    const focusableElements = overlayRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

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

  // Body scroll lock using position fixed pattern for iOS WebKit compatibility
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.dataset.scrollY = String(scrollY);
    } else {
      const scrollY = document.body.dataset.scrollY;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY));
        delete document.body.dataset.scrollY;
      }
    }
    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      delete document.body.dataset.scrollY;
    };
  }, [isOpen]);

  // Touch handlers for swipe gestures
  const minSwipeDistance = 75;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (hasMultiplePhotos) {
      if (isLeftSwipe) {
        goToNext();
      } else if (isRightSwipe) {
        goToPrev();
      }
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!currentPhoto || !photoUrl) return null;

  // Don't render on server side
  if (!mounted) return null;

  // Use portal to render at document body level (escapes book page container)
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={overlayRef}
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          initial="hidden"
          animate="visible"
          exit="exit"
          role="dialog"
          aria-modal="true"
          aria-label={`Photo lightbox: ${alt}`}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/95"
            variants={backdropVariants}
            transition={{ duration: 0.2 }}
            onClick={handleBackdropClick}
          />

          {/* Close button - dark background ensures visibility on any photo */}
          <motion.button
            onClick={onClose}
            className="absolute top-4 right-4 z-[10002] w-12 h-12 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors shadow-lg"
            variants={buttonVariants}
            transition={transition}
            aria-label="Close lightbox"
          >
            <X size={24} />
          </motion.button>

          {/* Photo counter */}
          {hasMultiplePhotos && (
            <motion.div
              className="absolute top-4 left-4 z-[10002] bg-black/60 text-white px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg"
              variants={buttonVariants}
              transition={transition}
            >
              {currentIndex + 1} / {photos.length}
            </motion.div>
          )}

          {/* Previous button - dark background ensures visibility on any photo */}
          {hasMultiplePhotos && (
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                goToPrev();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-[10002] w-12 h-12 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors shadow-lg"
              variants={buttonVariants}
              transition={transition}
              aria-label="Previous photo"
            >
              <ChevronLeft size={28} />
            </motion.button>
          )}

          {/* Next button - dark background ensures visibility on any photo */}
          {hasMultiplePhotos && (
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-[10002] w-12 h-12 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors shadow-lg"
              variants={buttonVariants}
              transition={transition}
              aria-label="Next photo"
            >
              <ChevronRight size={28} />
            </motion.button>
          )}

          {/* Photo container */}
          <motion.div
            className="relative z-[10001] flex items-center justify-center p-4 sm:p-8"
            style={{ width: '100vw', height: '100vh' }}
            variants={photoVariants}
            transition={transition}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={handleBackdropClick}
          >
            <div
              className="relative flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 
                Photo display logic:
                - Shows at native size (100%) if image fits within viewport
                - Scales down to fit if image is larger than viewport
                - Max constraints: 90vw width, 85vh height (leaves room for padding/controls)
              */}
              <img
                src={photoUrl}
                alt={alt}
                className="rounded-lg shadow-2xl"
                style={{
                  maxWidth: 'min(90vw, 100%)',
                  maxHeight: '85vh',
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain',
                  ...(currentPhoto.transform ? {
                    transform: `scale(${currentPhoto.transform.zoom}) translate(${currentPhoto.transform.position.x}%, ${currentPhoto.transform.position.y}%)`,
                    transformOrigin: 'center center',
                  } : {}),
                }}
              />
            </div>
          </motion.div>

          {/* Caption */}
          {currentPhoto.caption && (
            <motion.div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[10002] max-w-lg px-4"
              variants={buttonVariants}
              transition={transition}
            >
              <p className="text-white text-center text-sm bg-black/50 px-4 py-2 rounded-lg backdrop-blur-sm">
                {currentPhoto.caption}
              </p>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

