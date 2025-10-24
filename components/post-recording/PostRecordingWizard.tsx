"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";
import { useRecordingWizard } from "@/hooks/use-recording-wizard";
import { type PostRecordingData } from "@/types/recording";
import { processConversationData } from "@/lib/conversationEnhancement";
import { enhanceQuickStoryTranscript } from "@/lib/quickStoryEnhancement";
import { Step1_TitleYear } from "./Step1_TitleYear";
import { Step2_Photos } from "./Step2_Photos";
import { Step3_Review } from "./Step3_Review";
import { Step4_Lesson } from "./Step4_Lesson";
import { useRouter } from "next/navigation";

interface PostRecordingWizardProps {
  initialData: Partial<PostRecordingData>;
  onComplete?: () => void;
}

/**
 * Post-Recording Wizard Component
 *
 * 4-step wizard for finalizing a recording into a publishable story:
 * 1. Title & Year (required)
 * 2. Photos (optional, up to 3)
 * 3. Review Transcript (edit enhanced version)
 * 4. Lesson Learned (optional)
 */
export function PostRecordingWizard({
  initialData,
  onComplete,
}: PostRecordingWizardProps) {
  const router = useRouter();
  const wizard = useRecordingWizard({ initialData, onComplete });
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isTranscriptionLoading, setIsTranscriptionLoading] = useState(false);

  const handleCancel = () => {
    if (window.confirm("Are you sure you want to cancel? Your progress will be lost.")) {
      router.push("/timeline");
    }
  };

  // Auto-enhance transcripts when component mounts
  useEffect(() => {
    const enhanceIfNeeded = async () => {
      // Check if we need to enhance (enhanced is same as original)
      if (initialData.enhancedTranscript === initialData.originalTranscript && initialData.originalTranscript) {
        console.log(`[Wizard] Enhancing ${initialData.recording?.mode} transcript...`);
        setIsEnhancing(true);

        try {
          let enhancedResult = "";

          // Handle conversation mode with Q&A pairs
          if (
            initialData.recording?.mode === "conversation" &&
            initialData.recording?.qaPairs &&
            initialData.recording.qaPairs.length > 0
          ) {
            const enhanced = await processConversationData(
              initialData.recording.qaPairs,
              initialData.originalTranscript || ""
            );
            enhancedResult = enhanced.enhancedTranscript;
          }
          // Handle quick story mode with self-correction processing
          else if (initialData.recording?.mode === "quick") {
            const enhanced = await enhanceQuickStoryTranscript(
              initialData.originalTranscript || ""
            );
            enhancedResult = enhanced.enhanced;
          }
          // Default: just use original
          else {
            enhancedResult = initialData.originalTranscript || "";
          }

          // Update the enhanced transcript
          wizard.updateData("enhancedTranscript", enhancedResult);
          console.log("[Wizard] Transcript enhanced successfully");
        } catch (error) {
          console.error("[Wizard] Failed to enhance transcript:", error);
          // On error, enhanced will be same as original
        } finally {
          setIsEnhancing(false);
        }
      }
    };

    enhanceIfNeeded();
  }, []); // Only run once on mount

  // Listen for background transcription completion
  useEffect(() => {
    const handleTranscriptionComplete = (event: CustomEvent) => {
      console.log("[PostRecordingWizard] Background transcription completed!", event.detail);

      const { transcription: newTranscription, lessonOptions: newLessonOptions } = event.detail;

      // Update transcription if we don't have one yet or if it's empty
      if (!wizard.data.originalTranscript || wizard.data.originalTranscript.trim() === "") {
        wizard.updateData("originalTranscript", newTranscription);
        wizard.updateData("enhancedTranscript", newTranscription); // Will be enhanced later
        setIsTranscriptionLoading(false);

        console.log("[PostRecordingWizard] Transcription updated:", newTranscription);
      }

      // Store lesson options for Step 4
      if (newLessonOptions) {
        // Auto-set practical lesson if empty
        if (!wizard.data.lessonLearned && newLessonOptions.practical) {
          wizard.updateData("lessonLearned", newLessonOptions.practical);
        }
      }

      // Clean up sessionStorage
      sessionStorage.removeItem('hw_transcription_result');
    };

    const handleTranscriptionError = () => {
      console.error("[PostRecordingWizard] Background transcription failed");
      setIsTranscriptionLoading(false);

      // Clean up sessionStorage
      sessionStorage.removeItem('hw_transcription_error');
    };

    // Add event listeners
    window.addEventListener('hw_transcription_complete', handleTranscriptionComplete as EventListener);
    window.addEventListener('hw_transcription_error', handleTranscriptionError);

    // Check if transcription already completed before we mounted
    const cachedResult = sessionStorage.getItem('hw_transcription_result');
    if (cachedResult) {
      try {
        const data = JSON.parse(cachedResult);
        handleTranscriptionComplete(new CustomEvent('hw_transcription_complete', { detail: data }));
      } catch (error) {
        console.error("[PostRecordingWizard] Error parsing cached transcription:", error);
      }
    }

    // Check if there was an error
    const errorFlag = sessionStorage.getItem('hw_transcription_error');
    if (errorFlag) {
      handleTranscriptionError();
    }

    // If transcription is empty on mount, show loading state
    if (!initialData.originalTranscript || initialData.originalTranscript.trim() === "") {
      setIsTranscriptionLoading(true);
    }

    // Cleanup
    return () => {
      window.removeEventListener('hw_transcription_complete', handleTranscriptionComplete as EventListener);
      window.removeEventListener('hw_transcription_error', handleTranscriptionError);
    };
  }, []); // Only run on mount

  const {
    currentStep,
    nextStep,
    prevStep,
    canGoNext,
    canGoPrev,
    data,
    updateData,
    submitStory,
    isSubmitting,
    error,
  } = wizard;

  const isLastStep = currentStep === 4;
  const stepTitles = [
    "Title & Year",
    "Add Photos",
    "Review Transcript",
    "Lesson Learned",
  ];

  // Calculate progress percentage
  const progressPercent = (currentStep / 4) * 100;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">
            {stepTitles[currentStep - 1]}
          </h2>
          <span className="text-sm text-gray-500">
            Step {currentStep} of 4
          </span>
        </div>

        {/* Progress Dots */}
        <div className="flex items-center gap-2 mb-4">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`h-2 flex-1 rounded-full transition-colors ${
                step <= currentStep
                  ? "bg-gradient-to-r from-amber-500 to-rose-500"
                  : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-500 to-rose-500"
            initial={{ width: "0%" }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {currentStep === 1 && (
            <Step1_TitleYear
              title={data.title}
              year={data.year}
              userBirthYear={data.userBirthYear}
              onTitleChange={(title) => updateData("title", title)}
              onYearChange={(year) => updateData("year", year)}
            />
          )}

          {currentStep === 2 && (
            <Step2_Photos
              photos={data.photos}
              onPhotosChange={(photos) => updateData("photos", photos)}
            />
          )}

          {currentStep === 3 && (
            <>
              {isEnhancing && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <p className="text-sm text-blue-800">
                    {data.recording?.mode === "conversation"
                      ? "Transforming your interview into a flowing story..."
                      : "Cleaning up self-corrections and adding punctuation..."}
                  </p>
                </div>
              )}
              <Step3_Review
                originalTranscript={data.originalTranscript}
                enhancedTranscript={data.enhancedTranscript}
                useEnhanced={data.useEnhanced}
                isConversationMode={data.recording?.mode === "conversation"}
                isLoading={isTranscriptionLoading}
                onOriginalChange={(original) =>
                  updateData("originalTranscript", original)
                }
                onEnhancedChange={(enhanced) =>
                  updateData("enhancedTranscript", enhanced)
                }
                onUseEnhancedChange={(use) => updateData("useEnhanced", use)}
              />
            </>
          )}

          {currentStep === 4 && (
            <Step4_Lesson
              lessonLearned={data.lessonLearned}
              transcript={
                data.useEnhanced
                  ? data.enhancedTranscript
                  : data.originalTranscript
              }
              onLessonChange={(lesson) => updateData("lessonLearned", lesson)}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <Button
            onClick={prevStep}
            disabled={!canGoPrev || isSubmitting}
            variant="outline"
            size="lg"
            className="px-8"
          >
            Back
          </Button>

          <Button
            onClick={handleCancel}
            disabled={isSubmitting}
            variant="ghost"
            size="lg"
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>

        {!isLastStep ? (
          <Button
            onClick={nextStep}
            disabled={!canGoNext || isSubmitting}
            size="lg"
            className="bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 px-8"
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={submitStory}
            disabled={isSubmitting}
            size="lg"
            className="bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 px-8"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving Story...
              </>
            ) : (
              "Save Story"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
