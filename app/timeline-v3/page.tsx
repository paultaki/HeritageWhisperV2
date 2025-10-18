"use client";

import { useMediaQuery } from "@/hooks/use-media-query";
import { TimelineDesktop } from "@/components/timeline/TimelineDesktop";
import { TimelineMobile } from "@/components/timeline/TimelineMobile";
import Link from "next/link";
import { Home, Users, Settings, HelpCircle, Share2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function TimelineV3Page() {
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
      {/* Left Sidebar */}
      <aside
        className="hidden lg:flex lg:w-56 flex-col gap-2 p-4"
        style={{
          position: "sticky",
          top: 72,
          height: "100vh",
          backgroundColor: "transparent",
          borderRight: "none",
          color: isDark ? "#b0b3b8" : undefined,
        }}
      >
        <nav className="mt-4 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:opacity-90"
            style={{ color: isDark ? "#b0b3b8" : "#111827" }}
          >
            <Home className="w-5 h-5" />
            <span>Home</span>
          </Link>
          <Link
            href="/family"
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:opacity-90"
            style={{ color: isDark ? "#b0b3b8" : "#111827" }}
          >
            <Users className="w-5 h-5" />
            <span>Family</span>
          </Link>
          <Link
            href="/profile"
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:opacity-90"
            style={{ color: isDark ? "#b0b3b8" : "#111827" }}
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </Link>
          <Link
            href="/help"
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:opacity-90"
            style={{ color: isDark ? "#b0b3b8" : "#111827" }}
          >
            <HelpCircle className="w-5 h-5" />
            <span>Help</span>
          </Link>
          <Link
            href="/share"
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:opacity-90"
            style={{ color: isDark ? "#b0b3b8" : "#111827" }}
          >
            <Share2 className="w-5 h-5" />
            <span>Share</span>
          </Link>
        </nav>
      </aside>

      {/* Main timeline content */}
      <main className="flex-1 min-w-0">
        <TimelineDesktop />
      </main>
    </div>
  );
}
