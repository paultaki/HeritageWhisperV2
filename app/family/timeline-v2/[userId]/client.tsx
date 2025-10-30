'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { FamilyGuard } from '@/components/FamilyGuard';
import { FamilyBanner } from '@/components/FamilyBanner';
import { SubmitQuestionDialog } from '@/components/SubmitQuestionDialog';
import { useFamilyAuth } from '@/hooks/use-family-auth';
import { Card } from '@/components/ui/card';
import { Loader2, Plus } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { groupStoriesByDecade } from '@/lib/supabase';
import { normalizeYear } from '@/lib/utils';
import TimelineCardV2 from '@/components/timeline-v2/TimelineCardV2';
import YearScrubber from '@/components/timeline-v2/YearScrubber';
import FloatingAddButton from '@/components/timeline-v2/FloatingAddButton';

// Audio Manager (same as original timeline)
class AudioManager {
  private static instance: AudioManager;
  private currentAudio: HTMLAudioElement | null = null;
  private currentCardId: string | null = null;
  private listeners: Map<string, (playing: boolean, audioElement?: HTMLAudioElement | null) => void> = new Map();

  static getInstance() {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  register(cardId: string, callback: (playing: boolean, audioElement?: HTMLAudioElement | null) => void) {
    this.listeners.set(cardId, callback);
  }

  unregister(cardId: string) {
    if (this.currentCardId === cardId && this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
      this.currentCardId = null;
    }
    this.listeners.delete(cardId);
  }

  play(cardId: string, audio: HTMLAudioElement) {
    if (this.currentAudio && this.currentCardId !== cardId) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      const oldCallback = this.listeners.get(this.currentCardId!);
      if (oldCallback) {
        oldCallback(false, this.currentAudio);
      }
    }
    this.currentAudio = audio;
    this.currentCardId = cardId;
  }

  pause(cardId: string) {
    if (this.currentCardId === cardId) {
      this.currentAudio = null;
      this.currentCardId = null;
    }
  }

  getCurrentCardId() {
    return this.currentCardId;
  }
}

const audioManager = AudioManager.getInstance();

export default function FamilyTimelineV2Client({ userId }: { userId: string }) {
  const router = useRouter();
  const { session, updateFirstAccess } = useFamilyAuth();
  const decadeRefs = useRef<{ [key: string]: HTMLElement | null }>({});
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Mark first access as complete
    if (session?.firstAccess) {
      updateFirstAccess();
    }
  }, [session, updateFirstAccess]);

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

  const allStories = storiesData?.stories || [];
  const stories = allStories.filter((s: any) => s.includeInTimeline === true);
  const storytellerBirthYear = storiesData?.storyteller?.birthYear || 1950;

  // Group stories by decade
  const storiesByDecade = groupStoriesByDecade(stories, storytellerBirthYear);

  // Scroll to decade
  const scrollToDecade = (decadeId: string) => {
    const element = decadeRefs.current[decadeId];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Handle add memory click
  const handleAddMemory = () => {
    // For family members, they can't add memories - show a message or redirect
    alert('Family members can view but not add memories. Contact the storyteller to add more memories.');
  };

  // CHANGE 6: Find empty years (years with no stories)
  const allYears = stories.map((s: any) => normalizeYear(s.storyYear)).filter(Boolean).sort((a: number, b: number) => a - b);
  const minYear = allYears[0] || new Date().getFullYear() - 70;
  const maxYear = allYears[allYears.length - 1] || new Date().getFullYear();
  const emptyYears: number[] = [];
  
  for (let year = minYear; year <= maxYear; year++) {
    if (!allYears.includes(year)) {
      emptyYears.push(year);
    }
  }

  return (
    <FamilyGuard userId={userId}>
      <div className="min-h-screen pb-20 md:pb-0" style={{ background: 'var(--color-page)' }}>
        <FamilyBanner storytellerName={session?.storytellerName || 'Family Member'} />

        <div className="max-w-4xl mx-auto p-4 md:p-6">
          <div className="mb-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-serif font-bold text-gray-800 mb-2">
                  Timeline
                </h1>
                <p className="text-gray-600">
                  {stories.length} {stories.length === 1 ? 'story' : 'stories'} shared with you
                </p>
              </div>
              {session?.permissionLevel === 'contributor' && (
                <SubmitQuestionDialog
                  storytellerId={userId}
                  sessionToken={session.sessionToken}
                  storytellerName={session.storytellerName}
                />
              )}
            </div>
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

          {/* Timeline with stories grouped by decade */}
          {!isLoading && stories.length > 0 && (
            <div className="relative">
              {/* Vertical timeline spine */}
              <div className="absolute left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-200 to-amber-400 md:block hidden" />

              {/* Decade sections */}
              {Object.entries(storiesByDecade).map(([decade, decadeStories]: [string, any[]]) => (
                <div 
                  key={decade} 
                  ref={(el) => { decadeRefs.current[decade] = el; }}
                  data-decade={decade}
                  className="mb-12"
                >
                  {/* Decade header - CHANGE 4: Desktop removes duplicate year markers from spine */}
                  <div className="mb-6 md:ml-0">
                    <h2 className="text-2xl font-serif font-semibold text-gray-800">
                      {decade}
                    </h2>
                  </div>

                  {/* Stories in this decade */}
                  <div className="space-y-6">
                    {decadeStories.map((story: any) => (
                      <TimelineCardV2
                        key={story.id}
                        story={story}
                        birthYear={storytellerBirthYear}
                        audioManager={audioManager}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {/* CHANGE 6: Empty state for years with no memories */}
              {emptyYears.length > 0 && (
                <Card className="p-8 text-center mt-12 bg-amber-50 border-amber-200">
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">
                    Some years are waiting for memories
                  </h3>
                  <p className="text-gray-600 mb-4">
                    There are {emptyYears.length} years without stories between {minYear} and {maxYear}
                  </p>
                  {emptyYears.slice(0, 5).map((year) => (
                    <div key={year} className="text-sm text-gray-500 mb-2">
                      No memories yet for {year}
                    </div>
                  ))}
                  {emptyYears.length > 5 && (
                    <p className="text-sm text-gray-400 mt-2">
                      and {emptyYears.length - 5} more years...
                    </p>
                  )}
                </Card>
              )}
            </div>
          )}
        </div>

        {/* CHANGE 2: Mobile year scrubber - only show on mobile with stories */}
        {isMobile && stories.length > 0 && (
          <YearScrubber 
            decades={Object.keys(storiesByDecade)}
            onSelectDecade={scrollToDecade}
          />
        )}

        {/* CHANGE 5: Floating Add Memory button - Desktop only */}
        {!isMobile && (
          <FloatingAddButton onClick={handleAddMemory} />
        )}

        {/* CHANGE 5: Mobile bottom nav with Add Memory */}
        {isMobile && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-center gap-4">
            <button
              onClick={handleAddMemory}
              className="flex items-center gap-2 bg-amber-600 text-white px-6 py-3 rounded-full font-medium hover:bg-amber-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Add Memory</span>
            </button>
          </div>
        )}
      </div>
    </FamilyGuard>
  );
}

