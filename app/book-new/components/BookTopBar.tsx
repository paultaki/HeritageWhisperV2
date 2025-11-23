"use client";

import { Pencil, Menu } from "lucide-react";
import { BookTopBarProps } from "./types";

export default function BookTopBar({
  bookTitle,
  userInitials,
  onTimelineClick,
  onEditClick,
  onTocClick,
  viewMode,
  onViewModeChange,
}: BookTopBarProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-[56px] items-center justify-between gap-3 px-4 pt-[env(safe-area-inset-top)]">
      {/* Left side: Avatar and title */}
      <div className="flex min-w-0 items-center gap-3">
        {/* User avatar */}
        <div className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-sm font-medium text-white/90 ring-1 ring-white/15">
          {userInitials}
        </div>

        {/* Book title */}
        <div className="min-w-0">
          <div className="truncate text-lg font-medium tracking-tight text-white/95 sm:text-xl">
            {bookTitle}
          </div>
        </div>
      </div>

      {/* Center: View Mode Toggle (visible if provided) */}
      {viewMode && onViewModeChange && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden sm:flex items-center bg-white/10 rounded-full p-1 border border-white/10 backdrop-blur-sm">
          <button
            onClick={() => onViewModeChange('chronological')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${viewMode === 'chronological'
              ? 'bg-white text-black shadow-sm'
              : 'text-white/70 hover:text-white'
              }`}
          >
            Time
          </button>
          <button
            onClick={() => onViewModeChange('chapters')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${viewMode === 'chapters'
              ? 'bg-[#d4af87] text-white shadow-sm'
              : 'text-white/70 hover:text-white'
              }`}
          >
            Chapters
          </button>
        </div>
      )}

      {/* Right side: Action buttons */}
      <div className="flex items-center gap-2">
        {/* Edit button */}
        <button
          onClick={onEditClick}
          className="pointer-events-auto grid h-9 w-9 place-items-center rounded-full bg-white/6 text-white backdrop-blur-sm ring-1 ring-white/10 transition active:scale-[0.98]"
          aria-label="Edit"
        >
          <Pencil className="h-5 w-5" style={{ marginLeft: '1px' }} />
        </button>

        {/* TOC/Menu button */}
        <button
          onClick={onTocClick}
          className="pointer-events-auto grid h-9 w-9 place-items-center rounded-full bg-white/6 text-white backdrop-blur-sm ring-1 ring-white/10 transition active:scale-[0.98]"
          aria-label="Open contents"
        >
          <Menu className="h-5 w-5" style={{ marginLeft: '1px' }} />
        </button>
      </div>
    </header>
  );
}
