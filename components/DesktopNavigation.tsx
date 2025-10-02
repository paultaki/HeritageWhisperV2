"use client";

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Calendar, BookOpen, Mic } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  href: string;
  isActive?: boolean;
  onClick?: () => void;
}

function DesktopNavItem({ icon: Icon, label, href, isActive, onClick }: NavItemProps) {
  const router = useRouter();
  const [showTooltip, setShowTooltip] = useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push(href);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="p-3 rounded-xl transition-all hover:bg-gray-100 group"
        style={{
          color: isActive ? 'hsl(0, 77%, 64%)' : 'hsl(210, 10%, 60%)',
          background: isActive ? 'hsl(0, 77%, 95%)' : 'transparent',
        }}
      >
        <Icon className="w-6 h-6" />
      </button>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-800 text-white text-sm rounded whitespace-nowrap pointer-events-none z-50"
          >
            {label}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface DesktopNavigationProps {
  onRecordClick: () => void;
}

export default function DesktopNavigation({ onRecordClick }: DesktopNavigationProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  // Don't show navigation on auth pages or home page
  const shouldShow = user && !['/auth/login', '/auth/register', '/'].includes(pathname);

  if (!shouldShow) {
    return null;
  }

  return (
    <motion.nav
      initial={{ x: -100 }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', damping: 20 }}
      className="hidden md:flex fixed left-0 top-0 h-full w-20 bg-white/95 backdrop-blur-md border-r flex-col items-center py-8 z-40"
      style={{ borderRightColor: 'hsl(45, 20%, 82%)' }}
    >
      {/* Logo/Home */}
      <div className="mb-8 p-1">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-[hsl(0,77%,64%)] to-[hsl(0,77%,54%)] shadow-lg">
          <span className="text-white text-xl font-bold">HW</span>
        </div>
      </div>

      {/* Navigation Items - Only 3 main buttons */}
      <div className="flex-1 flex flex-col items-center space-y-4">
        <DesktopNavItem
          icon={Calendar}
          label="Timeline"
          href="/timeline"
          isActive={pathname === '/timeline'}
        />

        {/* Record Button - Moved to middle */}
        <button
          onClick={onRecordClick}
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95 my-2"
          style={{
            background: 'linear-gradient(135deg, hsl(0, 77%, 64%) 0%, hsl(0, 77%, 54%) 100%)',
            boxShadow: '0 4px 12px rgba(232, 93, 93, 0.3)',
          }}
        >
          <Mic className="w-6 h-6 text-white" />
        </button>

        <DesktopNavItem
          icon={BookOpen}
          label="Book View"
          href="/book"
          isActive={pathname.startsWith('/book')}
        />
      </div>
    </motion.nav>
  );
}
