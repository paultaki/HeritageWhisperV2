/**
 * TimelineEnd Component
 *
 * Graceful ending for timeline with:
 * - Add Memory Card (matches timeline card styling)
 * - Accessibility features
 */

"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { AddMemoryCard } from "./AddMemoryCard";

type TimelineEndProps = {
  isDark?: boolean;
  hasDrafts?: boolean;
  draftCount?: number;
  hasCurrentYearContent?: boolean;
  isProxyMode?: boolean;
  storytellerName?: string;
  onAddMemory?: () => void;
};

export function TimelineEnd({
  isDark = false,
  onAddMemory,
}: TimelineEndProps) {
  const router = useRouter();

  const handleCreateMemory = () => {
    if (onAddMemory) {
      onAddMemory();
    } else {
      router.push("/recording");
    }
  };

  return (
    <div
      id="timeline-end"
      className="relative"
      style={{
        paddingBottom: "calc(120px + env(safe-area-inset-bottom, 0px))",
        marginTop: "0",
      }}
    >
      {/* Add Memory Card - Centered */}
      <div className="flex justify-center w-full px-4" style={{ marginTop: "80px" }}>
        <AddMemoryCard onCreateMemory={handleCreateMemory} isDark={isDark} />
      </div>

      {/* Success toast container (for aria-live announcements) */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      <style jsx>{`
        /* Timeline end styling */
      `}</style>
    </div>
  );
}
