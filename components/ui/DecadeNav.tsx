"use client";

import React from "react";
import Image from "next/image";
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

      {/* mobile pill and sheet */}
      <div
        className="hw-decade-fab"
        role="region"
        aria-label="Decade navigation"
      >
        <button
          className="hw-decade-pill"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={`Jump to decade: ${entries.find((e) => e.id === activeId)?.label ?? entries[0]?.label}`}
        >
          <Image
            src="/timeline-icon.svg"
            alt="Timeline"
            width={20}
            height={20}
            className="timeline-icon"
          />
          <span className="caret" />
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
    </>
  );
}
