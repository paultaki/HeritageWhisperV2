/**
 * AddMemoryCard Component
 *
 * A visually cohesive card at the end of the timeline that invites users to add new content.
 * Matches existing memory card styling but uses dashed border to signal "not yet created"
 */

"use client";

import React, { useState, useEffect, useRef } from "react";
import { Camera } from "lucide-react";

type AddMemoryCardProps = {
  onCreateMemory: () => void;
  isDark?: boolean;
};

export function AddMemoryCard({ onCreateMemory, isDark = false }: AddMemoryCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Scroll-in animation using IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.2, rootMargin: "100px 0px" }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleClick = () => {
    onCreateMemory();

    // Analytics
    if (typeof window !== "undefined" && (window as any).track) {
      (window as any).track("add_memory_card_clicked", {
        location: "timeline_end",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      ref={cardRef}
      role="button"
      tabIndex={0}
      aria-label="Add a new memory to your timeline"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        max-w-full md:max-w-[448px] w-full
        bg-white rounded-2xl cursor-pointer
        transition-all duration-500
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
      `}
      style={{
        border: "1.5px dashed var(--color-timeline-card-border)",
        opacity: isHovered ? 1 : 0.85,
        boxShadow: isHovered
          ? "0 8px 20px rgba(0, 0, 0, 0.12)"
          : "0 4px 12px rgba(0, 0, 0, 0.08)",
        transform: isHovered ? "translateY(-2px)" : "translateY(0)",
      }}
    >
      {/* Photo Placeholder with Camera Icon */}
      <div
        className="flex flex-col items-center justify-center rounded-t-2xl border-b"
        style={{
          aspectRatio: "16/10",
          background: "linear-gradient(to bottom right, #f5f5f4, #e7e5e4)",
          borderColor: "#e7e5e4",
        }}
      >
        <Camera className="mb-2" size={64} strokeWidth={1.5} style={{ color: "#d6d3d1" }} />
        <p className="text-sm px-4 text-center" style={{ color: "#a8a29e" }}>
          Your next memory will appear here
        </p>
      </div>

      {/* Content Section */}
      <div className="px-4 py-4 space-y-3">
        {/* Title */}
        <h3
          className="text-[19px] font-semibold text-center"
          style={{ color: "#78716c" }}
        >
          Add a New Memory
        </h3>

        {/* Subtitle */}
        <p
          className="text-[15px] text-center mx-auto"
          style={{ color: "#a8a29e", maxWidth: "320px" }}
        >
          Record a story, upload a photo, or write about a moment
        </p>

        {/* CTA Button */}
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent double-firing from card click
            handleClick();
          }}
          className="w-full max-w-[280px] mx-auto block text-white font-semibold text-base py-3 rounded-full transition-all"
          style={{
            background: "linear-gradient(135deg, #F59E0B, #FBBF24)",
            boxShadow: isHovered
              ? "0 6px 16px rgba(245, 158, 11, 0.4)"
              : "0 4px 12px rgba(245, 158, 11, 0.3)",
            transform: isHovered ? "scale(1.02)" : "scale(1)",
          }}
          aria-label="Create a new memory"
        >
          + Create Memory
        </button>

        {/* Helper Text */}
        <p className="text-xs text-center" style={{ color: "#a8a29e" }}>
          Tap to start recording
        </p>
      </div>

      {/* Focus visible state */}
      <style jsx>{`
        div:focus-visible {
          outline: 2px solid #f59e0b;
          outline-offset: 4px;
        }
      `}</style>
    </div>
  );
}
