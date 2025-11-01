"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Calendar, BookOpen, User, Lightbulb } from "lucide-react";
import { motion } from "framer-motion";

export function CompactNav() {
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
          onClick={() => router.push("/timeline")}
          className="flex items-center justify-center p-2 rounded-lg transition-all hover:bg-white/10 relative"
          style={{
            color: pathname === "/timeline" ? "#ffffff" : "rgba(255, 255, 255, 0.6)",
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
          <Calendar className="w-5 h-5" />
        </button>

        <button
          onClick={() => router.push("/book")}
          className="flex items-center justify-center p-2 rounded-lg transition-all hover:bg-white/10 relative"
          style={{
            color: pathname.startsWith("/book") ? "#ffffff" : "rgba(255, 255, 255, 0.6)",
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
            color: pathname === "/prompts" ? "#ffffff" : "rgba(255, 255, 255, 0.6)",
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
            color: pathname === "/profile" ? "#ffffff" : "rgba(255, 255, 255, 0.6)",
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
