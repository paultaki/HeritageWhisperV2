"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Clock3, BookOpen, User, Lightbulb } from "lucide-react";
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
      className={`flex flex-col items-center gap-1 py-3 transition ${
        isActive ? "text-white" : "text-white/70 hover:text-white"
      }`}
    >
      <Icon className="h-5 w-5" />
      <span className={`text-[11px] leading-tight ${isActive ? "font-medium" : ""}`}>
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
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 6px)",
        paddingTop: "8px",
      }}
    >
      <div className="mx-auto max-w-md rounded-2xl bg-black/40 text-white backdrop-blur-md ring-1 ring-white/10">
        <div className="grid grid-cols-4 text-center text-[11px] leading-tight">
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
            icon={Lightbulb}
            label="Ideas"
            href="/prompts"
            isActive={pathname === "/prompts"}
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
