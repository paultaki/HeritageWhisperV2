"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Clock, BookOpen, Mic, Lightbulb, User } from "lucide-react";
import GlassNav from "./GlassNav";

export default function GlassNavWrapper() {
  const pathname = usePathname();

  // Hide navigation on specific pages
  const isInterviewChat = pathname === '/interview-chat';
  const isAuthPage = pathname.startsWith('/auth');

  // Don't show glass nav on these pages
  if (isInterviewChat || isAuthPage) {
    return null;
  }

  // Determine active key based on pathname
  const getActiveKey = () => {
    if (pathname === '/timeline' || pathname === '/') return 'timeline';
    if (pathname.startsWith('/book')) return 'book';
    if (pathname.startsWith('/memory-box')) return 'memory';
    if (pathname.startsWith('/prompts')) return 'ideas';
    if (pathname.startsWith('/profile')) return 'profile';
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
      label: 'Memory',
      href: '/memory-box',
      Icon: Mic,
    },
    {
      key: 'ideas',
      label: 'Ideas',
      href: '/prompts',
      Icon: Lightbulb,
    },
    {
      key: 'profile',
      label: 'Profile',
      href: '/profile',
      Icon: User,
    },
  ];

  return (
    <GlassNav
      items={navItems}
      activeKey={getActiveKey()}
      className="pb-[calc(env(safe-area-inset-bottom)+12px)]"
    />
  );
}
