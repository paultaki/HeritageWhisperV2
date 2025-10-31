"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Page from "./Page";

// Content types that can be paginated
export type ContentBlock = {
  type:
    | "text"
    | "heading"
    | "image"
    | "audio"
    | "callout"
    | "toc-item"
    | "chapter"
    | "page-break";
  content: string | React.ReactNode;
  noBreak?: boolean; // Don't split this block across pages
  pageBreakBefore?: boolean; // Force a new page before this block
  pageBreakAfter?: boolean; // Force a new page after this block
  id?: string;
};

interface AutoPaginatorProps {
  blocks: ContentBlock[];
  pageHeader?: React.ReactNode;
  pageFooter?: React.ReactNode;
  className?: string;
}

// Page dimensions (must match CSS)
// 5.5×8.5 page: 816px height - 58px top - 58px bottom = 700px content area
const CONTENT_HEIGHT = 700;

/**
 * AutoPaginator - Automatically splits content across Letter-sized pages
 *
 * Simple height-based pagination that estimates block heights
 */
export default function AutoPaginator({
  blocks,
  pageHeader,
  pageFooter,
  className = "",
}: AutoPaginatorProps) {
  const [pages, setPages] = useState<ContentBlock[][]>([]);

  // Estimate height for a block
  const estimateBlockHeight = useCallback((block: ContentBlock): number => {
    switch (block.type) {
      case "heading":
        return 40; // ~40px for heading
      case "text":
        // Estimate based on text length
        if (typeof block.content === "string") {
          const lines = Math.ceil(block.content.length / 80); // ~80 chars per line
          return lines * 20 + 12; // ~20px per line + 12px margin
        }
        return 60; // Default text height
      case "image":
        // 16:10 aspect ratio at full content width (~412px) = ~257px height + margins
        return 280;
      case "audio":
        return 100; // 80px + margins
      case "callout":
        return 140; // 120px + margins
      case "toc-item":
        return 40; // ~40px per TOC item
      default:
        return 40;
    }
  }, []);

  // Paginate blocks based on height estimates
  useEffect(() => {
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

      // Check if adding this block would exceed page height
      if (potentialHeight > CONTENT_HEIGHT && currentPage.length > 0) {
        // Start new page
        paginatedPages.push([...currentPage]);
        currentPage = [block];
        currentHeight = blockHeight;
      } else {
        // Add to current page
        currentPage.push(block);
        currentHeight = potentialHeight;
      }

      // Force new page after no-break block if close to page limit
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

    // Add last page if it has content
    if (currentPage.length > 0) {
      paginatedPages.push(currentPage);
    }

    setPages(paginatedPages);
  }, [blocks, estimateBlockHeight]);

  // Show loading state while paginating
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
      {pages.map((pageBlocks, pageIndex) => (
        <Page
          key={pageIndex}
          index={pageIndex}
          total={pages.length}
          className={className}
        >
          {pageHeader}
          <div className="book-text" lang="en">
            {pageBlocks.map((block, blockIndex) => (
              <BlockRenderer key={`${pageIndex}-${blockIndex}`} block={block} />
            ))}
          </div>
          {pageFooter}
        </Page>
      ))}
    </>
  );
}

// Helper: Get CSS class for block type
function getBlockClassName(type: ContentBlock["type"]): string {
  switch (type) {
    case "heading":
      return "book-heading";
    case "text":
      return "book-text";
    case "image":
      return "book-image no-break";
    case "audio":
      return "book-audio-player no-break";
    case "callout":
      return "book-callout no-break";
    case "toc-item":
      return "toc-item";
    default:
      return "";
  }
}

// Helper: Render individual block
function BlockRenderer({ block }: { block: ContentBlock }) {
  const className = getBlockClassName(block.type);

  if (block.type === "heading") {
    return <h2 className={className}>{block.content}</h2>;
  }

  if (block.type === "text") {
    return <p className={className}>{block.content}</p>;
  }

  if (block.type === "toc-item") {
    return <div className={className}>{block.content}</div>;
  }

  // For rich content (images, audio, etc.), render the React node directly
  return <div className={className}>{block.content}</div>;
}
