"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { MessageCircle, Mic } from "lucide-react";

interface ModeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectQuickStory: () => void;
  promptQuestion?: string; // Optional prompt question from prompts page
}

/**
 * Mode Selection Modal
 *
 * Presents users with two recording options:
 * 1. Conversation Mode - Guided interview with follow-up questions
 * 2. Quick Story - Simple 2-5 minute recording
 */
export function ModeSelectionModal({
  isOpen,
  onClose,
  onSelectQuickStory,
  promptQuestion,
}: ModeSelectionModalProps) {
  const router = useRouter();

  const handleConversationMode = () => {
    onClose();
    // Navigate to interview-chat (Pearl with Realtime API)
    // Pass prompt question if provided
    if (promptQuestion) {
      router.push(`/interview-chat?prompt=${encodeURIComponent(promptQuestion)}`);
    } else {
      router.push("/interview-chat");
    }
  };

  const handleQuickStory = () => {
    onClose();
    onSelectQuickStory();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-center mb-2">
            How would you like to record?
          </DialogTitle>
          <p className="text-center text-gray-600">
            Choose the recording style that feels right for your story
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Conversation Mode Card */}
          <button
            onClick={handleConversationMode}
            className="group relative p-8 border-2 border-gray-200 rounded-xl hover:border-amber-500 hover:shadow-lg transition-all duration-200 text-left focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
          >
            <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-amber-100 to-rose-100 group-hover:from-amber-200 group-hover:to-rose-200 transition-all">
              <MessageCircle className="w-8 h-8 text-amber-700" />
            </div>

            <h3 className="text-xl font-semibold mb-2 text-gray-800">
              Conversation Mode
            </h3>

            <p className="text-gray-600 mb-4 leading-relaxed">
              A guided interview with thoughtful follow-up questions to help you
              share a deeper story
            </p>

            <ul className="space-y-2 text-sm text-gray-500">
              <li className="flex items-start gap-2">
                <span className="text-amber-600 mt-0.5">•</span>
                <span>Perfect for exploring memories in depth</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 mt-0.5">•</span>
                <span>AI asks natural follow-up questions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 mt-0.5">•</span>
                <span>Takes about 10-15 minutes</span>
              </li>
            </ul>
          </button>

          {/* Quick Story Card */}
          <button
            onClick={handleQuickStory}
            className="group relative p-8 border-2 border-gray-200 rounded-xl hover:border-amber-500 hover:shadow-lg transition-all duration-200 text-left focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
          >
            <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 group-hover:from-blue-200 group-hover:to-purple-200 transition-all">
              <Mic className="w-8 h-8 text-blue-700" />
            </div>

            <h3 className="text-xl font-semibold mb-2 text-gray-800">
              Quick Story
            </h3>

            <p className="text-gray-600 mb-4 leading-relaxed">
              Record a 2-5 minute story in one take with pause/resume controls
            </p>

            <ul className="space-y-2 text-sm text-gray-500">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Great for capturing memories on the fly</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Simple 3-2-1 countdown to start</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Takes about 5 minutes total</span>
              </li>
            </ul>
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          You can use both modes for different types of stories
        </div>
      </DialogContent>
    </Dialog>
  );
}
