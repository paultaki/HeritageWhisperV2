import { useState, useCallback } from "react";

/**
 * Hook for managing the mode selection modal state.
 *
 * This replaces the previous useRecordModal hook with a simpler interface
 * that just handles opening/closing the mode selection dialog.
 */
export function useModeSelection() {
  const [isOpen, setIsOpen] = useState(false);
  const [quickRecorderOpen, setQuickRecorderOpen] = useState(false);

  const openModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const openQuickRecorder = useCallback(() => {
    setIsOpen(false); // Close mode selection
    setQuickRecorderOpen(true); // Open quick recorder
  }, []);

  const closeQuickRecorder = useCallback(() => {
    setQuickRecorderOpen(false);
  }, []);

  return {
    isOpen,
    openModal,
    closeModal,
    quickRecorderOpen,
    openQuickRecorder,
    closeQuickRecorder,
  };
}
