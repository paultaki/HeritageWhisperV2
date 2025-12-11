'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { FamilyGuard } from '@/components/FamilyGuard';
import { FamilyBanner } from '@/components/FamilyBanner';
import FamilyNav from '@/components/FamilyNav';
import { useFamilyAuth } from '@/hooks/use-family-auth';
import { Card } from '@/components/ui/card';
import { Loader2, Calendar, Play, Pause, AlertCircle } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { groupStoriesByDecade } from '@/lib/supabase';
import { normalizeYear, formatYear } from '@/lib/utils';
import { getTopTraits } from '@/utils/getTopTraits';
import Image from 'next/image';

// Audio Manager (same as author's timeline)
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
}

const audioManager = AudioManager.getInstance();

export default function FamilyTimelineClient({ userId }: { userId: string }) {
  const router = useRouter();
  const { session, updateFirstAccess } = useFamilyAuth();
  const decadeRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  useEffect(() => {
    // Mark first access as complete
    if (session?.firstAccess) {
      updateFirstAccess();
    }
  }, [session, updateFirstAccess]);

  // Fetch stories using family session (HttpOnly cookie sent automatically)
  const { data: storiesData, isLoading } = useQuery({
    queryKey: ['/api/family/stories', userId],
    queryFn: async () => {
      if (!session) {
        throw new Error('No session');
      }

      const response = await fetch(`/api/family/stories/${userId}`, {
        credentials: 'include', // Send HttpOnly cookie
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stories');
      }

      return response.json();
    },
    enabled: !!session,
  });

  const allStories = storiesData?.stories || [];
  const stories = allStories.filter((s: any) => s.includeInTimeline === true);
  const storytellerBirthYear = storiesData?.storyteller?.birthYear || 1950;

  return (
    <FamilyGuard userId={userId}>
      <div className="hw-page pb-24" style={{ background: 'var(--color-page)' }}>
        <FamilyBanner storytellerName={session?.storytellerName || 'Family Member'} />

        {/* Bottom Navigation Bar */}
        <FamilyNav
          activeKey="timeline"
          userId={userId}
          storytellerName={session?.storytellerName || 'Family Member'}
          permissionLevel={session?.permissionLevel}
        />

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

          {!isLoading && stories.length > 0 && (
            <div className="space-y-6">
              {stories.map((story: any) => (
                <Card key={story.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-serif font-semibold text-gray-800 mb-1">
                        {story.title}
                      </h2>
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
          )}
        </div>
      </div>
    </FamilyGuard>
  );
}
