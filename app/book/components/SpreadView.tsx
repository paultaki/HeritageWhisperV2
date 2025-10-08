import React from 'react';
import Page from './Page';

interface SpreadViewProps {
  leftPage: {
    index: number;
    children: React.ReactNode;
  };
  rightPage: {
    index: number;
    children: React.ReactNode;
  };
  totalPages: number;
  className?: string;
}

/**
 * SpreadView - Renders two facing pages side-by-side
 *
 * Creates a book spread with proper gutter margins:
 * - Left page has gutter on the right (binding side)
 * - Right page has gutter on the left (binding side)
 *
 * Total width: 1080px (528px + 24px gap + 528px)
 */
export default function SpreadView({
  leftPage,
  rightPage,
  totalPages,
  className = '',
}: SpreadViewProps) {
  return (
    <div className={`spread ${className}`}>
      <Page
        index={leftPage.index}
        total={totalPages}
        side="left"
      >
        {leftPage.children}
      </Page>
      <Page
        index={rightPage.index}
        total={totalPages}
        side="right"
      >
        {rightPage.children}
      </Page>
    </div>
  );
}
