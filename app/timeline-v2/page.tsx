"use client";

import { useMediaQuery } from "@/hooks/use-media-query";
import { useRouter } from "next/navigation";
import { TimelineDesktopV2 } from "@/components/timeline/TimelineDesktopV2";
import { TimelineMobileV2 } from "@/components/timeline/TimelineMobileV2";
import { useEffect, useState } from "react";

export default function TimelineV2Page() {
  // V2: Switch to mobile at 768px instead of 1024px
  const isDesktop = useMediaQuery("(min-width: 768px)");
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
    return <TimelineMobileV2 />;
  }

  return (
    <div
      className="hw-page relative"
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
        <TimelineDesktopV2 useV2Features={true} />
      </main>
    </div>
  );
}
