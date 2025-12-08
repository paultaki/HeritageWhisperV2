/**
 * useTimelineUI Hook
 *
 * Manages UI state for the timeline view including color schemes, theme, and modals.
 *
 * Responsibilities:
 * - Color scheme state and keyboard shortcuts (Cmd+1-7)
 * - Dark theme synchronization
 * - Paywall modal state
 * - Memory overlay state
 * - Selected story state
 *
 * Created: January 25, 2025
 * Extracted from: TimelineMobile.tsx lines 893-907, 921-987
 */

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Story } from "@/lib/supabase";
import type { UseTimelineUIReturn, ColorScheme } from "@/types/timeline";

/**
 * useTimelineUI
 *
 * Hook for managing timeline UI state (color scheme, theme, modals)
 */
export function useTimelineUI(): UseTimelineUIReturn {
  const { toast } = useToast();

  // ==================================================================================
  // State
  // ==================================================================================

  const [isDark, setIsDark] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [currentColorScheme, setCurrentColorScheme] =
    useState<ColorScheme>("original");
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [overlayOpen, setOverlayOpen] = useState(false);

  // ==================================================================================
  // Dark Theme Synchronization
  // ==================================================================================

  // Sync with global dark theme
  useEffect(() => {
    const updateFromDom = () => {
      const dark =
        document.documentElement.classList.contains("dark-theme") ||
        document.body.classList.contains("dark-theme");
      setIsDark(dark);
    };
    updateFromDom();
    const handler = () => updateFromDom();
    window.addEventListener("hw-theme-change", handler);
    return () => window.removeEventListener("hw-theme-change", handler);
  }, []);

  // ==================================================================================
  // Color Scheme Keyboard Shortcuts
  // ==================================================================================

  // Keyboard shortcuts for color scheme switching
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Check if cmd/ctrl is held
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case "1":
            e.preventDefault();
            setCurrentColorScheme("original");
            toast({ title: "Color scheme: Original" });
            break;
          case "2":
            e.preventDefault();
            setCurrentColorScheme("white");
            toast({ title: "Color scheme: Clean White" });
            break;
          case "3":
            e.preventDefault();
            setCurrentColorScheme("inverted");
            toast({ title: "Color scheme: Inverted" });
            break;
          case "4":
            e.preventDefault();
            setCurrentColorScheme("soft");
            toast({ title: "Color scheme: Soft Gray" });
            break;
          case "5":
            e.preventDefault();
            setCurrentColorScheme("cool");
            toast({ title: "Color scheme: Cool Blue" });
            break;
          case "6":
            e.preventDefault();
            setCurrentColorScheme("dark");
            toast({ title: "Color scheme: Dark Mode" });
            break;
          case "7":
            e.preventDefault();
            setCurrentColorScheme("retro");
            toast({ title: "Color scheme: Retro Radio" });
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [toast]);

  // ==================================================================================
  // Return hook interface
  // ==================================================================================

  return {
    // Color & Theme
    currentColorScheme,
    isDark,
    setCurrentColorScheme,

    // Modals & Overlays
    showPaywall,
    setShowPaywall,
    overlayOpen,
    setOverlayOpen,
    selectedStory,
    setSelectedStory,
  };
}
