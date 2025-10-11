"use client";

import React from "react";
import { usePathname } from "next/navigation";
import DesktopNavigation from "./DesktopNavigation";
import MobileNavigation from "./MobileNavigation";
import HamburgerMenu from "./HamburgerMenu";
import RecordModal from "./RecordModal";
import { useRecordModal } from "@/hooks/use-record-modal";
import { useBookFullscreen } from "@/hooks/use-book-fullscreen";

export default function NavigationWrapper() {
  const { isOpen, openModal, closeModal, handleSave, initialData } =
    useRecordModal();
  const pathname = usePathname();
  const { isFullscreen } = useBookFullscreen();

  // Only hide navigation when on book page AND in fullscreen mode
  const isBookPage = pathname === "/book";
  const shouldHideNav = isBookPage && isFullscreen;

  return (
    <>
      {/* Desktop Navigation (left sidebar) - only hide on book page in fullscreen */}
      {!shouldHideNav && <DesktopNavigation onRecordClick={() => openModal()} />}

      {/* Mobile Navigation (bottom bar) - only hide on book page in fullscreen */}
      {!shouldHideNav && <MobileNavigation onRecordClick={() => openModal()} />}

      {/* Hamburger Menu (top right) - only hide on book page in fullscreen */}
      {!shouldHideNav && <HamburgerMenu />}

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
