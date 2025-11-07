"use client";
import { useMemo, useState, useEffect } from "react";
import { Search } from "lucide-react";
import MemoryCard from "./MemoryCard";
import ActionBar from "./ActionBar";

type Memory = {
  id: string;
  title: string;
  year: number;
  age?: number;
  durationSec?: number;
  hasAudio?: boolean;
  onTimeline: boolean;
  inBook: boolean;
  favorited?: boolean;
  thumbUrl: string;
};

type Props = {
  items: Memory[];
  onBulkDelete?: (ids: string[]) => void;
  onBulkFavorite?: (ids: string[]) => void;
  onBulkMove?: (ids: string[]) => void;
  onOpen: (id: string) => void;
  onToggleTimeline: (id: string) => void;
  onToggleBook: (id: string) => void;
  onListen?: (id: string) => void;
  onEdit?: (id: string) => void;
  onFavorite?: (id: string) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
};

/**
 * MemoryList - Compact Scannable Grid
 *
 * Architecture decisions:
 * - Set-based selection: O(1) lookup performance with 100+ memories
 * - useMemo for filtering: Prevents recalculation on every render
 * - Horizontal filter scroll: Mobile pattern (no vertical space waste)
 * - Search right-aligned: Desktop users scan left→right, search last
 * - Grid: 1 col mobile, 2 col tablet, 3 col desktop (optimal card width)
 *
 * State management:
 * - Local search/filter state: No need for global state
 * - Selection state: Set for fast has() checks during render
 * - Filtered list: useMemo with [items, q, filter] dependencies
 *
 * Accessibility:
 * - role="list" on grid for screen readers
 * - aria-live on results count
 * - Keyboard: Escape exits action mode
 * - Focus management: Maintain scroll position after selection
 *
 * Performance:
 * - Filter computation: O(n) only when items/filter changes
 * - Selection toggle: O(1) Set operations
 * - Card memoization: Prevents re-render cascade
 */
export default function MemoryList({
  items,
  onBulkDelete,
  onBulkFavorite,
  onBulkMove,
  onOpen,
  onToggleTimeline,
  onToggleBook,
  onListen,
  onEdit,
  onDuplicate,
  onFavorite,
  onDelete,
}: Props) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<
    "all" | "book" | "timeline" | "favorites"
  >("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Filter logic with useMemo for performance
  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return items.filter((m) => {
      // Search filter
      const passQ = !ql || m.title.toLowerCase().includes(ql);

      // Category filter
      const passF =
        filter === "all"
          ? true
          : filter === "book"
            ? m.inBook
            : filter === "timeline"
              ? m.onTimeline
              : m.favorited === true;

      return passQ && passF;
    });
  }, [items, q, filter]);

  // Action mode active when selections exist
  const inActionMode = selected.size > 0;

  // Selection toggle with Set for O(1) performance
  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // Clear selection on Escape key (global listener)
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && inActionMode) {
        setSelected(new Set());
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [inActionMode]);

  // Add bottom padding when ActionBar is visible
  const gridPaddingClass = inActionMode ? "pb-24" : "";

  return (
    <div className="space-y-3">
      {/* Header + filters */}
      <div className="px-3 py-2">
        <h1 className="text-2xl font-bold text-gray-900">Memory Box</h1>
        <p className="text-sm text-slate-600 mt-1">
          Manage your stories. Choose Timeline and Book anytime.
        </p>

        {/* Filter pills + search */}
        <div className="mt-4 flex items-center gap-3">
          {/* Filter pills - Horizontal scroll on mobile */}
          <div className="flex items-center gap-2 overflow-x-auto flex-1 pb-1">
            {[
              { key: "all", label: "All", icon: "📚" },
              { key: "book", label: "In Book", icon: "📖" },
              { key: "timeline", label: "On Timeline", icon: "📅" },
              { key: "favorites", label: "Favorites", icon: "⭐" },
            ].map((f) => {
              const active = filter === f.key;
              return (
                <button
                  key={f.key}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    active
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                  }`}
                  style={{ minHeight: "44px", minWidth: "44px" }}
                  onClick={() => setFilter(f.key as any)}
                  aria-pressed={active}
                  aria-label={`Filter: ${f.label}`}
                >
                  <span className="mr-1" aria-hidden="true">
                    {f.icon}
                  </span>
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* Search input - Right side for desktop efficiency */}
          <div className="relative shrink-0 w-full md:w-56">
            <input
              className="w-full rounded-full border-2 border-slate-200 bg-white pl-10 pr-4 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-400/20 transition-all"
              style={{ minHeight: "44px" }}
              placeholder="Search memories..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search memories"
            />
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Results count - Screen reader announcement */}
        <div className="mt-2 text-sm text-slate-600" aria-live="polite">
          {filtered.length === items.length
            ? `${filtered.length} memories`
            : `${filtered.length} of ${items.length} memories`}
        </div>
      </div>

      {/* Grid - Responsive columns */}
      <div
        role="list"
        className={`grid grid-cols-1 gap-4 px-3 md:grid-cols-2 xl:grid-cols-3 ${gridPaddingClass}`}
      >
        {filtered.length === 0 ? (
          // Empty state
          <div className="col-span-full text-center py-12">
            <div className="text-6xl mb-4" aria-hidden="true">
              📦
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No memories found
            </h3>
            <p className="text-sm text-gray-600">
              {q
                ? "Try adjusting your search"
                : "Start recording your stories"}
            </p>
          </div>
        ) : (
          filtered.map((m) => (
            <MemoryCard
              key={m.id}
              memory={m}
              selected={selected.has(m.id)}
              onToggleSelect={toggleSelect}
              onToggleTimeline={onToggleTimeline}
              onToggleBook={onToggleBook}
              onOpen={onOpen}
              onListen={onListen}
              onEdit={onEdit}
              onFavorite={onFavorite}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
            />
          ))
        )}
      </div>

      {/* Action bar - Shows when items selected */}
      {inActionMode && (
        <ActionBar
          count={selected.size}
          onListen={
            onListen
              ? () => {
                  Array.from(selected).forEach(onListen);
                  setSelected(new Set());
                }
              : undefined
          }
          onFavorite={
            onBulkFavorite
              ? () => {
                  onBulkFavorite(Array.from(selected));
                  setSelected(new Set());
                }
              : undefined
          }
          onDelete={
            onBulkDelete
              ? () => {
                  onBulkDelete(Array.from(selected));
                  setSelected(new Set());
                }
              : undefined
          }
          onMove={
            onBulkMove
              ? () => {
                  onBulkMove(Array.from(selected));
                  setSelected(new Set());
                }
              : undefined
          }
          onExit={() => setSelected(new Set())}
        />
      )}
    </div>
  );
}
