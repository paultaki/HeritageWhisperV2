import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { navCache } from '@/lib/navCache';

export interface RecordModalInitialData {
  title?: string;
  prompt?: string;
  year?: number;
}

export function useRecordModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [initialData, setInitialData] = useState<RecordModalInitialData | null>(null);

  const openModal = useCallback((data?: RecordModalInitialData) => {
    if (data) {
      setInitialData(data);
    } else {
      setInitialData(null);
    }
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setInitialData(null);
  }, []);

  const handleSave = useCallback((recording: any) => {
    // Create navigation cache entry
    const navId = navCache.generateId();
    navCache.set(navId, {
      transcription: recording.transcription || '',
      audioDuration: recording.duration || 0,
      wisdomTranscription: recording.wisdomTranscription || '',
      mainAudioBase64: recording.mainAudioBase64,
      mainAudioType: recording.mainAudioType || 'audio/webm',
      wisdomAudioBase64: recording.wisdomAudioBase64,
      wisdomAudioType: recording.wisdomAudioType || 'audio/webm',
      prompt: recording.prompt,
      selectedPrompt: recording.selectedPrompt,
      followUpQuestions: recording.followUpQuestions,
      formattedContent: recording.formattedContent, // Include comprehensive processing
      fromModal: true,
    });

    // Close modal
    setIsOpen(false);

    // Navigate to review page for editing
    router.push(`/review?nav=${navId}`);
  }, [router]);

  return {
    isOpen,
    openModal,
    closeModal,
    handleSave,
    initialData,
  };
}