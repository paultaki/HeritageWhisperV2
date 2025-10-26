"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Play, Pause, RotateCcw } from "lucide-react";
import designSystem from "@/lib/designSystem";

/**
 * Transcription Review Component
 *
 * Shows the transcribed text for review and editing.
 * User can:
 * - Edit the transcription
 * - Play back the audio
 * - Go deeper with follow-up questions
 * - Re-record
 * - Save the story
 *
 * Extracted from RecordModal.tsx lines 1419-1532
 * Size: ~180 lines
 */

export interface TranscriptionReviewProps {
  // Transcription state
  transcription: string;
  editedTranscription: string;
  setEditedTranscription: (value: string) => void;
  isTranscribing: boolean;
  isTypingMode: boolean;

  // Audio playback
  audioUrl: string | null;
  isPlaying: boolean;
  togglePlayback: () => void;
  recordingTime: number;

  // Go Deeper
  showGoDeeperOverlay: () => void;

  // Utilities
  formatTime: (seconds: number) => string;
  currentPrompt: string;
}

export function TranscriptionReview(props: TranscriptionReviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h3
          className="text-2xl font-bold mb-2"
          style={{
            fontFamily: designSystem.typography.fontFamilies.serif,
          }}
        >
          {props.isTypingMode ? "Type Your Story" : "Review Your Story"}
        </h3>
        <p className="text-gray-600">
          {props.isTypingMode
            ? "Type your story below. Take your time and include all the details you want to share."
            : props.isTranscribing
              ? "Transcribing your story..."
              : "You can edit the transcription below"}
        </p>
      </div>

      {/* Audio Playback - Only show if not in typing mode */}
      {!props.isTypingMode && (
        <Card className="p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={props.togglePlayback}
                disabled={!props.audioUrl}
              >
                {props.isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
              <span className="text-sm text-gray-600">
                {props.isPlaying
                  ? "Playing..."
                  : "Listen to your recording"}
              </span>
            </div>
            <span className="text-sm font-medium">
              {props.formatTime(props.recordingTime)}
            </span>
          </div>
        </Card>
      )}

      {/* Transcription */}
      <Card
        className="p-6"
        style={{
          background: "white",
          borderRadius: designSystem.spacing.borderRadius.card,
        }}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Sparkles
              className="w-5 h-5 mt-1"
              style={{ color: designSystem.colors.primary.coral }}
            />
            <div className="flex-1">
              <h4 className="font-semibold mb-2">
                {props.isTypingMode ? "Your Story" : "Your Transcription"}
              </h4>
              {props.isTranscribing ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <div className="animate-pulse">
                    Processing audio...
                  </div>
                </div>
              ) : (
                <Textarea
                  value={props.editedTranscription}
                  onChange={(e) =>
                    props.setEditedTranscription(e.target.value)
                  }
                  className="min-h-[180px] sm:min-h-[200px] resize-none"
                  placeholder={
                    props.isTypingMode
                      ? `Start typing your story here...\n\nConsider the prompt: "${props.currentPrompt}"`
                      : "Your story transcription will appear here..."
                  }
                  autoFocus={props.isTypingMode}
                />
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Go Deeper Button - Don't show in typing mode since it's for recorded stories */}
      {!props.isTranscribing && props.transcription && !props.isTypingMode && (
        <Button
          variant="outline"
          onClick={props.showGoDeeperOverlay}
          className="w-full"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Go Deeper
        </Button>
      )}
    </motion.div>
  );
}
