'use client';

import { useQuery } from '@tanstack/react-query';
import { FamilyGuard } from '@/components/FamilyGuard';
import { FamilyBanner } from '@/components/FamilyBanner';
import { useFamilyAuth } from '@/hooks/use-family-auth';
import { Card } from '@/components/ui/card';
import { Loader2, BookOpen } from 'lucide-react';

export default function FamilyBookClient({ userId }: { userId: string }) {
  const { session } = useFamilyAuth();

  // Fetch stories using family session token
  const { data: storiesData, isLoading } = useQuery({
    queryKey: ['/api/family/stories', userId],
    queryFn: async () => {
      if (!session?.sessionToken) {
        throw new Error('No session token');
      }

      const response = await fetch(`/api/family/stories/${userId}`, {
        headers: {
          Authorization: `Bearer ${session.sessionToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stories');
      }

      return response.json();
    },
    enabled: !!session?.sessionToken,
  });

  const stories = storiesData?.stories || [];

  // Group stories by decade
  const storiesByDecade = stories.reduce((acc: any, story: any) => {
    if (!story.storyYear) return acc;
    
    const decade = Math.floor(story.storyYear / 10) * 10;
    if (!acc[decade]) {
      acc[decade] = [];
    }
    acc[decade].push(story);
    return acc;
  }, {});

  const decades = Object.keys(storiesByDecade)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <FamilyGuard userId={userId}>
      <div className="min-h-screen pb-20 md:pb-0" style={{ background: 'var(--color-page)' }}>
        <FamilyBanner storytellerName={session?.storytellerName || 'Family Member'} />

        <div className="max-w-4xl mx-auto p-4 md:p-6">
          <div className="mb-8 text-center">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-amber-600" />
            <h1 className="text-3xl font-serif font-bold text-gray-800 mb-2">
              Memory Book
            </h1>
            <p className="text-gray-600">
              {stories.length} {stories.length === 1 ? 'story' : 'stories'} organized by decade
            </p>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
            </div>
          )}

          {!isLoading && stories.length === 0 && (
            <Card className="p-12 text-center">
              <p className="text-gray-600">No stories have been shared yet.</p>
            </Card>
          )}

          {!isLoading && decades.length > 0 && (
            <div className="space-y-12">
              {decades.map((decade) => (
                <div key={decade}>
                  <div className="mb-6">
                    <h2 className="text-2xl font-serif font-bold text-amber-800 border-b-2 border-amber-200 pb-2">
                      {decade}s
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {storiesByDecade[decade].length} {storiesByDecade[decade].length === 1 ? 'story' : 'stories'}
                    </p>
                  </div>

                  <div className="space-y-6">
                    {storiesByDecade[decade].map((story: any) => (
                      <Card key={story.id} className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-serif font-semibold text-gray-800 mb-1">
                              {story.title}
                            </h3>
                            {story.storyYear && (
                              <p className="text-sm text-gray-600">
                                {story.storyYear}
                                {story.ageAtStory && ` • Age ${story.ageAtStory}`}
                              </p>
                            )}
                          </div>
                          <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
                            👁 View Only
                          </span>
                        </div>

                        {story.heroPhotoUrl && (
                          <div className="mb-4">
                            <img
                              src={story.heroPhotoUrl}
                              alt={story.title}
                              className="w-full rounded-lg object-cover max-h-96"
                            />
                          </div>
                        )}

                        <div className="prose max-w-none">
                          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {story.transcript}
                          </p>
                        </div>

                        {story.audioUrl && (
                          <div className="mt-4 pt-4 border-t">
                            <audio controls className="w-full">
                              <source src={story.audioUrl} type="audio/webm" />
                              Your browser does not support the audio element.
                            </audio>
                          </div>
                        )}

                        {story.wisdomText && (
                          <div className="mt-4 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg">
                            <p className="text-sm italic text-gray-700">
                              "{story.wisdomText}"
                            </p>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </FamilyGuard>
  );
}
