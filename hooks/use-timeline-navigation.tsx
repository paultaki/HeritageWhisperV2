/**
 * useTimelineNavigation Hook
 *
 * Manages scroll tracking, highlighting, and navigation for the timeline view.
 *
 * Responsibilities:
 * - IntersectionObserver for decade tracking
 * - URL parameter highlight detection
 * - Return navigation from BookView (sessionStorage)
 * - Auto-scroll to highlighted stories
 * - Decade jump logic
 * - Decade ref management
 *
 * Created: January 25, 2025
 * Extracted from: TimelineMobile.tsx lines 895-902, 989-1094, 1122-1191, 1428-1442
 */

import { useState, useEffect, useRef, useCallback } from "react";
import type { UseTimelineNavigationReturn } from "@/types/timeline";

export interface UseTimelineNavigationOptions {
  user: any;
  storiesData: any;
}

/**
 * useTimelineNavigation
 *
 * Hook for managing timeline scroll tracking and navigation
 */
export function useTimelineNavigation({
  user,
  storiesData,
}: UseTimelineNavigationOptions): UseTimelineNavigationReturn {
  // ==================================================================================
  // State
  // ==================================================================================

  const [activeDecade, setActiveDecade] = useState<string | null>(null);
  const [highlightedStoryId, setHighlightedStoryId] = useState<string | null>(
    null,
  );
  const [returnHighlightId, setReturnHighlightId] = useState<string | null>(
    null,
  );
  const decadeRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  // ==================================================================================
  // URL Parameter Detection & Return Navigation
  // ==================================================================================

  // Detect highlight parameter from URL and check for return navigation context
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const highlightId = urlParams.get("highlight");

    // Check for return navigation context from BookView
    const contextStr = sessionStorage.getItem("timeline-navigation-context");
    if (contextStr) {
      try {
        const context = JSON.parse(contextStr);
        const isExpired = Date.now() - context.timestamp > 5 * 60 * 1000; // 5 minutes expiry

        if (!isExpired && context.returnPath === "/timeline") {
          // Set the return highlight
          setReturnHighlightId(context.memoryId);

          // Restore scroll position after a brief delay to ensure DOM is ready
          setTimeout(() => {
            window.scrollTo({
              top: context.scrollPosition,
              behavior: "instant",
            });

            // Then apply smooth scroll to the specific card for visual feedback
            const memoryCard = document.querySelector(
              `[data-testid="memory-card-${context.memoryId}"]`,
            ) as HTMLElement;
            if (memoryCard) {
              const rect = memoryCard.getBoundingClientRect();
              const absoluteTop = rect.top + window.pageYOffset;
              const offset = window.innerHeight / 2 - rect.height / 2; // Center the card

              window.scrollTo({
                top: absoluteTop - offset,
                behavior: "smooth",
              });
            }
          }, 100);

          // Clear the context after using it
          sessionStorage.removeItem("timeline-navigation-context");

          // Remove highlight after animation
          setTimeout(() => {
            setReturnHighlightId(null);
          }, 3000);
        } else if (isExpired) {
          // Clear expired context
          sessionStorage.removeItem("timeline-navigation-context");
        }
      } catch (e) {
        console.error("Failed to parse navigation context:", e);
        sessionStorage.removeItem("timeline-navigation-context");
      }
    }

    if (highlightId) {
      setHighlightedStoryId(highlightId);
      // Clean up URL parameter
      urlParams.delete("highlight");
      const newUrl =
        window.location.pathname +
        (urlParams.toString() ? "?" + urlParams.toString() : "");
      window.history.replaceState({}, "", newUrl);
    }
  }, []);

  // ==================================================================================
  // Auto-scroll to Highlighted Story
  // ==================================================================================

  // Auto-scroll to highlighted memory when stories load
  useEffect(() => {
    if (highlightedStoryId && storiesData) {
      const stories = (storiesData as any)?.stories || [];
      const highlightedStory = stories.find(
        (story: any) => story.id === highlightedStoryId,
      );

      if (highlightedStory) {
        // Wait for DOM to render, then scroll to the highlighted memory
        const scrollToHighlighted = () => {
          const memoryCard = document.querySelector(
            `[data-testid="memory-card-${highlightedStoryId}"]`,
          ) as HTMLElement;
          if (memoryCard) {
            // Use scrollIntoView with center alignment for better UX
            memoryCard.scrollIntoView({
              behavior: "smooth",
              block: "center",
              inline: "center",
            });

            // Clear the highlighted story ID after a delay to remove the highlight effect
            setTimeout(() => {
              setHighlightedStoryId(null);
            }, 3000);
          } else {
            // If element not found, retry after a short delay (DOM still rendering)
            setTimeout(scrollToHighlighted, 100);
          }
        };

        // Use requestAnimationFrame for better DOM render detection
        requestAnimationFrame(() => {
          requestAnimationFrame(scrollToHighlighted);
        });
      }
    }
  }, [highlightedStoryId, storiesData]);

  // ==================================================================================
  // IntersectionObserver for Scroll Tracking
  // ==================================================================================

  // Setup IntersectionObserver for scroll tracking
  useEffect(() => {
    if (!user || !storiesData) return; // Only run when we have data

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const decadeId = entry.target.getAttribute("data-decade-id");
            if (decadeId) {
              setActiveDecade(decadeId);
            }
          }
        });
      },
      {
        rootMargin: "-100px 0px -60% 0px",
        threshold: 0,
      },
    );

    // Observe all decade sections
    (Object.values(decadeRefs.current) ?? []).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      (Object.values(decadeRefs.current) ?? []).forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, [user, storiesData]);

  // ==================================================================================
  // Decade Jump Logic
  // ==================================================================================

  const handleDecadeClick = useCallback((decadeId: string) => {
    // Scroll to the decade section
    const element = decadeRefs.current[decadeId];
    if (element) {
      const headerOffset = 80; // Account for sticky header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  }, []);

  // ==================================================================================
  // Ref Registration
  // ==================================================================================

  const registerDecadeRef = useCallback(
    (decadeId: string, el: HTMLElement | null) => {
      decadeRefs.current[decadeId] = el;
    },
    [],
  );

  // ==================================================================================
  // Return hook interface
  // ==================================================================================

  return {
    // State
    activeDecade,
    highlightedStoryId,
    returnHighlightId,

    // Refs
    decadeRefs,

    // Actions
    handleDecadeClick,
    registerDecadeRef,
  };
}
