"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import { ArrowLeft, Loader2, Check, X, ChevronDown, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StoryReviewCard } from "@/components/review/StoryReviewCard";
import { FullInterviewCard } from "@/components/review/FullInterviewCard";
import { formatDuration } from "@/lib/audioSlicer";

interface ParsedStory {
  id: string;
  recommendedTitle: string;
  bridgedText: string;
  rawTranscript: string;
  messageIds: string[];
  startTimestamp: string;
  endTimestamp: string;
  durationSeconds: number;
  audioUrl?: string;
  suggestedYear?: number;
  suggestedAge?: number;
  lifePhase?: string;
  wisdomSuggestion?: string;
  peopleMentioned?: string[];
  placesMentioned?: string[];
}

interface DetectedStories {
  parsedStories: ParsedStory[];
  fullInterview: {
    formattedTranscript: string;
    totalDurationSeconds: number;
  };
  metadata: {
    totalStoriesFound: number;
    processedAt: string;
  };
}

interface Interview {
  id: string;
  userId: string;
  fullAudioUrl: string;
  mixedAudioUrl?: string;
  durationSeconds: number;
  transcriptJson: any[];
  theme?: string;
  status: string;
  detectedStories?: DetectedStories;
  storiesParsedAt?: string;
  createdAt: string;
}

interface StoryEdits {
  [storyId: string]: {
    title: string;
    storyYear?: number;
    storyAge?: number;
    lifePhase?: string;
    lessonLearned?: string;
    photos: any[];
    included: boolean;
  };
}

function InterviewReviewContent() {
  const router = useRouter();
  const params = useParams();
  const interviewId = params.id as string;
  const { user, isLoading: isAuthLoading } = useAuth();

  const [interview, setInterview] = useState<Interview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFixingAudio, setIsFixingAudio] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Story editing state
  const [storyEdits, setStoryEdits] = useState<StoryEdits>({});
  const [saveAsFullInterview, setSaveAsFullInterview] = useState(false);
  const [fullInterviewTitle, setFullInterviewTitle] = useState("");

  // Fetch interview and parse if needed
  const fetchInterviewAndParse = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token;

      if (!authToken) {
        throw new Error("Not authenticated");
      }

      // 1. Fetch interview
      const response = await fetch(`/api/interviews/${interviewId}`, {
        headers: {
          "Authorization": `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch interview");
      }

      const { interview: fetchedInterview } = await response.json();
      
      // 2. Check if parsing is needed
      if (!fetchedInterview.detectedStories) {
        setIsParsing(true);
        
        // Call parse API
        const parseResponse = await fetch(`/api/interviews/${interviewId}/parse`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${authToken}`,
          },
        });

        if (!parseResponse.ok) {
          throw new Error("Failed to parse interview");
        }

        const { detectedStories } = await parseResponse.json();
        fetchedInterview.detectedStories = detectedStories;
        setIsParsing(false);
      }

      setInterview(fetchedInterview);

      // 2b. Fix WebM audio if needed (broken duration metadata)
      // This is a workaround for MediaRecorder WebM files with wrong duration
      if (fetchedInterview.fullAudioUrl && !fetchedInterview.fullAudioUrl.includes('-fixed.webm')) {
        setIsFixingAudio(true);
        console.log('[InterviewReview] Attempting to fix WebM audio metadata...');
        
        try {
          const fixResponse = await fetch('/api/process-audio/fix-webm', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ audioUrl: fetchedInterview.fullAudioUrl }),
          });

          if (fixResponse.ok) {
            const fixData = await fixResponse.json();
            console.log('[InterviewReview] ✅ Audio fixed! New URL:', fixData.url);
            
            // Update interview with fixed audio URL
            fetchedInterview.fullAudioUrl = fixData.url;
            if (fixData.durationSeconds) {
              fetchedInterview.durationSeconds = fixData.durationSeconds;
            }
            
            // Also update the database
            await fetch(`/api/interviews/${interviewId}`, {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                fullAudioUrl: fixData.url,
                durationSeconds: fixData.durationSeconds || fetchedInterview.durationSeconds,
              }),
            });
            
            setInterview({ ...fetchedInterview });
          } else {
            console.warn('[InterviewReview] Could not fix audio, using original');
          }
        } catch (fixError) {
          console.warn('[InterviewReview] Audio fix failed:', fixError);
        } finally {
          setIsFixingAudio(false);
        }
      }

      // 3. Initialize story edits
      if (fetchedInterview.detectedStories?.parsedStories) {
        const initialEdits: StoryEdits = {};
        for (const story of fetchedInterview.detectedStories.parsedStories) {
          // Parse year - handle cases like "1980s" or "early 1980s"
          let storyYear: number | undefined = undefined;
          if (story.suggestedYear) {
            const yearMatch = String(story.suggestedYear).match(/\d{4}/);
            if (yearMatch) {
              const parsed = parseInt(yearMatch[0], 10);
              if (parsed > 1800 && parsed < 2100) {
                storyYear = parsed;
              }
            }
          }

          // Parse age - ensure it's a number
          let storyAge: number | undefined = undefined;
          if (story.suggestedAge) {
            const parsed = parseInt(String(story.suggestedAge), 10);
            if (!isNaN(parsed) && parsed > 0 && parsed < 150) {
              storyAge = parsed;
            }
          }

          initialEdits[story.id] = {
            title: story.recommendedTitle,
            storyYear,
            storyAge,
            lifePhase: story.lifePhase,
            lessonLearned: story.wisdomSuggestion,
            photos: [],
            included: true,
          };
        }
        setStoryEdits(initialEdits);
      }

      // Initialize full interview title
      const date = new Date(fetchedInterview.createdAt);
      setFullInterviewTitle(
        `Conversation with Pearl - ${date.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`
      );
    } catch (err) {
      console.error("[InterviewReview] Error:", err);
      setError(err instanceof Error ? err.message : "Failed to load interview");
    } finally {
      setIsLoading(false);
    }
  }, [user, interviewId]);

  useEffect(() => {
    if (!isAuthLoading && user) {
      fetchInterviewAndParse();
    }
  }, [isAuthLoading, user, fetchInterviewAndParse]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, isAuthLoading, router]);

  // Handle story edit updates
  const handleStoryUpdate = useCallback((storyId: string, updates: Partial<StoryEdits[string]>) => {
    setStoryEdits(prev => ({
      ...prev,
      [storyId]: {
        ...prev[storyId],
        ...updates,
      },
    }));
  }, []);

  // Toggle story inclusion
  const handleToggleIncluded = useCallback((storyId: string) => {
    setStoryEdits(prev => ({
      ...prev,
      [storyId]: {
        ...prev[storyId],
        included: !prev[storyId].included,
      },
    }));
  }, []);

  // Handle "Save as Full Interview" toggle
  const handleToggleFullInterview = useCallback(() => {
    setSaveAsFullInterview(prev => !prev);
  }, []);

  // Count included stories
  const includedStoriesCount = Object.values(storyEdits).filter(e => e.included).length;

  // Save stories
  const handleSaveStories = async () => {
    if (!interview || !user) return;

    try {
      setIsSaving(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token;

      if (!authToken) {
        throw new Error("Not authenticated");
      }

      // Prepare stories to save
      const stories = saveAsFullInterview
        ? [
            {
              tempId: "full-interview",
              title: fullInterviewTitle,
              transcription: interview.detectedStories?.fullInterview.formattedTranscript || "",
              audioUrl: interview.mixedAudioUrl || interview.fullAudioUrl,
              durationSeconds: interview.durationSeconds,
              lessonLearned: "",
              photos: [],
            },
          ]
        : interview.detectedStories?.parsedStories
            .filter(story => storyEdits[story.id]?.included)
            .map(story => ({
              tempId: story.id,
              title: storyEdits[story.id].title,
              transcription: story.bridgedText,
              audioUrl: story.audioUrl || interview.fullAudioUrl,
              durationSeconds: story.durationSeconds,
              storyYear: storyEdits[story.id].storyYear,
              storyAge: storyEdits[story.id].storyAge,
              lifePhase: storyEdits[story.id].lifePhase,
              lessonLearned: storyEdits[story.id].lessonLearned,
              photos: storyEdits[story.id].photos,
              interviewStartMs: new Date(story.startTimestamp).getTime(),
              interviewEndMs: new Date(story.endTimestamp).getTime(),
            })) || [];

      if (stories.length === 0) {
        setError("Please select at least one story to save");
        setIsSaving(false);
        return;
      }

      // Call save API
      const response = await fetch(`/api/interviews/${interviewId}/save-stories`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stories,
          saveAsFullInterview,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[InterviewReview] Save API error:', errorData);
        // Show detailed errors if available
        if (errorData.errors && errorData.errors.length > 0) {
          console.error('[InterviewReview] Story errors:', errorData.errors);
          throw new Error(`Failed to save: ${errorData.errors[0]}`);
        }
        throw new Error(errorData.details || errorData.error || "Failed to save stories");
      }

      const result = await response.json();
      console.log("[InterviewReview] Stories saved:", result);

      // Redirect to timeline with success message
      router.push(`/timeline?saved=${result.created}`);
    } catch (err) {
      console.error("[InterviewReview] Save error:", err);
      setError(err instanceof Error ? err.message : "Failed to save stories");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle discard
  const handleDiscard = () => {
    if (confirm("Are you sure you want to discard this interview? All stories will be lost.")) {
      router.push("/timeline");
    }
  };

  // Loading state
  if (isAuthLoading || isLoading || isFixingAudio) {
    let loadingMessage = "Loading your stories...";
    if (isParsing) loadingMessage = "Analyzing your conversation...";
    else if (isFixingAudio) loadingMessage = "Preparing audio for playback...";

    return (
      <div className="hw-page flex items-center justify-center" style={{ background: "var(--hw-page-bg)", minHeight: "100vh" }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--hw-primary)]/20 border-t-[var(--hw-primary)] rounded-full mx-auto mb-4 animate-spin" />
          <p className="text-[var(--hw-text-secondary)] text-lg">{loadingMessage}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !interview) {
    return (
      <div className="hw-page flex items-center justify-center" style={{ background: "var(--hw-page-bg)", minHeight: "100vh" }}>
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button
            onClick={() => fetchInterviewAndParse()}
            className="min-h-[48px] bg-[var(--hw-primary)] hover:bg-[var(--hw-primary-hover)] text-white"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!interview || !interview.detectedStories) {
    return null;
  }

  const { parsedStories, fullInterview } = interview.detectedStories;
  const storiesCount = parsedStories.length;

  // Debug logging for audio URLs and story data
  console.log('[InterviewReview] Interview data:', {
    fullAudioUrl: interview.fullAudioUrl,
    mixedAudioUrl: interview.mixedAudioUrl,
    durationSeconds: interview.durationSeconds,
  });
  console.log('[InterviewReview] Parsed stories:', parsedStories.map(s => ({
    id: s.id,
    title: s.recommendedTitle,
    durationSeconds: s.durationSeconds,
    hasAudioUrl: !!s.audioUrl,
  })));
  console.log('[InterviewReview] Full interview:', {
    totalDurationSeconds: fullInterview.totalDurationSeconds,
    hasTranscript: !!fullInterview.formattedTranscript,
  });

  return (
    <div className="hw-page" style={{ background: "var(--hw-page-bg)", minHeight: "100vh" }}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--hw-surface)] border-b border-[var(--hw-border-subtle)]">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 flex items-center justify-center text-[var(--hw-text-secondary)] hover:text-[var(--hw-text-primary)] transition-colors rounded-full hover:bg-[var(--hw-section-bg)]"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <Image
                src="/final logo/logo-new.svg"
                alt="Heritage Whisper"
                width={140}
                height={35}
                className="h-7 w-auto mx-auto"
                priority
              />
            </div>
            <div className="w-10" /> {/* Spacer for balance */}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6 pb-32">
        {/* Title Section */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[var(--hw-text-primary)] mb-2">
            Your Stories
          </h1>
          <p className="text-base text-[var(--hw-text-secondary)]">
            We found {storiesCount} {storiesCount === 1 ? "story" : "stories"} in your conversation.
            Review each one below—edit titles, add dates, or skip any you don&apos;t want to keep.
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-700 text-base">{error}</p>
          </div>
        )}

        {/* Individual Stories */}
        <div className="space-y-4 mb-8">
          {parsedStories.map((story, index) => (
            <StoryReviewCard
              key={story.id}
              story={story}
              index={index}
              totalStories={storiesCount}
              edits={storyEdits[story.id]}
              onUpdate={(updates) => handleStoryUpdate(story.id, updates)}
              onToggleIncluded={() => handleToggleIncluded(story.id)}
              audioUrl={story.audioUrl || interview.fullAudioUrl}
              disabled={saveAsFullInterview}
              userBirthYear={user?.birthYear}
            />
          ))}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 h-px bg-[var(--hw-border-subtle)]" />
          <span className="text-sm text-[var(--hw-text-muted)] uppercase tracking-wide">OR</span>
          <div className="flex-1 h-px bg-[var(--hw-border-subtle)]" />
        </div>

        {/* Full Interview Option */}
        <FullInterviewCard
          checked={saveAsFullInterview}
          onToggle={handleToggleFullInterview}
          title={fullInterviewTitle}
          onTitleChange={setFullInterviewTitle}
          transcript={fullInterview.formattedTranscript}
          audioUrl={interview.mixedAudioUrl || interview.fullAudioUrl}
          durationSeconds={fullInterview.totalDurationSeconds}
        />
      </div>

      {/* Fixed Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-[var(--hw-surface)] border-t border-[var(--hw-border-subtle)] p-4">
        <div className="max-w-3xl mx-auto space-y-3">
          <Button
            onClick={handleSaveStories}
            disabled={isSaving || (includedStoriesCount === 0 && !saveAsFullInterview)}
            className="w-full min-h-[60px] bg-[var(--hw-primary)] hover:bg-[var(--hw-primary-hover)] text-white text-lg font-medium rounded-xl shadow-sm"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Saving...
              </>
            ) : saveAsFullInterview ? (
              <>
                <Check className="w-5 h-5 mr-2" />
                Save Story to My Timeline
              </>
            ) : (
              <>
                <Check className="w-5 h-5 mr-2" />
                Save {includedStoriesCount} {includedStoriesCount === 1 ? "Story" : "Stories"} to My Timeline
              </>
            )}
          </Button>
          <button
            onClick={handleDiscard}
            className="w-full min-h-[48px] text-base text-[var(--hw-text-secondary)] hover:text-[var(--hw-error)] transition-colors"
          >
            Discard and start over
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InterviewReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="hw-page flex items-center justify-center" style={{ background: "var(--hw-page-bg)", minHeight: "100vh" }}>
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[var(--hw-primary)]/20 border-t-[var(--hw-primary)] rounded-full mx-auto mb-4 animate-spin" />
            <p className="text-[var(--hw-text-secondary)] text-lg">Loading...</p>
          </div>
        </div>
      }
    >
      <InterviewReviewContent />
    </Suspense>
  );
}
