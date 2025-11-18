"use client";

import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type StarterMemoryTemplate } from "@/lib/starterTemplates";

type Props = {
  template: StarterMemoryTemplate;
  onStart: (template: StarterMemoryTemplate) => void;
};

/**
 * StarterMemoryCard - Premium ghost-style template card
 *
 * Appears in empty timeline state to guide new users.
 * Matches existing timeline card design with subtle "ghost" styling.
 */
export function StarterMemoryCard({ template, onStart }: Props) {
  return (
    <div
      className="border-[1.5px] border-dashed opacity-80
                 rounded-2xl bg-stone-50 hover:opacity-100 hover:shadow-lg
                 transition-all duration-200 cursor-pointer max-w-md w-full
                 hover:scale-[1.02] transform"
      style={{ borderColor: 'var(--color-border-card)' }}
      onClick={() => onStart(template)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onStart(template);
        }
      }}
      aria-label={`Start recording: ${template.title}`}
    >
      {/* Image Placeholder - 16:10 aspect ratio to match real cards */}
      <div className="aspect-[16/10] bg-gradient-to-br from-stone-100 to-stone-200
                      rounded-t-2xl flex flex-col items-center justify-center
                      border-b border-stone-200">
        <Camera className="w-16 h-16 text-stone-300 mb-2" strokeWidth={1.5} />
        <p className="text-sm text-stone-400 px-4 text-center">
          {template.placeholderText}
        </p>
      </div>

      {/* Content - matches existing card padding and typography */}
      <div className="px-4 py-3 space-y-2">
        {/* Title - matches TimelineCardV2.tsx style */}
        <h3 className="text-[19px] tracking-tight font-semibold text-stone-800">
          {template.title}
        </h3>

        {/* Subtitle - matches card metadata style */}
        <p className="text-[15px] text-stone-500 leading-relaxed">
          {template.subtitle}
        </p>

        {/* Micro-prompts - guiding questions */}
        <div className="text-sm italic text-stone-400 space-y-1 pt-1">
          {template.microPrompts.map((prompt, i) => (
            <p key={i} className="leading-snug">
              {prompt}
            </p>
          ))}
        </div>

        {/* Button - matches existing "Create First Memory" button */}
        <Button
          className="w-full bg-orange-500 hover:bg-orange-600 mt-4"
          size="lg"
          onClick={(e) => {
            e.stopPropagation();
            onStart(template);
          }}
        >
          {template.buttonLabel}
        </Button>

        {/* Helper text - reassures users they can skip photo */}
        <p className="text-xs text-center text-stone-400 mt-2 leading-relaxed">
          {template.helperText}
        </p>
      </div>
    </div>
  );
}
