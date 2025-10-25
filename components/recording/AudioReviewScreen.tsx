"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronRight, RotateCcw, Volume2 } from "lucide-react";
import designSystem from "@/lib/designSystem";

/**
 * Audio Review Screen Component
 *
 * Displays the audio review screen after recording stops.
 * User can listen to their recording and choose to either:
 * - Continue to add details (transcribes in background)
 * - Re-record the story
 *
 * Extracted from RecordModal.tsx lines 1043-1129
 * Size: ~150 lines
 */

export interface AudioReviewScreenProps {
  reviewAudioUrl: string;
  reviewDuration: number;
  handleContinueFromReview: () => void;
  handleReRecord: () => void;
  formatTime: (seconds: number) => string;
}

export function AudioReviewScreen({
  reviewAudioUrl,
  reviewDuration,
  handleContinueFromReview,
  handleReRecord,
  formatTime,
}: AudioReviewScreenProps) {
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
          Review Your Recording
        </h3>
        <p className="text-gray-600">
          Listen to your recording before continuing
        </p>
      </div>

      {/* Audio Playback */}
      <Card className="p-6 bg-gradient-to-br from-orange-50 to-pink-50 border-2 border-orange-200">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center">
                <Volume2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Your Story</p>
                <p className="text-sm text-gray-600">{formatTime(reviewDuration)}</p>
              </div>
            </div>
          </div>

          {/* Audio player */}
          <audio
            controls
            src={reviewAudioUrl}
            className="w-full"
            style={{
              borderRadius: "8px",
              outline: "none",
            }}
          />

          <p className="text-sm text-gray-600 text-center">
            Listen carefully - you can re-record if needed
          </p>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        <Button
          onClick={handleContinueFromReview}
          size="lg"
          className="w-full text-lg py-6"
          style={{
            background: designSystem.colors.gradients.coral,
            color: "white",
          }}
        >
          Continue to Add Details
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>

        <Button
          onClick={handleReRecord}
          variant="outline"
          size="lg"
          className="w-full text-lg py-6"
        >
          <RotateCcw className="w-5 h-5 mr-2" />
          Re-record
        </Button>
      </div>

      {/* Helpful tip */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-900">
          <strong>💡 Tip:</strong> While you're adding your title, date, and photos on the next screens, we'll be transcribing your audio in the background!
        </p>
      </div>
    </motion.div>
  );
}
