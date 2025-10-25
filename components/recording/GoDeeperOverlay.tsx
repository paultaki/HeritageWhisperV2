"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import designSystem from "@/lib/designSystem";

/**
 * Go Deeper Overlay Component
 *
 * Modal overlay that shows AI-generated follow-up questions
 * to help users expand on their stories.
 *
 * Features:
 * - Question carousel with navigation
 * - Dot indicators for question position
 * - Skip or Continue recording options
 *
 * Extracted from RecordModal.tsx lines 1535-1645
 * Size: ~150 lines
 */

export interface GoDeeperOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  goDeeperQuestions: string[];
  currentQuestionIndex: number;
  setCurrentQuestionIndex: (index: number) => void;
  handleContinue: () => void;
}

export function GoDeeperOverlay({
  isOpen,
  onClose,
  goDeeperQuestions,
  currentQuestionIndex,
  setCurrentQuestionIndex,
  handleContinue,
}: GoDeeperOverlayProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ background: "rgba(0, 0, 0, 0.7)" }}
        >
          <motion.div
            className="w-full max-w-md bg-white rounded-2xl p-6 space-y-4"
            style={{
              background: designSystem.colors.background.creamLight,
            }}
          >
            <div className="text-center">
              <h3
                className="text-xl font-bold mb-2"
                style={{
                  fontFamily: designSystem.typography.fontFamilies.serif,
                }}
              >
                Maybe go deeper here?
              </h3>
            </div>

            <Card
              className="p-4"
              style={{
                background: `linear-gradient(135deg, ${designSystem.colors.primary.coralLight} 0%, white 100%)`,
              }}
            >
              <p className="text-lg italic text-gray-700">
                &ldquo;{goDeeperQuestions[currentQuestionIndex]}
                &rdquo;
              </p>
            </Card>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() =>
                  setCurrentQuestionIndex(
                    Math.max(0, currentQuestionIndex - 1),
                  )
                }
                disabled={currentQuestionIndex === 0}
                className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                aria-label="Previous question"
              >
                <ChevronRight className="w-5 h-5 rotate-180 text-gray-600" />
              </button>

              <div className="flex items-center gap-2">
                {goDeeperQuestions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      index === currentQuestionIndex
                        ? "bg-coral-500 scale-125"
                        : "bg-gray-300 hover:bg-gray-400"
                    }`}
                    aria-label={`Question ${index + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={() =>
                  setCurrentQuestionIndex(
                    Math.min(
                      goDeeperQuestions.length - 1,
                      currentQuestionIndex + 1,
                    ),
                  )
                }
                disabled={
                  currentQuestionIndex ===
                  goDeeperQuestions.length - 1
                }
                className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                aria-label="Next question"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Skip
              </Button>
              <Button
                onClick={handleContinue}
                className="flex-1"
                style={{
                  background: designSystem.colors.primary.coral,
                  color: "white",
                }}
              >
                Continue Recording
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
