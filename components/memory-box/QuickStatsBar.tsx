"use client";
import React from "react";

type Props = {
  storiesCount: number;
  totalHours: number;
  treasuresCount: number;
  isOwnAccount?: boolean; // For family sharing - hide stories/time for viewers
  storytellerName?: string; // Name for subtitle personalization
};

/**
 * Quick Stats Bar - Minimal inline stats for Memory Box header
 *
 * Shows summary as compact text: "41 stories • 21 min recorded • 11 treasures"
 * Smart time formatting: minutes if <60, hours otherwise
 *
 * For family viewers (isOwnAccount=false): Shows only treasures count
 * For account owners (isOwnAccount=true): Shows all stats
 */
export function QuickStatsBar({
  storiesCount,
  totalHours,
  treasuresCount,
  isOwnAccount = true,
  storytellerName
}: Props) {
  // Smart time formatting: show minutes if <60 min, otherwise hours
  const formatSmartTime = (hours: number) => {
    const totalMinutes = Math.round(hours * 60);

    if (totalMinutes < 60) {
      return `${totalMinutes} min`;
    }

    // Show hours with one decimal place
    const formattedHours = (totalMinutes / 60).toFixed(1);
    return `${formattedHours} hrs`;
  };

  // Format individual stat strings
  const formatStories = () => {
    return `${storiesCount} ${storiesCount === 1 ? 'story' : 'stories'}`;
  };

  const formatTreasures = () => {
    return `${treasuresCount} ${treasuresCount === 1 ? 'treasure' : 'treasures'}`;
  };

  const formatRecorded = () => {
    return `${formatSmartTime(totalHours)} recorded`;
  };

  // Build subtitle based on account type
  const buildSubtitle = () => {
    const name = storytellerName || "their";
    return `All of ${name}'s stories and keepsakes in one place`;
  };

  // For family viewers, show only treasures
  if (!isOwnAccount) {
    return (
      <div className="mb-6">
        <p className="text-sm md:text-base text-gray-600 mb-1">
          {formatTreasures()}
        </p>
        <p className="text-xs md:text-sm text-gray-500">
          {buildSubtitle()}
        </p>
      </div>
    );
  }

  // For account owners, show all stats in one line
  return (
    <div className="mb-6">
      <p className="text-sm md:text-base text-gray-600 mb-1">
        {formatStories()} • {formatRecorded()} • {formatTreasures()}
      </p>
      <p className="text-xs md:text-sm text-gray-500">
        {buildSubtitle()}
      </p>
    </div>
  );
}
