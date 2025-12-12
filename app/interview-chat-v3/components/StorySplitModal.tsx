import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Scissors, Check, FileAudio } from "lucide-react";

interface DetectedStory {
  title: string;
  summary: string;
  bridged_text: string;
  start_index: number;
  end_index: number;
}

interface StorySplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  stories: DetectedStory[];
  onConfirmSplit: () => void;
  onKeepOne: () => void;
  isProcessing: boolean;
}

export function StorySplitModal({
  isOpen,
  onClose,
  stories,
  onConfirmSplit,
  onKeepOne,
  isProcessing
}: StorySplitModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isProcessing && !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-[#fffdf5] border-amber-100">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif text-amber-900">
            We found {stories.length} stories!
          </DialogTitle>
          <DialogDescription className="text-amber-900/60">
            Your conversation covered a few different topics. Would you like to save them as separate memories?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-3">
          {stories.map((story, index) => (
            <div
              key={index}
              className="p-4 rounded-xl bg-white border border-amber-100 shadow-sm flex gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm flex-shrink-0">
                {index + 1}
              </div>
              <div>
                <h4 className="font-medium text-amber-900">{story.title}</h4>
                <p className="text-sm text-amber-900/60 line-clamp-2">{story.summary}</p>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onKeepOne}
            disabled={isProcessing}
            className="w-full sm:w-auto border-amber-200 text-amber-800 hover:bg-amber-50"
          >
            Keep as One Big Story
          </Button>
          <Button
            onClick={onConfirmSplit}
            disabled={isProcessing}
            className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Splitting Audio...
              </>
            ) : (
              <>
                <Scissors className="w-4 h-4 mr-2" />
                Split into {stories.length} Stories
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
