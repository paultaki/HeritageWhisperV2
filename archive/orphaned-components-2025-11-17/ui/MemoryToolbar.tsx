"use client";
import React, { useState } from "react";

type FilterMode = "all" | "favorites" | "timeline" | "book" | "undated" | "private";

type Props = {
  stats: { label: string; value: number }[];
  view: "grid" | "list";
  setView: (v: "grid" | "list") => void;
  filter: string;
  setFilter: (s: string) => void;
  sort: string;
  setSort: (s: string) => void;
  filterMode?: FilterMode;
  setFilterMode?: (mode: FilterMode) => void;
};

export default function MemoryToolbar(props: Props) {
  const handleChipClick = (chipName: FilterMode) => {
    // Toggle: if already active, deactivate it; otherwise activate it
    const newMode = props.filterMode === chipName ? "all" : chipName;
    if (props.setFilterMode) {
      props.setFilterMode(newMode);
    }
  };

  return (
    <header className="hw-toolbar">
      <div className="hw-kpi-row">
        {props.stats.map((s) => (
          <div key={s.label} className="hw-kpi">
            <div className="n">{s.value}</div>
            <div className="l">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="hw-toolbar-row">
        <div className="hw-chip-grid">
          <button
            className={`hw-chip selectable ${props.filterMode === "all" || !props.filterMode ? "active" : ""}`}
            onClick={() => handleChipClick("all")}
          >
            All
          </button>
          <button
            className={`hw-chip selectable ${props.filterMode === "favorites" ? "active" : ""}`}
            onClick={() => handleChipClick("favorites")}
          >
            ⭐ Favorites
          </button>
          <button
            className={`hw-chip selectable ${props.filterMode === "timeline" ? "active" : ""}`}
            onClick={() => handleChipClick("timeline")}
          >
            Timeline
          </button>
          <button
            className={`hw-chip selectable ${props.filterMode === "book" ? "active" : ""}`}
            onClick={() => handleChipClick("book")}
          >
            Book
          </button>
          <button
            className={`hw-chip selectable ${props.filterMode === "undated" ? "active" : ""}`}
            onClick={() => handleChipClick("undated")}
          >
            No date
          </button>
          <button
            className={`hw-chip selectable warn ${props.filterMode === "private" ? "active" : ""}`}
            onClick={() => handleChipClick("private")}
          >
            Private
          </button>
        </div>

        <div className="hw-controls" suppressHydrationWarning>
          <input
            className="hw-search"
            placeholder="Search"
            value={props.filter}
            onChange={(e) => props.setFilter(e.target.value)}
            suppressHydrationWarning
          />
          <select
            className="hw-select"
            value={props.sort}
            onChange={(e) => props.setSort(e.target.value)}
            suppressHydrationWarning
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
              className={props.view === "grid" ? "on" : ""}
              onClick={() => props.setView("grid")}
              suppressHydrationWarning
            >
              Grid
            </button>
            <button
              className={props.view === "list" ? "on" : ""}
              onClick={() => props.setView("list")}
              suppressHydrationWarning
            >
              List
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
