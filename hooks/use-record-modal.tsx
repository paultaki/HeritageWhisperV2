import { useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { navCache } from "@/lib/navCache";

export interface RecordModalInitialData {
  title?: string;
  prompt?: string;
  year?: number;
}

export function useRecordModal() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [initialData, setInitialData] = useState<RecordModalInitialData | null>(
    null,
  );

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

  const handleSave = useCallback(
    async (recording: any) => {
      console.log("[useRecordModal] handleSave called with:", {
        hasAudioBlob: !!recording.audioBlob,
        hasMainAudioBase64: !!recording.mainAudioBase64,
        hasTranscription: !!recording.transcription,
        hasWisdomClipText: !!recording.wisdomClipText,
        wisdomClipText: recording.wisdomClipText,
        duration: recording.duration, // Log duration for debugging
      });

      // Convert audio blob to base64 if needed
      let mainAudioBase64: string | undefined = recording.mainAudioBase64;
      let mainAudioType: string | undefined =
        recording.mainAudioType || "audio/webm";

      if (recording.audioBlob && !mainAudioBase64) {
        console.log("[useRecordModal] Converting audio blob to base64...");
        try {
          mainAudioBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();

            reader.onloadend = () => {
              try {
                const base64 = reader.result as string;
                const base64Data = base64.split(",")[1]; // Remove data:type;base64, prefix
                resolve(base64Data);
              } catch (err) {
                reject(err);
              }
            };

            reader.onerror = (error) => {
              reject(error);
            };

            reader.readAsDataURL(recording.audioBlob);
          });

          mainAudioType = recording.audioBlob.type || "audio/webm";
          console.log(
            "[useRecordModal] Audio conversion successful, length:",
            mainAudioBase64.length,
          );
        } catch (error) {
          console.error(
            "[useRecordModal] Failed to convert audio blob:",
            error,
          );
        }
      }

      // Create navigation cache entry
      const navId = navCache.generateId();
      const wisdomText =
        recording.wisdomClipText || recording.wisdomTranscription || "";
      console.log("[useRecordModal] Wisdom text for NavCache:", wisdomText);

      const audioDuration = recording.duration || 0;
      console.log("[useRecordModal] Audio duration:", audioDuration, "seconds");
      
      navCache.set(navId, {
        transcription: recording.transcription || "",
        audioDuration: audioDuration,
        wisdomClipText: wisdomText,
        wisdomTranscription: wisdomText, // Keep for backwards compatibility
        mainAudioBase64,
        mainAudioType,
        wisdomAudioBase64: recording.wisdomAudioBase64,
        wisdomAudioType: recording.wisdomAudioType || "audio/webm",
        prompt: recording.prompt,
        selectedPrompt: recording.selectedPrompt,
        followUpQuestions: recording.followUpQuestions,
        formattedContent: recording.formattedContent,
        lessonOptions: recording.lessonOptions, // Pass lesson options through
        title: recording.title,
        storyYear: recording.year,
        fromModal: true,
        returnPath: pathname, // Store where the user came from
      });

      console.log(
        "[useRecordModal] Stored in NavCache with ID:",
        navId,
        "returnPath:",
        pathname,
        "audioDuration:",
        audioDuration,
      );

      // Close modal
      setIsOpen(false);

      // Navigate to review page for editing
      router.push(`/review?nav=${navId}`);
    },
    [router, pathname],
  );

  return {
    isOpen,
    openModal,
    closeModal,
    handleSave,
    initialData,
  };
}
