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
      className="flex flex-col items-center justify-center p-3 rounded-lg transition-all hover:bg-gray-100 group relative"
      style={{
        color: isActive ? "#D36A3D" : "hsl(210, 10%, 40%)",
      }}
    >
      {/* Tooltip on hover */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="bg-gray-800 text-white text-sm font-medium px-3 py-2 rounded-lg whitespace-nowrap shadow-lg">
          {label}
        </div>
      </div>

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
      <Icon className="w-6 flex-shrink-0" style={{ height: '26px' }} />
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
        height: '60px',
        borderTopColor: "#D36A3D",
        boxShadow: "0 -4px 12px rgba(0, 0, 0, 0.08)",
      }}
    >
      {/* Navigation Items Container - centered with even spacing */}
      <div className="flex items-center justify-center">
        {/* Left section - Timeline and Book */}
        <div className="flex items-center nav-group-left">
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
        </div>

        {/* Spacer for record button - 110px on each side, responsive */}
        <div style={{ width: 'clamp(120px, 20vw, 220px)' }} />

        {/* Right section - Memories and Prompts */}
        <div className="flex items-center nav-group-right">
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
      </div>

      {/* Record Button - Perfectly centered in viewport */}
      <div
        className="absolute left-1/2 -translate-x-1/2 z-50"
        style={{ bottom: '6px' }}
      >
        <button
          onClick={onRecordClick}
          className="w-16 h-16 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
          style={{
            background: "linear-gradient(135deg, #f59e0b 0%, #f43f5e 100%)",
            boxShadow:
              "0 4px 12px rgba(245, 158, 11, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.2)",
            border: "2px solid rgba(255, 255, 255, 0.3)",
          }}
        >
          {/* Pulse animation ring */}
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
    </motion.nav>
    </>
  );
}
