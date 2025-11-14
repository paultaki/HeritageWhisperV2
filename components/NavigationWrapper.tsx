"use client";

import React from "react";
import { usePathname } from "next/navigation";
import HamburgerMenu from "./HamburgerMenu";
import { useModeSelection } from "@/hooks/use-mode-selection";
import { ModeSelectionModal } from "@/components/recording/ModeSelectionModal";
import { QuickStoryRecorder } from "@/components/recording/QuickStoryRecorder";

export default function NavigationWrapper() {
  const modeSelection = useModeSelection();
  const pathname = usePathname();

  // Hide all navigation on interview-chat page (has its own custom nav)
  const isInterviewChat = pathname === '/interview-chat';
  const isBookPage = pathname === '/book' || pathname.startsWith('/book/');

  return (
    <>
      {/* Hamburger Menu (top right) - DISABLED - now using GlassMenuDropdown in GlassNav */}
      {/* {!isInterviewChat && !isBookPage && <HamburgerMenu />} */}

      {/* Mode Selection Modal */}
      <ModeSelectionModal
        isOpen={modeSelection.isOpen}
        onClose={modeSelection.closeModal}
        onSelectQuickStory={modeSelection.openQuickRecorder}
        promptQuestion={modeSelection.promptQuestion}
      />

      {/* Quick Story Recorder */}
      <QuickStoryRecorder
        isOpen={modeSelection.quickRecorderOpen}
        onClose={modeSelection.closeQuickRecorder}
        promptQuestion={modeSelection.promptQuestion}
      />
    </>
  );
}
