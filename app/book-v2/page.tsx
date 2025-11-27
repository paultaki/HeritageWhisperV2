/**
 * Book V2 - Premium Page-Based Reading Experience
 * No scrolling within pages - content flows across multiple pages
 */

"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useAccountContext } from '@/hooks/use-account-context';
import { apiRequest } from '@/lib/queryClient';
import { getApiUrl } from '@/lib/config';
import { BookContainer } from './components/BookContainer';
import { Loader2 } from 'lucide-react';
import './book-v2.css';

// Story interface matching API
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
  includeInBook?: boolean;
  createdAt: string;
}

function BookV2Content() {
  const { user } = useAuth();
  const { activeContext, isLoading: isContextLoading } = useAccountContext();
  const isOwnAccount = activeContext?.type === 'own';
  const router = useRouter();

  // Font size state with localStorage persistence
  const [fontSize, setFontSize] = useState(18);

  useEffect(() => {
    const saved = localStorage.getItem('bookViewFontSize');
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= 14 && parsed <= 28) {
        setFontSize(parsed);
      }
    }
  }, []);

  const handleFontSizeChange = (size: number) => {
    setFontSize(size);
    localStorage.setItem('bookViewFontSize', size.toString());
  };

  // Fetch stories
  const storytellerId = activeContext?.storytellerId || user?.id;
  const queryEnabled = !isContextLoading && ((!!user && !!user.id) || !!activeContext);

  const { data, isLoading, isFetching } = useQuery<{ stories: Story[] }>({
    queryKey: ['/api/stories', storytellerId],
    queryFn: async () => {
      const url = storytellerId
        ? `${getApiUrl('/api/stories')}?storyteller_id=${storytellerId}`
        : getApiUrl('/api/stories');

      const res = await apiRequest('GET', url);
      return res.json();
    },
    enabled: queryEnabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const stories = data?.stories || [];

  // Show loading while context or data is loading
  if (isContextLoading || isLoading) {
    return (
      <div className="book-v2-container">
        <div className="book-v2-loading">
          <Loader2 className="w-12 h-12 text-white/50 animate-spin" />
          <p className="mt-4 text-white/70">Loading your book...</p>
        </div>
      </div>
    );
  }

  return (
    <BookContainer
      stories={stories}
      isLoading={isFetching}
      fontSize={fontSize}
      onFontSizeChange={handleFontSizeChange}
      isOwnAccount={isOwnAccount}
    />
  );
}

export default function BookV2Page() {
  return (
    <Suspense
      fallback={
        <div className="book-v2-container">
          <div className="book-v2-loading">
            <Loader2 className="w-12 h-12 text-white/50 animate-spin" />
          </div>
        </div>
      }
    >
      <BookV2Content />
    </Suspense>
  );
}
