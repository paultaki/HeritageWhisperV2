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
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="enhanced" id="enhanced" />
            <Label htmlFor="enhanced" className="font-normal cursor-pointer">
              Enhanced (recommended) - Polished for readability with grammar and flow improvements
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="original" id="original" />
            <Label htmlFor="original" className="font-normal cursor-pointer">
              Original - Your exact words as transcribed
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Enhanced Transcript Editor */}
      <div className="space-y-2">
        <Label htmlFor="enhanced-transcript" className="text-base font-medium">
          {useEnhanced ? "Enhanced Transcript (Editable)" : "Enhanced Transcript (Preview)"}
        </Label>
        <Textarea
          id="enhanced-transcript"
          value={enhancedTranscript}
          onChange={(e) => onEnhancedChange(e.target.value)}
          className="min-h-[300px] text-base leading-relaxed"
          placeholder="Loading enhanced transcript..."
          disabled={!useEnhanced}
        />
        <p className="text-xs text-gray-500">
          {useEnhanced
            ? "Feel free to edit this version - it will be saved to your story"
            : "Switch to 'Enhanced' above to edit this version"}
        </p>
      </div>

      {/* Original Transcript (Collapsible) */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setShowOriginal(!showOriginal)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <span className="text-sm font-medium text-gray-700">
            View Original Transcript (Read-only)
          </span>
          {showOriginal ? (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-500" />
          )}
        </button>

        {showOriginal && (
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
                {originalTranscript}
              </pre>
            </div>
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
