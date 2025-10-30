"use client";

import React, { useState, useRef, useEffect } from "react";
import Draggable from "react-draggable";
import type { SnapZone } from "../hooks/usePhotoLayout";

interface DraggablePhotoProps {
  photoUrl: string;
  photoId: string;
  caption?: string;
  initialZone?: SnapZone;
  initialWidth?: number;
  onLayoutChange: (zone: SnapZone, width: number) => void;
}

// Snap zone definitions with CSS classes
const SNAP_ZONES: Record<SnapZone, { 
  name: string;
  float?: "left" | "right";
  margin: string;
  description: string;
}> = {
  1: { name: "top-left", float: "left", margin: "0 16px 8px 0", description: "Top Left" },
  2: { name: "top-right", float: "right", margin: "0 0 8px 16px", description: "Top Right" },
  3: { name: "middle-left", float: "left", margin: "0 16px 8px 0", description: "Middle Left" },
  4: { name: "middle-right", float: "right", margin: "0 0 8px 16px", description: "Middle Right" },
  5: { name: "center-full", margin: "0 auto 12px auto", description: "Center" },
  6: { name: "bottom-center", margin: "12px auto 0 auto", description: "Bottom" },
};

const DEFAULT_WIDTH = 320;
const MIN_WIDTH = 150;
const MAX_WIDTH = 500;

export function DraggablePhoto({
  photoUrl,
  photoId,
  caption,
  initialZone = 2, // Default to top-right
  initialWidth = DEFAULT_WIDTH,
  onLayoutChange,
}: DraggablePhotoProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [zone, setZone] = useState<SnapZone>(initialZone);
  const [width, setWidth] = useState(initialWidth);
  const [showZoneIndicators, setShowZoneIndicators] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);

  const zoneConfig = SNAP_ZONES[zone];

  const handleDragStart = () => {
    setIsDragging(true);
    setShowZoneIndicators(true);
  };

  const handleDragStop = (e: any, data: any) => {
    setIsDragging(false);
    setShowZoneIndicators(false);

    // Calculate which zone we're closest to based on drag position
    // For now, keep the current zone (we'll add snap logic next)
    onLayoutChange(zone, width);
  };

  const handleZoneChange = (newZone: SnapZone) => {
    setZone(newZone);
    onLayoutChange(newZone, width);
  };

  // Render based on zone
  const isFloating = zone === 1 || zone === 2 || zone === 3 || zone === 4;
  const isCentered = zone === 5 || zone === 6;

  const photoStyle: React.CSSProperties = {
    width: `${width}px`,
    maxWidth: "100%",
    ...(isFloating && {
      float: zoneConfig.float,
      margin: zoneConfig.margin,
    }),
    ...(isCentered && {
      display: "block",
      margin: zoneConfig.margin,
    }),
  };

  return (
    <>
      {/* Zone Indicators - shown while dragging */}
      {showZoneIndicators && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <ZoneIndicators currentZone={zone} onZoneSelect={handleZoneChange} />
        </div>
      )}

      <figure className="relative group">
        <Draggable
          nodeRef={nodeRef}
          onStart={handleDragStart}
          onStop={handleDragStop}
          position={{ x: 0, y: 0 }}
        >
          <div ref={nodeRef} className="cursor-move">
            <img
              src={photoUrl}
              alt={caption || "Story photo"}
              className="rounded-md shadow ring-1 ring-black/5 select-none"
              style={photoStyle}
              draggable={false}
            />
            
            {/* Edit controls - shown on hover */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <ZoneSelector currentZone={zone} onZoneChange={handleZoneChange} />
            </div>
          </div>
        </Draggable>

        {caption && (
          <figcaption className="text-[12px] text-neutral-600 mt-1">
            {caption}
          </figcaption>
        )}
      </figure>
    </>
  );
}

// Zone Selector Dropdown
function ZoneSelector({
  currentZone,
  onZoneChange,
}: {
  currentZone: SnapZone;
  onZoneChange: (zone: SnapZone) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-2 py-1 text-xs bg-white/90 backdrop-blur rounded shadow-lg border border-black/10 hover:bg-white transition-colors"
      >
        📍 Position
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-40 bg-white/95 backdrop-blur rounded-md shadow-xl border border-black/10 overflow-hidden z-50">
          {(Object.keys(SNAP_ZONES) as unknown as SnapZone[]).map((zoneNum) => (
            <button
              key={zoneNum}
              onClick={() => {
                onZoneChange(zoneNum);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 transition-colors ${
                currentZone === zoneNum ? "bg-indigo-100 font-semibold" : ""
              }`}
            >
              {SNAP_ZONES[zoneNum].description}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Zone Indicators - visual guides while dragging
function ZoneIndicators({
  currentZone,
  onZoneSelect,
}: {
  currentZone: SnapZone;
  onZoneSelect: (zone: SnapZone) => void;
}) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Grid overlay showing zones */}
      <div className="absolute inset-0 grid grid-cols-2 gap-4 p-8">
        {/* Top Left */}
        <div
          className={`border-2 border-dashed rounded-lg flex items-center justify-center text-sm font-medium transition-all ${
            currentZone === 1
              ? "border-indigo-400 bg-indigo-500/20 text-indigo-900"
              : "border-white/30 text-white/50"
          }`}
        >
          Top Left
        </div>

        {/* Top Right */}
        <div
          className={`border-2 border-dashed rounded-lg flex items-center justify-center text-sm font-medium transition-all ${
            currentZone === 2
              ? "border-indigo-400 bg-indigo-500/20 text-indigo-900"
              : "border-white/30 text-white/50"
          }`}
        >
          Top Right
        </div>

        {/* Middle Left */}
        <div
          className={`border-2 border-dashed rounded-lg flex items-center justify-center text-sm font-medium transition-all ${
            currentZone === 3
              ? "border-indigo-400 bg-indigo-500/20 text-indigo-900"
              : "border-white/30 text-white/50"
          }`}
        >
          Middle Left
        </div>

        {/* Middle Right */}
        <div
          className={`border-2 border-dashed rounded-lg flex items-center justify-center text-sm font-medium transition-all ${
            currentZone === 4
              ? "border-indigo-400 bg-indigo-500/20 text-indigo-900"
              : "border-white/30 text-white/50"
          }`}
        >
          Middle Right
        </div>
      </div>

      {/* Center Full */}
      <div
        className={`absolute left-1/2 top-1/3 -translate-x-1/2 w-3/4 h-20 border-2 border-dashed rounded-lg flex items-center justify-center text-sm font-medium transition-all ${
          currentZone === 5
            ? "border-indigo-400 bg-indigo-500/20 text-indigo-900"
            : "border-white/30 text-white/50"
        }`}
      >
        Center Full
      </div>

      {/* Bottom Center */}
      <div
        className={`absolute left-1/2 bottom-20 -translate-x-1/2 w-2/3 h-20 border-2 border-dashed rounded-lg flex items-center justify-center text-sm font-medium transition-all ${
          currentZone === 6
            ? "border-indigo-400 bg-indigo-500/20 text-indigo-900"
            : "border-white/30 text-white/50"
        }`}
      >
        Bottom Center
      </div>
    </div>
  );
}
