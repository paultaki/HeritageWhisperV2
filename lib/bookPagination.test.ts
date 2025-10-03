/**
 * Book Pagination Test Suite
 * Tests all edge cases and scenarios for the pagination system
 */

import {
  measureJustifiedText,
  extractLinesWithSentenceBoundary,
  calculateBalancedSplit,
  paginateStory,
  paginateBook,
  type Story,
  type DecadeGroup,
  MEASUREMENTS,
  CAPACITIES
} from './bookPagination';

// ============================================================================
// TEST DATA GENERATORS
// ============================================================================

/**
 * Generate lorem ipsum text with specified number of lines
 */
function generateLines(lineCount: number): string {
  const wordsPerLine = 10; // Approximate
  const sentences = [];
  let currentLineCount = 0;

  const sampleSentences = [
    "The summer days were long and filled with adventure.",
    "We would wake up early and explore the neighborhood.",
    "My friends and I built a treehouse in the backyard.",
    "Every evening, we'd catch fireflies in mason jars.",
    "Mom would call us in when the streetlights came on.",
    "Those were the days when time seemed to move slower.",
    "I remember the smell of fresh-cut grass and barbecues.",
    "We'd ride our bikes until the sun went down.",
    "The ice cream truck's melody still echoes in my memory.",
    "Life was simpler then, full of wonder and discovery."
  ];

  while (currentLineCount < lineCount) {
    const sentence = sampleSentences[sentences.length % sampleSentences.length];
    sentences.push(sentence);
    // Estimate ~65 chars per line, average sentence ~50 chars
    currentLineCount += Math.ceil(sentence.length / 65);
  }

  return sentences.join(' ');
}

/**
 * Create a test story with specified parameters
 */
function createTestStory(
  id: string,
  lineCount: number,
  hasLesson: boolean = true,
  photoCount: number = 1
): Story {
  const photos = Array.from({ length: photoCount }, (_, i) => ({
    id: `photo-${i}`,
    url: `https://example.com/photo-${i}.jpg`,
    isHero: i === 0
  }));

  return {
    id,
    title: `Test Story ${id}`,
    content: generateLines(lineCount),
    year: '1975',
    date: 'June 15, 1975',
    audioUrl: 'https://example.com/audio.mp3',
    photos,
    lessonLearned: hasLesson ? "This experience taught me to always trust myself." : undefined
  };
}

// ============================================================================
// TEST CASES FROM SPECIFICATION
// ============================================================================

export const TEST_STORIES = {
  microStory: {
    story: {
      id: 'micro',
      title: 'Learning to Ride',
      content: "I learned to ride a bike. It was scary but fun. Dad held on until he didn't.",
      year: '1965',
      audioUrl: 'audio.mp3',
      photos: [{ id: '1', url: 'photo.jpg' }],
      lessonLearned: "Trust yourself."
    },
    expectedPages: 1,
    description: "Micro story - should fit on single page"
  },

  exactThreshold: {
    story: createTestStory('exact', 8, true),
    expectedPages: 1,
    description: "Exactly 8 lines - should fit on single page with lesson"
  },

  justOverThreshold: {
    story: createTestStory('over', 13, false),
    expectedPages: 2,
    description: "13 lines - forces second page"
  },

  standardStory: {
    story: createTestStory('standard', 35, true),
    expectedPages: 2,
    description: "Typical 1.5 minute story - 35 lines with lesson"
  },

  epicStory: {
    story: createTestStory('epic', 95, true),
    expectedPages: 4,
    description: "Near 2-minute max - 95 lines with lesson"
  },

  noLessonLearned: {
    story: createTestStory('no-lesson', 20, false),
    expectedPages: 2,
    description: "20 lines with no lesson learned"
  },

  multiplePhotos: {
    story: createTestStory('multi-photo', 25, true, 3),
    expectedPages: 2,
    description: "Story with photo gallery - should not affect pagination"
  },

  veryLongLesson: {
    story: {
      ...createTestStory('long-lesson', 15, false),
      lessonLearned: generateLines(10) // Unusually long lesson
    },
    expectedPages: 2,
    description: "Story with unusually long lesson (10 lines)"
  }
};

// ============================================================================
// EDGE CASE TESTS
// ============================================================================

export const EDGE_CASES = {
  emptyStory: {
    story: {
      id: 'empty',
      title: 'Empty Story',
      content: '',
      year: '1970',
      photos: [{ id: '1', url: 'photo.jpg' }],
      audioUrl: 'audio.mp3'
    },
    expectedBehavior: 'Single page with just photo/title/date',
    expectedPages: 1
  },

  exactPageBoundary: {
    story: createTestStory('boundary', CAPACITIES.FIRST_PAGE_LINES, true),
    expectedBehavior: 'Lesson should go on next page, not squeezed',
    expectedPages: 2
  },

  noSentenceBoundary: {
    story: {
      id: 'no-period',
      title: 'Run-on Story',
      content: 'This is a very long run-on sentence that goes on and on without any periods or proper punctuation just continuous text that keeps going for many many lines without a break which tests our fallback to word boundaries when no sentence boundaries are found within the search range',
      year: '1980',
      photos: [{ id: '1', url: 'photo.jpg' }],
      audioUrl: 'audio.mp3'
    },
    expectedBehavior: 'Falls back to word boundary splitting',
    expectedPages: 2
  },

  abbreviationsInText: {
    story: {
      id: 'abbreviations',
      title: 'Meeting Dr. Smith',
      content: 'I met Dr. Smith on Jan. 5th at 3 p.m. at Smith & Co. headquarters. Mr. Johnson from Marketing Inc. was also there. We discussed the project until 5 p.m. etc. It was productive.',
      year: '1985',
      photos: [{ id: '1', url: 'photo.jpg' }],
      audioUrl: 'audio.mp3'
    },
    expectedBehavior: 'Should not break at abbreviation periods',
    expectedPages: 1
  }
};

// ============================================================================
// TEST RUNNER FUNCTIONS
// ============================================================================

/**
 * Run pagination test and verify results
 */
export function runPaginationTest(
  testName: string,
  story: Story,
  expectedPageCount: number
): boolean {
  console.log(`\nTesting: ${testName}`);
  console.log(`Content length: ${story.content.length} chars`);

  const pages = paginateStory(story, 1);

  console.log(`Expected pages: ${expectedPageCount}`);
  console.log(`Actual pages: ${pages.length}`);

  // Verify page count
  if (pages.length !== expectedPageCount) {
    console.error(`❌ Page count mismatch!`);
    return false;
  }

  // Verify page types
  if (pages.length === 1) {
    if (pages[0].type !== 'story-complete') {
      console.error(`❌ Single page should be type 'story-complete'`);
      return false;
    }
  } else {
    if (pages[0].type !== 'story-start') {
      console.error(`❌ First page should be type 'story-start'`);
      return false;
    }
    if (pages[pages.length - 1].type !== 'story-end') {
      console.error(`❌ Last page should be type 'story-end'`);
      return false;
    }
  }

  // Verify all text is included
  const allText = pages.map(p => p.text || '').join(' ');
  if (story.content && !allText.includes(story.content.substring(0, 50))) {
    console.error(`❌ Text content missing or corrupted`);
    return false;
  }

  // Verify lesson learned placement
  if (story.lessonLearned) {
    const lastPage = pages[pages.length - 1];
    if (!lastPage.lessonLearned) {
      console.error(`❌ Lesson learned not on last page`);
      return false;
    }
  }

  console.log(`✅ Test passed!`);
  return true;
}

/**
 * Run all tests
 */
export function runAllTests(): void {
  console.log('='.repeat(60));
  console.log('BOOK PAGINATION TEST SUITE');
  console.log('='.repeat(60));

  let passed = 0;
  let failed = 0;

  // Test standard stories
  console.log('\n📚 STANDARD TEST STORIES');
  for (const [key, test] of Object.entries(TEST_STORIES)) {
    const success = runPaginationTest(
      test.description,
      test.story,
      test.expectedPages
    );
    if (success) passed++;
    else failed++;
  }

  // Test edge cases
  console.log('\n🔧 EDGE CASES');
  for (const [key, test] of Object.entries(EDGE_CASES)) {
    console.log(`\nTesting: ${test.expectedBehavior}`);
    const pages = paginateStory(test.story, 1);
    console.log(`Result: ${pages.length} page(s)`);

    if (pages.length === test.expectedPages) {
      console.log(`✅ Edge case handled correctly`);
      passed++;
    } else {
      console.error(`❌ Edge case failed`);
      failed++;
    }
  }

  // Test visual balance
  console.log('\n⚖️ VISUAL BALANCE TESTS');
  const balanceTests = [
    { total: 20, lesson: 2, expected: 9, description: "Standard balance" },
    { total: 50, lesson: 3, expected: 12, description: "Long story balance" },
    { total: 10, lesson: 1, expected: 10, description: "Short story - no forced balance" },
  ];

  for (const test of balanceTests) {
    const result = calculateBalancedSplit(test.total, test.lesson);
    console.log(`${test.description}: ${result} lines on first page (expected ~${test.expected})`);
    if (Math.abs(result - test.expected) <= 2) {
      console.log(`✅ Balance reasonable`);
      passed++;
    } else {
      console.error(`❌ Balance off`);
      failed++;
    }
  }

  // Test full book pagination
  console.log('\n📖 FULL BOOK PAGINATION');
  const decadeGroups: DecadeGroup[] = [
    {
      decade: '1950s',
      title: 'The Beginning',
      stories: [
        createTestStory('50-1', 15),
        createTestStory('50-2', 25),
      ]
    },
    {
      decade: '1960s',
      title: 'Growing Up',
      stories: [
        createTestStory('60-1', 40),
        createTestStory('60-2', 10),
        createTestStory('60-3', 30),
      ]
    }
  ];

  const bookPages = paginateBook(decadeGroups);
  console.log(`Total pages in book: ${bookPages.length}`);

  // Verify decade markers are on left pages
  const decadePages = bookPages.filter(p => p.type === 'decade-marker');
  const allOnLeft = decadePages.every(p => p.isLeftPage);
  if (allOnLeft) {
    console.log(`✅ All decade markers on left pages`);
    passed++;
  } else {
    console.error(`❌ Some decade markers not on left pages`);
    failed++;
  }

  // Final results
  console.log('\n' + '='.repeat(60));
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(60));
}

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

/**
 * Test pagination performance with many stories
 */
export function testPerformance(): void {
  console.log('\n⚡ PERFORMANCE TEST');

  const stories: Story[] = [];
  for (let i = 0; i < 50; i++) {
    stories.push(createTestStory(`perf-${i}`, 20 + (i % 30)));
  }

  const decadeGroups: DecadeGroup[] = [
    {
      decade: '1950s',
      title: 'The Beginning',
      stories: stories.slice(0, 10)
    },
    {
      decade: '1960s',
      title: 'Growing Up',
      stories: stories.slice(10, 25)
    },
    {
      decade: '1970s',
      title: 'Young Adult',
      stories: stories.slice(25, 40)
    },
    {
      decade: '1980s',
      title: 'Family Life',
      stories: stories.slice(40, 50)
    }
  ];

  const startTime = performance.now();
  const pages = paginateBook(decadeGroups);
  const endTime = performance.now();

  const duration = endTime - startTime;
  console.log(`Paginated ${stories.length} stories into ${pages.length} pages`);
  console.log(`Time taken: ${duration.toFixed(2)}ms`);

  if (duration < 100) {
    console.log(`✅ Performance target met (<100ms)`);
  } else {
    console.error(`❌ Performance needs optimization (${duration.toFixed(2)}ms > 100ms)`);
  }
}

// Run tests if this file is executed directly
if (typeof window !== 'undefined' && (window as any).runBookPaginationTests) {
  runAllTests();
  testPerformance();
}