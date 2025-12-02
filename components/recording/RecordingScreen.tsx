"use client";

import { type RefObject } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AmbientSpotlight } from "@/components/ui/ambient-spotlight";
import { AudioRecorder, AudioRecorderHandle } from "@/components/AudioRecorder";
import { VoiceRecordingButton } from "@/components/VoiceRecordingButton";
import { Sparkles, Square, Play, Pause, Mic, Settings } from "lucide-react";
import designSystem from "@/lib/designSystem";
import { useRouter } from "next/navigation";

/**
 * Recording Screen Component
 *
 * Main recording interface with:
 * - Voice recording button
 * - Pause/resume controls
 * - Follow-up question display and navigation
 * - Recording tips
 * - AI disabled state
 *
 * Extracted from RecordModal.tsx lines 1131-1417
 * Size: ~180 lines
 */

export interface RecordingScreenProps {
  // Recording state
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  isTranscribing: boolean;

  // Prompt & follow-ups
  currentPrompt: string;
  followUpQuestions: string[];
  currentFollowUpIndex: number;
  isGeneratingFollowUp: boolean;
  showFollowUpButton: boolean;

  // AI consent
  isAIEnabled: boolean;
  isAILoading: boolean;

  // Actions
  startRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => void;
  handleGetFollowUpQuestion: () => void;
  setCurrentFollowUpIndex: (index: number) => void;

  // Refs
  audioRecorderRef: RefObject<AudioRecorderHandle>;

  // Router for navigation
  onClose: () => void;
}

export function RecordingScreen(props: RecordingScreenProps) {
  const router = useRouter();

  if (props.isTranscribing) {
    // Processing state - show spinner and message
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-4 border-gray-200 border-t-coral-500 animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles
              className="w-10 h-10"
              style={{ color: designSystem.colors.primary.coral }}
            />
          </div>
        </div>
        <div className="text-center space-y-2">
          <h3
            className="text-2xl font-semibold"
            style={{
              fontFamily: designSystem.typography.fontFamilies.serif,
            }}
          >
            Processing your recording...
          </h3>
          <p className="text-lg text-gray-600">
            We're transcribing your story. This will just take a moment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AmbientSpotlight
      intensity={0.4}
      color="rgba(251, 146, 60, 0.12)"
      className="rounded-2xl"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Prompt at top - or Follow-up Questions */}
        <motion.div
        key={props.followUpQuestions.length > 0 ? `followup-${props.currentFollowUpIndex}` : 'original-prompt'}
        initial={{ backgroundColor: 'rgba(251, 146, 60, 0.1)' }}
        animate={{ backgroundColor: 'rgba(0, 0, 0, 0)' }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <Card className="p-6 bg-gradient-to-br from-white to-amber-50/30">
          <div className="flex items-start gap-3">
            <Sparkles
              className="w-6 h-6 mt-1 flex-shrink-0"
              style={{ color: designSystem.colors.primary.coral }}
            />
            <div className="flex-1">
              <p className="text-2xl text-gray-700 italic leading-relaxed">
                {props.followUpQuestions.length > 0 ? (
                  <>&ldquo;{props.followUpQuestions[props.currentFollowUpIndex]}&rdquo;</>
                ) : (
                  <>&ldquo;{props.currentPrompt || "What's a story from your life that you've been wanting to share?"}&rdquo;</>
                )}
              </p>
              {props.followUpQuestions.length > 0 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-500">
                    Question {props.currentFollowUpIndex + 1} of {props.followUpQuestions.length}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => props.setCurrentFollowUpIndex(Math.max(0, props.currentFollowUpIndex - 1))}
                      disabled={props.currentFollowUpIndex === 0}
                      className="text-sm"
                    >
                      ← Previous
                    </Button>
                    {props.currentFollowUpIndex < props.followUpQuestions.length - 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => props.setCurrentFollowUpIndex(props.currentFollowUpIndex + 1)}
                        className="text-sm"
                      >
                        Next →
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Hidden AudioRecorder */}
      <div className="hidden">
        <AudioRecorder
          ref={props.audioRecorderRef}
          onRecordingComplete={() => {}} // Handled by parent
          maxDuration={300} // 5 minutes max
          onTimeWarning={(remaining) => {
            // Warnings handled by AudioRecorder internally
          }}
          className="w-full"
        />
      </div>

      {/* Center: Morphing Recording Button */}
      <div className="flex flex-col items-center justify-center py-4 space-y-3">
        {!props.isAIEnabled && !props.isAILoading ? (
          // AI Disabled State
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative">
                  <button
                    onClick={() => {
                      router.push("/profile#ai-processing");
                      props.onClose();
                    }}
                    className="relative w-32 h-32 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer"
                    style={{
                      background: "linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)",
                      boxShadow: "0 6px 16px rgba(107, 114, 128, 0.3)",
                    }}
                  >
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <Mic className="w-10 h-10 text-white/60" />
                      <span className="text-sm font-semibold text-white/60">Disabled</span>
                    </div>
                  </button>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-[280px]">
                <div className="space-y-2">
                  <p className="font-semibold">Recording is disabled</p>
                  <p className="text-sm text-muted-foreground">
                    Enable Whisper Storyteller in Settings to use voice recording and transcription.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-2"
                    onClick={() => {
                      router.push("/profile#ai-processing");
                      props.onClose();
                    }}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Go to Settings
                  </Button>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          // Normal AI Enabled State
          <VoiceRecordingButton
            isRecording={props.isRecording}
            isPaused={props.isPaused}
            recordingTime={props.recordingTime}
            onStart={props.startRecording}
            audioRecorderRef={props.audioRecorderRef}
          />
        )}
        {!props.isRecording && (
          <div className="text-sm text-gray-500 flex items-center gap-1.5">
            {!props.isAIEnabled && !props.isAILoading ? (
              <>
                <Settings className="w-4 h-4" />
                <span>Enable Whisper Storyteller in Settings</span>
              </>
            ) : (
              <>
                <span className="text-base">🔒</span>
                <span>Safe & Private</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Recording Controls - Only show when recording */}
      {props.isRecording && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-4 justify-center"
        >
          <Button
            variant="outline"
            onClick={props.isPaused ? props.resumeRecording : props.pauseRecording}
            className="flex-1 max-w-[140px] min-h-[44px]"
          >
            {props.isPaused ? (
              <>
                <Play className="w-4 h-4 mr-2" />
                Resume
              </>
            ) : (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </>
            )}
          </Button>

          <Button
            onClick={props.stopRecording}
            className="flex-1 max-w-[180px] min-h-[44px]"
            style={{
              background: designSystem.colors.gradients.coral,
              color: "white",
            }}
          >
            <Square className="w-4 h-4 mr-2" />
            Stop & Transcribe
          </Button>
        </motion.div>
      )}

      {/* Contextual Follow-up Button - Show when paused >30s */}
      {props.showFollowUpButton && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center"
        >
          <Button
            variant="ghost"
            onClick={props.handleGetFollowUpQuestion}
            disabled={props.isGeneratingFollowUp}
            className="text-base text-primary hover:bg-primary/10"
          >
            {props.isGeneratingFollowUp ? (
              <>
                <div className="w-5 h-5 mr-2 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Getting your personalized question...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Need help? Get a follow-up question
              </>
            )}
          </Button>
        </motion.div>
      )}

      {/* Bottom Section: Tips (follow-up questions now in top card) */}
      {!props.isRecording && props.followUpQuestions.length === 0 && (
        // Tips section when not recording and no follow-up questions
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700 text-base">
            Tips for a great recording:
          </h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-coral-500 mt-0.5">•</span>
              <span>Speak naturally, as if telling a friend</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-coral-500 mt-0.5">•</span>
              <span>Don't worry about perfect grammar</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-coral-500 mt-0.5">•</span>
              <span>Include details that make the story come alive</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-coral-500 mt-0.5">•</span>
              <span>We'll ask follow-up questions if you pause</span>
            </li>
          </ul>
        </div>
      )}
      </motion.div>
    </AmbientSpotlight>
  );
}
