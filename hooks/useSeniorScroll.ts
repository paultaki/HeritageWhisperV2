import { useState, useEffect, useCallback, RefObject } from 'react';

interface SeniorScrollConfig {
  /** Show indicators after this many milliseconds of inactivity */
  reappearDelay?: number;
  /** Hide indicators after user scrolls this many pixels */
  hideAfterScroll?: number;
  /** LocalStorage key for tracking if user has learned to scroll */
  storageKey?: string;
}

interface SeniorScrollState {
  /** Whether the content is scrollable */
  hasScroll: boolean;
  /** Whether indicators should be visible */
  showIndicators: boolean;
  /** Whether user has scrolled on this page */
  hasScrolled: boolean;
  /** Current scroll percentage (0-100) */
  scrollProgress: number;
  /** Whether user has ever scrolled (persisted) */
  userLearnedToScroll: boolean;
}

/**
 * Senior-friendly scroll tracking hook
 * - Detects scrollable content
 * - Shows/hides indicators based on user behavior
 * - Persists learning across sessions
 * - Reappears indicators if user idle too long
 */
export function useSeniorScroll(
  scrollRef: RefObject<HTMLElement>,
  config: SeniorScrollConfig = {}
): SeniorScrollState {
  const {
    reappearDelay = 10000, // 10 seconds
    hideAfterScroll = 100, // 100px
    storageKey = 'hw-user-learned-scroll',
  } = config;

  const [hasScroll, setHasScroll] = useState(false);
  const [showIndicators, setShowIndicators] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [userLearnedToScroll, setUserLearnedToScroll] = useState(false);
  const [lastScrollTime, setLastScrollTime] = useState(Date.now());

  // Check if user has learned to scroll (from localStorage)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const learned = localStorage.getItem(storageKey) === 'true';
      setUserLearnedToScroll(learned);
      
      // If user hasn't learned yet, show indicators by default
      if (!learned) {
        setShowIndicators(true);
      }
    }
  }, [storageKey]);

  // Check if content is scrollable
  useEffect(() => {
    const checkScroll = () => {
      if (scrollRef.current) {
        const element = scrollRef.current;
        const isScrollable = element.scrollHeight > element.clientHeight + 5;
        setHasScroll(isScrollable);
        
        // Show indicators if scrollable and user hasn't learned
        if (isScrollable && !userLearnedToScroll) {
          setShowIndicators(true);
        }
      }
    };

    checkScroll();
    
    // Recheck on resize
    window.addEventListener('resize', checkScroll);
    
    // Also check after a short delay (content might still be loading)
    const timer = setTimeout(checkScroll, 500);
    
    return () => {
      window.removeEventListener('resize', checkScroll);
      clearTimeout(timer);
    };
  }, [scrollRef, userLearnedToScroll]);

  // Track scroll events
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    
    const element = scrollRef.current;
    const scrolled = element.scrollTop;
    const maxScroll = element.scrollHeight - element.clientHeight;
    const progress = maxScroll > 0 ? (scrolled / maxScroll) * 100 : 0;
    
    setScrollProgress(progress);
    setLastScrollTime(Date.now());

    // User scrolled - hide indicators and mark as learned
    if (scrolled > hideAfterScroll && !hasScrolled) {
      setHasScrolled(true);
      setShowIndicators(false);
      
      // Persist learning
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, 'true');
        setUserLearnedToScroll(true);
      }
    }
  }, [scrollRef, hideAfterScroll, hasScrolled, storageKey]);

  // Attach scroll listener
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    element.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      element.removeEventListener('scroll', handleScroll);
    };
  }, [scrollRef, handleScroll]);

  // Reappear indicators after inactivity (only if user hasn't learned)
  useEffect(() => {
    if (userLearnedToScroll || !hasScroll) return;

    const checkInactivity = setInterval(() => {
      const timeSinceScroll = Date.now() - lastScrollTime;
      
      if (timeSinceScroll > reappearDelay && !showIndicators) {
        setShowIndicators(true);
      }
    }, 1000);

    return () => clearInterval(checkInactivity);
  }, [lastScrollTime, reappearDelay, showIndicators, hasScroll, userLearnedToScroll]);

  return {
    hasScroll,
    showIndicators,
    hasScrolled,
    scrollProgress,
    userLearnedToScroll,
  };
}

