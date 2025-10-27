"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Check } from "lucide-react";
import { motion } from "framer-motion";

interface TranscriptionSelectionScreenProps {
  originalTranscript?: string;
  enhancedTranscript?: string;
  isLoading?: boolean;
  onSelect: (useEnhanced: boolean) => void;
  onCancel?: () => void;
}

/**
 * Transcription Selection Screen
 * 
 * Shows original vs enhanced transcription side-by-side.
 * User picks their preferred version to continue with.
 * 
 * Features:
 * - Loading state while transcription processes
 * - Side-by-side comparison
 * - Visual selection indicators
 * - Smooth animations
 */
export function TranscriptionSelectionScreen({
  originalTranscript: initialOriginalTranscript = "",
  enhancedTranscript: initialEnhancedTranscript = "",
  isLoading = false,
  onSelect,
  onCancel,
}: TranscriptionSelectionScreenProps) {
  const [selectedVersion, setSelectedVersion] = useState<"original" | "enhanced" | null>(null);
  const [isTranscriptionReady, setIsTranscriptionReady] = useState(false);
  const [originalTranscript, setOriginalTranscript] = useState(initialOriginalTranscript);
  const [enhancedTranscript, setEnhancedTranscript] = useState(initialEnhancedTranscript);

  console.log("[TranscriptionSelection] Component rendered with:", {
    initialOriginalTranscript: initialOriginalTranscript?.substring(0, 50),
    initialEnhancedTranscript: initialEnhancedTranscript?.substring(0, 50),
    isLoading,
    isTranscriptionReady,
    originalTranscript: originalTranscript?.substring(0, 50),
  });

  // Listen for background transcription completion
  useEffect(() => {
    console.log("[TranscriptionSelection] useEffect running with initialOriginalTranscript:", initialOriginalTranscript?.substring(0, 50));
    const handleTranscriptionComplete = (event: CustomEvent) => {
      console.log("[TranscriptionSelection] Transcription completed!", event.detail);
      
      // Update transcripts from the event
      if (event.detail?.transcription) {
        setOriginalTranscript(event.detail.transcription);
        setEnhancedTranscript(event.detail.transcription);
      }
      
      setIsTranscriptionReady(true);
    };

    window.addEventListener('hw_transcription_complete', handleTranscriptionComplete as EventListener);

    // Check if already complete from sessionStorage
    const cachedResult = sessionStorage.getItem('hw_transcription_result');
    if (cachedResult) {
      try {
        const data = JSON.parse(cachedResult);
        if (data.transcription) {
          setOriginalTranscript(data.transcription);
          setEnhancedTranscript(data.transcription);
          setIsTranscriptionReady(true);
        }
      } catch (error) {
        console.error("[TranscriptionSelection] Error parsing cached result:", error);
      }
    }

    // Check if already complete from props
    if (initialOriginalTranscript && initialOriginalTranscript.trim().length > 0) {
      console.log("[TranscriptionSelection] Setting transcription ready from props!");
      setOriginalTranscript(initialOriginalTranscript);
      setEnhancedTranscript(initialEnhancedTranscript || initialOriginalTranscript);
      setIsTranscriptionReady(true);
    } else {
      console.log("[TranscriptionSelection] Props check failed:", {
        hasInitialOriginal: !!initialOriginalTranscript,
        length: initialOriginalTranscript?.trim().length,
      });
    }

    return () => {
      window.removeEventListener('hw_transcription_complete', handleTranscriptionComplete as EventListener);
    };
  }, [initialOriginalTranscript, initialEnhancedTranscript]);

  const handleSelectOriginal = () => {
    setSelectedVersion("original");
    setTimeout(() => onSelect(false), 300); // Small delay for visual feedback
  };

  const handleSelectEnhanced = () => {
    setSelectedVersion("enhanced");
    setTimeout(() => onSelect(true), 300); // Small delay for visual feedback
  };

  // Show loading state
  console.log("[TranscriptionSelection] Checking if should show loading:", {
    isLoading,
    isTranscriptionReady,
    hasOriginalTranscript: !!originalTranscript,
    transcriptLength: originalTranscript?.trim().length,
  });
  
  if (isLoading || !isTranscriptionReady || !originalTranscript || originalTranscript.trim().length === 0) {
    console.log("[TranscriptionSelection] Showing loading state");
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          <Loader2 className="w-16 h-16 mx-auto mb-6 animate-spin text-[#8b6b7a]" />
          <h2 className="text-3xl font-semibold mb-4">
            Transcribing your story...
          </h2>
          <p className="text-gray-600 text-lg mb-2 text-center">
            This usually takes just a few seconds
          </p>
          <p className="text-gray-500 text-sm text-center">
            We're converting your audio into text so you can review and edit it
          </p>

          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-base text-blue-900">
              💡 <strong>Did you know?</strong> We're creating two versions: your original words and an enhanced version with better formatting.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-semibold mb-3">
          Choose Your Transcription
        </h2>
        <p className="text-gray-600 text-lg">
          We've created two versions of your story. Pick the one you prefer.
        </p>
      </div>

      {/* Side-by-Side Comparison */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Original Transcription */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all ${
            selectedVersion === "original"
              ? "border-[#8b6b7a] bg-gradient-to-br from-[#f5f0f5] to-[#f8f3f8] shadow-lg"
              : "border-gray-200 hover:border-[#b88b94] bg-white"
          }`}
          onClick={handleSelectOriginal}
        >
          {/* Selection Badge */}
          {selectedVersion === "original" && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-3 -right-3 bg-[#8b6b7a] text-white rounded-full p-2"
            >
              <Check className="w-6 h-6" />
            </motion.div>
          )}

          <div className="mb-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Original Transcription
            </h3>
            <p className="text-sm text-gray-600">
              Your exact words as you spoke them
            </p>
          </div>

          {/* Preview */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
              {originalTranscript}
            </p>
          </div>

          {/* Select Button */}
          <Button
            onClick={handleSelectOriginal}
            className="w-full mt-4 bg-gradient-to-r from-[#8b6b7a] to-[#b88b94] hover:from-[#7a5a69] hover:to-[#a77a83]"
            size="lg"
          >
            {selectedVersion === "original" ? "Selected" : "Use Original"}
          </Button>
        </motion.div>

        {/* Enhanced Transcription */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all ${
            selectedVersion === "enhanced"
              ? "border-[#8b6b7a] bg-gradient-to-br from-[#f5f0f5] to-[#f8f3f8] shadow-lg"
              : "border-gray-200 hover:border-[#b88b94] bg-white"
          }`}
          onClick={handleSelectEnhanced}
        >
          {/* Selection Badge */}
          {selectedVersion === "enhanced" && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-3 -right-3 bg-[#8b6b7a] text-white rounded-full p-2"
            >
              <Check className="w-6 h-6" />
            </motion.div>
          )}

          {/* Recommended Badge */}
          <div className="absolute -top-3 -left-3 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
            ✨ RECOMMENDED
          </div>

          <div className="mb-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Enhanced Version
            </h3>
            <p className="text-sm text-gray-600">
              Cleaned up with proper formatting and paragraph breaks
            </p>
          </div>

          {/* Preview */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
              {enhancedTranscript || originalTranscript}
            </p>
          </div>

          {/* Select Button */}
          <Button
            onClick={handleSelectEnhanced}
            className="w-full mt-4 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600"
            size="lg"
          >
            {selectedVersion === "enhanced" ? "Selected" : "Use Enhanced"}
          </Button>
        </motion.div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 max-w-2xl mx-auto">
        <p className="text-sm text-blue-900">
          <strong>💡 Don't worry!</strong> You can still edit your transcription on the next screen, regardless of which version you choose here.
        </p>
      </div>

      {/* Cancel Button */}
      {onCancel && (
        <div className="text-center">
          <Button
            onClick={onCancel}
            variant="ghost"
            size="lg"
            className="text-gray-500 hover:text-gray-700"
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
