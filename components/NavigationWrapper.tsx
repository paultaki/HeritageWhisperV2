"use client";

import React from 'react';
import DesktopNavigation from './DesktopNavigation';
import MobileNavigation from './MobileNavigation';
import RecordModal from './RecordModal';
import { useRecordModal } from '@/hooks/use-record-modal';

export default function NavigationWrapper() {
  const { isOpen, openModal, closeModal, handleSave, initialData } = useRecordModal();

  return (
    <>
      {/* Desktop Navigation (left sidebar) */}
      <DesktopNavigation onRecordClick={() => openModal()} />

      {/* Mobile Navigation (bottom bar) */}
      <MobileNavigation onRecordClick={() => openModal()} />

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
