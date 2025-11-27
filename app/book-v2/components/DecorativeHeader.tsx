/**
 * DecorativeHeader - Elegant ornament for stories without photos
 * Adds visual polish with drop cap styling
 */

"use client";

import React from 'react';

export function DecorativeHeader() {
  return (
    <div className="book-v2-decorative-header">
      {/* Left ornamental line */}
      <div className="book-v2-decorative-line" />

      {/* Center diamond */}
      <div className="book-v2-decorative-diamond" />

      {/* Right ornamental line */}
      <div className="book-v2-decorative-line" />
    </div>
  );
}

/**
 * Flourish - Decorative element for end of short stories
 */
export function StoryFlourish() {
  return (
    <div className="flex items-center justify-center gap-2 py-6 mt-auto">
      <div className="w-1.5 h-1.5 bg-[var(--book-accent)] rounded-full opacity-40" />
      <div className="w-2 h-2 bg-[var(--book-accent)] rounded-full opacity-60" />
      <div className="w-1.5 h-1.5 bg-[var(--book-accent)] rounded-full opacity-40" />
    </div>
  );
}

/**
 * ChapterDivider - For decade/chapter marker pages
 */
export function ChapterDivider({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      {/* Decorative top */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-px bg-gradient-to-r from-transparent to-[var(--book-accent)]" />
        <div className="w-3 h-3 border-2 border-[var(--book-accent)] rotate-45" />
        <div className="w-12 h-px bg-gradient-to-l from-transparent to-[var(--book-accent)]" />
      </div>

      {/* Title */}
      <h1 className="text-4xl font-serif text-[var(--book-primary)] mb-2">
        {title}
      </h1>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-lg text-[var(--book-text-muted)]">
          {subtitle}
        </p>
      )}

      {/* Decorative bottom */}
      <div className="flex items-center gap-4 mt-8">
        <div className="w-8 h-px bg-gradient-to-r from-transparent to-[var(--book-accent)]" />
        <div className="w-2 h-2 bg-[var(--book-accent)] rotate-45" />
        <div className="w-8 h-px bg-gradient-to-l from-transparent to-[var(--book-accent)]" />
      </div>
    </div>
  );
}
