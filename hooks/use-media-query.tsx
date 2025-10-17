import { useState, useEffect } from 'react';

/**
 * Custom hook to detect media query matches
 * @param query - CSS media query string (e.g., "(min-width: 1024px)")
 * @returns boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Create media query list
    const media = window.matchMedia(query);
    
    // Set initial value
    setMatches(media.matches);

    // Create listener function
    const listener = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    // Add listener (using both old and new syntax for compatibility)
    if (media.addEventListener) {
      media.addEventListener('change', listener);
    } else {
      // Fallback for older browsers
      media.addListener(listener);
    }

    // Cleanup
    return () => {
      if (media.removeEventListener) {
        media.removeEventListener('change', listener);
      } else {
        // Fallback for older browsers
        media.removeListener(listener);
      }
    };
  }, [query]);

  return matches;
}
