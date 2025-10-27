/**
 * TimelineHeader Component
 *
 * Page header for the timeline view with logo and navigation.
 * Now uses universal MobilePageHeader component for consistency.
 *
 * Created: January 25, 2025
 * Updated: January 2025 - Migrated to universal header
 */

"use client";

import React from "react";
import { Calendar } from "lucide-react";
import type { TimelineHeaderProps } from "@/types/timeline";
import { MobilePageHeader } from "@/components/PageHeader";

/**
 * TimelineHeader - Sticky page header
 */
export function TimelineHeader({
  isDark,
  currentColorScheme,
}: TimelineHeaderProps) {
  return (
    <MobilePageHeader
      icon={Calendar}
      title="Timeline"
      subtitle="Your life's journey"
    />
  );
}
