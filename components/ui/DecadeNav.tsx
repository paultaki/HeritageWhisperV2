"use client";

import React from "react";
import { useDecadeSync } from "./useDecadeSync";
import "@/app/styles/decade-nav.css";

export type DecadeEntry = {
  id: string; // ex decade-1950s
  label: string; // ex 1950s
  count: number; // number of stories in decade
};

export default function DecadeNav({ entries }: { entries: DecadeEntry[] }) {
  const { activeId, scrollToId } = useDecadeSync(entries);
  const [open, setOpen] = React.useState(false);

  // Calculate decade range from numeric entries (exclude TOP, birth year)
  const decadeRange = React.useMemo(() => {
    const numericEntries = entries.filter(
      (e) => !e.id.includes("before-birth") && !e.id.includes("birth-year")
    );
    if (numericEntries.length === 0) return null;

    const firstLabel = numericEntries[0]?.label;
    const lastLabel = numericEntries[numericEntries.length - 1]?.label;

    // If only one decade, show just that year
    if (firstLabel === lastLabel) return firstLabel;

    // Otherwise show range with en-dash
    return `${firstLabel}–${lastLabel}`;
  }, [entries]);

  return (
    <>
      {/* desktop sidebar */}
      <aside className="hw-decade-nav" aria-label="Decades">
        <div className="hw-decade-list">
          {entries.map((d) => (
            <button
              key={d.id}
              className="hw-decade-item"
              aria-current={activeId === d.id}
              onClick={() => scrollToId(d.id)}
              aria-label={`Go to ${d.label}`}
            >
              <span>{d.label}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* mobile pill and sheet - only show if we have a decade range */}
      {decadeRange && (
        <div
          className="hw-decade-fab"
          role="region"
          aria-label="Decade navigation"
        >
          <button
            className="hw-decade-pill"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={`Jump to decade: ${decadeRange}`}
          >
            <span className="decade-range-text">{decadeRange}</span>
            <span className="caret" aria-hidden="true">▾</span>
          </button>
          {open && (
            <div className="hw-decade-sheet" role="menu">
              {entries.map((d) => (
                <button
                  key={d.id}
                  className="hw-decade-item"
                  aria-current={activeId === d.id}
                  onClick={() => {
                    setOpen(false);
                    scrollToId(d.id);
                  }}
                  role="menuitem"
                  aria-label={`Go to ${d.label}`}
                >
                  <span>{d.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
