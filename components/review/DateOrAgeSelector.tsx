"use client";

import { useState, useEffect } from "react";
import { getLifePhaseFromAge, formatLifePhase } from "@/lib/audioSlicer";

interface DateOrAgeSelectorProps {
  year?: number;
  age?: number;
  lifePhase?: string;
  userBirthYear?: number;
  onChange: (values: {
    storyYear?: number;
    storyAge?: number;
    lifePhase?: string;
  }) => void;
  disabled?: boolean;
}

type DateMode = "year" | "age" | "unknown";

export function DateOrAgeSelector({
  year,
  age,
  lifePhase,
  userBirthYear = 1950,
  onChange,
  disabled = false,
}: DateOrAgeSelectorProps) {
  // Determine initial mode
  const getInitialMode = (): DateMode => {
    if (year) return "year";
    if (age) return "age";
    return "unknown";
  };

  const [mode, setMode] = useState<DateMode>(getInitialMode);
  const [yearInput, setYearInput] = useState(year?.toString() || "");
  const [ageInput, setAgeInput] = useState(age?.toString() || "");
  const [selectedLifePhase, setSelectedLifePhase] = useState(lifePhase || "");

  // Calculate year from age and vice versa
  const calculateYear = (inputAge: number) => userBirthYear + inputAge;
  const calculateAge = (inputYear: number) => inputYear - userBirthYear;

  // Handle mode change
  const handleModeChange = (newMode: DateMode) => {
    if (disabled) return;
    setMode(newMode);

    if (newMode === "unknown") {
      onChange({
        storyYear: undefined,
        storyAge: undefined,
        lifePhase: selectedLifePhase || undefined,
      });
    }
  };

  // Handle year input change
  const handleYearChange = (value: string) => {
    setYearInput(value);
    const yearNum = parseInt(value);
    
    if (yearNum && yearNum >= 1900 && yearNum <= new Date().getFullYear()) {
      const calculatedAge = calculateAge(yearNum);
      setAgeInput(calculatedAge.toString());
      onChange({
        storyYear: yearNum,
        storyAge: calculatedAge,
        lifePhase: getLifePhaseFromAge(calculatedAge),
      });
    }
  };

  // Handle age input change
  const handleAgeChange = (value: string) => {
    setAgeInput(value);
    const ageNum = parseInt(value);
    
    if (ageNum && ageNum >= 0 && ageNum <= 120) {
      const calculatedYear = calculateYear(ageNum);
      setYearInput(calculatedYear.toString());
      onChange({
        storyYear: calculatedYear,
        storyAge: ageNum,
        lifePhase: getLifePhaseFromAge(ageNum),
      });
    }
  };

  // Handle life phase selection
  const handleLifePhaseChange = (phase: string) => {
    if (disabled) return;
    setSelectedLifePhase(phase);
    onChange({
      storyYear: undefined,
      storyAge: undefined,
      lifePhase: phase,
    });
  };

  const lifePhases = [
    "childhood",
    "teen",
    "early_adult",
    "mid_adult",
    "late_adult",
    "senior",
  ];

  return (
    <div className={`space-y-3 ${disabled ? "opacity-50" : ""}`}>
      <label className="block text-sm font-medium text-[var(--hw-text-primary)]">
        When did this happen?
      </label>

      {/* Mode toggle */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleModeChange("year")}
          disabled={disabled}
          className={`
            px-4 py-2 rounded-lg text-sm font-medium transition-colors
            ${disabled ? "cursor-not-allowed" : "cursor-pointer"}
            ${mode === "year"
              ? "bg-[var(--hw-primary)] text-white"
              : "bg-[var(--hw-surface)] border border-[var(--hw-border-subtle)] text-[var(--hw-text-secondary)] hover:bg-[var(--hw-section-bg)]"
            }
          `}
        >
          I know the year
        </button>
        <button
          onClick={() => handleModeChange("age")}
          disabled={disabled}
          className={`
            px-4 py-2 rounded-lg text-sm font-medium transition-colors
            ${disabled ? "cursor-not-allowed" : "cursor-pointer"}
            ${mode === "age"
              ? "bg-[var(--hw-primary)] text-white"
              : "bg-[var(--hw-surface)] border border-[var(--hw-border-subtle)] text-[var(--hw-text-secondary)] hover:bg-[var(--hw-section-bg)]"
            }
          `}
        >
          I know my age
        </button>
        <button
          onClick={() => handleModeChange("unknown")}
          disabled={disabled}
          className={`
            px-4 py-2 rounded-lg text-sm font-medium transition-colors
            ${disabled ? "cursor-not-allowed" : "cursor-pointer"}
            ${mode === "unknown"
              ? "bg-[var(--hw-primary)] text-white"
              : "bg-[var(--hw-surface)] border border-[var(--hw-border-subtle)] text-[var(--hw-text-secondary)] hover:bg-[var(--hw-section-bg)]"
            }
          `}
        >
          I don&apos;t recall
        </button>
      </div>

      {/* Year input */}
      {mode === "year" && (
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={1900}
            max={new Date().getFullYear()}
            value={yearInput}
            onChange={(e) => handleYearChange(e.target.value)}
            disabled={disabled}
            className={`
              w-28 h-12 px-3 py-2 text-center text-lg
              bg-[var(--hw-surface)]
              border border-[var(--hw-border-subtle)] rounded-xl
              text-[var(--hw-text-primary)]
              placeholder:text-[var(--hw-text-muted)]
              focus:border-[var(--hw-primary)]
              focus:ring-2 focus:ring-[var(--hw-primary)] focus:ring-offset-0
              disabled:cursor-not-allowed
              transition-all
            `}
            placeholder="1965"
          />
          {yearInput && parseInt(yearInput) > 1900 && (
            <span className="text-sm text-[var(--hw-text-muted)]">
              (You were about {calculateAge(parseInt(yearInput))} years old)
            </span>
          )}
        </div>
      )}

      {/* Age input */}
      {mode === "age" && (
        <div className="flex items-center gap-3">
          <span className="text-base text-[var(--hw-text-primary)]">I was about</span>
          <input
            type="number"
            min={0}
            max={120}
            value={ageInput}
            onChange={(e) => handleAgeChange(e.target.value)}
            disabled={disabled}
            className={`
              w-20 h-12 px-3 py-2 text-center text-lg
              bg-[var(--hw-surface)]
              border border-[var(--hw-border-subtle)] rounded-xl
              text-[var(--hw-text-primary)]
              placeholder:text-[var(--hw-text-muted)]
              focus:border-[var(--hw-primary)]
              focus:ring-2 focus:ring-[var(--hw-primary)] focus:ring-offset-0
              disabled:cursor-not-allowed
              transition-all
            `}
            placeholder="10"
          />
          <span className="text-base text-[var(--hw-text-primary)]">years old</span>
          {ageInput && parseInt(ageInput) >= 0 && (
            <span className="text-sm text-[var(--hw-text-muted)]">
              (Around {calculateYear(parseInt(ageInput))})
            </span>
          )}
        </div>
      )}

      {/* Life phase selector */}
      {mode === "unknown" && (
        <div className="space-y-2">
          <p className="text-sm text-[var(--hw-text-muted)]">
            That&apos;s okay! What period of your life was this?
          </p>
          <div className="flex flex-wrap gap-2">
            {lifePhases.map((phase) => (
              <button
                key={phase}
                onClick={() => handleLifePhaseChange(phase)}
                disabled={disabled}
                className={`
                  px-4 py-2 rounded-full text-sm font-medium transition-colors
                  ${disabled ? "cursor-not-allowed" : "cursor-pointer"}
                  ${selectedLifePhase === phase
                    ? "bg-[var(--hw-accent-gold)] text-white"
                    : "bg-[var(--hw-surface)] border border-[var(--hw-border-subtle)] text-[var(--hw-text-secondary)] hover:bg-[var(--hw-section-bg)]"
                  }
                `}
              >
                {formatLifePhase(phase)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
