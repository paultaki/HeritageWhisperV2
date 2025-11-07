"use client";

import { useState, useEffect } from "react";
import { Calendar, BookOpen, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type VisibilityModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: { onTimeline: boolean; inBook: boolean }) => void;
  story: {
    title: string;
    onTimeline: boolean;
    inBook: boolean;
  };
};

/**
 * VisibilityModal - Manage Timeline and Book visibility
 *
 * Design principles:
 * - Clean modal with story title at top
 * - Two toggle switches with clear labels and icons
 * - Helper text explains privacy implications
 * - Cancel doesn't save changes
 * - Save button disabled if no changes
 *
 * UX notes:
 * - Changes are not saved until user clicks Save
 * - Closing via X or Cancel discards changes
 * - Helper text updates based on toggle state
 */
export function VisibilityModal({
  isOpen,
  onClose,
  onSave,
  story,
}: VisibilityModalProps) {
  const [onTimeline, setOnTimeline] = useState(story.onTimeline);
  const [inBook, setInBook] = useState(story.inBook);

  // Reset state when story changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setOnTimeline(story.onTimeline);
      setInBook(story.inBook);
    }
  }, [isOpen, story.onTimeline, story.inBook]);

  const hasChanges =
    onTimeline !== story.onTimeline || inBook !== story.inBook;
  const isPrivate = !onTimeline && !inBook;

  const handleSave = () => {
    if (hasChanges) {
      onSave({ onTimeline, inBook });
    }
    onClose();
  };

  const handleCancel = () => {
    // Reset to original values
    setOnTimeline(story.onTimeline);
    setInBook(story.inBook);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Manage Visibility
          </DialogTitle>
          <DialogDescription className="text-base text-gray-700 mt-2">
            {story.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Timeline Toggle */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <Calendar className="w-5 h-5 text-purple-600 mt-0.5" />
              <div className="flex-1">
                <Label
                  htmlFor="timeline-toggle"
                  className="text-base font-medium cursor-pointer"
                >
                  Show in Timeline
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Display this memory in your chronological timeline
                </p>
              </div>
            </div>
            <Switch
              id="timeline-toggle"
              checked={onTimeline}
              onCheckedChange={setOnTimeline}
              className="shrink-0"
            />
          </div>

          {/* Book Toggle */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <BookOpen className="w-5 h-5 text-pink-600 mt-0.5" />
              <div className="flex-1">
                <Label
                  htmlFor="book-toggle"
                  className="text-base font-medium cursor-pointer"
                >
                  Show in Book
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Include this memory in your printed book
                </p>
              </div>
            </div>
            <Switch
              id="book-toggle"
              checked={inBook}
              onCheckedChange={setInBook}
              className="shrink-0"
            />
          </div>

          {/* Privacy Helper Text */}
          <div
            className={`flex items-start gap-2 p-3 rounded-lg transition-colors ${
              isPrivate
                ? "bg-red-50 border border-red-200"
                : "bg-blue-50 border border-blue-200"
            }`}
          >
            <Info
              className={`w-5 h-5 shrink-0 mt-0.5 ${
                isPrivate ? "text-red-600" : "text-blue-600"
              }`}
            />
            <p className={`text-sm ${isPrivate ? "text-red-900" : "text-blue-900"}`}>
              {isPrivate
                ? "This memory is private and only visible to you in the Memory Box."
                : "This memory is visible in the selected locations."}
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            className="flex-1 sm:flex-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges}
            className="flex-1 sm:flex-1 bg-blue-600 hover:bg-blue-700"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
