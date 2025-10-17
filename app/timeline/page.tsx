"use client";

import { useMediaQuery } from "@/hooks/use-media-query";
import { TimelineDesktop } from "@/components/timeline/TimelineDesktop";
import { TimelineMobile } from "@/components/timeline/TimelineMobile";

/**
 * Unified Timeline Page
 * 
 * Renders different timeline layouts based on screen size:
 * - Desktop (≥1024px): Timeline V2 with centered vertical timeline and alternating cards
 * - Mobile (<1024px): Original timeline with decade navigation and vertical scroll
 */
export default function TimelinePage() {
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  // Render the appropriate layout based on screen size
  return isDesktop ? <TimelineDesktop /> : <TimelineMobile />;
}
