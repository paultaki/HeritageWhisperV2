"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Calendar, BookOpen, User, Lightbulb } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { motion } from "framer-motion";
import { useRecordingState } from "@/contexts/RecordingContext";
import Image from "next/image";

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  href: string;
  isActive?: boolean;
  onClick?: () => void;
}

function DesktopNavItemBottom({
  icon: Icon,
  label,
  href,
  isActive,
  onClick,
}: NavItemProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push(href);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center justify-center px-3 rounded-lg transition-all hover:bg-gray-200 group relative"
      style={{
        color: isActive ? "#8b6b7a" : "hsl(210, 10%, 40%)",
        height: '32px',
      }}
    >
      {/* Active indicator bar at top */}
      {isActive && (
        <div
          className="absolute left-1/2 -translate-x-1/2 h-0.5 rounded-full transition-all"
          style={{
            backgroundColor: "#8b6b7a",
            width: "32px",
            top: "0",
          }}
        />
      )}
      <Icon className="w-5 flex-shrink-0" style={{ height: '20px' }} />
    </button>
  );
}

interface DesktopNavigationBottomProps {
  onRecordClick: () => void;
}

export default function DesktopNavigationBottom({
  onRecordClick,
}: DesktopNavigationBottomProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { isRecording, recordingType } = useRecordingState();

  // Don't show navigation on auth pages, home page, or book-v4 (has its own compact nav)
  const shouldShow =
    user &&
    !["/auth/login", "/auth/register", "/", "/book-v4"].includes(pathname);

  if (!shouldShow) {
    return null;
  }

  return (
    <>
      <style jsx>{`
        /* Responsive navigation spacing - scales from 110px down to 60px */
        .nav-group-left,
        .nav-group-right {
          gap: clamp(60px, 10vw, 110px);
        }
      `}</style>
      <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", damping: 20 }}
      className="hidden md:flex fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t-2 items-center justify-center px-8 z-40"
      style={{
        height: '36px',
        borderTopColor: "#8b6b7a",
        boxShadow: "0 -2px 6px rgba(0, 0, 0, 0.04)",
      }}
    >
      {/* Navigation Items - evenly distributed */}
      <div className="flex items-center justify-center gap-8">
        <DesktopNavItemBottom
          icon={Calendar}
          label="Timeline"
          href="/timeline"
          isActive={pathname === "/timeline"}
        />

        <DesktopNavItemBottom
          icon={BookOpen}
          label="Book"
          href="/book"
          isActive={pathname.startsWith("/book")}
        />

        <DesktopNavItemBottom
          icon={Lightbulb}
          label="Ideas"
          href="/prompts"
          isActive={pathname === "/prompts"}
        />

        <DesktopNavItemBottom
          icon={User}
          label="Profile"
          href="/profile"
          isActive={pathname === "/profile"}
        />
      </div>
    </motion.nav>
    </>
  );
}
