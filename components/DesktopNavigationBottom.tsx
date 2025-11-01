"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Clock3, BookOpen, User, Lightbulb } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { motion } from "framer-motion";

interface NavItemProps {
  icon: React.ElementType;
  href: string;
  isActive?: boolean;
  onClick?: () => void;
}

function DesktopNavItemBottom({
  icon: Icon,
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

export default function DesktopNavigationBottom() {
  // Desktop bottom navigation is no longer used - navigation is in left sidebar
  // Mobile navigation remains in MobileNavigation component
  // Book pages use CompactNav
  return null;

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
      <div className="flex items-center justify-center gap-6">
        <DesktopNavItemBottom
          icon={Clock3}
          href="/timeline"
          isActive={pathname === "/timeline"}
        />

        <DesktopNavItemBottom
          icon={BookOpen}
          href="/book"
          isActive={pathname.startsWith("/book")}
        />

        <DesktopNavItemBottom
          icon={Lightbulb}
          href="/prompts"
          isActive={pathname === "/prompts"}
        />

        <DesktopNavItemBottom
          icon={User}
          href="/profile"
          isActive={pathname === "/profile"}
        />
      </div>
    </motion.nav>
    </>
  );
}
