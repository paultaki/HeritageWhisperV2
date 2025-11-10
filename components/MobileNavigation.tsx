"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Clock3, BookOpen, User, Mic, Archive } from "lucide-react";
import { useAuth } from "@/lib/auth";

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
      className={`flex flex-col items-center justify-center gap-1.5 py-3 px-1 transition min-h-[64px] ${
        isActive ? "text-white" : "text-white/70 hover:text-white"
      }`}
    >
      <Icon className="h-6 w-6" />
      <span className={`text-xs font-medium leading-tight whitespace-nowrap ${isActive ? "font-semibold" : ""}`}>
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

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-[9999] px-4"
      style={{
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 4px)",
        paddingTop: "4px",
      }}
    >
      <div className="mx-auto max-w-md rounded-2xl bg-black/40 text-white backdrop-blur-md ring-1 ring-white/10 px-2 py-2">
        <div className="grid grid-cols-5 gap-1">
          <NavItem
            icon={Clock3}
            label="Timeline"
            href="/timeline"
            isActive={pathname === "/timeline"}
          />
          <NavItem
            icon={BookOpen}
            label="Book"
            href="/book"
            isActive={pathname.startsWith("/book")}
          />
          <NavItem
            icon={Mic}
            label="Record"
            href="/review/book-style?new=true"
            isActive={false}
          />
          <NavItem
            icon={Archive}
            label="Keepsakes"
            href="/memory-box"
            isActive={pathname === "/memory-box"}
          />
          <NavItem
            icon={User}
            label="Profile"
            href="/profile"
            isActive={pathname === "/profile"}
          />
        </div>
      </div>
    </nav>
  );
}
