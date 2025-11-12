"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Clock, BookOpen, Mic, Menu, Archive, MessageSquarePlus } from "lucide-react";
import GlassNav from "./GlassNav";
import GlassMenuDropdown from "./GlassMenuDropdown";
import { SubmitQuestionDialog } from "@/components/family/SubmitQuestionDialog";
import { useNavInk } from "@/hooks/use-nav-ink";
import { useAccountContext } from "@/hooks/use-account-context";

export default function GlassNavWrapper() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const { activeContext } = useAccountContext();
  const isOwnAccount = activeContext?.type === 'own' ?? false;

  // Determine default ink based on page context
  // Book, story, and record pages have darker backgrounds (or photos) → use light ink
  // Timeline, memory box, prompts have light backgrounds → use dark ink
  const defaultInk =
    pathname.startsWith('/book') ||
    pathname.startsWith('/story') ||
    pathname === '/recording'
      ? 'light'
      : 'dark';

  // Use the ink detection hook
  const ink = useNavInk({ defaultInk, navId: 'glass-nav' });

  // Determine if assertive blur mode should be active
  // Timeline and Memory Box have photo-heavy content that scrolls under the nav
  const isAssertive =
    pathname === '/timeline' || pathname.startsWith('/memory-box');

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
    if (pathname.startsWith('/recording')) return 'record';
    if (pathname.startsWith('/memory-box')) return 'keepsakes';
    if (pathname.startsWith('/prompts')) return 'ideas';
    return '';
  };

  // Build nav items based on permission level
  const allNavItems = [
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
      key: 'record',
      label: 'Record',
      href: '/recording',
      Icon: Mic,
      ownerOnly: true, // Only show for account owners
    },
    {
      key: 'question',
      label: 'Ask',
      href: '#',
      Icon: MessageSquarePlus,
      viewerOnly: true, // Only show for viewers
      onClick: () => setIsQuestionDialogOpen(true),
    },
    {
      key: 'keepsakes',
      label: 'Keepsakes',
      href: '/memory-box',
      Icon: Archive,
    },
    {
      key: 'menu',
      label: 'Menu',
      href: '#',
      Icon: Menu,
    },
  ];

  // Filter nav items based on permission level
  // - ownerOnly items: only show to account owners
  // - viewerOnly items: only show to viewers (not owners)
  // - no flag: show to everyone
  const navItems = allNavItems.filter(item => {
    if (item.ownerOnly && !isOwnAccount) return false;
    if (item.viewerOnly && isOwnAccount) return false;
    return true;
  });

  return (
    <>
      <GlassNav
        id="glass-nav"
        items={navItems}
        activeKey={getActiveKey()}
        className="pb-[calc(env(safe-area-inset-bottom)+6px)]"
        dataInk={ink}
        isAssertive={isAssertive}
        onMenuClick={() => setIsMenuOpen(!isMenuOpen)}
      />
      <GlassMenuDropdown isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      {/* Submit Question Dialog - Only for viewers */}
      {!isOwnAccount && activeContext && (
        <SubmitQuestionDialog
          isOpen={isQuestionDialogOpen}
          onClose={() => setIsQuestionDialogOpen(false)}
          storytellerUserId={activeContext.storytellerId}
          storytellerName={activeContext.storytellerName || 'the storyteller'}
        />
      )}
    </>
  );
}
