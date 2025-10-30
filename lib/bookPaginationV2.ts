/**
 * Book Pagination System V2 - Scrollable Single-Page Stories
 * Each story is complete on its own page with internal scrolling (no wrapping to next page)
 */

import {
  Story,
  BookPage,
  DecadeGroup,
  TableOfContentsEntry,
  StoryPhoto,
  PageType,
} from "./bookPagination";

// Re-export types for convenience
export type { Story, BookPage, DecadeGroup, StoryPhoto, PageType, TableOfContentsEntry };

// ============================================================================
// V2 PAGINATION - No Story Splitting
// ============================================================================

/**
 * V2: Paginate a single story - always fits on ONE page with scrolling
 * The entire story content is placed on a single page, and users scroll within that page
 */
export function paginateStoryV2(
  story: Story,
  startPageNumber: number,
): BookPage[] {
  // V2: Every story is a single "story-complete" page
  // All content (text, photos, audio, lesson) is on this one page
  // The page-content area will be scrollable if content exceeds visible area

  return [
    {
      type: "story-complete",
      pageNumber: startPageNumber,
      storyId: story.id,
      photos: story.photos,
      title: story.title,
      year: story.year,
      date: story.date,
      age: story.age,
      audioUrl: story.audioUrl,
      text: story.content, // Full content, no splitting
      lessonLearned: story.lessonLearned,
      continued: false, // Never continued in V2
      isLeftPage: startPageNumber % 2 === 0,
      isRightPage: startPageNumber % 2 === 1,
    },
  ];
}

/**
 * V2: Paginate table of contents (same as V1 - this doesn't change)
 */
function paginateTableOfContentsV2(
  tocEntries: TableOfContentsEntry[],
  startPageNumber: number,
): BookPage[] {
  // Estimate heights for TOC elements
  const DECADE_HEADER_HEIGHT = 70;
  const STORY_ROW_HEIGHT = 45;
  const TOC_TITLE_HEIGHT = 80;
  const availableHeight = 620;

  const pages: BookPage[] = [];
  let currentPageNumber = startPageNumber;
  let currentHeight = TOC_TITLE_HEIGHT;
  let currentPageEntries: TableOfContentsEntry[] = [];

  for (let i = 0; i < tocEntries.length; i++) {
    const entry = tocEntries[i];
    const decadeHeight = DECADE_HEADER_HEIGHT;
    const minRowsHeight = STORY_ROW_HEIGHT * 1;
    const totalEntriesHeight = entry.stories.length * STORY_ROW_HEIGHT;
    const fullGroupHeight = decadeHeight + totalEntriesHeight;
    const headerPlusMinRows = decadeHeight + minRowsHeight;

    if (
      currentHeight + headerPlusMinRows > availableHeight &&
      currentPageEntries.length > 0
    ) {
      pages.push({
        type: "table-of-contents",
        pageNumber: currentPageNumber,
        tocEntries: currentPageEntries,
        isLeftPage: currentPageNumber % 2 === 0,
        isRightPage: currentPageNumber % 2 === 1,
      });

      currentPageNumber++;
      currentHeight = 0;
      currentPageEntries = [];
    }

    if (currentHeight + fullGroupHeight <= availableHeight) {
      currentPageEntries.push(entry);
      currentHeight += fullGroupHeight;
    } else {
      // Split stories across pages
      let remainingStories = [...entry.stories];
      const firstPageAvailable = availableHeight - currentHeight - decadeHeight;
      const firstPageStoriesCount = Math.max(
        1,
        Math.floor(firstPageAvailable / STORY_ROW_HEIGHT),
      );

      if (firstPageStoriesCount >= remainingStories.length) {
        currentPageEntries.push(entry);
        currentHeight += fullGroupHeight;
      } else {
        const firstChunk = remainingStories.slice(0, firstPageStoriesCount);
        currentPageEntries.push({
          decade: entry.decade,
          decadeTitle: entry.decadeTitle,
          stories: firstChunk,
        });

        pages.push({
          type: "table-of-contents",
          pageNumber: currentPageNumber,
          tocEntries: currentPageEntries,
          isLeftPage: currentPageNumber % 2 === 0,
          isRightPage: currentPageNumber % 2 === 1,
        });

        currentPageNumber++;
        currentHeight = 0;
        currentPageEntries = [];
        remainingStories = remainingStories.slice(firstPageStoriesCount);

        while (remainingStories.length > 0) {
          const pageStoriesCount = Math.floor(
            availableHeight / STORY_ROW_HEIGHT,
          );
          const chunk = remainingStories.slice(0, pageStoriesCount);

          currentPageEntries.push({
            decade: entry.decade,
            decadeTitle: "",
            stories: chunk,
          });

          if (chunk.length >= remainingStories.length) {
            currentHeight = chunk.length * STORY_ROW_HEIGHT;
            break;
          } else {
            pages.push({
              type: "table-of-contents",
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

  if (currentPageEntries.length > 0) {
    pages.push({
      type: "table-of-contents",
      pageNumber: startPageNumber + pages.length,
      tocEntries: currentPageEntries,
      isLeftPage: (startPageNumber + pages.length) % 2 === 0,
      isRightPage: (startPageNumber + pages.length) % 2 === 1,
    });
  }

  if (pages.length === 0) {
    pages.push({
      type: "table-of-contents",
      pageNumber: startPageNumber,
      tocEntries: [],
      isLeftPage: startPageNumber % 2 === 0,
      isRightPage: startPageNumber % 2 === 1,
    });
  }

  return pages;
}

/**
 * V2: Paginate entire book with decade markers and single-page stories
 */
export function paginateBookV2(
  decadeGroups: DecadeGroup[],
  whisperPrompts: Array<{
    id: string;
    promptText: string;
    contextNote?: string;
  }> = [],
): BookPage[] {
  const allPages: BookPage[] = [];
  const tocEntries: TableOfContentsEntry[] = [];
  const tempPages: BookPage[] = [];

  let tempPageNumber = 3; // Start at page 3 (intro=1, TOC=2)

  for (const group of decadeGroups) {
    const tocEntry: TableOfContentsEntry = {
      decade: group.decade,
      decadeTitle: group.title,
      stories: [],
    };

    // Add decade marker on left (even) page
    if (tempPageNumber % 2 === 1) {
      tempPageNumber++;
    }

    tempPages.push({
      type: "decade-marker",
      pageNumber: tempPageNumber,
      decade: group.decade,
      decadeTitle: group.title,
      storiesInDecade: group.stories.length,
      isLeftPage: true,
      isRightPage: false,
    });

    tempPageNumber++;

    // V2: Each story gets exactly ONE page (no splitting)
    for (const story of group.stories) {
      const storyStartPage = tempPageNumber;
      const storyPages = paginateStoryV2(story, tempPageNumber);
      tempPages.push(...storyPages);
      tempPageNumber += storyPages.length; // Will be +1 since we only create 1 page per story

      tocEntry.stories.push({
        title: story.title,
        year: story.year,
        date: story.date,
        pageNumber: storyStartPage,
      });
    }

    tocEntries.push(tocEntry);
  }

  // Add Intro page
  allPages.push({
    type: "intro",
    pageNumber: 1,
    isLeftPage: false,
    isRightPage: true,
  });

  // Add TOC pages
  const tocPages = paginateTableOfContentsV2(tocEntries, 2);
  allPages.push(...tocPages);

  // Adjust page numbers based on TOC page count
  const tocPageCount = tocPages.length;
  const pageNumberOffset = tocPageCount - 1;

  if (pageNumberOffset > 0) {
    tempPages.forEach((page) => {
      page.pageNumber += pageNumberOffset;
    });

    tocEntries.forEach((entry) => {
      entry.stories.forEach((story) => {
        story.pageNumber += pageNumberOffset;
      });
    });
  }

  allPages.push(...tempPages);

  return allPages;
}

/**
 * Get page spreads for desktop view (pairs of pages)
 */
export function getPageSpreadsV2(
  pages: BookPage[],
): [BookPage, BookPage | null][] {
  const spreads: [BookPage, BookPage | null][] = [];

  for (let i = 0; i < pages.length; i += 2) {
    const leftPage = pages[i];
    const rightPage = pages[i + 1] || null;
    spreads.push([leftPage, rightPage]);
  }

  return spreads;
}

