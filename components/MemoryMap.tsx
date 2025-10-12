"use client";

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
  const decades = calculateDecadesCovered(stories);
  const decadeEntries = Object.entries(decades).sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
  const leastCoveredDecade = getLeastCoveredDecade(decades);
  
  if (stories.length === 0) {
    return (
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-8 rounded-2xl mb-8">
        <h2 className="text-2xl font-serif mb-4 text-heritage-brown">
          Your Life's Timeline
        </h2>
        <p className="text-gray-600 italic">
          Start recording stories to see your memory map come to life
        </p>
      </div>
    );
  }
  
  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-8 rounded-2xl mb-8">
      <h2 className="text-2xl font-serif mb-6 text-heritage-brown">
        Your Life's Timeline
      </h2>
      <p className="text-gray-600 mb-6 italic">
        You've shared <span className="font-semibold text-heritage-brown">{stories.length}</span> {stories.length === 1 ? 'story' : 'stories'} across <span className="font-semibold text-heritage-brown">{decadeEntries.length}</span> {decadeEntries.length === 1 ? 'decade' : 'decades'}
      </p>
      
      {/* Simple visual dots for each decade */}
      <div className="space-y-3">
        {decadeEntries.map(([decade, count]) => (
          <div key={decade} className="flex items-center gap-4">
            <span className="w-16 text-gray-700 font-medium">{decade}s</span>
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <div 
                  key={i}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    i < count ? 'bg-amber-500' : 'bg-gray-200'
                  }`}
                  title={`${Math.min(count, 5)} ${count === 1 ? 'memory' : 'memories'}`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600 italic">
              {count === 0 
                ? "Stories waiting" 
                : `${count} ${count === 1 ? 'memory' : 'memories'}`
              }
            </span>
          </div>
        ))}
      </div>
      
      {/* Gentle nudge */}
      {leastCoveredDecade && (
        <p className="mt-6 text-gray-600 italic flex items-center gap-2">
          <span className="text-xl">💡</span>
          <span>Your {leastCoveredDecade}s have stories waiting to be told</span>
        </p>
      )}
    </div>
  );
}
