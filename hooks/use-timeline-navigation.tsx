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
    console.log('[TimelineNav] Checking for navigation context:', contextStr);
    if (contextStr) {
      try {
        const context = JSON.parse(contextStr);
        const isExpired = Date.now() - context.timestamp > 5 * 60 * 1000; // 5 minutes expiry
        console.log('[TimelineNav] Parsed context:', context, 'isExpired:', isExpired);

        if (!isExpired && context.returnPath === "/timeline") {
          console.log('[TimelineNav] Valid context found, setting up navigation to:', context.memoryId);
          // Set the return highlight
          setReturnHighlightId(context.memoryId);

          // Retry mechanism to wait for DOM to be ready
          const scrollToMemory = (attempt = 0) => {
            const maxAttempts = 20; // Try for up to 2 seconds (20 * 100ms)

            // Try both selectors: mobile uses data-testid, desktop uses data-memory-id
            let memoryCard = document.querySelector(
              `[data-testid="memory-card-${context.memoryId}"]`,
            ) as HTMLElement;

            if (!memoryCard) {
              memoryCard = document.querySelector(
                `[data-memory-id="${context.memoryId}"]`,
              ) as HTMLElement;
            }

            console.log(`[TimelineNav] Attempt ${attempt + 1}/${maxAttempts} - Looking for memory card:`, memoryCard);

            if (memoryCard) {
              // Found it! Scroll to it
              console.log('[TimelineNav] Found memory card, scrolling into view');
              memoryCard.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
            } else if (attempt < maxAttempts) {
              // Not found yet, retry after 100ms
              setTimeout(() => scrollToMemory(attempt + 1), 100);
            } else {
              console.warn('[TimelineNav] Memory card not found after', maxAttempts, 'attempts');
            }
          };

          // Start scrolling attempt after initial delay
          setTimeout(() => scrollToMemory(0), 200);

          // Clear the context after using it
          sessionStorage.removeItem("timeline-navigation-context");

          // Remove highlight after animation
          setTimeout(() => {
            setReturnHighlightId(null);
          }, 3000);
        } else if (isExpired) {
          console.log('[TimelineNav] Context expired, clearing');
          // Clear expired context
          sessionStorage.removeItem("timeline-navigation-context");
        } else {
          console.log('[TimelineNav] Context returnPath mismatch:', context.returnPath);
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
