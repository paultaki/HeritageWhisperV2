"use client";

import { useMediaQuery } from "@/hooks/use-media-query";
import { useRouter } from "next/navigation";
import { TimelineDesktop } from "@/components/timeline/TimelineDesktop";
import { TimelineMobileV2 } from "@/components/timeline-v2/TimelineMobileV2";
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
    return <TimelineMobileV2 />;
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: isDark ? "#1c1c1d" : "#FFF8F3" }}
    >
      {/* Main timeline content */}
      <main className="flex-1 min-w-0">
        <TimelineDesktop useV2Features={true} />
      </main>
    </div>
  );
}
