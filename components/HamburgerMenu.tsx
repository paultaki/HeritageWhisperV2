"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, X, User, Users, LogOut, Settings, HelpCircle, Home, Plus, Share2, FileText, Shield } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { useRecordModal } from '@/hooks/use-record-modal';
import { useToast } from '@/hooks/use-toast';

export default function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const recordModal = useRecordModal();
  const { toast } = useToast();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

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
        description: "The link has been copied to your clipboard. Share it with anyone to show your timeline.",
      });
    }
    setIsOpen(false);
  };

  const menuItems = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: Settings, label: 'Settings', href: '/profile' },
    { icon: Users, label: 'Family', href: '/family' },
    { icon: HelpCircle, label: 'Help', href: '/help' },
  ];

  const actionItems = [
    { icon: Plus, label: 'New Memory', onClick: handleNewMemory, color: 'text-heritage-coral hover:bg-heritage-coral/10' },
    { icon: Share2, label: 'Share', onClick: handleShare, color: 'text-blue-600 hover:bg-blue-50' },
  ];

  // Don't show on auth pages or home page
  const shouldShow = !['/auth/login', '/auth/register', '/'].includes(pathname);

  if (!shouldShow) {
    return null;
  }

  return (
    <div ref={menuRef} className="fixed top-[6px] md:top-[4px] right-4 z-[100]">
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg bg-white/90 backdrop-blur-sm border border-gray-200 shadow-sm hover:shadow-md transition-all"
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
            className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden"
          >
            {/* User Info */}
            {user && (
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <p className="text-sm font-medium text-gray-900">{user.name || 'User'}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
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

                return (
                  <button
                    key={item.href}
                    onClick={() => handleNavigation(item.href)}
                    className={`w-full flex items-center px-4 py-2.5 text-sm transition-colors ${
                      isActive
                        ? 'bg-heritage-coral/10 text-heritage-coral'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Legal Links */}
            <div className="border-t border-gray-100 py-1">
              <button
                onClick={() => handleNavigation('/privacy')}
                className="w-full flex items-center px-4 py-2 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Shield className="w-3.5 h-3.5 mr-2" />
                Privacy Policy
              </button>
              <button
                onClick={() => handleNavigation('/terms')}
                className="w-full flex items-center px-4 py-2 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <FileText className="w-3.5 h-3.5 mr-2" />
                Terms of Service
              </button>
            </div>

            {/* Logout */}
            <div className="border-t border-gray-100 py-1">
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
  );
}