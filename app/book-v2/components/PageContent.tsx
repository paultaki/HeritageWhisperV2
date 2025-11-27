/**
 * PageContent - Renders page content WITHOUT scrolling
 * Content must fit the page or flow to next page
 */

"use client";

import React from 'react';
import { Play, Pause } from 'lucide-react';
import { DecorativeHeader } from './DecorativeHeader';

export interface ContentBlock {
  type: 'title' | 'metadata' | 'photo' | 'audio' | 'paragraph' | 'wisdomClip' | 'continuation';
  content?: string;
  // For metadata
  year?: number;
  age?: number;
  date?: string;
  // For photo
  photos?: Array<{
    id: string;
    url: string;
    transform?: { zoom: number; position: { x: number; y: number } };
    isHero?: boolean;
  }>;
  // For audio
  audioUrl?: string;
  // For continuation
  direction?: 'from' | 'to';
  storyTitle?: string;
}

export interface PageData {
  type: 'story-start' | 'story-continuation' | 'story-complete' | 'intro' | 'toc' | 'decade-marker';
  pageNumber: number;
  storyId?: string;
  blocks: ContentBlock[];
  continued?: boolean;
  continuesFrom?: string;
  isLeftPage: boolean;
  isRightPage: boolean;
}

interface PageContentProps {
  page: PageData;
  fontSize: number;
  isPlaying?: boolean;
  onAudioToggle?: () => void;
}

export function PageContent({ page, fontSize, isPlaying, onAudioToggle }: PageContentProps) {
  const hasPhoto = page.blocks.some(b => b.type === 'photo' && b.photos?.length);
  const isStoryStart = page.type === 'story-start' || page.type === 'story-complete';

  return (
    <article
      className="book-v2-content"
      style={{ fontSize: `${fontSize}px` }}
    >
      {/* Continuation header if this page continues a story */}
      {page.continuesFrom && (
        <div className="book-v2-continued-from">
          {page.continuesFrom} (continued)
        </div>
      )}

      {/* Decorative header for stories without photos */}
      {isStoryStart && !hasPhoto && <DecorativeHeader />}

      {/* Render content blocks */}
      {page.blocks.map((block, index) => (
        <BlockRenderer
          key={index}
          block={block}
          isStoryStart={isStoryStart}
          hasPhoto={hasPhoto}
          fontSize={fontSize}
          isPlaying={isPlaying}
          onAudioToggle={onAudioToggle}
        />
      ))}

      {/* Continuation indicator */}
      {page.continued && (
        <div className="book-v2-continued-to">
          Continued on next page...
        </div>
      )}

      {/* Page number */}
      <span
        className={`book-v2-page-number ${
          page.isLeftPage ? 'book-v2-page-number--left' : 'book-v2-page-number--right'
        }`}
      >
        {page.pageNumber}
      </span>
    </article>
  );
}

interface BlockRendererProps {
  block: ContentBlock;
  isStoryStart: boolean;
  hasPhoto: boolean;
  fontSize: number;
  isPlaying?: boolean;
  onAudioToggle?: () => void;
}

function BlockRenderer({ block, isStoryStart, hasPhoto, fontSize, isPlaying, onAudioToggle }: BlockRendererProps) {
  switch (block.type) {
    case 'title':
      return (
        <h2 className="book-v2-title">{block.content}</h2>
      );

    case 'metadata':
      return (
        <div className="book-v2-meta">
          {block.year && <span>{block.year}</span>}
          {block.age && (
            <>
              <span className="book-v2-meta-divider" />
              <span>Age {block.age}</span>
            </>
          )}
          {block.date && (
            <>
              <span className="book-v2-meta-divider" />
              <span>{block.date}</span>
            </>
          )}
        </div>
      );

    case 'photo':
      if (!block.photos?.length) return null;
      // Find hero photo or use first photo
      const heroPhoto = block.photos.find(p => p.isHero) || block.photos[0];
      return (
        <div className="book-v2-photo-carousel">
          <img
            src={heroPhoto.url}
            alt=""
            className="book-v2-photo"
            style={
              heroPhoto.transform
                ? {
                    objectPosition: `${50 + heroPhoto.transform.position.x}% ${50 + heroPhoto.transform.position.y}%`,
                  }
                : undefined
            }
          />
          {block.photos.length > 1 && (
            <div className="book-v2-photo-count">
              1 / {block.photos.length}
            </div>
          )}
        </div>
      );

    case 'audio':
      if (!block.audioUrl) return null;
      return (
        <div className="book-v2-audio">
          <button
            className="book-v2-audio-button"
            onClick={onAudioToggle}
            aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </button>
          <span className="text-sm text-gray-600">Listen to this memory</span>
        </div>
      );

    case 'paragraph':
      return (
        <div
          className={`book-v2-text ${isStoryStart && !hasPhoto ? 'book-v2-drop-cap' : ''}`}
        >
          <p>{block.content}</p>
        </div>
      );

    case 'wisdomClip':
      if (!block.content) return null;
      return (
        <div className="book-v2-wisdom">
          <div className="book-v2-wisdom-label">Lesson Learned</div>
          <div className="book-v2-wisdom-text">{block.content}</div>
        </div>
      );

    case 'continuation':
      if (block.direction === 'from') {
        return (
          <div className="book-v2-continued-from">
            {block.storyTitle} (continued)
          </div>
        );
      }
      return (
        <div className="book-v2-continued-to">
          Continued on next page...
        </div>
      );

    default:
      return null;
  }
}
