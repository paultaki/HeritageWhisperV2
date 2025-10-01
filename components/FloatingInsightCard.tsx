"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X, MessageCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface FloatingInsightCardProps {
  followUp: {
    id?: string;
    text?: string;
    title?: string;
    icon?: React.ReactNode;
  } | string;
  onAnswer?: () => void;
  storyId?: string;
}

export default function FloatingInsightCard({
  followUp,
  onAnswer,
  storyId = 'default'
}: FloatingInsightCardProps) {
  const isMobile = useIsMobile();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const normalizedFollowUp = typeof followUp === 'string'
    ? { text: followUp }
    : followUp;

  const questionText = normalizedFollowUp.text || normalizedFollowUp.title || '';

  const storageKey = `floating-insight-dismissed-${storyId}`;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const wasDismissed = sessionStorage.getItem(storageKey) === 'true';
      if (wasDismissed) {
        setIsDismissed(true);
      }
    }
  }, [storageKey]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sessionKey = 'book-visit-shown';
      const hasShownThisSession = sessionStorage.getItem(sessionKey);

      if (hasShownThisSession) {
        setHasTriggered(true);
        setIsDismissed(true);
      }
    }
  }, []);

  useEffect(() => {
    if (!questionText || hasTriggered || isDismissed) return;

    let timeoutId: NodeJS.Timeout;

    const showCard = () => {
      if (!hasTriggered && !isDismissed) {
        setHasTriggered(true);
        setIsVisible(true);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('book-visit-shown', 'true');
        }
      }
    };

    const startPauseTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(showCard, 5000);
    };

    const resetPauseTimer = () => {
      clearTimeout(timeoutId);
      startPauseTimer();
    };

    const activityEvents = ['mousemove', 'click', 'scroll', 'keydown', 'touchstart'];

    startPauseTimer();

    activityEvents.forEach(event => {
      window.addEventListener(event, resetPauseTimer);
    });

    return () => {
      clearTimeout(timeoutId);
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetPauseTimer);
      });
    };
  }, [questionText, hasTriggered, isDismissed]);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(storageKey, 'true');
    }
  };

  const handleRecall = () => {
    setIsVisible(true);
    setIsDismissed(false);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(storageKey);
    }
  };

  const handleAnswerThis = () => {
    if (onAnswer) {
      onAnswer();
    }
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (isMobile) {
      if (info.offset.y > 100) {
        handleDismiss();
      }
    }
  };

  if (!questionText) return null;

  const desktopVariants = {
    hidden: { x: 400, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.2, ease: 'easeOut' }
    },
    exit: {
      x: 400,
      opacity: 0,
      transition: { duration: 0.2, ease: 'easeIn' }
    }
  };

  const mobileVariants = {
    hidden: { y: '100%', opacity: 0, scale: 1 },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: { duration: 0.2, ease: 'easeOut' }
    },
    exit: {
      y: '100%',
      opacity: 0,
      scale: 0.8,
      transition: { duration: 0.15, ease: 'easeIn' }
    }
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {isVisible && !isDismissed && (
          <motion.div
            ref={cardRef}
            className={`fixed bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl rounded-lg p-5 z-[45] overflow-hidden ${
              isMobile
                ? 'bottom-20 left-4 right-4 min-h-[25vh] max-h-[40vh] rounded-2xl'
                : 'right-4 bottom-20 w-[320px]'
            }`}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={isMobile ? mobileVariants : desktopVariants}
            drag={isMobile ? 'y' : false}
            dragConstraints={isMobile ? { top: 0, bottom: 300 } : undefined}
            dragElastic={0.3}
            onDragEnd={handleDragEnd}
            role="dialog"
            aria-label="Follow-up question"
            aria-describedby="insight-card-content"
          >
            {isMobile && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full" />
            )}

            <button
              onClick={handleDismiss}
              className={`absolute ${isMobile ? 'top-2 right-2 p-2' : 'top-3 right-3 p-1'} rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors bg-gray-50 dark:bg-gray-800`}
              aria-label="Close insight card"
            >
              <X className={`${isMobile ? 'w-6 h-6' : 'w-4 h-4'} text-gray-600 dark:text-gray-400`} />
            </button>

            <div className="flex flex-col h-full">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="font-semibold text-lg">Go Deeper</h3>
              </div>

              <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                HW Personalized Story Prompt:
              </div>

              <div className="flex-1 overflow-y-auto mb-4" id="insight-card-content">
                <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                  {questionText}
                </p>
              </div>

              <div className="mt-auto">
                <Button
                  onClick={handleAnswerThis}
                  className="w-full"
                  size="default"
                >
                  Answer This
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {isDismissed && !isVisible && (
          <motion.button
            className={`fixed bg-primary text-white rounded-full shadow-lg z-[44] hover:scale-110 transition-transform ${
              isMobile
                ? 'bottom-28 right-4 w-14 h-14 flex items-center justify-center'
                : 'bottom-24 right-4 w-12 h-12 flex items-center justify-center'
            }`}
            style={{ left: 'auto' }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRecall}
            aria-label="Show follow-up questions"
          >
            <MessageCircle className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5'}`} />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
