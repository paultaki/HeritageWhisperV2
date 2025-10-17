import { useEffect, useRef, useState } from 'react';

interface UseScrollRevealOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

/**
 * useScrollReveal Hook
 * 
 * High-performance scroll reveal using Intersection Observer.
 * Triggers animations when elements enter the viewport.
 * 
 * @param options Configuration options
 * @returns { elementRef, isVisible, scrollProgress }
 * 
 * @example
 * const { elementRef, isVisible } = useScrollReveal({ triggerOnce: true });
 * 
 * <div ref={elementRef} className={isVisible ? 'revealed' : ''}>
 *   Content
 * </div>
 */
export function useScrollReveal(options: UseScrollRevealOptions = {}) {
  const {
    threshold = 0.1,
    rootMargin = '0px 0px -10% 0px', // Trigger slightly before entering viewport
    triggerOnce = true,
  } = options;

  const elementRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Check for prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsVisible(true);
      setScrollProgress(1);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          
          // Calculate scroll progress (0 to 1)
          const progress = Math.max(0, Math.min(1, entry.intersectionRatio));
          setScrollProgress(progress);

          // Unobserve if triggerOnce is true (performance optimization)
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
          setScrollProgress(0);
        }
      },
      {
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce]);

  return { elementRef, isVisible, scrollProgress };
}

