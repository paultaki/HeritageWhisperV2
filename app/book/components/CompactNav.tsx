"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Clock3, BookOpen, User, Lightbulb } from "lucide-react";
import { motion } from "framer-motion";

type CompactNavProps = {
  currentStoryId?: string;
};

export function CompactNav({ currentStoryId }: CompactNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", damping: 20 }}
      className="hidden md:flex fixed bottom-0 left-0 right-0 bg-[#0b0d12]/95 backdrop-blur-md border-t-2 items-center justify-center z-40"
      style={{
        height: '36px', // Half of original 72px
        borderTopColor: "rgba(255, 255, 255, 0.1)",
        boxShadow: "0 -4px 12px rgba(0, 0, 0, 0.08)",
      }}
    >
      {/* Navigation Items - Icons only, evenly spaced */}
      <div className="flex items-center justify-center gap-12">
        <button
          onClick={() => {
            console.log('[CompactNav] Timeline clicked. currentStoryId:', currentStoryId);

            // If we have a current story ID, store navigation context for timeline to scroll to it
            if (currentStoryId) {
              const context = {
                memoryId: currentStoryId,
                scrollPosition: 0, // Start at top, will scroll to card
                timestamp: Date.now(),
                returnPath: '/timeline', // Required by timeline navigation logic
              };
              console.log('[CompactNav] Setting sessionStorage context:', context);
              sessionStorage.setItem('timeline-navigation-context', JSON.stringify(context));
              console.log('[CompactNav] SessionStorage set. Verifying:', sessionStorage.getItem('timeline-navigation-context'));
            } else {
              console.log('[CompactNav] No currentStoryId - skipping sessionStorage');
            }

            router.push("/timeline");
          }}
          className="flex items-center justify-center p-2 rounded-lg transition-all hover:bg-white/10 relative"
          style={{
            color: "#ffffff",
          }}
        >
          {pathname === "/timeline" && (
            <div
              className="absolute left-1/2 -translate-x-1/2 h-1 rounded-full"
              style={{
                backgroundColor: "#ffffff",
                width: "32px",
                top: "-7px",
              }}
            />
          )}
          <Clock3 className="w-5 h-5" />
        </button>

        <button
          onClick={() => router.push("/book")}
          className="flex items-center justify-center p-2 rounded-lg transition-all hover:bg-white/10 relative"
          style={{
            color: "#ffffff",
          }}
        >
          {pathname.startsWith("/book") && (
            <div
              className="absolute left-1/2 -translate-x-1/2 h-1 rounded-full"
              style={{
                backgroundColor: "#ffffff",
                width: "32px",
                top: "-7px",
              }}
            />
          )}
          <BookOpen className="w-5 h-5" />
        </button>

        <button
          onClick={() => router.push("/prompts")}
          className="flex items-center justify-center p-2 rounded-lg transition-all hover:bg-white/10 relative"
          style={{
            color: "#ffffff",
          }}
        >
          {pathname === "/prompts" && (
            <div
              className="absolute left-1/2 -translate-x-1/2 h-1 rounded-full"
              style={{
                backgroundColor: "#ffffff",
                width: "32px",
                top: "-7px",
              }}
            />
          )}
          <Lightbulb className="w-5 h-5" />
        </button>

        <button
          onClick={() => router.push("/profile")}
          className="flex items-center justify-center p-2 rounded-lg transition-all hover:bg-white/10 relative"
          style={{
            color: "#ffffff",
          }}
        >
          {pathname === "/profile" && (
            <div
              className="absolute left-1/2 -translate-x-1/2 h-1 rounded-full"
              style={{
                backgroundColor: "#ffffff",
                width: "32px",
                top: "-7px",
              }}
            />
          )}
          <User className="w-5 h-5" />
        </button>
      </div>
    </motion.nav>
  );
}
