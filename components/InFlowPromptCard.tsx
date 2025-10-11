"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, ArrowRight } from "lucide-react";

interface InFlowPromptCardProps {
  prompt: string;
  isVisible: boolean;
  onAnswer: () => void;
  onKeepTalking: () => void;
  onDismiss?: () => void;
  autoDismissDelay?: number; // Time to wait before auto-dismissing (in ms)
}

export function InFlowPromptCard({
  prompt,
  isVisible,
  onAnswer,
  onKeepTalking,
  onDismiss,
  autoDismissDelay = 500,
}: InFlowPromptCardProps) {
  const [shouldShow, setShouldShow] = useState(isVisible);

  useEffect(() => {
    setShouldShow(isVisible);
  }, [isVisible]);

  // Auto-dismiss if speech is detected quickly
  useEffect(() => {
    if (isVisible && autoDismissDelay && onDismiss) {
      const timer = setTimeout(() => {
        onDismiss();
      }, autoDismissDelay);

      return () => clearTimeout(timer);
    }
  }, [isVisible, autoDismissDelay, onDismiss]);

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{
            type: "spring",
            damping: 25,
            stiffness: 300,
            duration: 0.3,
          }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-8"
        >
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-amber-50 to-rose-50 dark:from-amber-900/20 dark:to-rose-900/20 border-amber-200 dark:border-amber-800 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Going Deeper...
                  </h3>
                  <p className="text-lg font-medium text-foreground mb-4">
                    {prompt}
                  </p>

                  <div className="flex gap-3">
                    <Button
                      onClick={onAnswer}
                      className="flex-1 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white"
                      data-testid="button-answer-prompt"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Answer this
                    </Button>

                    <Button
                      onClick={onKeepTalking}
                      variant="outline"
                      className="flex-1 border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                      data-testid="button-keep-talking"
                    >
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Keep talking
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
