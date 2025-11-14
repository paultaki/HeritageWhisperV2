"use client";

import { useState, useEffect } from "react";

/**
 * Hook that detects and tracks actual visible viewport height
 * Handles Chrome URL bar auto-hide/show behavior on mobile
 * 
 * Returns:
 * - viewportHeight: Current window.innerHeight (changes as URL bar slides)
 * - urlBarHeight: Estimated height of browser chrome (URL bar, etc.)
 * - isUrlBarVisible: Whether the URL bar is currently taking up space
 */
export function useSafeViewport() {
  const [viewportHeight, setViewportHeight] = useState<number | undefined>(undefined);
  const [urlBarHeight, setUrlBarHeight] = useState<number>(0);
  
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    const updateHeight = () => {
      // window.innerHeight changes as URL bar slides in/out
      const vh = window.innerHeight;
      
      // visualViewport.height stays constant (actual visible area)
      const vvh = window.visualViewport?.height || vh;
      
      setViewportHeight(vh);
      
      // Calculate URL bar height (difference between window and visual viewport)
      const barHeight = Math.max(0, vh - vvh);
      setUrlBarHeight(barHeight);
    };
    
    // Initial measurement
    updateHeight();
    
    // Listen for viewport changes
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateHeight);
      window.visualViewport.addEventListener('scroll', updateHeight);
    }
    
    // Fallback to window resize
    window.addEventListener('resize', updateHeight);
    
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateHeight);
        window.visualViewport.removeEventListener('scroll', updateHeight);
      }
      window.removeEventListener('resize', updateHeight);
    };
  }, []);
  
  return { 
    viewportHeight, 
    urlBarHeight, 
    isUrlBarVisible: urlBarHeight > 10 // Threshold to avoid false positives
  };
}
