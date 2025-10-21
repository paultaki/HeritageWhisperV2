import { useState, useCallback } from "react";

/**
 * Hook for managing the mode selection modal state.
 *
 * This replaces the previous useRecordModal hook with a simpler interface
 * that just handles opening/closing the mode selection dialog.
 *
 * Now supports passing a prompt question from the prompts page.
 */
export function useModeSelection() {
  const [isOpen, setIsOpen] = useState(false);
  const [quickRecorderOpen, setQuickRecorderOpen] = useState(false);
  const [promptQuestion, setPromptQuestion] = useState<string | undefined>();

  const openModal = useCallback((question?: string) => {
    setPromptQuestion(question);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setPromptQuestion(undefined); // Clear prompt on close
  }, []);

  const openQuickRecorder = useCallback(() => {
    setIsOpen(false); // Close mode selection
    setQuickRecorderOpen(true); // Open quick recorder
  }, []);

  const closeQuickRecorder = useCallback(() => {
    setQuickRecorderOpen(false);
    setPromptQuestion(undefined); // Clear prompt on close
  }, []);

  return {
    isOpen,
    openModal,
    closeModal,
    quickRecorderOpen,
    openQuickRecorder,
    closeQuickRecorder,
    promptQuestion,
  };
}
