import React from 'react';

interface PageProps {
  children: React.ReactNode;
  index: number;
  total: number;
  className?: string;
  side?: 'left' | 'right'; // Left = even pages (gutter on right), Right = odd pages (gutter on left)
}

/**
 * Page component - Renders a single 5.5×8.5 half-letter page
 *
 * Fixed dimensions: 5.5" × 8.5" (528px × 816px at 96 DPI)
 * Asymmetric margins for book binding:
 * - Left pages (even): gutter on right side
 * - Right pages (odd): gutter on left side
 */
export default function Page({ children, index, total, className = '', side }: PageProps) {
  // Auto-detect side based on page number if not specified
  // Page 0 (cover) = right, Page 1 = left, Page 2 = right, etc.
  const pageSide = side || (index % 2 === 0 ? 'right' : 'left');

  return (
    <section
      className={`page ${pageSide} ${className}`}
      role="article"
      aria-label={`Page ${index + 1} of ${total}`}
    >
      <div className="page-content">
        {children}
      </div>
      <div className="page-number">
        {index + 1}
      </div>
    </section>
  );
}
