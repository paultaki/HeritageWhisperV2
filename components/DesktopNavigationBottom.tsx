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
      className="flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all hover:bg-gray-100 group relative"
      style={{
        color: isActive ? "#D36A3D" : "hsl(210, 10%, 60%)",
        background: isActive ? "#FFF5F0" : "transparent",
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
      <span className="text-xs font-medium text-center whitespace-nowrap">
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
      className="flex fixed bottom-0 left-0 right-0 h-20 bg-blue-500 backdrop-blur-md border-t-4 border-black items-center justify-center px-8 z-[9999]"
      style={{
        borderTopColor: "#D36A3D",
        boxShadow: "0 -4px 12px rgba(0, 0, 0, 0.08)",
      }}
    >
      {/* Navigation Items Container - Centered */}
      <div className="flex items-center gap-2">
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

        {/* Record Button - Highlighted */}
        <button
          onClick={onRecordClick}
          className="flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all hover:brightness-110 group mx-2"
          style={{
            background: "linear-gradient(135deg, #D36A3D 0%, #C05A2D 100%)",
            boxShadow: "0 4px 12px rgba(211, 106, 61, 0.4)",
          }}
        >
          <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
            <Image src="/REC_Mic.png" alt="Record" width={20} height={20} />
          </div>
          <span className="text-xs font-medium text-white text-center whitespace-nowrap">
            Record
          </span>
        </button>

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
