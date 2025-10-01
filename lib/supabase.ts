// Note: We're using Drizzle directly with PostgreSQL connection instead of Supabase client
// This file provides utility functions for working with our database schema

import { createClient } from '@supabase/supabase-js';
import { normalizeYear } from './utils';

// Supabase OAuth configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'heritage-whisper-auth',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Expose supabase to window for debugging (remove in production)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).supabase = supabase;
}

export async function signInWithGoogle() {
  const redirectUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/auth/callback`
    : `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002'}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      }
    }
  });
  
  if (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
  
  return data;
}

export async function handleOAuthCallback() {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Error getting session:', error);
    throw error;
  }
  
  return session;
}

export async function signOutSupabase() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export interface User {
  id: string;
  email: string;
  name: string;
  birthYear: number;
  storyCount: number;
  isPaid: boolean;
}

export interface Story {
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
  createdAt: string;
}

export interface GhostPrompt {
  id: string;
  title: string;
  text: string;
  category: string;
  decade: string;
}

// Calculate age from birth year
export function calculateAge(birthYear: number): number {
  return new Date().getFullYear() - birthYear;
}

// Calculate decade from year
export function getDecadeFromYear(year: number | string): string {
  const normalizedYear = normalizeYear(year);
  if (!normalizedYear) return 'Unknown';
  
  const decade = Math.floor(normalizedYear / 10) * 10;
  return `${decade}s`;
}

// Format age range for decade
export function getAgeRangeForDecade(birthYear: number, decade: string): string {
  const decadeStart = parseInt(decade.replace('s', ''));
  const startAge = Math.max(0, decadeStart - birthYear);
  const endAge = startAge + 9;
  return `Ages ${startAge}-${endAge}`;
}

// Get decade display name
export function getDecadeDisplayName(decade: string): string {
  const year = decade.replace('s', '');
  return `THE ${year}s`;
}

// Group stories by decade
export function groupStoriesByDecade(stories: Story[], birthYear: number) {
  const decades = new Map<string, Story[]>();
  const normalizedBirthYear = normalizeYear(birthYear);
  
  stories.forEach(story => {
    const normalizedStoryYear = normalizeYear(story.storyYear);
    
    // Skip invalid years
    if (!normalizedStoryYear) {
      return;
    }
    
    // Skip birth year stories - they go in their own section
    if (normalizedStoryYear === normalizedBirthYear) {
      return;
    }
    
    const decade = getDecadeFromYear(normalizedStoryYear);
    if (decade !== 'Unknown') {
      if (!decades.has(decade)) {
        decades.set(decade, []);
      }
      decades.get(decade)!.push(story);
    }
  });

  return Array.from(decades.entries())
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .map(([decade, stories]) => ({
      decade,
      displayName: getDecadeDisplayName(decade),
      ageRange: getAgeRangeForDecade(birthYear, decade),
      stories: stories.sort((a, b) => {
        const yearA = normalizeYear(a.storyYear) || 0;
        const yearB = normalizeYear(b.storyYear) || 0;
        return yearA - yearB;
      })
    }));
}
