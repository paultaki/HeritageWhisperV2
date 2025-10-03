/**
 * Book Pagination System - Core Engine
 * Handles text measurement, page splitting, and visual balance for book view
 */

// ============================================================================
// CONSTANTS & MEASUREMENTS
// ============================================================================

export const MEASUREMENTS = {
  // Page dimensions
  PAGE_HEIGHT: 1000,
  PAGE_WIDTH_DESKTOP: 520,
  PAGE_WIDTH_MOBILE: 380,

  // Fixed elements (first page only)
  PHOTO_AREA: 220,          // Fixed height even for galleries
  STORY_TITLE: 45,
  STORY_DATE: 30,
  AUDIO_PLAYER: 55,         // Always present on first page
  PAGE_PADDING_TOP: 60,
  PAGE_PADDING_BOTTOM: 60,

  // Text properties
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
  FIRST_PAGE_TEXT_HEIGHT: 530, // After all fixed elements
  CONTINUATION_PAGE_HEIGHT: 880,
  FIRST_PAGE_LINES: Math.floor(530 / 28), // ~19 lines possible
  CONTINUATION_LINES: Math.floor(880 / 28), // ~31 lines

  // Visual balance targets
  PHOTO_VISUAL_WEIGHT: 8, // Photo "feels like" 8 lines of text
  TARGET_FIRST_PAGE_LINES: 9, // Default balanced split
  CHARS_PER_LINE: 65, // Approximate for 520px width
};

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type PageType =
  | 'decade-marker'
  | 'story-start'
  | 'story-continuation'
  | 'story-end'
  | 'story-complete';

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
  audioUrl?: string;
  photos: StoryPhoto[];
  lessonLearned?: string;
}

export interface BookPage {
  type: PageType;
  pageNumber: number;
  storyId?: string;

  // For decade markers
  decade?: string;
  decadeTitle?: string;
  storiesInDecade?: number;

  // For story pages
  photos?: StoryPhoto[];
  title?: string;
  year?: string;
  date?: string;
  audioUrl?: string;
  text?: string;
  lessonLearned?: string;

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
 */
export function measureJustifiedText(
  text: string,
  containerWidth: number = MEASUREMENTS.PAGE_WIDTH_DESKTOP
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
 * Paginate a single story into book pages
 */
export function paginateStory(
  story: Story,
  startPageNumber: number
): BookPage[] {

  // Measure all text
  const textLines = measureJustifiedText(story.content);
  const lessonLines = story.lessonLearned ?
    measureJustifiedText(story.lessonLearned) : 0;

  // Check if it fits on a single page
  const totalContentLines = textLines + lessonLines;
  const singlePageThreshold = 12; // Conservative threshold

  if (totalContentLines <= singlePageThreshold) {
    // Single page story
    return [{
      type: 'story-complete',
      pageNumber: startPageNumber,
      storyId: story.id,
      photos: story.photos,
      title: story.title,
      year: story.year,
      date: story.date,
      audioUrl: story.audioUrl,
      text: story.content,
      lessonLearned: story.lessonLearned,
      isLeftPage: startPageNumber % 2 === 0,
      isRightPage: startPageNumber % 2 === 1,
    }];
  }

  // Multi-page story - calculate balanced split
  const firstPageLines = calculateBalancedSplit(textLines, lessonLines);
  const pages: BookPage[] = [];

  // First page with photos and metadata
  const firstPageExtraction = extractLinesWithSentenceBoundary(
    story.content,
    0,
    firstPageLines
  );

  pages.push({
    type: 'story-start',
    pageNumber: startPageNumber,
    storyId: story.id,
    photos: story.photos,
    title: story.title,
    year: story.year,
    date: story.date,
    audioUrl: story.audioUrl,
    text: firstPageExtraction.text,
    isLeftPage: startPageNumber % 2 === 0,
    isRightPage: startPageNumber % 2 === 1,
  });

  // Continue with subsequent pages
  let currentPosition = firstPageExtraction.endPosition;
  let currentPageNumber = startPageNumber + 1;

  while (currentPosition < story.content.length) {
    // Check how much text remains
    const remainingText = story.content.substring(currentPosition);
    const remainingLines = measureJustifiedText(remainingText);

    // Is this the last page?
    const isLastPage = remainingLines <= CAPACITIES.CONTINUATION_LINES;

    const pageExtraction = extractLinesWithSentenceBoundary(
      story.content,
      currentPosition,
      isLastPage ? remainingLines : CAPACITIES.CONTINUATION_LINES
    );

    pages.push({
      type: isLastPage ? 'story-end' : 'story-continuation',
      pageNumber: currentPageNumber,
      storyId: story.id,
      text: pageExtraction.text,
      lessonLearned: isLastPage ? story.lessonLearned : undefined,
      isLeftPage: currentPageNumber % 2 === 0,
      isRightPage: currentPageNumber % 2 === 1,
    });

    currentPosition = pageExtraction.endPosition;
    currentPageNumber++;
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
 */
export function paginateBook(decadeGroups: DecadeGroup[]): BookPage[] {
  const allPages: BookPage[] = [];
  let currentPageNumber = 1;

  for (const group of decadeGroups) {
    // Add decade marker on left (even) page
    if (currentPageNumber % 2 === 1) {
      // We're on a right page, need to skip to next left
      currentPageNumber++;
    }

    allPages.push({
      type: 'decade-marker',
      pageNumber: currentPageNumber,
      decade: group.decade,
      decadeTitle: group.title,
      storiesInDecade: group.stories.length,
      isLeftPage: true,
      isRightPage: false,
    });

    currentPageNumber++;

    // Add all stories in this decade
    for (const story of group.stories) {
      const storyPages = paginateStory(story, currentPageNumber);
      allPages.push(...storyPages);
      currentPageNumber += storyPages.length;
    }
  }

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