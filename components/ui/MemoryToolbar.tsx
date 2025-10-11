"use client";
import React, { useState } from "react";

type Props = {
  stats: { label: string; value: number }[];
  view: "grid" | "list";
  setView: (v: "grid" | "list") => void;
  filter: string;
  setFilter: (s: string) => void;
  sort: string;
  setSort: (s: string) => void;
  filterMode?: string;
  setFilterMode?: (mode: string) => void;
};

export default function MemoryToolbar(p: Props) {
  const handleChipClick = (chipName: string) => {
    // Toggle: if already active, deactivate it; otherwise activate it
    const newMode = p.filterMode === chipName ? "all" : chipName;
    if (p.setFilterMode) {
      p.setFilterMode(newMode);
    }
  };

  return (
    <header className="hw-toolbar">
      <div className="hw-kpi-row">
        {p.stats.map((s) => (
          <div key={s.label} className="hw-kpi">
            <div className="n">{s.value}</div>
            <div className="l">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="hw-toolbar-row">
        <div className="hw-chip-grid">
          <button
            className={`hw-chip selectable ${p.filterMode === "all" || !p.filterMode ? "active" : ""}`}
            onClick={() => handleChipClick("all")}
          >
            All
          </button>
          <button
            className={`hw-chip selectable ${p.filterMode === "favorites" ? "active" : ""}`}
            onClick={() => handleChipClick("favorites")}
          >
            ⭐ Favorites
          </button>
          <button
            className={`hw-chip selectable ${p.filterMode === "timeline" ? "active" : ""}`}
            onClick={() => handleChipClick("timeline")}
          >
            Timeline
          </button>
          <button
            className={`hw-chip selectable ${p.filterMode === "book" ? "active" : ""}`}
            onClick={() => handleChipClick("book")}
          >
            Book
          </button>
          <button
            className={`hw-chip selectable ${p.filterMode === "undated" ? "active" : ""}`}
            onClick={() => handleChipClick("undated")}
          >
            No date
          </button>
          <button
            className={`hw-chip selectable warn ${p.filterMode === "private" ? "active" : ""}`}
            onClick={() => handleChipClick("private")}
          >
            Private
          </button>
        </div>

        <div className="hw-controls">
          <input
            className="hw-search"
            placeholder="Search"
            value={p.filter}
            onChange={(e) => p.setFilter(e.target.value)}
          />
          <select
            className="hw-select"
            value={p.sort}
            onChange={(e) => p.setSort(e.target.value)}
          >
            <option value="year-newest">By Year: Newest → Oldest</option>
            <option value="year-oldest">
              By Year: Oldest → Newest (Timeline)
            </option>
            <option value="added-newest">Recently Added</option>
            <option value="added-oldest">First Added</option>
            <option value="title">Title A-Z</option>
            <option value="duration">Duration: Longest First</option>
          </select>
          <div className="hw-toggle">
            <button
              className={p.view === "grid" ? "on" : ""}
              onClick={() => p.setView("grid")}
            >
              Grid
            </button>
            <button
              className={p.view === "list" ? "on" : ""}
              onClick={() => p.setView("list")}
            >
              List
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
