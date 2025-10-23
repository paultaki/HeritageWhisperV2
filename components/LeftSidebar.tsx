"use client";

import Link from "next/link";
import { Home, Users, Settings, HelpCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";

export function LeftSidebar() {
  const [isDark, setIsDark] = useState(false);
  const { user } = useAuth();

  // Fetch profile data for profile photo
  const { data: profileData } = useQuery({
    queryKey: ["/api/user/profile"],
    enabled: !!user,
    retry: false,
  });

  const profileUser = (profileData as any)?.user;

  useEffect(() => {
    const updateFromDom = () => {
      const dark =
        document.documentElement.classList.contains("dark") ||
        document.body.classList.contains("dark");
      setIsDark(dark);
    };
    updateFromDom();
    const handler = () => updateFromDom();
    window.addEventListener("hw-theme-change", handler);
    return () => window.removeEventListener("hw-theme-change", handler);
  }, []);

  return (
    <aside
      className="hidden lg:flex lg:w-56 flex-col gap-1.5 p-2 lg:sticky lg:top-0 lg:self-start"
      style={{
        backgroundColor: "transparent",
        borderRight: "none",
        color: isDark ? "#b0b3b8" : undefined,
        minHeight: "calc(100vh - 200px)",
      }}
    >
      <nav className="mt-8 space-y-[7px]">
        {/* Profile Section */}
        {user && (
          <Link
            href="/profile"
            className="flex items-center gap-3 px-2 py-2 rounded-md hover:opacity-90 mb-4"
            style={{ color: isDark ? "#b0b3b8" : "#111827" }}
          >
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarImage
                src={profileUser?.profilePhotoUrl || ""}
                alt={user.name || "User"}
              />
              <AvatarFallback className="bg-heritage-coral/10 text-heritage-coral text-sm">
                {(user.name || "U")
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium truncate">{user.name || "User"}</span>
          </Link>
        )}

        <Link
          href="/"
          className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:opacity-90"
          style={{ color: isDark ? "#b0b3b8" : "#111827", fontSize: '0.92rem', lineHeight: 1.1 }}
        >
          <Home className="w-7 h-7" />
          <span>Home</span>
        </Link>
        <Link
          href="/family"
          className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:opacity-90"
          style={{ color: isDark ? "#b0b3b8" : "#111827", fontSize: '0.92rem', lineHeight: 1.1 }}
        >
          <Users className="w-7 h-7" />
          <span>Family</span>
        </Link>
        <Link
          href="/profile"
          className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:opacity-90"
          style={{ color: isDark ? "#b0b3b8" : "#111827", fontSize: '0.92rem', lineHeight: 1.1 }}
        >
          <Settings className="w-7 h-7" />
          <span>Settings</span>
        </Link>
        <Link
          href="/help"
          className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:opacity-90"
          style={{ color: isDark ? "#b0b3b8" : "#111827", fontSize: '0.92rem', lineHeight: 1.1 }}
        >
          <HelpCircle className="w-7 h-7" />
          <span>Help</span>
        </Link>
      </nav>
    </aside>
  );
}
