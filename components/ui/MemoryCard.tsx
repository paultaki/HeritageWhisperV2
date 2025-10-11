"use client";
import React, { useState, useRef, useEffect } from "react";

type Props = {
  imageUrl: string;
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
  return (
    <article className="hw-card hw-card-memorybox">
      <div style={{ position: "relative" }}>
        <img
          className="hw-card-media"
          src={p.imageUrl}
          alt=""
          loading="lazy"
          decoding="async"
        />
        <button
          className="hw-play hw-play-desktop"
          aria-label="Play memory"
          onClick={p.onPlay}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 5l11 7-11 7V5z" />
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
            <div style={{ display: "flex", gap: "6px" }}>
              {p.onToggleTimeline && (
                <button
                  className={`hw-chip ${p.inTimeline ? "active" : ""}`}
                  onClick={p.onToggleTimeline}
                  aria-label="Toggle timeline"
                >
                  Timeline
                </button>
              )}
              {p.onToggleBook && (
                <button
                  className={`hw-chip ${p.inBook ? "active" : ""}`}
                  onClick={p.onToggleBook}
                  aria-label="Toggle book"
                >
                  Book
                </button>
              )}
            </div>
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <button
                className="hw-icon-btn hw-play-mobile"
                aria-label="Play memory"
                onClick={p.onPlay}
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  width="18"
                  height="18"
                >
                  <path d="M8 5l11 7-11 7V5z" fill="var(--color-accent)" />
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
