"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ChevronDown, ChevronRight } from "lucide-react";

interface Step3_ReviewProps {
  originalTranscript: string;
  enhancedTranscript: string;
  useEnhanced: boolean;
  onOriginalChange: (original: string) => void;
  onEnhancedChange: (enhanced: string) => void;
  onUseEnhancedChange: (use: boolean) => void;
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
}: Step3_ReviewProps) {
  const [showOriginal, setShowOriginal] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium mb-2">Review your transcript</h3>
        <p className="text-gray-600 text-sm">
          We've enhanced your transcript for readability. You can use the enhanced version or the
          original.
        </p>
      </div>

      {/* Version Selection */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Which version would you like to use?</Label>
        <RadioGroup
          value={useEnhanced ? "enhanced" : "original"}
          onValueChange={(value) => onUseEnhancedChange(value === "enhanced")}
          className="space-y-3"
        >
          <div className="flex items-start space-x-3">
            <RadioGroupItem value="enhanced" id="enhanced" className="mt-0.5" />
            <Label htmlFor="enhanced" className="font-normal cursor-pointer flex-1 leading-normal">
              Enhanced (recommended) - Polished for readability with grammar and flow improvements
            </Label>
          </div>
          <div className="flex items-start space-x-3">
            <RadioGroupItem value="original" id="original" className="mt-0.5" />
            <Label htmlFor="original" className="font-normal cursor-pointer flex-1 leading-normal">
              Original - Your exact words as transcribed
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Active Transcript Editor - shows which one is selected */}
      <div className="space-y-2">
        <Label htmlFor="active-transcript" className="text-base font-medium">
          {useEnhanced ? "Enhanced Transcript (Editable)" : "Original Transcript (Editable)"}
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
        <p className="text-xs text-gray-500">
          This is the version that will be saved to your story. Feel free to make any edits.
        </p>
      </div>

      {/* Alternate Version Preview (Collapsible) */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setShowOriginal(!showOriginal)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <span className="text-sm font-medium text-gray-700">
            {useEnhanced
              ? "View Original Version (Editable)"
              : "View Enhanced Version (Editable)"}
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
            <p className="text-xs text-gray-500 mt-2">
              You can edit this version too, but it won't be saved unless you select it above.
            </p>
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> The enhanced version improves grammar and flow while keeping your
          original meaning. You can edit it further or switch to the original at any time.
        </p>
      </div>
    </div>
  );
}
