"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";

interface Step3_ReviewProps {
  originalTranscript: string;
  enhancedTranscript: string;
  useEnhanced: boolean;
  onOriginalChange: (original: string) => void;
  onEnhancedChange: (enhanced: string) => void;
  onUseEnhancedChange: (use: boolean) => void;
  isConversationMode?: boolean;
  isLoading?: boolean;
}

/**
 * Step 3: Review Transcript
 *
 * - Choose between original and enhanced transcript
 * - View original transcript (read-only, collapsible)
 * - Edit enhanced transcript
 */
export function Step3_Review({
  originalTranscript,
  enhancedTranscript,
  useEnhanced,
  onOriginalChange,
  onEnhancedChange,
  onUseEnhancedChange,
  isConversationMode = false,
  isLoading = false,
}: Step3_ReviewProps) {
  const [showOriginal, setShowOriginal] = useState(false);

  return (
    <div className="space-y-7">
      {/* Header */}
      <div>
        <h3 className="text-xl font-semibold mb-3">Review your transcript</h3>
        <p className="text-gray-700 text-base leading-relaxed">
          {isConversationMode
            ? "We've transformed your interview answers into a flowing story while preserving your exact words and voice. You can use this version or the original Q&A format."
            : "We've cleaned up self-corrections, removed duplicates, and added punctuation while keeping your exact voice and personality. You can use this enhanced version or the original."}
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="border-2 border-blue-200 bg-blue-50 rounded-lg p-8 flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
          <h4 className="text-lg font-semibold text-blue-900 mb-2">Transcribing your story...</h4>
          <p className="text-sm text-blue-700 text-center max-w-md">
            This usually takes 10-30 seconds. Feel free to go back and add photos while you wait!
          </p>
        </div>
      )}

      {/* Transcript Content - only show when not loading */}
      {!isLoading && (
        <>

      {/* Version Selection */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold text-gray-800">Which version would you like to use?</Label>
        <RadioGroup
          value={useEnhanced ? "enhanced" : "original"}
          onValueChange={(value) => onUseEnhancedChange(value === "enhanced")}
          className="flex flex-col items-start gap-4"
        >
          <div className="flex items-center gap-3">
            <RadioGroupItem
              value="enhanced"
              id="enhanced"
              className="h-5 w-5 border-2 border-gray-500 rounded-full data-[state=checked]:bg-gray-800 data-[state=checked]:border-gray-800 data-[state=checked]:after:bg-transparent transition"
            />
            <Label
              htmlFor="enhanced"
              className="font-medium cursor-pointer text-left text-base leading-relaxed max-w-2xl"
            >
              {isConversationMode
                ? "✓ Use our recommended edits – your answers woven into a first-person story"
                : "✓ Use our recommended edits – duplicates removed, punctuation added, easier to read"}
            </Label>
          </div>
          <div className="flex items-center gap-3">
            <RadioGroupItem
              value="original"
              id="original"
              className="h-5 w-5 border-2 border-gray-500 rounded-full data-[state=checked]:bg-gray-800 data-[state=checked]:border-gray-800 data-[state=checked]:after:bg-transparent transition"
            />
            <Label
              htmlFor="original"
              className="font-medium cursor-pointer text-left text-base leading-relaxed max-w-2xl"
            >
              {isConversationMode
                ? "○ Original transcript – your responses exactly as spoken"
                : "○ Original transcript – your exact words as transcribed"}
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Active Transcript Editor - shows which one is selected */}
      <div className="space-y-2">
        <Label htmlFor="active-transcript" className="text-lg font-semibold text-gray-800">
          {useEnhanced ? "Recommended edits (editable)" : "Original transcript (editable)"}
        </Label>
        <Textarea
          id="active-transcript"
          value={useEnhanced ? enhancedTranscript : originalTranscript}
          onChange={(e) =>
            useEnhanced ? onEnhancedChange(e.target.value) : onOriginalChange(e.target.value)
          }
          className="min-h-[300px] text-base leading-relaxed"
          placeholder="Loading transcript..."
        />
        <p className="text-sm text-gray-600">
          This is the version that will be saved to your story. Feel free to make any edits.
        </p>
      </div>

      {/* Alternate Version Preview (Collapsible) */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setShowOriginal(!showOriginal)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <span className="text-base font-medium text-gray-700">
            {useEnhanced
              ? "Preview original transcript"
              : "Preview recommended edits"}
          </span>
          {showOriginal ? (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-500" />
          )}
        </button>

        {showOriginal && (
          <div className="p-4 bg-white border-t border-gray-200">
            <Textarea
              value={useEnhanced ? originalTranscript : enhancedTranscript}
              onChange={(e) =>
                useEnhanced ? onOriginalChange(e.target.value) : onEnhancedChange(e.target.value)
              }
              className="min-h-[200px] text-base leading-relaxed"
              placeholder="Loading alternate version..."
            />
            <p className="text-sm text-gray-600 mt-2">
              These edits only apply if you select this version above.
            </p>
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-base text-blue-900">
          <strong>Tip:</strong> The enhanced version improves grammar and flow while keeping your
          original meaning. You can edit it further or switch to the original at any time.
        </p>
      </div>
      </>
      )}
    </div>
  );
}
