"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import BookProgressBar from "@/components/BookProgressBar";

// Story interface matching your API structure
interface Story {
  id: string;
  userId: string;
  title: string;
  audioUrl: string;
  transcription?: string;
  durationSeconds?: number;
  wisdomClipUrl?: string;
  wisdomClipText?: string;
  storyYear: number;
  storyDate?: string;
  lifeAge?: number;
  photoUrl?: string;
  photoTransform?: { zoom: number; position: { x: number; y: number } };
  photos?: Array<{
    id: string;
    url: string;
    transform?: { zoom: number; position: { x: number; y: number } };
    caption?: string;
    isHero?: boolean;
  }>;
  emotions?: string[];
  pivotalCategory?: string;
  includeInBook?: boolean;
  formattedContent?: {
    formattedText?: string;
    pages?: string[];
    questions?: Array<{ text: string }>;
  };
  createdAt: string;
}

export default function BookV4Page() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [currentPage, setCurrentPage] = useState(0);

  // Fetch stories - same as main book
  const { data, isLoading } = useQuery<{ stories: Story[] }>({
    queryKey: ["/api/stories"],
    enabled: !!user,
  });

  const stories = data?.stories || [];

  // Filter stories that should be included in book
  const bookStories = stories.filter(
    (s) => s.includeInBook !== false && s.storyYear && s.transcription
  );

  // Sort by year
  const sortedStories = [...bookStories].sort((a, b) => a.storyYear - b.storyYear);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your stories...</p>
        </div>
      </div>
    );
  }

  // No stories state
  if (sortedStories.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <h2 className="text-2xl font-serif text-gray-800 mb-4">
            Your Book is Empty
          </h2>
          <p className="text-gray-600 mb-6">
            Start creating memories to see them appear here.
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-gradient-to-r from-[#8b6b7a] to-[#b88b94] text-white rounded-full hover:shadow-lg transition-all"
          >
            Create Your First Memory
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      {/* Header with Progress Bar */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => router.push("/")}
              className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
            >
              ← Back to Home
            </button>
            <h1 className="text-2xl font-serif text-gray-800">
              Your Story Book
            </h1>
            <div className="w-24" /> {/* Spacer for centering */}
          </div>
          <BookProgressBar
            currentPage={currentPage}
            totalPages={sortedStories.length}
            onPageClick={(page) => setCurrentPage(page)}
          />
        </div>
      </div>

      {/* PASTE YOUR NEW BOOK UI HERE */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {sortedStories.map((story, index) => (
            <div
              key={story.id}
              className="bg-white rounded-lg shadow-lg p-8 border border-gray-200"
            >
              {/* Placeholder - Replace with your new design */}
              <div className="mb-4">
                <span className="text-sm text-gray-500">
                  {story.storyYear}
                  {story.lifeAge !== undefined && ` • Age ${story.lifeAge}`}
                </span>
              </div>
              
              <h2 className="text-3xl font-serif text-gray-800 mb-4">
                {story.title}
              </h2>

              {story.photos && story.photos.length > 0 && (
                <div className="mb-6">
                  <img
                    src={story.photos[0].url}
                    alt={story.title}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
              )}

              <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
                {story.transcription}
              </div>

              {story.wisdomClipText && (
                <div className="mt-6 p-4 bg-amber-50 border-l-4 border-amber-400 rounded">
                  <p className="text-sm font-semibold text-amber-900 mb-1">
                    Lesson Learned
                  </p>
                  <p className="text-gray-700 italic">{story.wisdomClipText}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Navigation - Keep if needed */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          <span className="text-gray-600">
            Page {currentPage + 1} of {sortedStories.length}
          </span>
          <button
            onClick={() =>
              setCurrentPage(Math.min(sortedStories.length - 1, currentPage + 1))
            }
            disabled={currentPage === sortedStories.length - 1}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
