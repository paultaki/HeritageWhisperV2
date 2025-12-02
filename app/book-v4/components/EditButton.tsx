"use client";

import React from "react";
import { Pencil } from "lucide-react";

type EditButtonProps = {
  onClick: () => void;
  className?: string;
  ariaLabel?: string;
};

/**
 * Hover-Only Edit Button
 *
 * A corner-positioned pencil icon button that appears on hover.
 * Designed for non-intrusive editing access on story pages.
 *
 * Features:
 * - opacity-0 by default, opacity-100 on parent :hover or :focus
 * - Requires parent to have 'group' class for hover state
 * - Circular button with subtle glass effect
 * - Focus ring for keyboard accessibility
 *
 * Usage:
 * <div className="group relative">
 *   <EditButton onClick={() => handleEdit(storyId)} />
 *   ... page content ...
 * </div>
 */
export default function EditButton({
  onClick,
  className = "",
  ariaLabel = "Edit story"
}: EditButtonProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`book-edit-button ${className}`}
      aria-label={ariaLabel}
    >
      <Pencil className="h-4 w-4 text-gray-600" />
    </button>
  );
}
