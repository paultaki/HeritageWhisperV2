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
      className="flex items-center justify-center px-2 flex-1 transition-all relative"
      style={{
        color: isActive ? "#ffffff" : "rgba(255, 255, 255, 0.6)",
      }}
    >
      {/* Active indicator bar at top - positioned inside the nav bar */}
      {isActive && (
        <div
          className="absolute left-1/2 -translate-x-1/2 h-0.5 rounded-full transition-all"
          style={{
            backgroundColor: "#ffffff",
            width: "32px",
            top: "3px", // Position inside the bar, below the border
          }}
        />
      )}
      <Icon
        className={`w-5 h-5 transition-transform ${isActive ? "scale-110" : ""}`}
      />
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
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#0b0d12]/95 backdrop-blur-md border-t-2 md:hidden"
      style={{
        borderTopColor: "rgba(255, 255, 255, 0.1)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        boxShadow: "0 -2px 6px rgba(0, 0, 0, 0.04)",
        marginBottom: 0,
      }}
    >
      <div
        className="flex items-center justify-around relative"
        style={{
          gap: 'clamp(12px, 6vw, 60px)',
          paddingLeft: 12,
          paddingRight: 12,
          width: '100%',
          height: '37px', // 5px taller than original 32px (h-8)
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

        {/* Ideas */}
        <NavItem
          icon={Lightbulb}
          label="Ideas"
          href="/prompts"
          isActive={pathname === "/prompts"}
        />

        {/* Profile */}
        <NavItem
          icon={User}
          label="Profile"
          href="/profile"
          isActive={pathname === "/profile"}
        />
      </div>
    </motion.nav>
  );
}
