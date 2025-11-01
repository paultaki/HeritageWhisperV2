"use client";

import React from "react";
import MobileNavigation from "./MobileNavigation";
import HamburgerMenu from "./HamburgerMenu";
import { useModeSelection } from "@/hooks/use-mode-selection";
import { ModeSelectionModal } from "@/components/recording/ModeSelectionModal";
import { QuickStoryRecorder } from "@/components/recording/QuickStoryRecorder";

export default function NavigationWrapper() {
  const modeSelection = useModeSelection();

  return (
    <>
      {/* Mobile Navigation (bottom bar) - shows on all pages */}
      <MobileNavigation />

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
