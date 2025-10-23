"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Calendar, BookOpen, Box, Sparkles, Mic } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { motion } from "framer-motion";
import { useRecordingState } from "@/contexts/RecordingContext";

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  href: string;
  isActive?: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({
  icon: Icon,
  label,
  href,
  isActive,
  onClick,
}) => {
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
      className="flex flex-col items-center justify-center py-2 px-3 flex-1 transition-all relative"
      style={{
        color: isActive ? "#D36A3D" : "hsl(210, 10%, 60%)",
      }}
    >
      {/* Active indicator bar at top */}
      {isActive && (
        <div
          className="absolute -top-2.5 left-1/2 -translate-x-1/2 h-1 rounded-full transition-all"
          style={{
            backgroundColor: "#D36A3D",
            width: "52px",
          }}
        />
      )}
      <Icon
        className={`w-6 h-6 mb-1 transition-transform ${isActive ? "scale-110" : ""}`}
      />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
};

interface MobileNavigationProps {
  onRecordClick: () => void;
}

export default function MobileNavigation({
  onRecordClick,
}: MobileNavigationProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { isRecording, recordingType } = useRecordingState();

  // Don't show navigation on auth pages or home page
  const shouldShow =
    user && !["/auth/login", "/auth/register", "/"].includes(pathname);

  if (!shouldShow) {
    return null;
  }

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", damping: 20 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t-2 md:hidden"
      style={{
        borderTopColor: "#D36A3D",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        boxShadow: "0 -4px 12px rgba(0, 0, 0, 0.08)",
        marginBottom: 0,
      }}
    >
      <div
        className="flex items-center justify-around h-16 relative"
        style={{
          gap: 'clamp(12px, 6vw, 60px)',
          paddingLeft: 12,
          paddingRight: 12,
          width: '100%'
        }}
      >
        {/* Timeline */}
        <NavItem
          icon={Calendar}
          label="Timeline"
          href="/timeline"
          isActive={pathname === "/timeline"}
        />

        {/* Book View */}
        <NavItem
          icon={BookOpen}
          label="Book"
          href="/book"
          isActive={pathname.startsWith("/book")}
        />

        {/* Record Button - Hero Center Element */}
        <div
          className="relative flex-1 flex justify-center"
          style={{ marginLeft: 'clamp(8px, 4vw, 24px)', marginRight: 'clamp(8px, 6vw, 32px)' }}
        >
          <button
            onClick={isRecording ? undefined : onRecordClick}
            disabled={isRecording}
            className={`absolute w-16 h-16 rounded-full flex items-center justify-center transition-all ${
              isRecording
                ? 'cursor-not-allowed opacity-50'
                : 'hover:scale-110 active:scale-95'
            }`}
            style={{
              bottom: "-2px",
              background: isRecording
                ? "linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)"
                : "linear-gradient(135deg, #f59e0b 0%, #f43f5e 100%)",
              boxShadow: isRecording
                ? "0 2px 6px rgba(0, 0, 0, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.2)"
                : "0 4px 12px rgba(245, 158, 11, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.2)",
              border: isRecording
                ? "2px solid rgba(255, 255, 255, 0.1)"
                : "2px solid rgba(255, 255, 255, 0.3)",
            }}
          >
            {/* Pulse animation ring - only when not recording */}
            {!isRecording && (
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: "linear-gradient(135deg, #f59e0b 0%, #f43f5e 100%)",
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
            <Mic
              className={`z-10 ${isRecording ? 'opacity-60' : ''}`}
              size={28}
              strokeWidth={2}
              color="white"
            />
          </button>
        </div>

        {/* Memory Box */}
        <NavItem
          icon={Box}
          label="Memories"
          href="/memory-box"
          isActive={pathname === "/memory-box"}
        />

        {/* Prompts - Profile removed since it's in hamburger menu */}
        <NavItem
          icon={Sparkles}
          label="Prompts"
          href="/prompts"
          isActive={pathname === "/prompts"}
        />
      </div>
    </motion.nav>
  );
}
