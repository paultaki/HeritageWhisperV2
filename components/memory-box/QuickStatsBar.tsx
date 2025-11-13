"use client";
import React from "react";

type Props = {
  storiesCount: number;
  totalHours: number;
  treasuresCount: number;
  isOwnAccount?: boolean; // For family sharing - hide stories/time for viewers
};

/**
 * Quick Stats Bar - Immediate Context for Seniors
 *
 * Shows at-a-glance summary of their collection
 * Large, readable numbers with clear labels
 *
 * For family viewers (isOwnAccount=false): Shows only treasures count
 * For account owners (isOwnAccount=true): Shows all stats
 */
export function QuickStatsBar({ storiesCount, totalHours, treasuresCount, isOwnAccount = true }: Props) {
  const formatHours = (hours: number) => {
    if (hours < 1) {
      const minutes = Math.round(hours * 60);
      return `${minutes} min`;
    }
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return minutes > 0 ? `${wholeHours}h ${minutes}m` : `${wholeHours} hours`;
  };

  // For family viewers, show only treasures count (centered)
  if (!isOwnAccount) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-2 md:p-3 mb-6">
        <div className="flex items-center justify-center">
          <div className="text-center px-4 md:px-6">
            <div className="text-2xl md:text-4xl font-bold text-heritage-brown">
              {treasuresCount}
            </div>
            <div className="text-xs md:text-base text-gray-700 font-medium">
              {treasuresCount === 1 ? "Timeless Treasure" : "Timeless Treasures"}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // For account owners, show all stats
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-2 md:p-3 mb-6">
      <div className="flex items-center justify-center divide-x divide-gray-200">
        <div className="text-center px-4 md:px-6">
          <div className="text-2xl md:text-4xl font-bold text-heritage-brown">
            {storiesCount}
          </div>
          <div className="text-xs md:text-base text-gray-700 font-medium">
            {storiesCount === 1 ? "Story" : "Stories"}
          </div>
        </div>

        <div className="text-center px-4 md:px-6">
          <div className="text-2xl md:text-4xl font-bold text-heritage-coral">
            {formatHours(totalHours)}
          </div>
          <div className="text-xs md:text-base text-gray-700 font-medium">
            Recorded
          </div>
        </div>

        <div className="text-center px-4 md:px-6">
          <div className="text-2xl md:text-4xl font-bold text-heritage-brown">
            {treasuresCount}
          </div>
          <div className="text-xs md:text-base text-gray-700 font-medium">
            {treasuresCount === 1 ? "Timeless Treasure" : "Timeless Treasures"}
          </div>
        </div>
      </div>
    </div>
  );
}
