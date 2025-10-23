"use client";

import { useMediaQuery } from "@/hooks/use-media-query";
import { TimelineDesktop } from "@/components/timeline/TimelineDesktop";
import { TimelineMobile } from "@/components/timeline/TimelineMobile";
import { useEffect, useState } from "react";
import { LeftSidebar } from "@/components/LeftSidebar";

export default function TimelinePage() {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const updateFromDom = () => {
      const dark =
        document.documentElement.classList.contains("dark") ||
        document.body.classList.contains("dark");
      setIsDark(dark);
    };
    updateFromDom();
    const handler = () => updateFromDom();
    window.addEventListener("hw-theme-change", handler);
    return () => window.removeEventListener("hw-theme-change", handler);
  }, []);

  if (!isDesktop) {
    return <TimelineMobile />;
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: isDark ? "#1c1c1d" : "#FFF8F3" }}
    >
      <LeftSidebar topOffsetClass="lg:top-[102px]" />

      {/* Main timeline content */}
      <main className="flex-1 min-w-0 lg:ml-56">
        <TimelineDesktop />
      </main>
    </div>
  );
}
