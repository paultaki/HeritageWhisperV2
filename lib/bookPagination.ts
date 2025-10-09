/**
 * Book Pagination System - Core Engine
 * Handles text measurement, page splitting, and visual balance for book view
 */

// ============================================================================
// CONSTANTS & MEASUREMENTS
// ============================================================================

export const MEASUREMENTS = {
  // Page dimensions (must match book.css: 5.5×8.5 at 96 DPI)
  PAGE_HEIGHT: 816,      // 8.5in × 96 DPI
  PAGE_WIDTH_DESKTOP: 528,  // 5.5in × 96 DPI (was 520, but CSS uses 528)
  PAGE_WIDTH_MOBILE: 380,

  // Page padding (matches book.css --margin)
  PAGE_PADDING_TOP: 58,
  PAGE_PADDING_BOTTOM: 58,
  PAGE_PADDING_LEFT: 38,   // Reduced from 58 for more content breathing room
  PAGE_PADDING_RIGHT: 38,

  // Content area height (816 - 58 - 58 = 700px)
  CONTENT_BOX_HEIGHT: 700,

  // Fixed elements (first page only)
  PHOTO_AREA: 240,          // Fixed height even for galleries (with margins)
  STORY_TITLE: 50,          // Title with margins
  STORY_DATE: 35,           // Date/age line with margins
  AUDIO_PLAYER: 70,         // Audio player with margins (was 55, but renders at ~70px)

  // Text properties (must match book.css for accurate measurement)
  LINE_HEIGHT: 28,
  FONT_SIZE: 16,
  FONT_FAMILY: 'Georgia, serif',
  TEXT_ALIGN: 'justify' as const,    // Both edges straight

  // Lesson learned
  LESSON_HEADER: 40,
  LESSON_TEXT_LINES: 3,     // Max ~3 lines (1 sentence typical)
};

// Calculated capacities
export const CAPACITIES = {
  // First page has photos, title, date, audio
  FIRST_PAGE_TEXT_HEIGHT: 700 - 240 - 50 - 35 - 70 - 40, // = 265px (~9 lines) - updated with new measurements

  // Continuation pages have full content area
  CONTINUATION_PAGE_HEIGHT: 700,

  FIRST_PAGE_LINES: Math.floor(330 / 28), // ~11 lines on first page
  CONTINUATION_LINES: Math.floor(700 / 28), // ~25 lines on continuation pages

  // Visual balance targets
  PHOTO_VISUAL_WEIGHT: 8, // Photo "feels like" 8 lines of text
  TARGET_FIRST_PAGE_LINES: 9, // Default balanced split
  CHARS_PER_LINE: 65, // Approximate for 520px width
};

// ============================================================================
// PAGE POLICY - Single source of truth for pagination rules
// ============================================================================

/**
 * Get the exact page content height from CSS variable
 * Single source of truth defined in app/book/book.css @layer book-screen
 */
export function getPageContentHeightPx(): number {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return 700; // SSR fallback
  }

  try {
    const raw = getComputedStyle(document.documentElement)
      .getPropertyValue('--book-content-height')
      .trim();
    const n = parseFloat(raw);
    return Number.isFinite(n) && n > 0 ? n : 700;
  } catch {
    return 700; // Fallback if CSS var not available
  }
}

/**
 * Get epsilon guard for sub-pixel rendering issues
 */
function getEpsilonPx(): number {
  if (typeof window === 'undefined') {
    return 2;
  }
  return Math.max(2, Math.ceil(window.devicePixelRatio));
}

export const PagePolicy = {
  // Exact page content height (read from CSS variable)
  get pageHeightPx(): number {
    return getPageContentHeightPx();
  },

  // Legacy alias for backward compatibility
  get contentBoxPx(): number {
    return this.pageHeightPx;
  },

  // Bottom guard for sub-pixel rendering
  get epsilonPx(): number {
    return getEpsilonPx();
  },

  // Minimum free space allowed at bottom of page (allows small trailing whitespace)
  minFreePx: 12,

  // Widow/orphan control (minimum lines)
  widowLines: 2,    // Min lines at top of page when paragraph splits
  orphanLines: 2,   // Min lines at bottom of page when paragraph splits

  // Story layout rule: each new story MUST start at top of fresh page
  storyStartsOnFreshPage: true,

  // TOC rules
  tocMinRowsAfterHeader: 1,  // Decade header must have at least 1 row after it
};

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type PageType =
  | 'intro'
  | 'table-of-contents'
  | 'decade-marker'
  | 'story-start'
  | 'story-continuation'
  | 'story-end'
  | 'story-complete';

// Block model for accurate pagination
export type BlockType = 'heading' | 'paragraph' | 'image' | 'audioCard' | 'callout' | 'caption' | 'spacer' | 'lessonLearned';

export interface ContentBlock {
  type: BlockType;
  content: string;  // Text or HTML
  splittable: boolean;  // Can this block be split across pages?
  noBreak: boolean;     // Never break this block
  id?: string;
  measuredHeight?: number;  // Cached measurement
}

// Content metrics measured from live DOM
export interface ContentMetrics {
  contentWidthPx: number;
  contentHeightPx: number;
  lineHeightPx: number;
}

export interface StoryPhoto {
  id: string;
  url: string;
  caption?: string;
  isHero?: boolean;
}

export interface Story {
  id: string;
  title: string;
  content: string;
  year: string;
  date?: string;
  age?: number;
  audioUrl?: string;
  photos: StoryPhoto[];
  lessonLearned?: string;
}

export interface TableOfContentsEntry {
  decade: string;
  decadeTitle: string;
  stories: Array<{
    title: string;
    year: string;
    pageNumber: number;
  }>;
}

export interface BookPage {
  type: PageType;
  pageNumber: number;
  storyId?: string;

  // For table of contents
  tocEntries?: TableOfContentsEntry[];

  // For decade markers
  decade?: string;
  decadeTitle?: string;
  storiesInDecade?: number;

  // For story pages
  photos?: StoryPhoto[];
  title?: string;
  year?: string;
  date?: string;
  age?: number;
  audioUrl?: string;
  text?: string;  // Legacy: plain text (still used for backward compat)
  blocks?: ContentBlock[];  // New: structured blocks for accurate pagination
  lessonLearned?: string;

  // Pagination flags
  continued?: boolean;  // True if story continues on next page
  continuesFrom?: string;  // Story ID/title being continued

  // Metadata
  isLeftPage: boolean;
  isRightPage: boolean;
}

export interface TextExtraction {
  text: string;
  endPosition: number;
  lineCount: number;
}

// ============================================================================
// TEXT MEASUREMENT UTILITIES
// ============================================================================

/**
 * Measures justified text by creating a hidden DOM element
 * This is the only accurate way to measure justified text
 * Returns number of lines (divides height by LINE_HEIGHT)
 */
export function measureJustifiedText(
  text: string,
  containerWidth: number = MEASUREMENTS.PAGE_WIDTH_DESKTOP - MEASUREMENTS.PAGE_PADDING_LEFT - MEASUREMENTS.PAGE_PADDING_RIGHT
): number {
  if (!text || text.trim().length === 0) {
    return 0;
  }

  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    // Fallback estimation for SSR
    const avgCharsPerLine = CAPACITIES.CHARS_PER_LINE;
    return Math.ceil(text.length / avgCharsPerLine);
  }

  // Create hidden measurement div
  const measureDiv = document.createElement('div');
  measureDiv.style.cssText = `
    position: absolute;
    visibility: hidden;
    left: -9999px;
    top: -9999px;
    width: ${containerWidth}px;
    font-family: ${MEASUREMENTS.FONT_FAMILY};
    font-size: ${MEASUREMENTS.FONT_SIZE}px;
    line-height: ${MEASUREMENTS.LINE_HEIGHT}px;
    text-align: ${MEASUREMENTS.TEXT_ALIGN};
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow-wrap: break-word;
    hyphens: auto;
  `;

  document.body.appendChild(measureDiv);
  measureDiv.textContent = text;

  // Allow browser to render
  const height = measureDiv.offsetHeight;
  const lineCount = Math.round(height / MEASUREMENTS.LINE_HEIGHT);

  document.body.removeChild(measureDiv);

  return lineCount;
}

/**
 * Batch measure multiple text segments for performance
 */
export function measureMultipleTexts(
  texts: string[],
  containerWidth: number = MEASUREMENTS.PAGE_WIDTH_DESKTOP
): number[] {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    // Fallback estimation for SSR
    const avgCharsPerLine = CAPACITIES.CHARS_PER_LINE;
    return texts.map(text => Math.ceil(text.length / avgCharsPerLine));
  }

  const container = document.createElement('div');
  container.style.cssText = `
    position: absolute;
    visibility: hidden;
    left: -9999px;
    top: -9999px;
  `;
  document.body.appendChild(container);

  const results = texts.map(text => {
    const div = document.createElement('div');
    div.style.cssText = `
      width: ${containerWidth}px;
      font-family: ${MEASUREMENTS.FONT_FAMILY};
      font-size: ${MEASUREMENTS.FONT_SIZE}px;
      line-height: ${MEASUREMENTS.LINE_HEIGHT}px;
      text-align: ${MEASUREMENTS.TEXT_ALIGN};
      white-space: pre-wrap;
      word-wrap: break-word;
      overflow-wrap: break-word;
      hyphens: auto;
      margin-bottom: 20px;
    `;
    div.textContent = text;
    container.appendChild(div);
    return Math.round(div.offsetHeight / MEASUREMENTS.LINE_HEIGHT);
  });

  document.body.removeChild(container);
  return results;
}

// ============================================================================
// TRUE DOM MEASUREMENT
// ============================================================================

// Global measurer instance (created once, reused for all measurements)
let globalMeasurer: HTMLDivElement | null = null;
let globalMetrics: ContentMetrics | null = null;

/**
 * Get or create the global content measurer element
 * This element has identical styles to the live .page-content
 */
function getOrCreateMeasurer(): HTMLDivElement {
  if (globalMeasurer && document.body.contains(globalMeasurer)) {
    return globalMeasurer;
  }

  const measurer = document.createElement('div');
  measurer.id = 'book-content-measurer';
  measurer.style.cssText = `
    position: absolute;
    visibility: hidden;
    left: -9999px;
    top: -9999px;
    pointer-events: none;
  `;

  // Match exact styles from .page-content
  measurer.className = 'page-content book-text';
  measurer.setAttribute('lang', 'en');

  document.body.appendChild(measurer);
  globalMeasurer = measurer;

  return measurer;
}

/**
 * Measure the exact content box dimensions from live DOM
 * Call this once after fonts/images are ready
 */
export function getContentMetrics(): ContentMetrics {
  // Return cached if available
  if (globalMetrics) {
    return globalMetrics;
  }

  // Check if we're in browser
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    // SSR fallback
    return {
      contentWidthPx: MEASUREMENTS.PAGE_WIDTH_DESKTOP - MEASUREMENTS.PAGE_PADDING_LEFT - MEASUREMENTS.PAGE_PADDING_RIGHT,
      contentHeightPx: PagePolicy.pageHeightPx,
      lineHeightPx: MEASUREMENTS.LINE_HEIGHT,
    };
  }

  // Try to find a live .page element
  const livePage = document.querySelector('.page');
  if (livePage) {
    const pageContent = livePage.querySelector('.page-content') || livePage;
    const rect = pageContent.getBoundingClientRect();
    const computed = window.getComputedStyle(pageContent);

    globalMetrics = {
      contentWidthPx: rect.width,
      contentHeightPx: rect.height || PagePolicy.pageHeightPx,
      lineHeightPx: parseFloat(computed.lineHeight) || MEASUREMENTS.LINE_HEIGHT,
    };

    return globalMetrics;
  }

  // Fallback to PagePolicy.pageHeightPx (reads from CSS var)
  globalMetrics = {
    contentWidthPx: MEASUREMENTS.PAGE_WIDTH_DESKTOP - MEASUREMENTS.PAGE_PADDING_LEFT - MEASUREMENTS.PAGE_PADDING_RIGHT,
    contentHeightPx: PagePolicy.pageHeightPx,
    lineHeightPx: MEASUREMENTS.LINE_HEIGHT,
  };

  return globalMetrics;
}

/**
 * Normalize story content into measurable blocks
 */
export function normalizeStoryToBlocks(story: Story): ContentBlock[] {
  const blocks: ContentBlock[] = [];

  // Split content by double newlines (paragraphs)
  const paragraphs = story.content.split('\n\n').filter(p => p.trim());

  paragraphs.forEach((para, idx) => {
    blocks.push({
      type: 'paragraph',
      content: para.trim(),
      splittable: true,
      noBreak: false,
      id: `para-${idx}`,
    });
  });

  // Add lesson learned if present
  if (story.lessonLearned) {
    blocks.push({
      type: 'lessonLearned',
      content: story.lessonLearned,
      splittable: false,  // Keep lesson learned as one block
      noBreak: true,
      id: 'lesson',
    });
  }

  return blocks;
}

/**
 * Measure the height of a content block using true DOM measurement
 */
export function measureBlockHeight(block: ContentBlock, metrics?: ContentMetrics): number {
  // Return cached if available
  if (block.measuredHeight !== undefined) {
    return block.measuredHeight;
  }

  const measurer = getOrCreateMeasurer();
  const m = metrics || getContentMetrics();

  // Set measurer width to match content area
  measurer.style.width = `${m.contentWidthPx}px`;

  // Clear previous content
  measurer.innerHTML = '';

  // Create appropriate markup based on block type
  let element: HTMLElement;

  switch (block.type) {
    case 'heading':
      element = document.createElement('h2');
      element.className = 'book-heading';
      element.textContent = block.content;
      break;

    case 'paragraph':
      element = document.createElement('p');
      element.className = 'mb-4 last:mb-0 leading-relaxed text-justify';
      element.textContent = block.content;
      break;

    case 'lessonLearned':
      element = document.createElement('div');
      element.className = 'book-callout';
      element.innerHTML = `<p>${block.content}</p>`;
      break;

    default:
      element = document.createElement('div');
      element.textContent = block.content;
  }

  measurer.appendChild(element);

  // Force layout
  const rect = element.getBoundingClientRect();
  const computed = window.getComputedStyle(element);

  // Include margins
  const marginTop = parseFloat(computed.marginTop) || 0;
  const marginBottom = parseFloat(computed.marginBottom) || 0;

  const height = Math.ceil(rect.height + marginTop + marginBottom);

  // Cache the measurement
  block.measuredHeight = height;

  return height;
}

/**
 * Split a paragraph to fit within maxHeight, respecting widow/orphan rules
 * Returns the text that fits and the remainder
 */
export function splitParagraphToFit(
  text: string,
  maxHeight: number,
  metrics?: ContentMetrics
): { fitsText: string; remainderText: string } {
  const m = metrics || getContentMetrics();
  const measurer = getOrCreateMeasurer();
  measurer.style.width = `${m.contentWidthPx}px`;

  // Helper to measure text height
  const measureText = (str: string): number => {
    measurer.innerHTML = '';
    const p = document.createElement('p');
    p.className = 'mb-4 last:mb-0 leading-relaxed text-justify';
    p.textContent = str;
    measurer.appendChild(p);

    const rect = p.getBoundingClientRect();
    return Math.ceil(rect.height);
  };

  // Check if entire text fits
  const fullHeight = measureText(text);
  if (fullHeight <= maxHeight) {
    return { fitsText: text, remainderText: '' };
  }

  // Binary search for the split point
  let left = 0;
  let right = text.length;
  let bestFit = '';

  while (left < right) {
    const mid = Math.floor((left + right + 1) / 2);
    const candidate = text.substring(0, mid);
    const height = measureText(candidate);

    if (height <= maxHeight) {
      bestFit = candidate;
      left = mid;
    } else {
      right = mid - 1;
    }
  }

  // If nothing fits, return empty
  if (!bestFit) {
    return { fitsText: '', remainderText: text };
  }

  // Try to find a sentence boundary near the split point
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  let accumulated = '';
  let splitIndex = 0;

  for (const sentence of sentences) {
    const testText = accumulated + sentence;
    const height = measureText(testText);

    if (height <= maxHeight) {
      accumulated = testText;
      splitIndex += sentence.length;
    } else {
      break;
    }
  }

  // Use sentence boundary if we found one, otherwise use bestFit
  if (accumulated && accumulated.length > bestFit.length * 0.7) {
    // Sentence boundary is close enough
    return {
      fitsText: accumulated.trim(),
      remainderText: text.substring(splitIndex).trim(),
    };
  }

  // Fall back to word boundary
  const lastSpace = bestFit.lastIndexOf(' ');
  if (lastSpace > bestFit.length * 0.5) {
    return {
      fitsText: bestFit.substring(0, lastSpace).trim(),
      remainderText: text.substring(lastSpace).trim(),
    };
  }

  // Last resort: use bestFit as-is
  return {
    fitsText: bestFit.trim(),
    remainderText: text.substring(bestFit.length).trim(),
  };
}

// ============================================================================
// TEXT SPLITTING WITH SENTENCE BOUNDARIES
// ============================================================================

// Common abbreviations to ignore when finding sentence boundaries
const ABBREVIATIONS = [
  'Dr.', 'Mrs.', 'Mr.', 'Ms.', 'Prof.', 'Sr.', 'Jr.',
  'Inc.', 'Ltd.', 'Co.', 'Corp.', 'vs.', 'etc.', 'i.e.', 'e.g.',
  'Jan.', 'Feb.', 'Mar.', 'Apr.', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'
];

/**
 * Extract text with intelligent sentence boundary detection
 */
export function extractLinesWithSentenceBoundary(
  text: string,
  startPos: number,
  targetLines: number,
  containerWidth: number = MEASUREMENTS.PAGE_WIDTH_DESKTOP
): TextExtraction {

  if (!text || startPos >= text.length) {
    return { text: '', endPosition: startPos, lineCount: 0 };
  }

  // Estimate character position for target lines
  const targetEndPos = startPos + (targetLines * CAPACITIES.CHARS_PER_LINE);

  // Don't go past the end of the text
  if (targetEndPos >= text.length) {
    const extractedText = text.substring(startPos).trim();
    return {
      text: extractedText,
      endPosition: text.length,
      lineCount: measureJustifiedText(extractedText, containerWidth)
    };
  }

  // Find nearest sentence end
  let bestSplit = targetEndPos;
  const searchStart = Math.max(startPos, targetEndPos - 200);
  const searchEnd = Math.min(text.length, targetEndPos + 200);

  // Look for sentence boundaries
  for (let i = searchStart; i < searchEnd; i++) {
    if (isSentenceBoundary(text, i)) {
      // Check if this is closer to our target
      if (Math.abs(i - targetEndPos) < Math.abs(bestSplit - targetEndPos)) {
        bestSplit = i + 1; // Include the period
      }
    }
  }

  // If no sentence boundary found, fall back to word boundary
  if (bestSplit === targetEndPos) {
    bestSplit = findWordBoundary(text, targetEndPos);
  }

  const extractedText = text.substring(startPos, bestSplit).trim();

  return {
    text: extractedText,
    endPosition: bestSplit,
    lineCount: measureJustifiedText(extractedText, containerWidth)
  };
}

/**
 * Check if position is a valid sentence boundary
 */
function isSentenceBoundary(text: string, position: number): boolean {
  // Check for period followed by space or end of text
  if (text[position] !== '.') return false;

  // Must be followed by space, newline, or end of text
  if (position + 1 < text.length &&
      text[position + 1] !== ' ' &&
      text[position + 1] !== '\n') {
    return false;
  }

  // Check if it's an abbreviation
  const precedingText = text.substring(Math.max(0, position - 20), position);
  const words = precedingText.split(/\s+/);
  const lastWord = words[words.length - 1];

  for (const abbr of ABBREVIATIONS) {
    if (lastWord + '.' === abbr) {
      return false; // It's an abbreviation, not a sentence end
    }
  }

  // Check for ellipsis (...)
  if (position >= 2 && text[position - 1] === '.' && text[position - 2] === '.') {
    return false;
  }

  return true;
}

/**
 * Find nearest word boundary when sentence boundary not available
 */
function findWordBoundary(text: string, targetPos: number): number {
  // Look backwards for a space
  for (let i = targetPos; i > targetPos - 50 && i >= 0; i--) {
    if (text[i] === ' ' || text[i] === '\n') {
      return i + 1;
    }
  }

  // Look forwards if necessary
  for (let i = targetPos; i < targetPos + 50 && i < text.length; i++) {
    if (text[i] === ' ' || text[i] === '\n') {
      return i;
    }
  }

  // Fallback to target position
  return targetPos;
}

// ============================================================================
// VISUAL BALANCE CALCULATION
// ============================================================================

/**
 * Calculate balanced split point for multi-page stories
 * Goal: Left page content height ≈ Right page content height
 */
export function calculateBalancedSplit(
  totalLines: number,
  lessonLines: number
): number {

  // For very short stories, don't force balance
  if (totalLines <= 15) {
    return Math.min(totalLines, 10);
  }

  // Calculate visual weights
  const photoVisualWeight = CAPACITIES.PHOTO_VISUAL_WEIGHT;
  const targetFirstPageLines = CAPACITIES.TARGET_FIRST_PAGE_LINES;

  // What would be on right page with default split?
  const rightPageLines = (totalLines - targetFirstPageLines) + lessonLines;
  const leftVisualLines = photoVisualWeight + targetFirstPageLines;

  // If right would be >1.5x left, rebalance
  if (rightPageLines > leftVisualLines * 1.5) {
    // Add more to left page to balance
    const extraLines = Math.ceil((rightPageLines - leftVisualLines) / 2);
    return Math.min(12, targetFirstPageLines + extraLines); // Cap at 12 lines
  }

  // If left would be much heavier, reduce first page lines
  if (leftVisualLines > rightPageLines * 1.5 && targetFirstPageLines > 6) {
    return Math.max(6, targetFirstPageLines - 2);
  }

  return targetFirstPageLines; // Default balanced split
}

// ============================================================================
// MAIN PAGINATION FUNCTION
// ============================================================================

/**
 * Paginate a single story into book pages using true DOM measurement
 * This ensures no text is cut off at page boundaries
 */
export function paginateStory(
  story: Story,
  startPageNumber: number
): BookPage[] {
  const metrics = getContentMetrics();
  const pages: BookPage[] = [];

  // Normalize story to blocks
  let blocks = normalizeStoryToBlocks(story);

  // Calculate available height on first page (accounting for fixed elements)
  const firstPageAvailableHeight = metrics.contentHeightPx -
    MEASUREMENTS.PHOTO_AREA -
    MEASUREMENTS.STORY_TITLE -
    MEASUREMENTS.STORY_DATE -
    MEASUREMENTS.AUDIO_PLAYER -
    40; // Additional spacing

  // Pagination state
  let currentPageNumber = startPageNumber;
  let usedHeight = 0;
  let availableHeight = firstPageAvailableHeight;
  let currentBlocks: ContentBlock[] = [];
  let isFirstPage = true;

  // Process each block
  let i = 0;
  while (i < blocks.length) {
    const block = blocks[i];
    const blockHeight = measureBlockHeight(block, metrics);

    // Check if block fits on current page (with epsilon guard for sub-pixel rendering)
    const epsilon = PagePolicy.epsilonPx;
    if (usedHeight + blockHeight <= availableHeight - epsilon) {
      // Block fits - add it to current page
      currentBlocks.push(block);
      usedHeight += blockHeight;
      i++;
    } else {
      // Block doesn't fit
      if (block.splittable && usedHeight < availableHeight - PagePolicy.minFreePx - epsilon) {
        // Try to split the paragraph
        const remainingHeight = availableHeight - usedHeight - epsilon;
        const split = splitParagraphToFit(block.content, remainingHeight, metrics);

        if (split.fitsText) {
          // Add the part that fits
          currentBlocks.push({
            ...block,
            content: split.fitsText,
          });

          // Create new block for remainder
          blocks[i] = {
            ...block,
            content: split.remainderText,
            measuredHeight: undefined, // Needs remeasurement
          };

          // Finish current page and continue (don't increment i)
          const pageBlocks = [...currentBlocks];
          pages.push(createStoryPage(
            isFirstPage ? 'story-start' : 'story-continuation',
            currentPageNumber,
            story,
            pageBlocks,
            isFirstPage,
            true // continued
          ));

          // Setup for next page
          currentPageNumber++;
          currentBlocks = [];
          usedHeight = 0;
          availableHeight = metrics.contentHeightPx;
          isFirstPage = false;
          // Don't increment i - we'll process the remainder block next
        } else {
          // Nothing fits, move entire block to next page
          finishPageAndStartNew();
        }
      } else {
        // Non-splittable block or no room - finish page and start new one
        finishPageAndStartNew();
      }
    }
  }

  // Finish last page if it has content
  if (currentBlocks.length > 0) {
    const isComplete = pages.length === 0; // Single page story
    const pageType = isComplete ? 'story-complete' :
      (pages.length > 0 ? 'story-end' : 'story-start');

    pages.push(createStoryPage(
      pageType,
      currentPageNumber,
      story,
      currentBlocks,
      isFirstPage,
      false // not continued
    ));
  }

  return pages;

  // Helper: Finish current page and prepare for next
  function finishPageAndStartNew() {
    if (currentBlocks.length > 0) {
      const pageType = isFirstPage ? 'story-start' : 'story-continuation';
      pages.push(createStoryPage(
        pageType,
        currentPageNumber,
        story,
        currentBlocks,
        isFirstPage,
        false
      ));
    }

    currentPageNumber++;
    currentBlocks = [];
    usedHeight = 0;
    availableHeight = metrics.contentHeightPx;
    isFirstPage = false;
  }
}

/**
 * Helper to create a story page with all metadata
 */
function createStoryPage(
  type: PageType,
  pageNumber: number,
  story: Story,
  blocks: ContentBlock[],
  includeMetadata: boolean,
  continued: boolean
): BookPage {
  // Convert blocks back to text for backward compatibility
  const text = blocks.map(b => b.content).join('\n\n');

  return {
    type,
    pageNumber,
    storyId: story.id,
    photos: includeMetadata ? story.photos : undefined,
    title: includeMetadata ? story.title : undefined,
    year: includeMetadata ? story.year : undefined,
    date: includeMetadata ? story.date : undefined,
    age: includeMetadata ? story.age : undefined,
    audioUrl: includeMetadata ? story.audioUrl : undefined,
    text,
    blocks,
    continued,
    continuesFrom: !includeMetadata ? story.title : undefined,
    isLeftPage: pageNumber % 2 === 0,
    isRightPage: pageNumber % 2 === 1,
  };
}

// ============================================================================
// TABLE OF CONTENTS PAGINATION
// ============================================================================

/**
 * Paginate TOC across multiple pages, respecting decade header grouping rules
 * A decade header must never be the last item on a page (needs at least 1 row after it)
 */
function paginateTableOfContents(
  tocEntries: TableOfContentsEntry[],
  startPageNumber: number
): BookPage[] {
  // Estimate heights for TOC elements
  const DECADE_HEADER_HEIGHT = 50;  // Decade title with border
  const STORY_ROW_HEIGHT = 32;      // Each story row
  const TOC_TITLE_HEIGHT = 60;      // "Table of Contents" heading
  const TOC_PADDING = 40;           // Top/bottom padding

  const availableHeight = PagePolicy.contentBoxPx - TOC_PADDING;

  const pages: BookPage[] = [];
  let currentPageNumber = startPageNumber;
  let currentHeight = TOC_TITLE_HEIGHT; // First page includes title
  let currentPageEntries: TableOfContentsEntry[] = [];

  for (let i = 0; i < tocEntries.length; i++) {
    const entry = tocEntries[i];
    const decadeHeight = DECADE_HEADER_HEIGHT;
    const minRowsHeight = STORY_ROW_HEIGHT * Math.max(1, PagePolicy.tocMinRowsAfterHeader);
    const totalEntriesHeight = entry.stories.length * STORY_ROW_HEIGHT;
    const fullGroupHeight = decadeHeight + totalEntriesHeight;

    // Check if the header + minimum rows fits on current page
    const headerPlusMinRows = decadeHeight + minRowsHeight;

    if (currentHeight + headerPlusMinRows > availableHeight && currentPageEntries.length > 0) {
      // Start a new page
      pages.push({
        type: 'table-of-contents',
        pageNumber: currentPageNumber,
        tocEntries: currentPageEntries,
        isLeftPage: currentPageNumber % 2 === 0,
        isRightPage: currentPageNumber % 2 === 1,
      });

      currentPageNumber++;
      currentHeight = 0; // Subsequent pages don't have title
      currentPageEntries = [];
    }

    // Check if entire group fits on current page
    if (currentHeight + fullGroupHeight <= availableHeight) {
      // Entire group fits
      currentPageEntries.push(entry);
      currentHeight += fullGroupHeight;
    } else {
      // Need to split stories across pages
      // But keep header with at least minRows stories
      const storiesPerPage: Array<{decade: string; decadeTitle: string; stories: Array<{title: string; year: string; pageNumber: number}>}> = [];
      let remainingStories = [...entry.stories];

      // First chunk: header + as many stories as fit
      const firstPageAvailable = availableHeight - currentHeight - decadeHeight;
      const firstPageStoriesCount = Math.max(
        PagePolicy.tocMinRowsAfterHeader,
        Math.floor(firstPageAvailable / STORY_ROW_HEIGHT)
      );

      if (firstPageStoriesCount >= remainingStories.length) {
        // All stories fit
        currentPageEntries.push(entry);
        currentHeight += fullGroupHeight;
      } else {
        // Split stories
        const firstChunk = remainingStories.slice(0, firstPageStoriesCount);
        currentPageEntries.push({
          decade: entry.decade,
          decadeTitle: entry.decadeTitle,
          stories: firstChunk,
        });

        // Finish current page
        pages.push({
          type: 'table-of-contents',
          pageNumber: currentPageNumber,
          tocEntries: currentPageEntries,
          isLeftPage: currentPageNumber % 2 === 0,
          isRightPage: currentPageNumber % 2 === 1,
        });

        currentPageNumber++;
        currentHeight = 0;
        currentPageEntries = [];
        remainingStories = remainingStories.slice(firstPageStoriesCount);

        // Continue stories on subsequent pages (no header repeat)
        while (remainingStories.length > 0) {
          const pageStoriesCount = Math.floor(availableHeight / STORY_ROW_HEIGHT);
          const chunk = remainingStories.slice(0, pageStoriesCount);

          currentPageEntries.push({
            decade: entry.decade,
            decadeTitle: '', // No header on continuation
            stories: chunk,
          });

          if (chunk.length >= remainingStories.length) {
            // This was the last chunk
            currentHeight = chunk.length * STORY_ROW_HEIGHT;
            break;
          } else {
            // More chunks needed
            pages.push({
              type: 'table-of-contents',
              pageNumber: currentPageNumber,
              tocEntries: currentPageEntries,
              isLeftPage: currentPageNumber % 2 === 0,
              isRightPage: currentPageNumber % 2 === 1,
            });

            currentPageNumber++;
            currentHeight = 0;
            currentPageEntries = [];
            remainingStories = remainingStories.slice(pageStoriesCount);
          }
        }
      }
    }
  }

  // Add last page if it has content
  if (currentPageEntries.length > 0) {
    pages.push({
      type: 'table-of-contents',
      pageNumber: startPageNumber + pages.length,
      tocEntries: currentPageEntries,
      isLeftPage: (startPageNumber + pages.length) % 2 === 0,
      isRightPage: (startPageNumber + pages.length) % 2 === 1,
    });
  }

  // If no pages were created, return at least one empty TOC page
  if (pages.length === 0) {
    pages.push({
      type: 'table-of-contents',
      pageNumber: startPageNumber,
      tocEntries: [],
      isLeftPage: startPageNumber % 2 === 0,
      isRightPage: startPageNumber % 2 === 1,
    });
  }

  return pages;
}

// ============================================================================
// FULL BOOK PAGINATION
// ============================================================================

export interface DecadeGroup {
  decade: string;
  title: string;
  stories: Story[];
}

/**
 * Paginate entire book with decade markers and stories
 * Enforces PagePolicy.storyStartsOnFreshPage rule
 */
export function paginateBook(decadeGroups: DecadeGroup[]): BookPage[] {
  const allPages: BookPage[] = [];
  let currentPageNumber = 1;

  // First pass: Create all pages and collect TOC data
  const tocEntries: TableOfContentsEntry[] = [];
  const tempPages: BookPage[] = [];

  // Start at page 3 to leave room for intro (page 1) and TOC (page 2)
  let tempPageNumber = 3;

  for (const group of decadeGroups) {
    const tocEntry: TableOfContentsEntry = {
      decade: group.decade,
      decadeTitle: group.title,
      stories: [],
    };

    // Add decade marker on left (even) page
    if (tempPageNumber % 2 === 1) {
      // We're on a right page, need to skip to next left
      tempPageNumber++;
    }

    const decadeMarkerPage = tempPageNumber;

    tempPages.push({
      type: 'decade-marker',
      pageNumber: tempPageNumber,
      decade: group.decade,
      decadeTitle: group.title,
      storiesInDecade: group.stories.length,
      isLeftPage: true,
      isRightPage: false,
    });

    tempPageNumber++;

    // Add all stories in this decade
    for (const story of group.stories) {
      // FRESH PAGE ENFORCEMENT: If storyStartsOnFreshPage is true and we're not already
      // on a fresh page (i.e., previous story ended mid-page), skip to next page.
      // We detect "mid-page" by checking if the last page was a story-end or story-continuation
      // (not story-complete, which would have used the full page).
      if (PagePolicy.storyStartsOnFreshPage && tempPages.length > 0) {
        const lastPage = tempPages[tempPages.length - 1];
        if (
          lastPage.type === 'story-end' ||
          lastPage.type === 'story-continuation'
        ) {
          // Previous story ended mid-page, advance to next page for fresh start
          tempPageNumber++;
        }
      }

      const storyStartPage = tempPageNumber;
      const storyPages = paginateStory(story, tempPageNumber);
      tempPages.push(...storyPages);
      tempPageNumber += storyPages.length;

      // Add to TOC
      tocEntry.stories.push({
        title: story.title,
        year: story.year,
        pageNumber: storyStartPage,
      });
    }

    tocEntries.push(tocEntry);
  }

  // Add Intro page as page 1 (right page)
  allPages.push({
    type: 'intro',
    pageNumber: 1,
    isLeftPage: false,
    isRightPage: true,
  });

  // Add Table of Contents as page 2 (left page)
  // TOC may span multiple pages if there are many stories
  const tocPages = paginateTableOfContents(tocEntries, 2);
  allPages.push(...tocPages);

  // Adjust all subsequent page numbers based on actual TOC page count
  const tocPageCount = tocPages.length;
  const pageNumberOffset = tocPageCount - 1; // We assumed 1 page, got tocPageCount

  if (pageNumberOffset > 0) {
    // Shift all story/decade pages forward
    tempPages.forEach(page => {
      page.pageNumber += pageNumberOffset;
    });
  }

  // Add all other pages
  allPages.push(...tempPages);

  return allPages;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get page spreads for desktop view (pairs of pages)
 */
export function getPageSpreads(pages: BookPage[]): [BookPage, BookPage | null][] {
  const spreads: [BookPage, BookPage | null][] = [];

  for (let i = 0; i < pages.length; i += 2) {
    const leftPage = pages[i];
    const rightPage = pages[i + 1] || null;
    spreads.push([leftPage, rightPage]);
  }

  return spreads;
}

/**
 * Find which pages contain a specific story
 */
export function findStoryPages(pages: BookPage[], storyId: string): BookPage[] {
  return pages.filter(page => page.storyId === storyId);
}

/**
 * Get page number range for a story
 */
export function getStoryPageRange(pages: BookPage[], storyId: string): [number, number] | null {
  const storyPages = findStoryPages(pages, storyId);
  if (storyPages.length === 0) return null;

  const pageNumbers = storyPages.map(p => p.pageNumber);
  return [Math.min(...pageNumbers), Math.max(...pageNumbers)];
}