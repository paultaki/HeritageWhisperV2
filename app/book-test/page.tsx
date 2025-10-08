'use client';

import React, { useState } from 'react';
import BookWrap from '../book/components/BookWrap';
import { ContentBlock } from '../book/components/AutoPaginator';
import SpreadPaginator from '../book/components/SpreadPaginator';
import { useViewportMode } from '../book/components/ViewportManager';

// Complete memory example with all components
const completeMemory = {
  title: "The Boy Who Became My Father",
  year: 1934,
  age: "Before Birth",
  story: `This was Dad at eight years old, 1934, the middle of the Depression. He didn't have much, but you'd never know it from that clean shirt and serious look. There's something steady in his eyes, even then. He grew up with little but carried himself like a man who had everything that mattered: gratitude, work ethic, and heart.`,
  lesson: "True wealth lies not in what we possess but in the strength of our character and the richness of our spirit.",
  hasPhoto: true,
  hasAudio: false,
};

const completeMemory2 = {
  title: "Sleepless Nights",
  year: 1978,
  age: "Age 23",
  story: `We brought our first child home and realized we needed a plan, not bravery. The floral couch became headquarters. The lamp table got an index card that said, feed, burp, change, walk, pray. At 1:12 a.m., he announced himself to the neighborhood. I wore a blazer because every shirt was dirty. Your mom wound the kitchen timer to 20 minutes. When it ticked, we traded the baby. No debate. The rule was the boss.

I tried the shoulder rock. Nothing. I tried the slow walk. Nothing. I whispered box scores because it was the only script in my head. He calmed at the sound of something ordinary. Your mom laughed and added a step to the card. Talk about anything simple.

By 3 a.m., the system held. We were tired, not angry. We were teammates, not heroes. The timer dinged. Trade. Kiss. Keep going.

Morning came. We snapped the photo on that couch. People see a happy young family. I see a pact that still works. Make small rules while you were calm. To carry you when you were tired.`,
  lesson: "In the whirlwind of life's unexpected challenges, the strength of a family lies not in individual heroics, but in creating simple, shared systems that guide us through our toughest moments together.",
  hasPhoto: true,
  hasAudio: true,
};

// Sample story for basic testing
const sampleStory = `
It was the summer of 1958, and I was just seven years old. My family had moved to a small house on Elm Street, where the cicadas sang their endless song through humid afternoons.

My father worked at the steel mill, coming home each evening with his lunch pail rattling and his work boots covered in dust. Mother kept the house spotless, despite the constant battle with the soot that drifted in through open windows.

I remember the neighborhood kids gathering after dinner to play kick-the-can under the streetlights. Billy Johnson, Tommy Martinez, and the Peterson twins—we'd run through yards and hide behind hedges until our mothers called us home.

One particular evening stands out in my memory. It was late July, oppressively hot. Dad came home early, which was unusual. He gathered us in the living room—me, my two sisters, and Mother—and announced that he'd been offered a promotion. We'd be moving to Pittsburgh.

I didn't understand then what it meant. To me, it was just another adventure. But looking back now, I realize it was the moment our family's trajectory changed forever.
`.trim();

const sampleStory2 = `
The move to Pittsburgh happened quickly. Within three weeks, we'd packed up our entire life into a U-Haul truck. I remember watching our old house disappear in the rearview mirror, tears streaming down my face.

The new house was bigger, in a nicer neighborhood. My room had its own closet—a luxury I'd never experienced. The walls were painted pale blue, and from my window, I could see the neighbor's apple tree.

School was different in Pittsburgh. The kids dressed nicer. They talked faster. I felt like an outsider for the first few months, struggling to make friends and fit in.

But gradually, things improved. I joined the baseball team. Made friends with a boy named David Chen who lived three houses down. By the end of that first year, Pittsburgh had started to feel like home.

Looking back, I'm grateful for that move. It taught me resilience. It showed me that change, while scary, often leads to growth.
`.trim();

const sampleStory3 = `
High school brought new challenges and opportunities. I discovered a passion for photography in Mr. Henderson's art class. He had converted a janitor's closet into a darkroom, and I spent countless hours there, watching images emerge in the developer tray.

My first camera was a used Pentax that my father bought from a pawn shop. It was heavy and mechanical, with a satisfying click when you pressed the shutter. I carried it everywhere, documenting the neighborhood, my friends, the changing seasons.

One photo I took—of an elderly woman feeding pigeons in the park—won a local contest. The prize was fifty dollars and publication in the newspaper. I felt like a professional photographer, even though I was just sixteen.

That camera taught me to see the world differently. To notice light and shadow, composition and moment. It opened up possibilities I'd never imagined.
`.trim();

const sampleStory4 = `
College was a whirlwind. I studied journalism at Penn State, lived in a cramped apartment with three roommates, and worked nights at the campus newspaper. Sleep was optional; ambition was mandatory.

My editor, Carol Martinez, was tough but fair. She taught me to write tight, to fact-check obsessively, to never miss a deadline. Her red pen marked up my early articles until they bled with corrections.

One assignment changed everything. A story about corruption in the student government led to investigations, resignations, and eventually, a job offer from the Pittsburgh Post-Gazette. I was twenty-two and terrified.

But I took the job. It was the best decision I ever made. Journalism became more than a career—it became a calling.
`.trim();

const sampleStory5 = `
I met Sarah at a coffee shop in 1985. She was reading García Márquez and drinking black coffee. I was immediately smitten. Our first conversation lasted three hours, ranging from literature to politics to the best pizza in Pittsburgh.

We were married within a year. Some people thought we were rushing, but when you know, you know. Our wedding was small—just family and close friends—in a garden on a perfect June afternoon.

Sarah became my anchor. She supported my career through late nights and tight deadlines, celebrated my successes, consoled me through failures. We built a life together, brick by brick, moment by moment.

Forty years later, I still look at her and feel that same spark I felt in the coffee shop. Some things don't fade with time—they just grow deeper.
`.trim();

// Helper: Create a chapter page
function createChapterPage(decade: string, memoryCount: number): ContentBlock[] {
  return [
    {
      type: 'chapter',
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="text-6xl font-serif font-bold mb-4" style={{ fontFamily: 'var(--font-serif)', color: '#2C3E50' }}>
            THE<br />
            {decade.toUpperCase()}
          </div>
          <div className="w-24 h-0.5 bg-gray-400 mb-6" />
          <div className="text-lg text-gray-600" style={{ fontFamily: 'var(--font-serif)' }}>
            {decade}
          </div>
          <div className="mt-4 text-sm text-gray-500 flex items-center gap-2">
            <span className="inline-block w-4 h-4 rounded-full border-2 border-gray-400" />
            {memoryCount} {memoryCount === 1 ? 'Memory' : 'Memories'} in this chapter
          </div>
          <div className="mt-8 text-xs uppercase tracking-wider text-gray-400">CHAPTER</div>
        </div>
      ),
      noBreak: true,
      pageBreakBefore: true, // Chapter always starts on new page
      pageBreakAfter: true,  // Chapter always ends on its own page
    }
  ];
}

// Helper: Create a complete memory with all components
function createMemory(memory: typeof completeMemory): ContentBlock[] {
  const blocks: ContentBlock[] = [];

  // Photo (if present) - always at start of page
  if (memory.hasPhoto) {
    blocks.push({
      type: 'image',
      content: (
        <div className="bg-gradient-to-br from-gray-300 to-gray-400 rounded-lg flex items-center justify-center text-gray-600 book-image">
          <div className="text-center">
            <div className="text-4xl mb-2">📷</div>
            <div className="text-sm">{memory.title}</div>
          </div>
        </div>
      ),
      noBreak: true,
      pageBreakBefore: true, // Memory always starts on a new page
    });
  }

  // Title
  blocks.push({
    type: 'heading',
    content: memory.title,
    noBreak: true,
  });

  // Date and Age
  blocks.push({
    type: 'callout',
    content: (
      <div className="text-sm text-gray-500 mb-4" style={{ fontFamily: 'var(--font-serif)' }}>
        {memory.year} • {memory.age}
      </div>
    ),
  });

  // Audio player (if present)
  if (memory.hasAudio) {
    blocks.push({
      type: 'audio',
      content: (
        <div className="my-4 bg-gray-50 rounded-lg p-4 border border-gray-200 flex items-center gap-4">
          <button className="w-12 h-12 rounded-full border-2 border-coral-500 flex items-center justify-center hover:bg-coral-50 transition-colors">
            <svg className="w-5 h-5 text-coral-500 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
          <div className="flex-1">
            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-coral-500" style={{ width: '0%' }} />
            </div>
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>0:00</span>
              <span>0:00</span>
            </div>
          </div>
        </div>
      ),
      noBreak: true,
    });
  }

  // Story text (split into paragraphs)
  const paragraphs = memory.story.split('\n\n');
  paragraphs.forEach(para => {
    if (para.trim()) {
      blocks.push({
        type: 'text',
        content: para.trim(),
      });
    }
  });

  // Lesson learned (if present)
  if (memory.lesson) {
    blocks.push({
      type: 'callout',
      content: (
        <div className="my-6 p-6 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-amber-600">✨</span>
            <span className="text-sm font-semibold text-amber-800 uppercase tracking-wide">Lesson Learned</span>
          </div>
          <p className="text-base italic text-gray-700 leading-relaxed" style={{ fontFamily: 'var(--font-serif)' }}>
            "{memory.lesson}"
          </p>
        </div>
      ),
      noBreak: true,
      pageBreakAfter: true, // End of memory - next memory starts on new page
    });
  } else {
    // If no lesson, add page break after last paragraph
    const lastBlock = blocks[blocks.length - 1];
    if (lastBlock) {
      lastBlock.pageBreakAfter = true;
    }
  }

  return blocks;
}

// Convert story text into ContentBlocks
function createContentBlocks(stories: string[], onTOCClick?: (pageNumber: number) => void): ContentBlock[] {
  const blocks: ContentBlock[] = [];

  blocks.push({
    type: 'heading',
    content: 'Table of Contents',
  });

  // TOC entries
  blocks.push({
    type: 'toc-item',
    content: (
      <button
        onClick={() => onTOCClick?.(2)}
        className="flex justify-between py-2 border-b border-gray-200 w-full text-left hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <span>The 1930s</span>
        <span className="text-gray-500">Page 2</span>
      </button>
    ),
  });

  blocks.push({
    type: 'toc-item',
    content: (
      <button
        onClick={() => onTOCClick?.(4)}
        className="flex justify-between py-2 border-b border-gray-200 w-full text-left hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <span>The Boy Who Became My Father</span>
        <span className="text-gray-500">Page 4</span>
      </button>
    ),
  });

  blocks.push({
    type: 'toc-item',
    content: (
      <button
        onClick={() => onTOCClick?.(6)}
        className="flex justify-between py-2 border-b border-gray-200 w-full text-left hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <span>The 1970s</span>
        <span className="text-gray-500">Page 6</span>
      </button>
    ),
  });

  blocks.push({
    type: 'toc-item',
    content: (
      <button
        onClick={() => onTOCClick?.(8)}
        className="flex justify-between py-2 border-b border-gray-200 w-full text-left hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <span>Sleepless Nights</span>
        <span className="text-gray-500">Page 8</span>
      </button>
    ),
  });

  // Chapter: The 1930s
  blocks.push(...createChapterPage('The 1930s', 1));

  // Memory 1: The Boy Who Became My Father
  blocks.push(...createMemory(completeMemory));

  // Chapter: The 1970s
  blocks.push(...createChapterPage('The 1970s', 1));

  // Memory 2: Sleepless Nights
  blocks.push(...createMemory(completeMemory2));

  return blocks;
}

export default function BookTestPage() {
  const [currentPage, setCurrentPage] = useState(0);
  const viewMode = useViewportMode();
  const scrollToPageRef = React.useRef<((pageIndex: number) => void) | null>(null);

  // Handle TOC link clicks
  const handleTOCClick = (pageNumber: number) => {
    if (scrollToPageRef.current) {
      scrollToPageRef.current(pageNumber - 1); // Convert 1-based to 0-based index
    }
  };

  const contentBlocks = createContentBlocks([], handleTOCClick);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold">📖 Book Pagination Test - 5.5×8.5</h1>
          <p className="text-sm text-gray-600 mt-1">
            Half-letter pages with {viewMode === 'spread' ? 'spread view (2 pages)' : 'single page view'}
          </p>
        </div>
      </div>

      {/* Book Container */}
      <BookWrap
        currentPage={currentPage}
        totalPages={10} // Will be updated by SpreadPaginator
        onPageChange={setCurrentPage}
        spreadMode={viewMode === 'spread'}
        scrollToPageRef={scrollToPageRef}
      >
        <SpreadPaginator
          blocks={contentBlocks}
          viewMode={viewMode}
        />
      </BookWrap>

      {/* Instructions */}
      <div className="fixed top-20 right-4 bg-white rounded-lg shadow-lg p-4 max-w-xs hidden lg:block">
        <h3 className="font-semibold text-sm mb-2">Testing Instructions</h3>
        <ul className="text-xs space-y-1 text-gray-600">
          <li>• Use ← → arrow keys to navigate</li>
          <li>• Page Up/Down also work</li>
          <li>• Scroll or click arrow buttons</li>
          <li>• Test with Cmd+P to preview print</li>
          <li>• Half-letter size (5.5" × 8.5")</li>
          <li>• Spread view on wide screens (&gt;1200px)</li>
        </ul>
      </div>
    </div>
  );
}
