"use client";

import React from "react";

type PageStackProps = {
  side: "left" | "right";
  className?: string;
};

/**
 * Page Stack Lines
 *
 * Creates subtle vertical lines on the outer edge of pages to simulate
 * the appearance of stacked pages in a book.
 *
 * Uses ::before and ::after pseudo-elements for the lines.
 * Hidden on mobile for performance.
 */
export default function PageStack({
  side,
  className = ""
}: PageStackProps) {
  const stackClass = side === "left"
    ? "book-page-stack-left"
    : "book-page-stack-right";

  return (
    <div
      className={`${stackClass} ${className}`}
      aria-hidden="true"
    />
  );
}
