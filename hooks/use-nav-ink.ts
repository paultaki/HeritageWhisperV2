"use client";

import { useEffect, useState, useRef } from "react";

type NavInk = "dark" | "light";

interface UseNavInkOptions {
  defaultInk: NavInk;
  navId: string;
}

/**
 * Hook that automatically switches navigation ink (text color) based on content behind the nav.
 * Uses IntersectionObserver to detect elements marked with data-nav-ink="light".
 *
 * @param defaultInk - Default ink color based on page context
 * @param navId - ID of the navigation element to calculate rootMargin
 * @returns Current ink color ("dark" or "light")
 */
export function useNavInk({ defaultInk, navId }: UseNavInkOptions): NavInk {
  const [ink, setInk] = useState<NavInk>(defaultInk);
  const rafRef = useRef<number | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const mutationObserverRef = useRef<MutationObserver | null>(null);

  useEffect(() => {
    // Reset ink when defaultInk changes (e.g., route change)
    setInk(defaultInk);

    // Get nav element to calculate height for rootMargin
    const navElement = document.getElementById(navId);
    if (!navElement) {
      console.warn(`useNavInk: Navigation element with id "${navId}" not found`);
      return;
    }

    const navHeight = navElement.offsetHeight || 60; // fallback to 60px

    // Track which observed elements are currently intersecting the nav zone
    const intersectingElements = new Set<Element>();

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      // Cancel any pending animation frame
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      // Debounce with requestAnimationFrame for smooth performance
      rafRef.current = requestAnimationFrame(() => {
        entries.forEach((entry) => {
          const target = entry.target as HTMLElement;
          const targetInk = target.getAttribute('data-nav-ink') as NavInk | null;

          // Switch to target ink when element significantly intersects (≥35% visible)
          if (entry.intersectionRatio >= 0.35) {
            if (targetInk) {
              intersectingElements.add(target);
            }
          }
          // Switch back when element mostly exits (<15% visible)
          else if (entry.intersectionRatio < 0.15) {
            intersectingElements.delete(target);
          }
          // Between 0.15-0.35: hysteresis zone, maintain current state
        });

        // Determine the ink color based on intersecting elements
        // If ANY intersecting element requests a specific ink, we use it
        // If multiple elements intersect (rare), we prioritize the last one added (most recent)
        let requestedInk: NavInk | null = null;
        if (intersectingElements.size > 0) {
          // Get the last element added to the set (most likely the one the user just scrolled to)
          const lastElement = Array.from(intersectingElements).pop() as HTMLElement;
          requestedInk = lastElement.getAttribute('data-nav-ink') as NavInk | null;
        }

        setInk(requestedInk || defaultInk);
      });
    };

    // Create IntersectionObserver with rootMargin to watch only the nav area
    // For a bottom nav at viewport height - navHeight, we need to shrink the
    // root from the top so only the bottom nav-height zone is active
    const rootMarginTop = -(window.innerHeight - navHeight);

    observerRef.current = new IntersectionObserver(handleIntersection, {
      root: null, // Use viewport as root
      rootMargin: `${rootMarginTop}px 0px 0px 0px`, // Watch only bottom nav zone
      threshold: [0, 0.15, 0.35, 0.5, 0.75, 1], // Multiple thresholds for smooth transitions
    });

    // Observe all existing elements marked with data-nav-ink
    const elementsToObserve = document.querySelectorAll('[data-nav-ink]');
    elementsToObserve.forEach((el) => {
      observerRef.current?.observe(el);
    });

    // Watch for dynamically added elements (infinite scroll, etc.)
    mutationObserverRef.current = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof Element) {
            // Check if the node itself has the attribute
            if (node.hasAttribute('data-nav-ink')) {
              observerRef.current?.observe(node);
            }
            // Check children for the attribute
            const children = node.querySelectorAll('[data-nav-ink]');
            children.forEach((child) => {
              observerRef.current?.observe(child);
            });
          }
        });

        // Handle removed nodes
        mutation.removedNodes.forEach((node) => {
          if (node instanceof Element) {
            intersectingElements.delete(node);
          }
        });
      });
    });

    mutationObserverRef.current.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Cleanup on unmount or dependency change
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      observerRef.current?.disconnect();
      mutationObserverRef.current?.disconnect();
      intersectingElements.clear();
    };
  }, [defaultInk, navId]);

  return ink;
}
