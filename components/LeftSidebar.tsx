"use client";

import Link from "next/link";
import { Clock3, BookOpen, Lightbulb, Archive, Mic, MessageSquarePlus } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useAccountContext } from "@/hooks/use-account-context";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { SubmitPromptButton } from "@/components/family/SubmitPromptButton";

interface LeftSidebarProps {
  topOffsetClass?: string;
}

export function LeftSidebar({ topOffsetClass = "lg:top-0" }: LeftSidebarProps) {
  const [isDark, setIsDark] = useState(false);
  const { user } = useAuth();
  const { activeContext } = useAccountContext();
  const isOwnAccount = activeContext?.type === 'own' ?? false;

  console.log('[LeftSidebar] activeContext:', activeContext, 'isOwnAccount:', isOwnAccount, 'user:', !!user);

  // Fetch profile data for profile photo
  const { data: profileData } = useQuery({
    queryKey: ["/api/user/profile"],
    enabled: !!user,
    retry: false,
  });

  const profileUser = (profileData as { user?: { profilePhotoUrl?: string } })?.user;

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
      className={`hidden lg:flex lg:w-28 flex-col gap-1.5 p-2 lg:sticky ${topOffsetClass} lg:self-start`}
      style={{
        backgroundColor: "transparent",
        borderRight: "none",
        color: isDark ? "#b0b3b8" : undefined,
        minHeight: "calc(100vh - 200px)",
      }}
    >
      <nav className="mt-8 space-y-[7px]">
        {/* Profile Section - Only show for account owners */}
        {user && isOwnAccount && (
          <Link
            href="/profile"
            className="flex items-center gap-3 px-2 py-2 rounded-md transition-all hover:bg-gray-100 dark:hover:bg-gray-800 mb-4"
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
          href="/timeline"
          className="flex items-center gap-3 px-2 py-1.5 rounded-md transition-all hover:bg-gray-100 dark:hover:bg-gray-800"
          style={{ color: isDark ? "#b0b3b8" : "#111827", fontSize: '0.92rem', lineHeight: 1.1 }}
        >
          <Clock3 className="w-7 h-7" />
          <span>Timeline</span>
        </Link>
        <Link
          href="/book"
          className="flex items-center gap-3 px-2 py-1.5 rounded-md transition-all hover:bg-gray-100 dark:hover:bg-gray-800"
          style={{ color: isDark ? "#b0b3b8" : "#111827", fontSize: '0.92rem', lineHeight: 1.1 }}
        >
          <BookOpen className="w-7 h-7" />
          <span>Book</span>
        </Link>

        {/* Show Record button for owners, Submit Question for viewers */}
        {isOwnAccount ? (
          <Link
            href="/review/book-style?new=true"
            className="flex items-center gap-3 px-2 py-1.5 rounded-md transition-all hover:bg-gray-100 dark:hover:bg-gray-800"
            style={{ color: isDark ? "#b0b3b8" : "#111827", fontSize: '0.92rem', lineHeight: 1.1 }}
          >
            <Mic className="w-7 h-7" />
            <span>Record</span>
          </Link>
        ) : (
          <div className="px-2 py-1.5">
            <SubmitPromptButton
              storytellerUserId={activeContext?.storytellerId || ""}
              storytellerName={activeContext?.storytellerName || ""}
            />
          </div>
        )}

        <Link
          href="/memory-box"
          className="flex items-center gap-3 px-2 py-1.5 rounded-md transition-all hover:bg-gray-100 dark:hover:bg-gray-800"
          style={{ color: isDark ? "#b0b3b8" : "#111827", fontSize: '0.92rem', lineHeight: 1.1 }}
        >
          <Archive className="w-7 h-7" />
          <span>Keepsakes</span>
        </Link>
      </nav>
    </aside>
  );
}
