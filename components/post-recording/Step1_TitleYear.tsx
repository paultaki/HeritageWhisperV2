"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useRef } from "react";

interface Step1_TitleYearProps {
  title: string;
  year?: number;
  userBirthYear?: number;
  onTitleChange: (title: string) => void;
  onYearChange: (year: number | undefined) => void;
}

/**
 * Step 1: Title & Year
 *
 * - Title input (required)
 * - Year input (optional, 1900-current year)
 * - Shows age calculation if userBirthYear is provided
 */
export function Step1_TitleYear({
  title,
  year,
  userBirthYear,
  onTitleChange,
  onYearChange,
}: Step1_TitleYearProps) {
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus title input when step mounts
  useEffect(() => {
    titleInputRef.current?.focus();
  }, []);

  const currentYear = new Date().getFullYear();
  const minYear = 1900;

  // Calculate age for given year
  const calculateAge = (storyYear: number) => {
    if (!userBirthYear) return null;
    return storyYear - userBirthYear;
  };

  const age = year ? calculateAge(year) : null;

  const handleYearChange = (value: string) => {
    if (value === "") {
      onYearChange(undefined);
      return;
    }

    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) return;

    // Allow any input, will validate on save
    onYearChange(numValue);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium mb-2">Let's give your story a title</h3>
        <p className="text-gray-600 text-sm">
          Choose a memorable title and optionally add the year this story took place.
        </p>
      </div>

      {/* Title Input */}
      <div className="space-y-2">
        <Label htmlFor="story-title" className="text-base font-medium">
          Story Title <span className="text-red-500">*</span>
        </Label>
        <Input
          id="story-title"
          ref={titleInputRef}
          type="text"
          placeholder="e.g., My First Day at School"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="text-lg"
          maxLength={100}
        />
        {title.length > 0 && (
          <p className="text-xs text-gray-500">
            {title.length} / 100 characters
          </p>
        )}
      </div>

      {/* Year Input */}
      <div className="space-y-2">
        <Label htmlFor="story-year" className="text-base font-medium">
          Year (Optional)
        </Label>
        <div className="flex items-start gap-4">
          <div className="flex-1 space-y-1">
            <Input
              id="story-year"
              type="number"
              placeholder={`${minYear} - ${currentYear}`}
              value={year || ""}
              onChange={(e) => handleYearChange(e.target.value)}
              min={minYear}
              max={currentYear}
              className="text-lg"
            />
            <p className="text-xs text-gray-500">
              Enter a year between {minYear} and {currentYear}
            </p>
          </div>

          {/* Age Display */}
          {age !== null && (
            <div className="flex-shrink-0 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-gray-600">
                {age > 0 ? `Age ${age}` : age === 0 ? "Birth" : "Before birth"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Help Text */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> You can add photos and edit your transcript in the next steps.
        </p>
      </div>
    </div>
  );
}
