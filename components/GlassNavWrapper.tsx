"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Clock, BookOpen, Mic, Menu } from "lucide-react";
import GlassNav from "./GlassNav";
import GlassMenuDropdown from "./GlassMenuDropdown";

export default function GlassNavWrapper() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Hide navigation on specific pages
  const isLandingPage = pathname === '/';
  const isInterviewChat = pathname === '/interview-chat';
  const isAuthPage = pathname.startsWith('/auth');
  const isRecording = pathname === '/recording';

  // Don't show glass nav on these pages
  if (isLandingPage || isInterviewChat || isAuthPage || isRecording) {
    return null;
  }

  // Determine active key based on pathname
  const getActiveKey = () => {
    if (pathname === '/timeline' || pathname === '/') return 'timeline';
    if (pathname.startsWith('/book')) return 'book';
    if (pathname.startsWith('/memory-box') || pathname.startsWith('/recording')) return 'memory';
    if (pathname.startsWith('/prompts')) return 'ideas';
    return '';
  };

  const navItems = [
    {
      key: 'timeline',
      label: 'Timeline',
      href: '/timeline',
      Icon: Clock,
    },
    {
      key: 'book',
      label: 'Book',
      href: '/book',
      Icon: BookOpen,
    },
    {
      key: 'memory',
      label: '+Memory',
      href: '/recording',
      Icon: Mic,
    },
    {
      key: 'menu',
      label: 'Menu',
      href: '#',
      Icon: Menu,
    },
  ];

  return (
    <>
      <GlassNav
        items={navItems}
        activeKey={getActiveKey()}
        className="pb-[calc(env(safe-area-inset-bottom)+6px)]"
        onMenuClick={() => setIsMenuOpen(!isMenuOpen)}
      />
      <GlassMenuDropdown isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
}
