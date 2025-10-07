"use client";

import React, { useState } from "react";
import { FileText } from "lucide-react";

export type BookNavEntry = {
  id: string;
  label: string;
  pageNumber: number;
  isTOC?: boolean;
};

type Props = {
  entries: BookNavEntry[];
  currentPage: number;
  onNavigate: (pageNumber: number) => void;
};

export default function BookNav({ entries, currentPage, onNavigate }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Find the active entry based on current page
  const activeEntry = entries.reduce((prev, curr) => {
    if (curr.pageNumber <= currentPage) {
      return curr;
    }
    return prev;
  }, entries[0]);

  return (
    <>
      {/* Desktop: Fixed side navigation - collapsed by default */}
      <nav className="hw-book-nav hidden md:flex">
        {!isExpanded ? (
          <button
            className="hw-decade-pill"
            onClick={() => setIsExpanded(true)}
            aria-label="Show chapters"
          >
            {activeEntry?.isTOC ? (
              <>
                <FileText className="w-4 h-4" />
                <span className="ml-1">TOC</span>
              </>
            ) : (
              <span>{activeEntry?.label}</span>
            )}
            <span className="caret"></span>
          </button>
        ) : (
          <div className="hw-decade-list">
            {entries.map((entry) => (
              <button
                key={entry.id}
                onClick={() => {
                  onNavigate(entry.pageNumber);
                  setIsExpanded(false);
                }}
                className="hw-decade-item"
                aria-current={activeEntry?.id === entry.id ? "true" : "false"}
              >
                {entry.isTOC ? (
                  <FileText className="w-4 h-4" />
                ) : (
                  <span>{entry.label}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* Mobile: Floating pill that expands */}
      <div className="hw-decade-fab md:hidden">
        {!isExpanded ? (
          <button
            className="hw-decade-pill"
            onClick={() => setIsExpanded(true)}
            aria-label="Show chapters"
          >
            {activeEntry?.isTOC ? (
              <>
                <FileText className="w-4 h-4" />
                <span className="ml-1">TOC</span>
              </>
            ) : (
              <span>{activeEntry?.label}</span>
            )}
            <span className="caret"></span>
          </button>
        ) : (
          <div className="hw-decade-sheet">
            {entries.map((entry) => (
              <button
                key={entry.id}
                onClick={() => {
                  onNavigate(entry.pageNumber);
                  setIsExpanded(false);
                }}
                className="hw-decade-item"
                aria-current={activeEntry?.id === entry.id ? "true" : "false"}
              >
                {entry.isTOC ? (
                  <>
                    <FileText className="w-4 h-4" />
                    <span className="ml-1 text-xs">TOC</span>
                  </>
                ) : (
                  <span>{entry.label}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Backdrop to close expanded menu */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => setIsExpanded(false)}
          aria-label="Close navigation"
        />
      )}
    </>
  );
}
