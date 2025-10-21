"use client";

import { Button } from "@/components/ui/button";
import { BookOpen, Layers } from "lucide-react";

interface Story {
  title: string;
  topic: string;
  messageIds: string[];
}

interface StorySplitModalProps {
  stories: Story[];
  onKeepTogether: () => void;
  onSplit: () => void;
}

export function StorySplitModal({ stories, onKeepTogether, onSplit }: StorySplitModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6">
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 animate-in fade-in slide-in-from-bottom-4 duration-300"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 mx-auto mb-4 flex items-center justify-center">
            <Layers className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            I noticed you've covered multiple topics
          </h2>
          <p className="text-gray-600">
            Would you like to save these as separate stories?
          </p>
        </div>

        {/* Story previews */}
        <div className="space-y-4 mb-8">
          {stories.map((story, index) => (
            <div
              key={index}
              className="p-5 rounded-xl border-2 border-gray-200 bg-gray-50 hover:border-amber-400 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-rose-500 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-lg mb-1">
                    {story.title}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {story.topic}
                  </p>
                </div>
                <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full border border-gray-200">
                  Story {index + 1}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Info box */}
        <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 mb-6">
          <p className="text-sm text-blue-800">
            💡 <strong>You can always edit titles and add photos later.</strong> Splitting stories now helps organize your memories by theme.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <Button
            onClick={onKeepTogether}
            variant="outline"
            className="flex-1 h-12 text-base border-2"
          >
            Keep Together
          </Button>
          <Button
            onClick={onSplit}
            className="flex-1 h-12 text-base bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white"
          >
            Split into {stories.length} Stories
          </Button>
        </div>

        {/* Helper text */}
        <p className="text-center text-xs text-gray-500 mt-4">
          You'll continue the interview after making your choice
        </p>
      </div>
    </div>
  );
}
