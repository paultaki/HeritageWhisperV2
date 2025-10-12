"use client";

import React from "react";
import DesktopNavigation from "./DesktopNavigation";
import MobileNavigation from "./MobileNavigation";
import HamburgerMenu from "./HamburgerMenu";
import RecordModal from "./RecordModal";
import { useRecordModal } from "@/hooks/use-record-modal";

export default function NavigationWrapper() {
  const { isOpen, openModal, closeModal, handleSave, initialData } =
    useRecordModal();

  return (
    <>
      {/* Desktop Navigation (left sidebar) - hidden on book page, book has its own combined sidebar */}
      <DesktopNavigation onRecordClick={() => openModal()} />

      {/* Mobile Navigation (bottom bar) - hidden on book page per component logic */}
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
