"use client";

import { useMediaQuery } from "@/hooks/use-media-query";
import { useRouter } from "next/navigation";
import { TimelineDesktop } from "@/components/timeline/TimelineDesktop";
import { TimelineMobileV2 } from "@/components/timeline/TimelineMobileV2";
import { useEffect, useState } from "react";

export default function TimelinePage() {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const router = useRouter();
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
    return (
      <div className="relative">
        <TimelineMobileV2 />
        {/* Build version indicator */}
        <div className="fixed bottom-2 right-2 text-xs opacity-30 pointer-events-none z-50">
          Build: 2025-11-14 7:58pm (Paul)
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen relative"
      style={{ backgroundColor: isDark ? "#1c1c1d" : "#faf8f5" }}
    >
      {/* Spine glow - subtle radial gradient down the center */}
      {!isDark && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 800px 100% at 50% 50%, rgba(166,131,104,0.03), transparent)',
          }}
        />
      )}

      {/* Main timeline content */}
      <main className="flex-1 min-w-0 relative z-10">
        <TimelineDesktop useV2Features={true} />
      </main>
      
      {/* Build version indicator */}
      <div className="fixed bottom-2 right-2 text-xs opacity-30 pointer-events-none z-50">
        Build: 2025-11-14 7:58pm (Paul)
      </div>
    </div>
  );
}
