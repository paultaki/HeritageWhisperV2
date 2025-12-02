"use client";

import React, { useState, useRef } from "react";
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

// Snap zone definitions - 3x3 grid
const SNAP_ZONES: Record<SnapZone, { 
  name: string;
  float?: "left" | "right";
  margin: string;
  description: string;
  region: { x: number; y: number };
}> = {
  1: { name: "top-left", float: "left", margin: "0 16px 8px 0", description: "Top Left", region: { x: 0, y: 0 } },
  2: { name: "top-right", float: "right", margin: "0 0 8px 16px", description: "Top Right", region: { x: 2, y: 0 } },
  3: { name: "middle-left", float: "left", margin: "0 16px 8px 0", description: "Middle Left", region: { x: 0, y: 1 } },
  4: { name: "middle-right", float: "right", margin: "0 0 8px 16px", description: "Middle Right", region: { x: 2, y: 1 } },
  5: { name: "center-full", margin: "0 auto 12px auto", description: "Center", region: { x: 1, y: 1 } },
  6: { name: "bottom-center", margin: "12px auto 0 auto", description: "Bottom", region: { x: 1, y: 2 } },
};

const DEFAULT_WIDTH = 320;

export function DraggablePhoto({
  photoUrl,
  photoId,
  caption,
  initialZone = 2,
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

    if (nodeRef.current) {
      const container = nodeRef.current.closest('.book-v3-scroll');
      if (container) {
        const rect = container.getBoundingClientRect();
        const x = data.x + rect.width / 2;
        const y = data.y + rect.height / 2;
        
        const normX = Math.max(0, Math.min(1, x / rect.width));
        const normY = Math.max(0, Math.min(1, y / rect.height));
        
        let gridX = 1;
        let gridY = 1;
        
        if (normX < 0.33) gridX = 0;
        else if (normX > 0.67) gridX = 2;
        else gridX = 1;
        
        if (normY < 0.33) gridY = 0;
        else if (normY > 0.67) gridY = 2;
        else gridY = 1;
        
        let newZone: SnapZone = zone;
        for (const [zoneKey, zoneConfig] of Object.entries(SNAP_ZONES)) {
          if (zoneConfig.region.x === gridX && zoneConfig.region.y === gridY) {
            newZone = parseInt(zoneKey) as SnapZone;
            break;
          }
        }
        
        setZone(newZone);
        onLayoutChange(newZone, width);
        
        if (nodeRef.current) {
          nodeRef.current.style.transform = '';
        }
      }
    }
  };

  const handleZoneChange = (newZone: SnapZone) => {
    setZone(newZone);
    onLayoutChange(newZone, width);
  };

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
      {showZoneIndicators && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <ZoneIndicators currentZone={zone} onZoneSelect={handleZoneChange} />
        </div>
      )}

      <figure className="relative group" style={photoStyle}>
        <Draggable
          nodeRef={nodeRef}
          onStart={handleDragStart}
          onStop={handleDragStop}
          position={{ x: 0, y: 0 }}
        >
          <div ref={nodeRef} className="relative cursor-move">
            <img
              src={photoUrl}
              alt={caption || "Story photo"}
              className="rounded-md shadow ring-1 ring-amber-900/10 select-none w-full book-v3-photo"
              draggable={false}
            />
          </div>
        </Draggable>
        
        <div className="absolute top-2 right-2 flex gap-1 pointer-events-auto" style={{ zIndex: 9999 }}>
          <ZoneSelector currentZone={zone} onZoneChange={handleZoneChange} />
        </div>

        {caption && (
          <figcaption className="text-[12px] mt-1 italic" style={{ color: "#6b635a" }}>
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
    <div className="relative pointer-events-auto">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="px-2 py-1 text-xs backdrop-blur rounded shadow-lg border transition-colors pointer-events-auto"
        style={{
          background: "rgba(253, 251, 247, 0.95)",
          borderColor: "rgba(139, 107, 74, 0.2)",
          color: "#3d2e1f"
        }}
      >
        📍 Position
      </button>

      {isOpen && (
        <div 
          className="absolute top-full right-0 mt-1 w-40 rounded-md shadow-xl border overflow-hidden"
          style={{ 
            zIndex: 9999,
            background: "#fdfbf7",
            borderColor: "rgba(139, 107, 74, 0.2)"
          }}
        >
          {(Object.keys(SNAP_ZONES) as unknown as SnapZone[]).map((zoneNum) => (
            <button
              key={zoneNum}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onZoneChange(zoneNum);
                setIsOpen(false);
              }}
              className={`block w-full text-left px-3 py-2 text-xs transition-colors cursor-pointer ${
                currentZone === zoneNum ? "font-semibold" : ""
              }`}
              style={{ 
                pointerEvents: 'auto',
                background: currentZone === zoneNum ? "rgba(203, 164, 106, 0.15)" : "transparent",
                color: "#3d2e1f"
              }}
            >
              <span className="pointer-events-none">{SNAP_ZONES[zoneNum].description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Zone Indicators
function ZoneIndicators({
  currentZone,
  onZoneSelect,
}: {
  currentZone: SnapZone;
  onZoneSelect: (zone: SnapZone) => void;
}) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute inset-0 grid grid-cols-2 gap-4 p-8">
        {/* Top Left */}
        <div
          className={`border-2 border-dashed rounded-lg flex items-center justify-center text-sm font-medium transition-all ${
            currentZone === 1
              ? "border-amber-500 bg-amber-500/20 text-amber-900"
              : "border-stone-300/50 text-stone-400"
          }`}
        >
          Top Left
        </div>

        {/* Top Right */}
        <div
          className={`border-2 border-dashed rounded-lg flex items-center justify-center text-sm font-medium transition-all ${
            currentZone === 2
              ? "border-amber-500 bg-amber-500/20 text-amber-900"
              : "border-stone-300/50 text-stone-400"
          }`}
        >
          Top Right
        </div>

        {/* Middle Left */}
        <div
          className={`border-2 border-dashed rounded-lg flex items-center justify-center text-sm font-medium transition-all ${
            currentZone === 3
              ? "border-amber-500 bg-amber-500/20 text-amber-900"
              : "border-stone-300/50 text-stone-400"
          }`}
        >
          Middle Left
        </div>

        {/* Middle Right */}
        <div
          className={`border-2 border-dashed rounded-lg flex items-center justify-center text-sm font-medium transition-all ${
            currentZone === 4
              ? "border-amber-500 bg-amber-500/20 text-amber-900"
              : "border-stone-300/50 text-stone-400"
          }`}
        >
          Middle Right
        </div>
      </div>

      {/* Center Full */}
      <div
        className={`absolute left-1/2 top-1/3 -translate-x-1/2 w-3/4 h-20 border-2 border-dashed rounded-lg flex items-center justify-center text-sm font-medium transition-all ${
          currentZone === 5
            ? "border-amber-500 bg-amber-500/20 text-amber-900"
            : "border-stone-300/50 text-stone-400"
        }`}
      >
        Center Full
      </div>

      {/* Bottom Center */}
      <div
        className={`absolute left-1/2 bottom-20 -translate-x-1/2 w-2/3 h-20 border-2 border-dashed rounded-lg flex items-center justify-center text-sm font-medium transition-all ${
          currentZone === 6
            ? "border-amber-500 bg-amber-500/20 text-amber-900"
            : "border-stone-300/50 text-stone-400"
        }`}
      >
        Bottom Center
      </div>
    </div>
  );
}

