"use client";

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Calendar, BookOpen, Box, User } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  href: string;
  isActive?: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon: Icon, label, href, isActive, onClick }) => {
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
      className="flex flex-col items-center justify-center py-2 px-3 flex-1 transition-all"
      style={{
        color: isActive ? 'hsl(0, 77%, 64%)' : 'hsl(210, 10%, 60%)',
      }}
    >
      <Icon className={`w-6 h-6 mb-1 transition-transform ${isActive ? 'scale-110' : ''}`} />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
};

interface MobileNavigationProps {
  onRecordClick: () => void;
}

export default function MobileNavigation({ onRecordClick }: MobileNavigationProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  // Don't show navigation on auth pages or home page
  const shouldShow = user && !['/auth/login', '/auth/register', '/'].includes(pathname);

  if (!shouldShow) {
    return null;
  }

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', damping: 20 }}
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t-2 md:hidden"
      style={{
        borderTopColor: 'hsl(0, 77%, 64%)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.08)',
      }}
    >
      <div className="flex items-center justify-around h-20 relative">
        {/* Timeline */}
        <NavItem
          icon={Calendar}
          label="Timeline"
          href="/timeline"
          isActive={pathname === '/timeline'}
        />

        {/* Book View */}
        <NavItem
          icon={BookOpen}
          label="Book"
          href="/book"
          isActive={pathname.startsWith('/book')}
        />

        {/* Record Button - Hero Center Element */}
        <div className="relative flex-1 flex justify-center">
          <button
            onClick={onRecordClick}
            className="absolute -top-4 w-16 h-16 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, hsl(0, 77%, 64%) 0%, hsl(0, 77%, 54%) 100%)',
              boxShadow: '0 4px 12px rgba(232, 93, 93, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.2)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
            }}
          >
            {/* Pulse animation ring */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ background: 'linear-gradient(135deg, hsl(0, 77%, 64%) 0%, hsl(0, 77%, 54%) 100%)' }}
              animate={{
                scale: [1, 1.3, 1.3],
                opacity: [0.5, 0, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 0.5,
              }}
            />

            {/* Icon */}
            <Image
              src="/REC_Mic.png"
              alt="Record"
              width={24}
              height={24}
              className="z-10"
            />
          </button>
        </div>

        {/* Memory Box */}
        <NavItem
          icon={Box}
          label="Memories"
          href="/memory-box"
          isActive={pathname === '/memory-box'}
        />

        {/* Profile */}
        <NavItem
          icon={User}
          label="Profile"
          href="/profile"
          isActive={pathname === '/profile'}
        />
      </div>
    </motion.nav>
  );
}
