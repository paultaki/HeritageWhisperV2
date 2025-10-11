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
      {/* Desktop Navigation (left sidebar) */}
      <DesktopNavigation onRecordClick={() => openModal()} />

      {/* Mobile Navigation (bottom bar) */}
      <MobileNavigation onRecordClick={() => openModal()} />

      {/* Hamburger Menu (top right) */}
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
