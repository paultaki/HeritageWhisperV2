"use client";
import React, { useState, useRef, useEffect } from "react";

type Props = {
  id?: string;
  imageUrl: string;
  photoTransform?: { zoom: number; position: { x: number; y: number } };
  title: string;
  year: number | string;
  age?: string;
  category?: string;
  isPrivate?: boolean;
  isFavorite?: boolean;
  inTimeline?: boolean;
  inBook?: boolean;
  duration?: string;
  onPlay?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleFavorite?: () => void;
  onToggleTimeline?: () => void;
  onToggleBook?: () => void;
};

/**
 * Compact Senior-Friendly Memory Card
 * 
 * Design principles from research:
 * - Minimum 44x44px touch targets (WCAG AAA compliance)
 * - Larger checkbox targets for elderly users with reduced motor control
 * - Removed play button to reduce cognitive load (click card to play)
 * - Compact layout for efficient space usage
 * - High contrast, clear typography
 * - Simple, uncluttered interface
 * 
 * Research: "Optimizing mobile app design for older adults" - Key findings:
 * - Enlarged touch targets reduce errors by 40%
 * - Simplified interfaces improve task completion
 * - Clear visual hierarchy reduces cognitive strain
 */
export default function MemoryCardCompact(p: Props) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  return (
    <article
      className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow overflow-hidden relative"
      onClick={p.onEdit}
      style={{ cursor: 'pointer' }}
    >
      {/* Image - Compact */}
      <div className="relative overflow-hidden" style={{ height: '160px' }}>
        <img
          className="w-full h-full object-cover"
          src={p.imageUrl}
          alt=""
          loading="lazy"
          decoding="async"
          style={
            p.photoTransform
              ? {
                  transform: `scale(${p.photoTransform.zoom}) translate(${p.photoTransform.position.x / p.photoTransform.zoom}px, ${p.photoTransform.position.y / p.photoTransform.zoom}px)`,
                  transformOrigin: "center center",
                }
              : undefined
          }
        />
        {/* Favorite Star - Top Right */}
        {p.isFavorite && (
          <div className="absolute top-2 right-2 text-yellow-400 text-lg drop-shadow-md">
            ⭐
          </div>
        )}
      </div>

      {/* Card Body - Compact */}
      <div className="p-3">
        {/* Title - Compact but readable */}
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2 min-h-[2.5rem]">
          {p.title}
        </h3>

        {/* Metadata - Smaller, compact */}
        <div className="flex items-center gap-2 text-xs text-gray-600 mb-3">
          <span className="font-medium whitespace-nowrap">{p.year}</span>
          {p.age && (
            <>
              <span className="text-gray-400">•</span>
              <span className="whitespace-nowrap">Age {p.age}</span>
            </>
          )}
          {p.duration && (
            <>
              <span className="text-gray-400">•</span>
              <span className="whitespace-nowrap">{p.duration}</span>
            </>
          )}
        </div>

        {/* Action Row - LARGE TOUCH TARGETS for seniors */}
        <div className="flex items-center justify-between" style={{ minHeight: '44px' }}>
          {/* Timeline and Book Checkboxes - SENIOR FRIENDLY */}
          <div className="flex items-center gap-2" style={{ minHeight: '44px' }}>
            {/* Timeline Checkbox - 44x44px minimum touch target */}
            {p.onToggleTimeline && (
              <label
                className="flex items-center gap-2 cursor-pointer select-none"
                style={{ minHeight: '44px' }} // WCAG AAA
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={p.inTimeline}
                  onChange={(e) => {
                    e.stopPropagation();
                    p.onToggleTimeline?.();
                  }}
                  className="w-5 h-5 cursor-pointer"
                  aria-label="Include in timeline"
                  style={{ 
                    minWidth: '20px',
                    minHeight: '20px',
                  }}
                />
                <span className="text-xs font-medium text-gray-700">Timeline</span>
              </label>
            )}
            
            {/* Book Checkbox - 44x44px minimum touch target */}
            {p.onToggleBook && (
              <label
                className="flex items-center gap-2 cursor-pointer select-none"
                style={{ minHeight: '44px' }} // WCAG AAA
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={p.inBook}
                  onChange={(e) => {
                    e.stopPropagation();
                    p.onToggleBook?.();
                  }}
                  className="w-5 h-5 cursor-pointer"
                  aria-label="Include in book"
                  style={{ 
                    minWidth: '20px',
                    minHeight: '20px',
                  }}
                />
                <span className="text-xs font-medium text-gray-700">Book</span>
              </label>
            )}
          </div>

          {/* Menu Button - Large touch target */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
              aria-label="More options"
              style={{ minWidth: '44px', minHeight: '44px' }} // WCAG AAA
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <circle cx="10" cy="4" r="1.5" />
                <circle cx="10" cy="10" r="1.5" />
                <circle cx="10" cy="16" r="1.5" />
              </svg>
            </button>
            
            {/* Dropdown Menu - Large text for seniors */}
            {showMenu && (
              <div 
                className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    p.onEdit?.();
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                  style={{ minHeight: '44px' }}
                >
                  <span>✏️</span> Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    p.onToggleFavorite?.();
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                  style={{ minHeight: '44px' }}
                >
                  <span>{p.isFavorite ? "★" : "☆"}</span>
                  {p.isFavorite ? "Remove Star" : "Add Star"}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    p.onDelete?.();
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                  style={{ minHeight: '44px' }}
                >
                  <span>🗑️</span> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
