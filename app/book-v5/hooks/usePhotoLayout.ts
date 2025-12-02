"use client";

import { useState, useEffect } from "react";

export type SnapZone = 1 | 2 | 3 | 4 | 5 | 6;

export interface PhotoLayout {
  photoId: string;
  zone: SnapZone;
  width: number;
}

const STORAGE_KEY_PREFIX = "book-v5-layout-";

/**
 * Hook to manage photo layouts with localStorage persistence
 */
export function usePhotoLayout(storyId: string) {
  const [layouts, setLayouts] = useState<PhotoLayout[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const key = `${STORAGE_KEY_PREFIX}${storyId}`;
    const stored = localStorage.getItem(key);
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setLayouts(parsed);
      } catch (error) {
        console.error("Failed to parse photo layout:", error);
      }
    }
    
    setIsLoaded(true);
  }, [storyId]);

  // Save to localStorage
  const saveLayout = (newLayouts: PhotoLayout[]) => {
    setLayouts(newLayouts);
    
    if (typeof window === "undefined") return;
    
    const key = `${STORAGE_KEY_PREFIX}${storyId}`;
    localStorage.setItem(key, JSON.stringify(newLayouts));
  };

  // Update a specific photo's layout
  const updatePhotoLayout = (photoId: string, zone: SnapZone, width: number) => {
    const newLayouts = layouts.filter((l) => l.photoId !== photoId);
    newLayouts.push({ photoId, zone, width });
    saveLayout(newLayouts);
  };

  // Get layout for a specific photo
  const getPhotoLayout = (photoId: string): PhotoLayout | undefined => {
    return layouts.find((l) => l.photoId === photoId);
  };

  // Reset all layouts
  const resetLayouts = () => {
    saveLayout([]);
    if (typeof window !== "undefined") {
      const key = `${STORAGE_KEY_PREFIX}${storyId}`;
      localStorage.removeItem(key);
    }
  };

  return {
    layouts,
    isLoaded,
    updatePhotoLayout,
    getPhotoLayout,
    resetLayouts,
  };
}

