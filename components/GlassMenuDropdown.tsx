"use client";

import React, { useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  User,
  Users,
  LogOut,
  Settings,
  HelpCircle,
  Home,
  Plus,
  FileText,
  Shield,
  Box,
  Lightbulb,
  Archive,
  BookOpen,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { motion, AnimatePresence } from "framer-motion";
import { useModeSelection } from "@/hooks/use-mode-selection";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { useAccountContext } from "@/hooks/use-account-context";

type GlassMenuDropdownProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function GlassMenuDropdown({ isOpen, onClose }: GlassMenuDropdownProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const modeSelection = useModeSelection();
  const { activeContext } = useAccountContext();
  const isOwnAccount = activeContext?.type === 'own';

  console.log('[GlassMenuDropdown] activeContext:', activeContext, 'isOwnAccount:', isOwnAccount);

  // Fetch profile data for profile photo
  const { data: profileData } = useQuery({
    queryKey: ["/api/user/profile"],
    enabled: !!user,
    retry: false,
  });

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Check if click is on the menu button itself (ignore it)
      const isMenuButton = target.closest('[data-menu-button]');

      if (isMenuButton) {
        return; // Don't close if clicking the menu button
      }

      if (menuRef.current && !menuRef.current.contains(target)) {
        onClose();
      }
    };

    if (isOpen) {
      // Use a small delay to ensure the opening click has completed
      const timeoutId = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  // Close menu on route change
  const pathnameRef = useRef(pathname);
  useEffect(() => {
    // Only close if pathname actually changed (not on initial mount)
    if (pathnameRef.current !== pathname) {
      pathnameRef.current = pathname;
      onClose();
    }
  }, [pathname, onClose]);

  const profileUser = (profileData as any)?.user;

  const handleNavigation = (href: string) => {
    router.push(href);
    onClose();
  };

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  const handleNewMemory = () => {
    modeSelection.openQuickRecorder();
    onClose();
  };

  const allMenuItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: BookOpen, label: "Manage Chapters", href: "/chapters-v2", ownerOnly: true },
    { icon: Lightbulb, label: "Story Ideas", href: "/prompts", ownerOnly: true },
    { icon: Archive, label: "Memory Box", href: "/memory-box" },
    { icon: Settings, label: "Settings", href: "/profile", ownerOnly: true },
    { icon: HelpCircle, label: "Help", href: "/help" },
  ];

  // Filter menu items based on permissions
  const menuItems = allMenuItems.filter(item => !item.ownerOnly || isOwnAccount);

  const allActionItems = [
    {
      icon: Plus,
      label: "New Memory",
      onClick: handleNewMemory,
      color: "text-heritage-coral hover:bg-heritage-coral/10",
      ownerOnly: true,
    },
  ];

  // Filter action items based on permissions
  const actionItems = allActionItems.filter(item => !item.ownerOnly || isOwnAccount);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[110] w-[90%] max-w-sm max-h-[calc(100vh-8rem)] rounded-2xl shadow-2xl overflow-y-auto bg-white/95 backdrop-blur-xl border border-white/30"
        >
          {/* User Info */}
          {user && (
            <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-100 bg-gray-50/50">
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

          {/* Action Items - only show if there are any */}
          {actionItems.length > 0 && (
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
          )}

          {/* Menu Items */}
          <div className="py-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <button
                  key={item.href}
                  onClick={() => handleNavigation(item.href)}
                  className={`w-full flex items-center px-4 py-2.5 text-sm text-gray-700 transition-colors ${isActive ? "bg-heritage-coral/10 text-heritage-coral" : "hover:bg-gray-50"
                    }`}
                >
                  <Icon className="w-4 h-4 mr-3" />
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Legal Links */}
          <div className="py-1 border-t border-gray-100">
            <button
              onClick={() => handleNavigation("/privacy")}
              className="w-full flex items-center px-4 py-2.5 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <Shield className="w-3.5 h-3.5 mr-2" />
              Privacy Policy
            </button>
            <button
              onClick={() => handleNavigation("/terms")}
              className="w-full flex items-center px-4 py-2.5 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 mr-2" />
              Terms of Service
            </button>
          </div>

          {/* Logout */}
          <div className="py-1 border-t border-gray-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Sign Out
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
