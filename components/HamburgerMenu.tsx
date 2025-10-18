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
  Share2,
  FileText,
  Shield,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { motion, AnimatePresence } from "framer-motion";
import { useRecordModal } from "@/hooks/use-record-modal";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { CustomToggle } from "@/components/ui/custom-toggle";

export default function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const recordModal = useRecordModal();
  const { toast } = useToast();

  // Fetch profile data for profile photo
  const { data: profileData } = useQuery({
    queryKey: ["/api/user/profile"],
    enabled: !!user,
    retry: false,
  });

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

  // Initialize and persist dark theme
  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("hw-theme") : null;
    const initialDark = stored ? stored === "dark" : document.documentElement.classList.contains("dark-theme") || document.body.classList.contains("dark-theme");
    setIsDark(initialDark);
    if (initialDark) {
      document.documentElement.classList.add("dark-theme");
      document.body.classList.add("dark-theme");
    } else {
      document.documentElement.classList.remove("dark-theme");
      document.body.classList.remove("dark-theme");
    }
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark-theme");
      document.body.classList.add("dark-theme");
      localStorage.setItem("hw-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark-theme");
      document.body.classList.remove("dark-theme");
      localStorage.setItem("hw-theme", "light");
    }
    // Broadcast theme change for interested listeners
    try {
      window.dispatchEvent(new CustomEvent("hw-theme-change", { detail: { isDark } }));
    } catch {}
  }, [isDark]);

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
    recordModal.openModal();
    setIsOpen(false);
  };

  const handleShare = () => {
    if (user?.id) {
      const shareUrl = `${window.location.origin}/share/${user.id}`;
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Share link copied!",
        description:
          "The link has been copied to your clipboard. Share it with anyone to show your timeline.",
      });
    }
    setIsOpen(false);
  };



  const menuItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Settings, label: "Settings", href: "/profile" },
    { icon: Users, label: "Family", href: "/family" },
    { icon: HelpCircle, label: "Help", href: "/help" },
  ];

  const actionItems = [
    // New Memory & Share on all pages
    {
      icon: Plus,
      label: "New Memory",
      onClick: handleNewMemory,
      color: "text-heritage-coral hover:bg-heritage-coral/10",
    },
    {
      icon: Share2,
      label: "Share",
      onClick: handleShare,
      color: "text-blue-600 hover:bg-blue-50",
    },
  ];

  // Don't show on auth pages or home page
  const shouldShow = !["/auth/login", "/auth/register", "/"].includes(pathname);

  if (!shouldShow) {
    return null;
  }

  const isBookPage = pathname === "/book";

  return (
    <div ref={menuRef} className="fixed right-4 z-[100]" style={{ top: '5px' }}>
      {/* Hamburger Button - Semi-transparent on book page */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-3 rounded-full transition-all ${
          isBookPage
            ? "bg-white/70 backdrop-blur-md border-2 border-white/30 shadow-lg hover:shadow-xl hover:bg-white/80"
            : "bg-white/90 backdrop-blur-sm border border-gray-200 shadow-sm hover:shadow-md rounded-lg p-2"
        }`}
        aria-label="Menu"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-gray-700" />
        ) : (
          <Menu className="w-6 h-6 text-gray-700" />
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
            className="absolute right-0 mt-2 w-56 rounded-lg shadow-xl overflow-hidden"
            style={{
              backgroundColor: isDark ? '#252728' : '#ffffff',
              border: `1px solid ${isDark ? '#3b3d3f' : '#f3f4f6'}`,
              color: isDark ? '#b0b3b8' : undefined,
            }}
          >
            {/* User Info */}
            {user && (
              <div
                className="px-4 py-3 flex items-center gap-3"
                style={{
                  borderBottom: `1px solid ${isDark ? '#3b3d3f' : '#f3f4f6'}`,
                  backgroundColor: isDark ? '#252728' : '#f9fafb',
                }}
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
                  <p className="text-sm font-medium truncate" style={{ color: isDark ? '#b0b3b8' : '#111827' }}>
                    {user.name || "User"}
                  </p>
                  <p className="text-xs truncate" style={{ color: isDark ? '#8a8d92' : '#6b7280' }}>{user.email}</p>
                </div>
              </div>
            )}

            {/* Action Items (New Memory, Share) */}
            <div className="py-1" style={{ borderBottom: `1px solid ${isDark ? '#3b3d3f' : '#f3f4f6'}` }}>
              {actionItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <button
                    key={index}
                    onClick={item.onClick}
                    className={`w-full flex items-center px-4 py-2.5 text-sm transition-colors ${item.color}`}
                    style={{ color: isDark ? '#b0b3b8' : undefined }}
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    {item.label}
                  </button>
                );
              })}
            </div>

          {/* Appearance */}
          <div className="py-1 border-b border-gray-100">
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-sm text-gray-700">Dark Mode</span>
              <CustomToggle
                id="menu-dark-toggle"
                checked={isDark}
                onCheckedChange={(checked) => setIsDark(checked)}
                aria-label="Toggle dark mode"
              />
            </div>
          </div>

            {/* Menu Items */}
            <div className="py-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <button
                    key={item.href}
                    onClick={() => handleNavigation(item.href)}
                    className={`w-full flex items-center px-4 py-2.5 text-sm transition-colors ${isActive ? "bg-heritage-coral/10 text-heritage-coral" : "hover:bg-gray-50"}`}
                    style={{ color: isDark ? '#b0b3b8' : '#374151', backgroundColor: isActive && isDark ? 'rgba(176,179,184,0.08)' : undefined }}
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Legal Links */}
            <div className="py-1" style={{ borderTop: `1px solid ${isDark ? '#3b3d3f' : '#f3f4f6'}` }}>
              <button
                onClick={() => handleNavigation("/privacy")}
                className="w-full flex items-center px-4 py-2 text-xs transition-colors"
                style={{ color: isDark ? '#8a8d92' : '#4b5563' }}
              >
                <Shield className="w-3.5 h-3.5 mr-2" />
                Privacy Policy
              </button>
              <button
                onClick={() => handleNavigation("/terms")}
                className="w-full flex items-center px-4 py-2 text-xs transition-colors"
                style={{ color: isDark ? '#8a8d92' : '#4b5563' }}
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
            <div className="py-1" style={{ borderTop: `1px solid ${isDark ? '#3b3d3f' : '#f3f4f6'}` }}>
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-2.5 text-sm hover:bg-red-50 transition-colors"
                style={{ color: isDark ? '#ff6b6b' : '#dc2626' }}
              >
                <LogOut className="w-4 h-4 mr-3" />
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
