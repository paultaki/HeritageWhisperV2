"use client";

import React from "react";
import DesktopNavigationBottom from "./DesktopNavigationBottom";
import MobileNavigation from "./MobileNavigation";
import HamburgerMenu from "./HamburgerMenu";
import RecordModal from "./RecordModal";
import { useRecordModal } from "@/hooks/use-record-modal";

export default function NavigationWrapper() {
  const { isOpen, openModal, closeModal, handleSave, initialData } =
    useRecordModal();

  return (
    <>
      {/* Desktop Navigation (bottom bar) - shows on all pages */}
      <DesktopNavigationBottom onRecordClick={() => openModal()} />

      {/* Mobile Navigation (bottom bar) - shows on all pages */}
      <MobileNavigation onRecordClick={() => openModal()} />

      {/* Hamburger Menu (top right) - hidden on book page per component logic */}
      <HamburgerMenu />

      {/* Record Modal */}
      <RecordModal
        isOpen={isOpen}
        onClose={closeModal}
        onSave={handleSave}
        initialPrompt={initialData?.prompt}
        initialTitle={initialData?.title}
        initialYear={initialData?.year}
      />
    </>
  );
}
