'use client';

import React, { useMemo } from 'react';
import AutoPaginator, { ContentBlock } from './AutoPaginator';
import SpreadView from './SpreadView';
import Page from './Page';

interface SpreadPaginatorProps {
  blocks: ContentBlock[];
  pageHeader?: React.ReactNode;
  pageFooter?: React.ReactNode;
  className?: string;
  viewMode: 'single' | 'spread';
}

/**
 * SpreadPaginator - Wraps AutoPaginator to support both single and spread views
 *
 * In single mode: Renders pages individually
 * In spread mode: Groups pages into two-page spreads
 */
export default function SpreadPaginator({
  blocks,
  pageHeader,
  pageFooter,
  className = '',
  viewMode,
}: SpreadPaginatorProps) {
  // For single page view, just use AutoPaginator as-is
  if (viewMode === 'single') {
    return (
      <AutoPaginator
        blocks={blocks}
        pageHeader={pageHeader}
        pageFooter={pageFooter}
        className={className}
      />
    );
  }

  // For spread view, we need to render pages grouped into spreads
  // We'll still use AutoPaginator to get the paginated content, but render differently
  return (
    <SpreadRenderer
      blocks={blocks}
      pageHeader={pageHeader}
      pageFooter={pageFooter}
      className={className}
    />
  );
}

/**
 * SpreadRenderer - Renders content in spread view
 * Uses the same pagination logic as AutoPaginator but groups into spreads
 */
function SpreadRenderer({
  blocks,
  pageHeader,
  pageFooter,
  className = '',
}: Omit<SpreadPaginatorProps, 'viewMode'>) {
  const [pages, setPages] = React.useState<ContentBlock[][]>([]);

  // Same pagination logic as AutoPaginator
  const CONTENT_HEIGHT = 700;

  const estimateBlockHeight = React.useCallback((block: ContentBlock): number => {
    switch (block.type) {
      case 'heading':
        return 40;
      case 'text':
        if (typeof block.content === 'string') {
          const lines = Math.ceil(block.content.length / 80);
          return lines * 20 + 12;
        }
        return 60;
      case 'image':
        // 16:10 aspect ratio at full content width (~412px) = ~257px height + margins
        return 280;
      case 'audio':
        return 100;
      case 'callout':
        return 140;
      case 'toc-item':
        return 40;
      default:
        return 40;
    }
  }, []);

  React.useEffect(() => {
    if (blocks.length === 0) {
      setPages([]);
      return;
    }

    const paginatedPages: ContentBlock[][] = [];
    let currentPage: ContentBlock[] = [];
    let currentHeight = 0;

    blocks.forEach((block) => {
      const blockHeight = estimateBlockHeight(block);
      const potentialHeight = currentHeight + blockHeight;

      // Force new page before this block if specified
      if (block.pageBreakBefore && currentPage.length > 0) {
        paginatedPages.push([...currentPage]);
        currentPage = [];
        currentHeight = 0;
      }

      if (potentialHeight > CONTENT_HEIGHT && currentPage.length > 0) {
        paginatedPages.push([...currentPage]);
        currentPage = [block];
        currentHeight = blockHeight;
      } else {
        currentPage.push(block);
        currentHeight = potentialHeight;
      }

      if (block.noBreak && potentialHeight > CONTENT_HEIGHT * 0.85) {
        paginatedPages.push([...currentPage]);
        currentPage = [];
        currentHeight = 0;
      }

      // Force new page after this block if specified
      if (block.pageBreakAfter) {
        paginatedPages.push([...currentPage]);
        currentPage = [];
        currentHeight = 0;
      }
    });

    if (currentPage.length > 0) {
      paginatedPages.push(currentPage);
    }

    setPages(paginatedPages);
  }, [blocks, estimateBlockHeight]);

  // Group pages into spreads
  const spreads = useMemo(() => {
    const result: Array<{ left: number; right: number }> = [];
    for (let i = 0; i < pages.length; i += 2) {
      result.push({
        left: i,
        right: i + 1,
      });
    }
    return result;
  }, [pages.length]);

  if (pages.length === 0 && blocks.length > 0) {
    return (
      <Page index={0} total={1}>
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">Preparing pages...</p>
        </div>
      </Page>
    );
  }

  return (
    <>
      {spreads.map((spread, spreadIndex) => {
        const leftPageBlocks = pages[spread.left];
        const rightPageBlocks = spread.right < pages.length ? pages[spread.right] : null;

        if (!rightPageBlocks) {
          // Odd number of pages - render last page solo
          return (
            <Page
              key={spread.left}
              index={spread.left}
              total={pages.length}
              className={className}
            >
              {pageHeader}
              <div className="book-text" lang="en">
                {leftPageBlocks.map((block, blockIndex) => (
                  <BlockRenderer key={`${spread.left}-${blockIndex}`} block={block} />
                ))}
              </div>
              {pageFooter}
            </Page>
          );
        }

        return (
          <SpreadView
            key={`spread-${spreadIndex}`}
            leftPage={{
              index: spread.left,
              children: (
                <>
                  {pageHeader}
                  <div className="book-text" lang="en">
                    {leftPageBlocks.map((block, blockIndex) => (
                      <BlockRenderer key={`${spread.left}-${blockIndex}`} block={block} />
                    ))}
                  </div>
                  {pageFooter}
                </>
              ),
            }}
            rightPage={{
              index: spread.right,
              children: (
                <>
                  {pageHeader}
                  <div className="book-text" lang="en">
                    {rightPageBlocks.map((block, blockIndex) => (
                      <BlockRenderer key={`${spread.right}-${blockIndex}`} block={block} />
                    ))}
                  </div>
                  {pageFooter}
                </>
              ),
            }}
            totalPages={pages.length}
            className={className}
          />
        );
      })}
    </>
  );
}

// Helper: Get CSS class for block type
function getBlockClassName(type: ContentBlock['type']): string {
  switch (type) {
    case 'heading':
      return 'book-heading';
    case 'text':
      return 'book-text';
    case 'image':
      return 'book-image no-break';
    case 'audio':
      return 'book-audio-player no-break';
    case 'callout':
      return 'book-callout no-break';
    case 'toc-item':
      return 'toc-item';
    default:
      return '';
  }
}

// Helper: Render individual block
function BlockRenderer({ block }: { block: ContentBlock }) {
  const className = getBlockClassName(block.type);

  if (block.type === 'heading') {
    return <h2 className={className}>{block.content}</h2>;
  }

  if (block.type === 'text') {
    return <p className={className}>{block.content}</p>;
  }

  if (block.type === 'toc-item') {
    return <div className={className}>{block.content}</div>;
  }

  return <div className={className}>{block.content}</div>;
}
