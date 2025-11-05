/**
 * TimelineEnd Component
 *
 * Graceful ending for timeline with:
 * - Terminal "Today" node with fade
 * - Smart CTA button with rotating microcopy
 * - State-aware button text
 * - Accessibility features
 */

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type TimelineEndProps = {
  isDark?: boolean;
  hasDrafts?: boolean;
  draftCount?: number;
  hasCurrentYearContent?: boolean;
  isProxyMode?: boolean;
  storytellerName?: string;
  onAddMemory?: () => void;
};

const MICROCOPY_VARIANTS = [
  { text: "Capture a new memory", path: "/review/book-style?new=true" },
  { text: "Record a story from today", path: "/review/book-style?new=true" },
  { text: "Add a photo from this year", path: "/review/book-style?new=true" },
  { text: "Save a lesson learned", path: "/review/book-style?new=true" },
  { text: "Invite family to contribute", path: "/family" },
];

export function TimelineEnd({
  isDark = false,
  hasDrafts = false,
  draftCount = 0,
  hasCurrentYearContent = true,
  isProxyMode = false,
  storytellerName = "",
  onAddMemory,
}: TimelineEndProps) {
  const router = useRouter();
  const [currentVariantIndex, setCurrentVariantIndex] = useState(0);

  // Rotate microcopy every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentVariantIndex((prev) => (prev + 1) % MICROCOPY_VARIANTS.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // State-aware button text and path
  const getButtonConfig = () => {
    if (hasDrafts) {
      return {
        text: `Resume your draft${draftCount > 1 ? ` (${draftCount})` : ""}`,
        path: "/review/book-style?new=true",
      };
    }
    if (!hasCurrentYearContent) {
      const currentYear = new Date().getFullYear();
      return {
        text: `Add your first ${currentYear} memory`,
        path: "/review/book-style?new=true",
      };
    }
    if (isProxyMode && storytellerName) {
      return {
        text: `Suggest a memory for ${storytellerName}`,
        path: "/review/book-style?new=true",
      };
    }
    // Default to rotating variants
    return MICROCOPY_VARIANTS[currentVariantIndex];
  };

  const handleClick = () => {
    const config = getButtonConfig();

    if (onAddMemory) {
      onAddMemory();
    } else {
      router.push(config.path);
    }

    // Analytics
    if (typeof window !== "undefined" && (window as any).track) {
      (window as any).track("timeline_end_cta_clicked", {
        button_text: config.text,
        destination: config.path,
      });
    }
  };

  return (
    <div
      id="timeline-end"
      className="relative md:-ml-[225px]"
      style={{
        paddingBottom: "calc(120px + env(safe-area-inset-bottom, 0px))",
        marginTop: "0",
      }}
    >
      {/* Spine fade from top (72-96px mobile, 96-120px desktop) - connects to spine above */}
      <div
        className="absolute gradient-line"
        style={{
          width: "4px",
          background: isDark
            ? "linear-gradient(to bottom, rgba(176, 179, 184, 0.35) 0%, rgba(176, 179, 184, 0.2) 40%, transparent 100%)"
            : "linear-gradient(to bottom, rgba(196, 167, 183, 0.35) 0%, rgba(196, 167, 183, 0.2) 40%, transparent 100%)",
        }}
      />

      {/* Terminal node - "Today" */}
      <div className="relative flex items-center mb-12 today-node">
        {/* Terminal dot aligned with spine */}
        <div
          className="w-3 h-3 rounded-full border-2 flex-shrink-0"
          style={{
            marginLeft: "10px",
            backgroundColor: isDark ? "#1c1c1d" : "#FFF8F3",
            borderColor: isDark ? "#b0b3b8" : "#B49D8D",
          }}
        />
        <span
          className="ml-3 text-sm font-medium"
          style={{ color: isDark ? "#8a8d92" : "#9CA3AF" }}
        >
          Today
        </span>
      </div>

      {/* CTA Button */}
      <button
        id="end-cta"
        onClick={handleClick}
        aria-label="Add a new memory"
        className="end-cta-button"
      >
        + {getButtonConfig().text}
      </button>

      {/* Success toast container (for aria-live announcements) */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      <style jsx>{`
        .gradient-line {
          left: 14px;
          top: -12px;
          height: 72px;
        }

        .today-node {
          padding-top: 52px;
        }

        .end-cta-button {
          margin: 0 auto;
          display: block;
          width: min(640px, 92%);
          min-height: 60px;
          border-radius: 9999px;
          border: 1px solid #e5e7eb;
          background-color: white;
          font-size: 1.125rem;
          font-weight: 500;
          color: #111827;
          box-shadow: 0 6px 24px rgba(0, 0, 0, 0.08);
          transition: transform 0.2s;
        }

        .end-cta-button:active {
          transform: scale(0.98);
        }

        .end-cta-button:focus {
          outline: none;
          ring: 2px;
          ring-color: rgba(147, 197, 253, 0.5);
        }

        .end-cta-button:hover {
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
        }

        @media (min-width: 768px) {
          .gradient-line {
            left: 465px;
            top: 239px;
            height: 96px;
          }

          .today-node {
            padding-top: 355px;
            padding-left: 450px;
          }

          .end-cta-button {
            margin-top: 190px;
            margin-left: 225px; /* Offset the parent's -225px to center on window */
          }
        }
      `}</style>
    </div>
  );
}
