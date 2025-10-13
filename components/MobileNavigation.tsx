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
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t-2 md:hidden safe-area-bottom"
      style={{
        borderTopColor: "#D36A3D",
        paddingBottom: "env(safe-area-inset-bottom)",
        boxShadow: "0 -4px 12px rgba(0, 0, 0, 0.08)",
        position: "fixed",
      }}
    >
      <div className="flex items-center justify-around h-20 relative">
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
        <div className="relative flex-1 flex justify-center">
          <button
            onClick={onRecordClick}
            className="absolute w-16 h-16 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            style={{
              bottom: "-12px",
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
              width={24}
              height={24}
              className="z-10"
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
