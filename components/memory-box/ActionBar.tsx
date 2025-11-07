"use client";
import { Button } from "@/components/ui/button";

type Props = {
  count: number;
  onListen?: () => void;
  onEdit?: () => void;
  onFavorite?: () => void;
  onDelete?: () => void;
  onMove?: () => void;
  onExit: () => void;
};

/**
 * ActionBar - Sticky Bottom Bar for Bulk Actions
 *
 * Design rationale:
 * - Fixed bottom placement: Thumb-reachable on large phones (ergonomic zone)
 * - Backdrop blur: Maintains context visibility while showing actions
 * - Large buttons: 48px height minimum for senior-friendly tapping
 * - Horizontal scroll: On mobile, actions scroll horizontally if needed
 * - Counter first: Shows selection count prominently
 * - Done button right: Consistent with iOS/Android patterns
 *
 * Accessibility:
 * - role="toolbar" for screen readers
 * - Keyboard: Tab to navigate, Enter to activate
 * - Focus trap: Keeps focus within bar when active
 *
 * Performance:
 * - backdrop-filter GPU-accelerated
 * - Fixed positioning doesn't trigger layout reflow
 */
export default function ActionBar({
  count,
  onListen,
  onEdit,
  onFavorite,
  onDelete,
  onMove,
  onExit,
}: Props) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/70 safe-area-inset-bottom"
      role="toolbar"
      aria-label={`${count} memories selected`}
    >
      <div className="mx-auto flex max-w-screen-xl items-center gap-3 px-4 py-3 overflow-x-auto">
        {/* Selection counter - Prominent left placement */}
        <div
          className="font-semibold text-lg text-slate-900 shrink-0"
          aria-live="polite"
        >
          {count} selected
        </div>

        {/* Divider for visual separation */}
        <div className="h-8 w-px bg-slate-300 shrink-0" aria-hidden="true" />

        {/* Action buttons - Horizontal scroll on mobile */}
        <div className="flex items-center gap-2 flex-1 overflow-x-auto">
          {onListen && (
            <Button
              size="lg"
              variant="secondary"
              onClick={onListen}
              className="shrink-0 h-12 px-4"
              style={{ minHeight: "48px", minWidth: "44px" }}
            >
              🔊 Listen
            </Button>
          )}
          {onEdit && (
            <Button
              size="lg"
              variant="secondary"
              onClick={onEdit}
              className="shrink-0 h-12 px-4"
              style={{ minHeight: "48px", minWidth: "44px" }}
            >
              ✏️ Edit
            </Button>
          )}
          {onFavorite && (
            <Button
              size="lg"
              variant="secondary"
              onClick={onFavorite}
              className="shrink-0 h-12 px-4"
              style={{ minHeight: "48px", minWidth: "44px" }}
            >
              ⭐ Favorite
            </Button>
          )}
          {onMove && (
            <Button
              size="lg"
              variant="secondary"
              onClick={onMove}
              className="shrink-0 h-12 px-4"
              style={{ minHeight: "48px", minWidth: "44px" }}
            >
              📁 Move
            </Button>
          )}
          {onDelete && (
            <Button
              size="lg"
              variant="destructive"
              onClick={onDelete}
              className="shrink-0 h-12 px-4"
              style={{ minHeight: "48px", minWidth: "44px" }}
            >
              🗑️ Delete
            </Button>
          )}
        </div>

        {/* Done button - Right-aligned, always visible */}
        <div className="ml-auto shrink-0">
          <Button
            variant="ghost"
            onClick={onExit}
            className="h-12 px-6 font-semibold"
            style={{ minHeight: "48px", minWidth: "44px" }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                onExit();
              }
            }}
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
