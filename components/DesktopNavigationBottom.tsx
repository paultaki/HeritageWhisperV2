"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Calendar, BookOpen, Box, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { motion } from "framer-motion";
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
      className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all hover:bg-gray-100 group relative"
      style={{
        color: isActive ? "#D36A3D" : "hsl(210, 10%, 40%)",
      }}
    >
      {/* Active indicator bar at top */}
      {isActive && (
        <div
          className="absolute -top-2 left-1/2 -translate-x-1/2 h-1 rounded-full transition-all"
          style={{
            backgroundColor: "#D36A3D",
            width: "52px",
          }}
        />
      )}
      <Icon className="w-6 h-6 flex-shrink-0" />
      <span className="text-sm font-medium text-center whitespace-nowrap">
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

  // Don't show navigation on auth pages or home page
  const shouldShow =
    user &&
    !["/auth/login", "/auth/register", "/"].includes(pathname);

  if (!shouldShow) {
    return null;
  }

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", damping: 20 }}
      className="hidden md:flex fixed bottom-0 left-0 right-0 h-20 bg-white/95 backdrop-blur-md border-t-2 items-center justify-center px-8 z-40"
      style={{
        borderTopColor: "#D36A3D",
        boxShadow: "0 -4px 12px rgba(0, 0, 0, 0.08)",
      }}
    >
      {/* Navigation Items Container - Centered */}
      <div className="flex items-center gap-4">
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

        {/* Record Button - Hero Center Element (matches mobile) */}
        <div className="relative flex items-center justify-center px-4 z-50">
          <button
            onClick={onRecordClick}
            className="absolute w-16 h-16 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-50"
            style={{
              bottom: "-14px",
              background: "linear-gradient(135deg, #D36A3D 0%, #C05A2D 100%)",
              boxShadow:
                "0 4px 12px rgba(211, 106, 61, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.2)",
              border: "2px solid rgba(255, 255, 255, 0.3)",
            }}
          >
            {/* Pulse animation ring */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: "linear-gradient(135deg, #D36A3D 0%, #C05A2D 100%)",
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

            {/* Icon */}
            <Image
              src="/REC_Mic.png"
              alt="Record"
              width={22}
              height={22}
              className="z-10"
              style={{ width: 'auto', height: 'auto' }}
            />
          </button>
        </div>

        <DesktopNavItemBottom
          icon={Box}
          label="Memories"
          href="/memory-box"
          isActive={pathname === "/memory-box"}
        />

        <DesktopNavItemBottom
          icon={Sparkles}
          label="Prompts"
          href="/prompts"
          isActive={pathname === "/prompts"}
        />
      </div>
    </motion.nav>
  );
}
