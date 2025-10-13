"use client";

import React, { useState, useEffect } from "react";
import { BookPage } from "@/lib/bookPagination";
import "@/app/styles/decade-nav.css";

export type DecadeEntry = {
  decade: string; // ex "1950s"
  title: string; // ex "1950s - Early Childhood"
  pageNumber: number; // first page of decade
};

interface BookDecadesPillProps {
  pages: BookPage[];
  currentPage: number;
  onNavigateToPage: (pageNumber: number) => void;
}

/**
 * Extract decades from book pages
 */
function extractDecades(pages: BookPage[]): DecadeEntry[] {
  const decades: DecadeEntry[] = [];
  const seen = new Set<string>();

  pages.forEach((page) => {
    if (page.type === "decade-marker" && page.decade && !seen.has(page.decade)) {
      seen.add(page.decade);
      decades.push({
        decade: page.decade,
        title: page.decadeTitle || page.decade,
        pageNumber: page.pageNumber,
      });
    }
  });

  return decades.sort((a, b) => {
    const aYear = parseInt(a.decade);
    const bYear = parseInt(b.decade);
    return aYear - bYear;
  });
}

/**
 * Find which decade the current page belongs to
 */
function getCurrentDecade(pages: BookPage[], currentPage: number): string {
  // Find the most recent decade marker before or at current page
  let currentDecade = "";
  
  for (let i = 0; i <= currentPage && i < pages.length; i++) {
    const page = pages[i];
    if (page.type === "decade-marker" && page.decade) {
      currentDecade = page.decade;
    }
  }
  
  return currentDecade;
}

export default function BookDecadesPill({
  pages,
  currentPage,
  onNavigateToPage,
}: BookDecadesPillProps) {
  const [open, setOpen] = useState(false);
  const decades = extractDecades(pages);
  const activeDecade = getCurrentDecade(pages, currentPage);

  // Close sheet when clicking outside
  useEffect(() => {
    if (!open) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".hw-decade-fab")) {
        setOpen(false);
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [open]);

  if (decades.length === 0) {
    return null;
  }

  return (
    <div className="hw-decade-fab md:hidden" role="region" aria-label="Decade navigation">
      {/* Pill button */}
      <button
        className="hw-decade-pill"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {activeDecade || decades[0]?.decade}
        <span className="caret" />
      </button>

      {/* Expanded sheet */}
      {open && (
        <div className="hw-decade-sheet" role="menu">
          {decades.map((d) => (
            <button
              key={d.decade}
              className="hw-decade-item"
              aria-current={activeDecade === d.decade}
              onClick={() => {
                setOpen(false);
                // Navigate to the decade marker page (subtract 1 for 0-indexing)
                onNavigateToPage(d.pageNumber - 1);
              }}
              role="menuitem"
              aria-label={`Go to ${d.title}`}
            >
              <span>{d.decade}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
