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
  scale?: number;
  className?: string;
}

/**
 * SpreadView - Renders two facing pages side-by-side with optional scaling
 *
 * Creates a premium book spread with proper gutter margins and depth.
 * Supports scaling (0.95-1.0) while maintaining readability.
 *
 * Total width: 1086px (528px + 30px gap + 528px)
 * Scaled width at 0.95: 1031.7px
 */
export default function SpreadView({
  leftPage,
  rightPage,
  totalPages,
  scale = 1.0,
  className = '',
}: SpreadViewProps) {
  return (
    <div
      className={`spread ${className}`}
      style={{
        transform: scale !== 1.0 ? `scale(${scale})` : undefined,
        transformOrigin: 'center top',
        transition: 'transform 140ms ease-out',
      }}
    >
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
