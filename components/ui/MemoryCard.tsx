"use client";
import React, { useState, useRef, useEffect } from "react";

type Props = {
  id?: string;
  imageUrl: string;
  photoTransform?: { zoom: number; position: { x: number; y: number } };
  title: string;
  year: number | string;
  age?: string;
  category?: string;
  isPrivate?: boolean;
  isFavorite?: boolean;
  inTimeline?: boolean;
  inBook?: boolean;
  duration?: string;
  onPlay?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleFavorite?: () => void;
  onToggleTimeline?: () => void;
  onToggleBook?: () => void;
};

export default function MemoryCard(p: Props) {
  const [showMenu, setShowMenu] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  // Register with AudioManager to track playing state
  useEffect(() => {
    if (!p.id) return;

    // Import AudioManager dynamically to avoid SSR issues
    const AudioManager = (window as any).AudioManager;
    if (!AudioManager) return;

    const manager = AudioManager.getInstance();
    manager.register(p.id, (playing: boolean) => {
      setIsPlaying(playing);
    });

    return () => {
      manager.unregister(p.id);
    };
  }, [p.id]);
  return (
    <article className="hw-card hw-card-memorybox">
      <div style={{ position: "relative", overflow: "hidden" }}>
        <img
          className="hw-card-media"
          src={p.imageUrl}
          alt=""
          loading="lazy"
          decoding="async"
          style={
            p.photoTransform
              ? {
                  transform: `scale(${p.photoTransform.zoom}) translate(${p.photoTransform.position.x / p.photoTransform.zoom}px, ${p.photoTransform.position.y / p.photoTransform.zoom}px)`,
                  transformOrigin: "center center",
                }
              : undefined
          }
        />
        {/* Play/Pause button overlaid on photo - matching timeline style */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            p.onPlay?.();
          }}
          aria-label={isPlaying ? "Pause memory" : "Play memory"}
          className="hw-play-desktop absolute bottom-3 right-3 flex-shrink-0 w-11 h-11 rounded-full bg-gray-500/40 backdrop-blur-sm hover:bg-gray-500/60 flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-110 cursor-pointer"
          style={{ pointerEvents: 'auto' }}
        >
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ pointerEvents: 'none' }}>
            <circle cx="14" cy="14" r="13" fill="white" fillOpacity="0.9" />
            {isPlaying ? (
              // Pause icon - two bars
              <>
                <rect x="10" y="9" width="3" height="10" fill="#fb923c" />
                <rect x="15" y="9" width="3" height="10" fill="#fb923c" />
              </>
            ) : (
              // Play icon - triangle
              <polygon points="11,9 11,19 19,14" fill="#fb923c" />
            )}
          </svg>
        </button>
      </div>

      <div className="hw-card-body">
        <div className="flex items-start justify-between gap-2">
          <h3 className="hw-card-title flex-1">{p.title}</h3>
          {p.isFavorite && (
            <span
              className="text-yellow-500 text-lg leading-none"
              aria-label="Favorite"
            >
              ⭐
            </span>
          )}
        </div>

        <div className="hw-meta">
          <span>{p.year}</span>
          <span className="divider"></span>
          {p.age && (
            <>
              <span>Age {p.age}</span>
              <span className="divider"></span>
            </>
          )}
          {p.category && <span>{p.category}</span>}
          {p.duration && (
            <>
              <span className="divider"></span>
              <span>{p.duration}</span>
            </>
          )}
        </div>

        {/* Timeline/Book toggles with play and menu buttons */}
        {(p.onToggleTimeline || p.onToggleBook) && (
          <div className="hw-card-actions-row">
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              {p.onToggleTimeline && (
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    cursor: "pointer",
                    fontSize: "14px",
                    color: "#1f0f08",
                    userSelect: "none",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={p.inTimeline}
                    onChange={(e) => {
                      e.stopPropagation();
                      p.onToggleTimeline?.();
                    }}
                    style={{
                      width: "16px",
                      height: "16px",
                      cursor: "pointer",
                      accentColor: "#fb923c",
                    }}
                    aria-label="Include in timeline"
                  />
                  <span>Timeline</span>
                </label>
              )}
              {p.onToggleBook && (
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    cursor: "pointer",
                    fontSize: "14px",
                    color: "#1f0f08",
                    userSelect: "none",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={p.inBook}
                    onChange={(e) => {
                      e.stopPropagation();
                      p.onToggleBook?.();
                    }}
                    style={{
                      width: "16px",
                      height: "16px",
                      cursor: "pointer",
                      accentColor: "#fb923c",
                    }}
                    aria-label="Include in book"
                  />
                  <span>Book</span>
                </label>
              )}
            </div>
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <button
                className="hw-icon-btn hw-play-mobile"
                aria-label={isPlaying ? "Pause memory" : "Play memory"}
                onClick={p.onPlay}
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  width="18"
                  height="18"
                >
                  {isPlaying ? (
                    // Pause icon - two bars
                    <>
                      <rect x="8" y="5" width="2.5" height="14" fill="var(--color-accent)" />
                      <rect x="13.5" y="5" width="2.5" height="14" fill="var(--color-accent)" />
                    </>
                  ) : (
                    // Play icon - triangle
                    <path d="M8 5l11 7-11 7V5z" fill="var(--color-accent)" />
                  )}
                </svg>
              </button>
              <div style={{ position: "relative" }} ref={menuRef}>
                <button
                  className="hw-icon-btn"
                  aria-label="More options"
                  onClick={() => setShowMenu(!showMenu)}
                >
                  ⋯
                </button>
                {showMenu && (
                  <div className="hw-dropdown-menu">
                    <button
                      onClick={() => {
                        p.onEdit?.();
                        setShowMenu(false);
                      }}
                    >
                      ✎ Edit
                    </button>
                    <button
                      onClick={() => {
                        p.onToggleFavorite?.();
                        setShowMenu(false);
                      }}
                    >
                      {p.isFavorite ? "★" : "☆"}{" "}
                      {p.isFavorite ? "Unfavorite" : "Favorite"}
                    </button>
                    <button
                      className="danger"
                      onClick={() => {
                        p.onDelete?.();
                        setShowMenu(false);
                      }}
                    >
                      🗑 Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
