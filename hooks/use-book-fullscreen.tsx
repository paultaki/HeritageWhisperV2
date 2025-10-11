"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface BookFullscreenState {
  isFullscreen: boolean;
  setFullscreen: (value: boolean) => void;
  toggleFullscreen: () => void;
}

/**
 * Global state for book fullscreen mode
 * 
 * Features:
 * - Persists preference in localStorage
 * - Shared across NavigationWrapper and Book page
 * - Smooth state transitions
 */
export const useBookFullscreen = create<BookFullscreenState>()(
  persist(
    (set) => ({
      isFullscreen: false,
      setFullscreen: (value: boolean) => set({ isFullscreen: value }),
      toggleFullscreen: () =>
        set((state) => ({ isFullscreen: !state.isFullscreen })),
    }),
    {
      name: "book-fullscreen-preference",
    }
  )
);
