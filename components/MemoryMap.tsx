"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface Story {
  id: string;
  storyYear?: number;
  story_year?: number;
}

interface MemoryMapProps {
  stories: Story[];
}

function calculateDecadesCovered(stories: Story[]) {
  const decades: Record<string, number> = {};
  
  stories.forEach((story) => {
    const year = story.storyYear || story.story_year;
    if (year) {
      const decade = Math.floor(year / 10) * 10;
      decades[decade] = (decades[decade] || 0) + 1;
    }
  });
  
  return decades;
}

function getLeastCoveredDecade(decades: Record<string, number>): string | null {
  const entries = Object.entries(decades);
  if (entries.length === 0) return null;
  
  // Find decades with 0 or 1 stories
  const sparse = entries.filter(([_, count]) => count <= 1);
  if (sparse.length > 0) {
    // Return the most recent sparse decade
    const sorted = sparse.sort((a, b) => parseInt(b[0]) - parseInt(a[0]));
    return sorted[0][0];
  }
  
  // All decades covered well, return the one with fewest stories
  const sorted = entries.sort((a, b) => a[1] - b[1]);
  return sorted[0][0];
}

export function MemoryMap({ stories }: MemoryMapProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const decades = calculateDecadesCovered(stories);
  const decadeEntries = Object.entries(decades).sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
  const leastCoveredDecade = getLeastCoveredDecade(decades);

  if (stories.length === 0) {
    return (
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-2xl mb-6">
        <h2 className="text-xl font-serif mb-2 text-heritage-brown">
          Your Life's Timeline
        </h2>
        <p className="text-gray-600 italic text-sm">
          Start recording stories to see your memory map come to life
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-2xl mb-6">
      {/* Collapsed Summary View */}
      <div
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-serif mb-2 text-heritage-brown">
              Your Life's Timeline
            </h2>
            <div className="space-y-1">
              <p className="text-gray-700 text-sm">
                <span className="font-semibold">{stories.length} {stories.length === 1 ? 'story' : 'stories'}</span> across <span className="font-semibold">{decadeEntries.length} {decadeEntries.length === 1 ? 'decade' : 'decades'}</span>
              </p>
              {leastCoveredDecade && (
                <p className="text-gray-600 italic text-sm">
                  💡 Your {leastCoveredDecade}s have stories waiting to be told
                </p>
              )}
            </div>
          </div>
          <button
            className="ml-4 p-1 hover:bg-amber-100 rounded-lg transition-colors"
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Detail View */}
      {isExpanded && (
        <div className="mt-6 pt-6 border-t border-amber-200">
          {/* Visual dots for each decade */}
          <div className="space-y-3">
            {decadeEntries.map(([decade, count]) => (
              <div key={decade} className="flex items-center gap-4">
                <span className="w-16 text-gray-700 font-medium text-sm">{decade}s</span>
                <div className="flex gap-1">
                  {[...Array(Math.min(count, 5))].map((_, i) => (
                    <div
                      key={i}
                      className="w-3 h-3 rounded-full bg-amber-500"
                      title={`${count} ${count === 1 ? 'memory' : 'memories'}`}
                    />
                  ))}
                  {count > 5 && (
                    <span className="text-xs text-amber-600 ml-1">+{count - 5}</span>
                  )}
                  {count === 0 && (
                    <div className="flex gap-1">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className="w-3 h-3 rounded-full bg-gray-200"
                        />
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-xs text-gray-600 italic">
                  {count === 0
                    ? "Stories waiting"
                    : `${count} ${count === 1 ? 'memory' : 'memories'}`
                  }
                </span>
              </div>
            ))}
          </div>

          {/* Expand prompt */}
          <p className="mt-4 text-xs text-gray-500 italic">
            Click anywhere above to collapse
          </p>
        </div>
      )}
    </div>
  );
}
