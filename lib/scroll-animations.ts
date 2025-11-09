'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Custom hook for fade-in animation on scroll
 * @param threshold - Percentage of element visibility to trigger (0-1)
 * @param delay - Delay before animation starts (ms)
 */
export function useScrollFadeIn(threshold = 0.2, delay = 0) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            setIsVisible(true)
          }, delay)
        }
      },
      {
        threshold,
        rootMargin: '0px 0px -50px 0px', // Trigger slightly before element is fully in view
      }
    )

    const currentRef = ref.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [threshold, delay])

  return { ref, isVisible }
}

/**
 * CSS classes for fade-in animation
 */
export const fadeInClasses = {
  initial: 'opacity-0 translate-y-12',
  animate: 'opacity-100 translate-y-0 transition-all duration-700 ease-out',
}
