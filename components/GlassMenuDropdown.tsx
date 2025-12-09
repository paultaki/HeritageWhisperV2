"use client";

import React, { useRef, useEffect, useState } from "react";
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
  ChevronDown,
  Check,
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
  const { activeContext, availableStorytellers, switchToStoryteller, isOwnAccount } = useAccountContext();
  const [isAccountSwitcherOpen, setIsAccountSwitcherOpen] = useState(false);

  // Filter out current user from family storytellers list (shown separately)
  const familyStorytellers = availableStorytellers.filter(
    (s) => s.storytellerId !== user?.id
  );
  const hasFamilyAccess = familyStorytellers.length > 0;

  console.log('[GlassMenuDropdown] activeContext:', activeContext, 'isOwnAccount:', isOwnAccount, 'familyStorytellers:', familyStorytellers.length);

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

  const handleAccountSwitch = async (storytellerId: string) => {
    await switchToStoryteller(storytellerId);
    setIsAccountSwitcherOpen(false);
    onClose();
    // Reload to ensure fresh data for new context
    window.location.reload();
  };

  // Reset account switcher state when menu closes
  useEffect(() => {
    if (!isOpen) {
      setIsAccountSwitcherOpen(false);
    }
  }, [isOpen]);

  const allMenuItems = [
    { icon: Home, label: "Home", href: "/" },
    // HIDDEN: Chapters feature not ready for launch
    // { icon: BookOpen, label: "Manage Chapters", href: "/chapters-v2", ownerOnly: true },
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
          initial={{ opacity: 0, y: 10, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: 10, x: "-50%" }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-24 left-1/2 z-[110] w-[90%] max-w-sm max-h-[calc(100vh-12rem)] rounded-2xl shadow-2xl overflow-y-auto bg-white/95 backdrop-blur-xl border border-white/30"
        >
          {/* User Info & Account Switcher */}
          {user && (
            <div className="border-b border-gray-100 bg-gray-50/50">
              {/* Main user row - horizontal layout */}
              <button
                onClick={() => hasFamilyAccess && setIsAccountSwitcherOpen(!isAccountSwitcherOpen)}
                className={`w-full px-4 py-3 flex items-center gap-3 ${hasFamilyAccess ? 'cursor-pointer hover:bg-gray-100/50' : 'cursor-default'}`}
                disabled={!hasFamilyAccess}
              >
                <Avatar className="w-10 h-10 flex-shrink-0">
                  {isOwnAccount ? (
                    <>
                      <AvatarImage
                        src={profileUser?.profilePhotoUrl || ""}
                        alt={user.name || "User"}
                      />
                      <AvatarFallback className="bg-amber-100 text-amber-700 text-sm">
                        {(user.name || "U")
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </AvatarFallback>
                    </>
                  ) : (
                    <AvatarFallback className="bg-blue-100 text-blue-700 text-sm">
                      {(activeContext?.storytellerName || "F")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {isOwnAccount ? (user.name || "Your Stories") : activeContext?.storytellerName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {isOwnAccount ? "Your Stories" : `Viewing as ${activeContext?.relationship || 'Family'}`}
                  </p>
                </div>
                {hasFamilyAccess && (
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform ${isAccountSwitcherOpen ? 'rotate-180' : ''}`}
                  />
                )}
              </button>

              {/* Expandable account list */}
              <AnimatePresence>
                {isAccountSwitcherOpen && hasFamilyAccess && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-gray-100"
                  >
                    <div className="py-1 bg-white/50">
                      {/* Own account option */}
                      <button
                        onClick={() => handleAccountSwitch(user.id)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                          isOwnAccount ? 'bg-amber-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{user.name || "Your Stories"}</p>
                          <p className="text-xs text-gray-500">Your Stories</p>
                        </div>
                        {isOwnAccount && <Check className="w-4 h-4 text-amber-600 flex-shrink-0" />}
                      </button>

                      {/* Family accounts */}
                      {familyStorytellers.map((storyteller) => {
                        const isActive = activeContext?.storytellerId === storyteller.storytellerId;
                        return (
                          <button
                            key={storyteller.storytellerId}
                            onClick={() => handleAccountSwitch(storyteller.storytellerId)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                              isActive ? 'bg-blue-50' : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                              <Users className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{storyteller.storytellerName}</p>
                              <p className="text-xs text-gray-500 truncate">{storyteller.relationship || 'Family'}</p>
                            </div>
                            {isActive && <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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
