"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Menu,
  X,
  User,
  Users,
  LogOut,
  Settings,
  HelpCircle,
  Home,
  Plus,
  FileText,
  Shield,
  Lightbulb,
  Box,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useAccountContext } from "@/hooks/use-account-context";
import { motion, AnimatePresence } from "framer-motion";
import { useModeSelection } from "@/hooks/use-mode-selection";
import { ModeSelectionModal } from "@/components/recording/ModeSelectionModal";
import { QuickStoryRecorder } from "@/components/recording/QuickStoryRecorder";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { activeContext } = useAccountContext();
  const isOwnAccount = activeContext?.type === 'own';
  const modeSelection = useModeSelection();

  console.log('[HamburgerMenu] activeContext:', activeContext, 'isOwnAccount:', isOwnAccount, 'user:', !!user);

  // Fetch profile data for profile photo
  const { data: profileData } = useQuery({
    queryKey: ["/api/user/profile"],
    enabled: !!user,
    retry: false,
  });

  // Fetch unread family questions count for notification badge
  const { data: unreadData } = useQuery({
    queryKey: ["/api/prompts/family-unread-count"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/prompts/family-unread-count");
      if (!response.ok) throw new Error("Failed to fetch unread count");
      return response.json();
    },
    enabled: !!user && isOwnAccount,
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000, // Consider data stale after 30 seconds
  });

  const unreadCount = (unreadData as any)?.count || 0;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Profile user helper for typing
  const profileUser = (profileData as any)?.user;

  const handleNavigation = (href: string) => {
    router.push(href);
    setIsOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
  };

  const handleNewMemory = () => {
    modeSelection.openQuickRecorder();
    setIsOpen(false);
  };

  const menuItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Box, label: "Memory Box", href: "/memory-box" },
    { icon: Lightbulb, label: "Story Ideas", href: "/prompts" },
    { icon: Users, label: "Family", href: "/family" },
    // Only show Settings for account owners
    ...(isOwnAccount ? [{ icon: Settings, label: "Settings", href: "/profile" }] : []),
    { icon: HelpCircle, label: "Help", href: "/help" },
  ];

  // Only show action items for account owners
  const actionItems = isOwnAccount ? [
    {
      icon: Plus,
      label: "New Memory",
      onClick: handleNewMemory,
      color: "text-heritage-coral hover:bg-heritage-coral/10",
    },
  ] : [];

  // Don't show on auth pages, home page, or book-new page
  const shouldShow = !["/auth/login", "/auth/register", "/", "/book-new"].includes(pathname) && !pathname.startsWith("/book-new/");

  if (!shouldShow) {
    return null;
  }

  const isBookPage = pathname === "/book";

  return (
    <>
      <div ref={menuRef} className="fixed right-4 z-[100]" style={{ top: '5px' }}>
      {/* Hamburger Button - Just lines, no circle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 transition-all relative"
        aria-label="Menu"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-gray-700" />
        ) : (
          <Menu className="w-6 h-6 text-gray-700" />
        )}
        {/* Notification badge on hamburger icon */}
        {unreadCount > 0 && !isOpen && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-heritage-coral rounded-full ring-2 ring-white" />
        )}
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-56 rounded-lg shadow-xl overflow-hidden bg-white border border-gray-100"
          >
            {/* User Info */}
            {user && (
              <div
                className="px-4 py-3 flex items-center gap-3 border-b border-gray-100 bg-gray-50"
              >
                <Avatar className="w-10 h-10 flex-shrink-0">
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
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.name || "User"}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
            )}

            {/* Action Items (New Memory, Share) */}
            <div className="py-1 border-b border-gray-100">
              {actionItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <button
                    key={index}
                    onClick={item.onClick}
                    className={`w-full flex items-center px-4 py-2.5 text-sm transition-colors ${item.color}`}
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Menu Items */}
            <div className="py-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                const showBadge = item.href === "/prompts" && unreadCount > 0;

                return (
                  <button
                    key={item.href}
                    onClick={() => handleNavigation(item.href)}
                    className={`w-full flex items-center px-4 py-2.5 text-sm text-gray-700 transition-colors ${isActive ? "bg-heritage-coral/10 text-heritage-coral" : "hover:bg-gray-50"}`}
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {showBadge && (
                      <span className="ml-2 px-1.5 py-0.5 text-xs font-semibold bg-heritage-coral text-white rounded-full min-w-[1.25rem] text-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legal Links */}
            <div className="py-1 border-t border-gray-100">
              <button
                onClick={() => handleNavigation("/privacy")}
                className="w-full flex items-center px-4 py-2 text-xs text-gray-600 transition-colors hover:bg-gray-50"
              >
                <Shield className="w-3.5 h-3.5 mr-2" />
                Privacy Policy
              </button>
              <button
                onClick={() => handleNavigation("/terms")}
                className="w-full flex items-center px-4 py-2 text-xs text-gray-600 transition-colors hover:bg-gray-50"
              >
                <FileText className="w-3.5 h-3.5 mr-2" />
                Terms of Service
              </button>
            </div>

            {/* Beta Badge */}
            <div className="border-t border-gray-100 py-2 px-4">
              <div className="flex items-center justify-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                  BETA
                </span>
                <span className="text-xs text-gray-500">Pilot Phase</span>
              </div>
            </div>

            {/* Logout */}
            <div className="py-1 border-t border-gray-100">
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-3" />
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>

      {/* Mode Selection Modal */}
      <ModeSelectionModal
        isOpen={modeSelection.isOpen}
        onClose={modeSelection.closeModal}
        onSelectQuickStory={modeSelection.openQuickRecorder}
        promptQuestion={modeSelection.promptQuestion}
      />

      {/* Quick Story Recorder */}
      <QuickStoryRecorder
        isOpen={modeSelection.quickRecorderOpen}
        onClose={modeSelection.closeQuickRecorder}
        promptQuestion={modeSelection.promptQuestion}
      />
    </>
  );
}
