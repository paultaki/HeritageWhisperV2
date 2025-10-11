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
      {/* Desktop Navigation (left sidebar) - slides out when fullscreen */}
      <div
        className="transition-transform duration-300 ease-in-out"
        style={{
          transform: shouldHideNav ? "translateX(-100%)" : "translateX(0)",
        }}
      >
        <DesktopNavigation onRecordClick={() => openModal()} />
      </div>

      {/* Mobile Navigation (bottom bar) - slides down when fullscreen */}
      <div
        className="transition-transform duration-300 ease-in-out"
        style={{
          transform: shouldHideNav ? "translateY(100%)" : "translateY(0)",
        }}
      >
        <MobileNavigation onRecordClick={() => openModal()} />
      </div>

      {/* Hamburger Menu (top right) - fades out when fullscreen */}
      <div
        className="transition-opacity duration-300 ease-in-out"
        style={{
          opacity: shouldHideNav ? 0 : 1,
          pointerEvents: shouldHideNav ? "none" : "auto",
        }}
      >
        <HamburgerMenu />
      </div>

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
