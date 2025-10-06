"use client";

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Calendar, BookOpen, Box } from 'lucide-react';
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
      className="flex flex-col items-center gap-1 px-3 py-3 rounded-xl transition-all hover:bg-gray-100 group w-full"
      style={{
        color: isActive ? '#D36A3D' : 'hsl(210, 10%, 60%)',
        background: isActive ? '#FFF5F0' : 'transparent',
      }}
    >
      <Icon className="w-6 h-6 flex-shrink-0" />
      <span className="text-xs font-medium text-center">{label}</span>
    </button>
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
      className="hidden md:flex fixed left-0 top-0 h-full w-28 bg-white/90 backdrop-blur-md border-r-2 flex-col py-8 px-3 z-40"
      style={{
        borderRightColor: '#D36A3D',
        boxShadow: '4px 0 12px rgba(0, 0, 0, 0.08)',
      }}
    >
      {/* Logo/Home */}
      <div className="mb-8 flex justify-center">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{
          background: 'linear-gradient(135deg, #D36A3D 0%, #C05A2D 100%)'
        }}>
          <span className="text-white text-xl font-serif font-bold tracking-tight">HW</span>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 flex flex-col space-y-2">
        <DesktopNavItem
          icon={Calendar}
          label="Timeline"
          href="/timeline"
          isActive={pathname === '/timeline'}
        />

        {/* Record Button */}
        <button
          onClick={onRecordClick}
          className="flex flex-col items-center gap-1 px-3 py-3 rounded-xl transition-all hover:bg-red-50 group w-full my-2"
          style={{
            background: 'linear-gradient(135deg, #D36A3D 0%, #C05A2D 100%)',
            boxShadow: '0 4px 12px rgba(211, 106, 61, 0.4)',
          }}
        >
          <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
            <Image
              src="/REC_Mic.png"
              alt="Record"
              width={20}
              height={20}
            />
          </div>
          <span className="text-xs font-medium text-white text-center">Record</span>
        </button>

        <DesktopNavItem
          icon={BookOpen}
          label="Book"
          href="/book"
          isActive={pathname.startsWith('/book')}
        />

        <DesktopNavItem
          icon={Box}
          label="Memories"
          href="/memory-box"
          isActive={pathname === '/memory-box'}
        />
      </div>
    </motion.nav>
  );
}
