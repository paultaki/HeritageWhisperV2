"use client";
import React from "react";

type Props = {
  storiesCount: number;
  totalHours: number;
  treasuresCount: number;
};

/**
 * Quick Stats Bar - Immediate Context for Seniors
 *
 * Shows at-a-glance summary of their collection
 * Large, readable numbers with clear labels
 */
export function QuickStatsBar({ storiesCount, totalHours, treasuresCount }: Props) {
  const formatHours = (hours: number) => {
    if (hours < 1) {
      const minutes = Math.round(hours * 60);
      return `${minutes} min`;
    }
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return minutes > 0 ? `${wholeHours}h ${minutes}m` : `${wholeHours} hours`;
  };

  return (
    <div className="bg-gradient-to-r from-heritage-brown/10 to-heritage-coral/10 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-center gap-8 flex-wrap">
        <div className="text-center">
          <div className="text-3xl md:text-4xl font-bold text-heritage-brown">
            {storiesCount}
          </div>
          <div className="text-sm md:text-base text-gray-700 font-medium">
            {storiesCount === 1 ? "Story" : "Stories"}
          </div>
        </div>

        <div className="text-2xl text-gray-300">•</div>

        <div className="text-center">
          <div className="text-3xl md:text-4xl font-bold text-heritage-coral">
            {formatHours(totalHours)}
          </div>
          <div className="text-sm md:text-base text-gray-700 font-medium">
            Recorded
          </div>
        </div>

        <div className="text-2xl text-gray-300">•</div>

        <div className="text-center">
          <div className="text-3xl md:text-4xl font-bold text-heritage-brown">
            {treasuresCount}
          </div>
          <div className="text-sm md:text-base text-gray-700 font-medium">
            {treasuresCount === 1 ? "Treasure" : "Treasures"}
          </div>
        </div>
      </div>
    </div>
  );
}
