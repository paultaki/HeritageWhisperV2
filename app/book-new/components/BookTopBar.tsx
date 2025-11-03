"use client";

import { Clock3, Pencil, Menu } from "lucide-react";
import { BookTopBarProps } from "./types";

export default function BookTopBar({
  bookTitle,
  userInitials,
  onTimelineClick,
  onEditClick,
  onTocClick,
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

      {/* Right side: Action buttons */}
      <div className="flex items-center gap-2">
        {/* Timeline button */}
        <button
          onClick={onTimelineClick}
          className="pointer-events-auto rounded-full bg-white/6 p-2 text-white backdrop-blur-sm ring-1 ring-white/10 transition active:scale-[0.98]"
          aria-label="Open timeline"
        >
          <Clock3 className="h-5 w-5" />
        </button>

        {/* Edit button */}
        <button
          onClick={onEditClick}
          className="pointer-events-auto rounded-full bg-white/6 p-2 text-white backdrop-blur-sm ring-1 ring-white/10 transition active:scale-[0.98]"
          aria-label="Edit"
        >
          <Pencil className="h-5 w-5" />
        </button>

        {/* TOC/Menu button */}
        <button
          onClick={onTocClick}
          className="pointer-events-auto rounded-full bg-white/6 p-2 text-white backdrop-blur-sm ring-1 ring-white/10 transition active:scale-[0.98]"
          aria-label="Open contents"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
