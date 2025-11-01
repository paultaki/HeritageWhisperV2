"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Clock3, BookOpen, User, Lightbulb } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { motion } from "framer-motion";

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  href: string;
  isActive?: boolean;
  onClick?: () => void;
  isDarkMode?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({
  icon: Icon,
  label,
  href,
  isActive,
  onClick,
  isDarkMode = false,
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
      className="flex flex-col items-center justify-center transition-all relative gap-0.5"
      style={{
        color: isDarkMode 
          ? (isActive ? "#ffffff" : "rgba(255, 255, 255, 0.6)")
          : (isActive ? "#8b6b7a" : "hsl(210, 10%, 40%)"),
        width: "56px",
        height: "37px",
      }}
    >
      {/* Active indicator bar at top - positioned inside the nav bar */}
      {isActive && (
        <div
          className="absolute left-1/2 -translate-x-1/2 h-0.5 rounded-full transition-all"
          style={{
            backgroundColor: isDarkMode ? "#ffffff" : "#8b6b7a",
            width: "32px",
            top: "2px",
          }}
        />
      )}
      <Icon
        className={`w-5 h-5 transition-transform ${isActive ? "scale-110" : ""}`}
      />
      <span
        className="leading-none font-medium"
        style={{
          fontSize: "7.5px",
          marginTop: "1px",
        }}
      >
        {label}
      </span>
    </button>
  );
};

export default function MobileNavigation() {
  const pathname = usePathname();
  const { user } = useAuth();

  // Don't show navigation on auth pages or home page
  const shouldShow =
    user && !["/auth/login", "/auth/register", "/"].includes(pathname);

  if (!shouldShow) {
    return null;
  }

  // Check if we're on a book page
  const isBookPage = pathname.startsWith("/book");

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", damping: 20 }}
      className={`md:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-md border-t-2 ${
        isBookPage ? "bg-[#0b0d12]/95" : "bg-white/95"
      }`}
      style={{
        borderTopColor: isBookPage ? "rgba(255, 255, 255, 0.1)" : "#8b6b7a",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        boxShadow: "0 -2px 6px rgba(0, 0, 0, 0.04)",
        marginBottom: 0,
      }}
    >
      <div
        className="flex items-center justify-center relative"
        style={{
          gap: 'clamp(55px, 9vw, 125px)',
          paddingLeft: 12,
          paddingRight: 12,
          width: '100%',
          height: '37px',
        }}
      >
        {/* Timeline */}
        <NavItem
          icon={Clock3}
          label="Timeline"
          href="/timeline"
          isActive={pathname === "/timeline"}
          isDarkMode={isBookPage}
        />

        {/* Book */}
        <NavItem
          icon={BookOpen}
          label="Book"
          href="/book"
          isActive={pathname.startsWith("/book")}
          isDarkMode={isBookPage}
        />

        {/* Ideas */}
        <NavItem
          icon={Lightbulb}
          label="Ideas"
          href="/prompts"
          isActive={pathname === "/prompts"}
          isDarkMode={isBookPage}
        />

        {/* Profile */}
        <NavItem
          icon={User}
          label="Profile"
          href="/profile"
          isActive={pathname === "/profile"}
          isDarkMode={isBookPage}
        />
      </div>
    </motion.nav>
  );
}
