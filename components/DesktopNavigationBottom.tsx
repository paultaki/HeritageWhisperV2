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
      className="flex flex-col items-center justify-center px-4 py-2 rounded-lg transition-all hover:bg-gray-200 group relative"
      style={{
        color: isActive ? "#8b6b7a" : "hsl(210, 10%, 40%)",
      }}
    >
      {/* Active indicator bar at top (inside) */}
      {isActive && (
        <div
          className="absolute left-1/2 -translate-x-1/2 h-1 rounded-full transition-all"
          style={{
            backgroundColor: "#8b6b7a",
            width: "80px",
            top: "-5px",
          }}
        />
      )}
      <Icon className="w-6 flex-shrink-0" style={{ height: '26px' }} />
      <span className="text-xs mt-1 font-medium whitespace-nowrap">
        {label}
      </span>
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

  // Don't show navigation on auth pages or home page
  const shouldShow =
    user &&
    !["/auth/login", "/auth/register", "/"].includes(pathname);

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
        height: '72px',
        borderTopColor: "#8b6b7a",
        boxShadow: "0 -4px 12px rgba(0, 0, 0, 0.08)",
      }}
    >
      {/* Navigation Items Container - centered with even spacing */}
      <div className="flex items-center justify-center">
        {/* Left section - Timeline and Book */}
        <div className="flex items-center nav-group-left">
          <DesktopNavItemBottom
            icon={Calendar}
            label="Timeline View"
            href="/timeline"
            isActive={pathname === "/timeline"}
          />

          <DesktopNavItemBottom
            icon={BookOpen}
            label="Book View"
            href="/book"
            isActive={pathname.startsWith("/book")}
          />
        </div>

        {/* Spacer for record button - 110px on each side, responsive */}
        <div style={{ width: 'clamp(120px, 20vw, 220px)' }} />

        {/* Right section - Ideas and Profile */}
        <div className="flex items-center nav-group-right">
          <DesktopNavItemBottom
            icon={Lightbulb}
            label="Story Ideas"
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
      </div>

      {/* Record Button - Perfectly centered in viewport */}
      <div
        className="absolute left-1/2 -translate-x-1/2 z-50 group"
        style={{ bottom: '6px' }}
      >
        {/* Tooltip on hover - shows different text when recording */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className={`${isRecording ? 'bg-gray-600' : 'bg-gray-800'} text-white text-sm font-medium px-3 py-2 rounded-lg whitespace-nowrap shadow-lg`}>
            {isRecording ? (
              <>Recording in progress • {recordingType === 'interview' ? 'Interview Mode' : recordingType === 'conversation' ? 'Conversation Mode' : 'Quick Story'}</>
            ) : (
              '+Record Memory'
            )}
          </div>
        </div>

        <button
          onClick={isRecording ? undefined : onRecordClick}
          disabled={isRecording}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
            isRecording
              ? 'cursor-not-allowed opacity-50'
              : 'hover:scale-110 active:scale-95 cursor-pointer'
          }`}
          style={{
            background: isRecording
              ? "linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)"
              : "linear-gradient(135deg, #8b6b7a 0%, #b88b94 100%)",
            boxShadow: isRecording
              ? "0 2px 6px rgba(0, 0, 0, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.2)"
              : "0 6px 16px rgba(139, 107, 122, 0.4), inset 0 3px 6px rgba(255, 255, 255, 0.4), inset 0 -3px 6px rgba(0, 0, 0, 0.25)",
            border: isRecording
              ? "2px solid rgba(255, 255, 255, 0.1)"
              : "2px solid rgba(255, 255, 255, 0.4)",
          }}
        >
          {/* Pulse animation ring - only when not recording */}
          {!isRecording && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: "linear-gradient(135deg, #8b6b7a 0%, #b88b94 100%)",
              }}
              animate={{
                scale: [1, 1.3, 1.3],
                opacity: [0.5, 0, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 0.5,
              }}
            />
          )}

          {/* Icon - opacity reduced when recording */}
          <Image
            src="/silver_mic_sm.png"
            alt="Record"
            width={25}
            height={25}
            className={`z-10 ${isRecording ? 'opacity-60' : ''}`}
          />
        </button>
      </div>
    </motion.nav>
    </>
  );
}
