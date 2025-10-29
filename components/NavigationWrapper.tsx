"use client";

import React from "react";
import { useRouter } from "next/navigation";
import DesktopNavigationBottom from "./DesktopNavigationBottom";
import MobileNavigation from "./MobileNavigation";
import HamburgerMenu from "./HamburgerMenu";
import { useModeSelection } from "@/hooks/use-mode-selection";
import { ModeSelectionModal } from "@/components/recording/ModeSelectionModal";
import { QuickStoryRecorder } from "@/components/recording/QuickStoryRecorder";
import { supabase } from "@/lib/supabase";

export default function NavigationWrapper() {
  const modeSelection = useModeSelection();
  const router = useRouter();

  const handleRecordClick = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      // Always create a new memory when clicking record button
      router.push("/review/book-style?new=true");
    } catch (error) {
      console.error("Error in record click:", error);
      // Fallback: open new memory
      router.push("/review/book-style?new=true");
    }
  };

  return (
    <>
      {/* Desktop Navigation (bottom bar) - shows on all pages */}
      <DesktopNavigationBottom onRecordClick={handleRecordClick} />

      {/* Mobile Navigation (bottom bar) - shows on all pages */}
      <MobileNavigation onRecordClick={handleRecordClick} />

      {/* Hamburger Menu (top right) - hidden on book page per component logic */}
      <HamburgerMenu />

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
