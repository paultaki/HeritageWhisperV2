"use client";

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Lightbulb } from "lucide-react";

interface Step4_LessonProps {
  lessonLearned: string;
  transcript: string;
  onLessonChange: (lesson: string) => void;
}

/**
 * Step 4: Lesson Learned
 *
 * - Optional wisdom/lesson from the story
 * - Displayed as callout in book view
 */
export function Step4_Lesson({
  lessonLearned,
  transcript,
  onLessonChange,
}: Step4_LessonProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
          <Lightbulb className="w-6 h-6 text-amber-700" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-medium mb-2">What did you learn from this experience?</h3>
          <p className="text-gray-600 text-sm">
            Reflect on any wisdom or lessons from this story. This is completely optional but adds
            depth to your memory.
          </p>
        </div>
      </div>

      {/* Lesson Input */}
      <div className="space-y-2">
        <Label htmlFor="lesson-learned" className="text-base font-medium">
          Lesson Learned (Optional)
        </Label>
        <Textarea
          id="lesson-learned"
          value={lessonLearned}
          onChange={(e) => onLessonChange(e.target.value)}
          className="min-h-[150px] text-base leading-relaxed"
          placeholder="Example: I learned that true courage isn't the absence of fear, but choosing to act despite it."
          maxLength={500}
        />
        {lessonLearned.length > 0 && (
          <p className="text-xs text-gray-500">{lessonLearned.length} / 500 characters</p>
        )}
      </div>

      {/* Preview */}
      {lessonLearned.trim() && (
        <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg">
          <p className="text-sm font-medium text-amber-900 mb-1">Preview:</p>
          <p className="text-sm text-amber-800 italic leading-relaxed">
            "{lessonLearned.trim()}"
          </p>
        </div>
      )}

      {/* Help Text */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800 mb-2">
          <strong>This is optional!</strong> You can skip this step and save your story without a
          lesson.
        </p>
        <p className="text-sm text-blue-800">
          If you add one, it will appear as an elegant callout at the end of your story in the book
          view.
        </p>
      </div>

      {/* Examples */}
      <div className="border border-gray-200 rounded-lg p-4">
        <p className="text-sm font-medium text-gray-700 mb-3">Example lessons:</p>
        <div className="space-y-2 text-sm text-gray-600">
          <p className="italic">
            "Family time is more valuable than any possession. Those Sunday dinners together were
            the real treasure."
          </p>
          <p className="italic">
            "Sometimes the scariest decisions lead to the most rewarding chapters of our lives."
          </p>
          <p className="italic">
            "Hard work and perseverance can overcome almost any obstacle, but knowing when to ask
            for help is equally important."
          </p>
        </div>
      </div>
    </div>
  );
}
