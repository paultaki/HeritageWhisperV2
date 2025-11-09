"use client";

import { TimelineDesktop } from "@/components/timeline/TimelineDesktop";
import { useState, useEffect } from "react";

export default function TimelineDesktopV2Page() {
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

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: isDark ? "#1c1c1d" : "#FFF8F3" }}
    >
      <main className="flex-1 min-w-0">
        <TimelineDesktop useV2Features={true} />
      </main>
    </div>
  );
}
