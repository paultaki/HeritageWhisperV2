/**
 * TimelineMobileV2 - Enhanced timeline with senior-friendly UX improvements
 * 
 * V2 Features:
 * 1. Audio indicator with "Listen • duration" and circular progress
 * 2. Mobile year scrubber on right edge
 * 3. Photo carousel with arrow buttons and swipe
 * 4. Improved metadata format "Age 7 • Summer 1962"
 * 5. Bottom nav "Add Memory" button
 * 6. Empty state for years with no memories
 */

"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useAccountContext } from "@/hooks/use-account-context";
import { NextStoryCard } from "@/components/NextStoryCard";
import { PaywallPromptCard } from "@/components/PaywallPromptCard";
import DecadeNav from "@/components/ui/DecadeNav";
import { useToast } from "@/hooks/use-toast";
import { type Story } from "@/lib/supabase";
import { type GhostPrompt } from "@/lib/ghostPrompts";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { normalizeYear } from "@/lib/utils";

// Hooks
import { useTimelineData } from "@/hooks/use-timeline-data";
import { useTimelineNavigation } from "@/hooks/use-timeline-navigation";
import { useTimelineUI } from "@/hooks/use-timeline-ui";

// V2 Components
import { TimelineHeader } from "@/components/timeline/TimelineHeader";
import { TimelineDecadeSection } from "@/components/timeline/TimelineDecadeSection";
import { TimelineEnd } from "@/components/timeline/TimelineEnd";
import { STARTER_TEMPLATES, type StarterMemoryTemplate } from "@/lib/starterTemplates";
import { StarterMemoryCard } from "@/components/timeline/StarterMemoryCard";

export function TimelineMobileV2() {
  const { user, session, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // V3: Get active storyteller context for family sharing
  const { activeContext, isLoading: isAccountContextLoading } = useAccountContext();
  const isViewingOwnAccount = activeContext?.type === 'own';

  console.log('[TimelineMobileV2] Auth state:', { user: !!user, activeContext: !!activeContext, isLoading, isAccountContextLoading });

  // Data fetching and processing
  const timelineData = useTimelineData({ user, session });

  // Use storyteller's birth year, fallback to user's birth year
  const birthYear = timelineData.storyteller?.birthYear || user?.birthYear || 0;

  console.log('[TimelineMobileV2] Timeline data:', {
    storiesCount: timelineData.stories.length,
    allTimelineItemsCount: timelineData.allTimelineItems.length,
    isLoading: timelineData.isLoading,
    storyteller: !!timelineData.storyteller,
    birthYear
  });

  // Navigation and scroll tracking
  const navigation = useTimelineNavigation({
    user,
    storiesData: timelineData.stories,
  });

  // UI state
  const ui = useTimelineUI();

  // Event Handlers
  const handleGhostPromptClick = useCallback(
    (_prompt: GhostPrompt) => {
      router.push("/review/book-style?new=true");
    },
    [router],
  );

  // Auth redirect - allow family viewers (activeContext without user)
  useEffect(() => {
    // Wait for both auth and account context to load before redirecting
    if (!isLoading && !isAccountContextLoading && !user && !activeContext) {
      router.push("/auth/login");
    }
  }, [isLoading, isAccountContextLoading, user, activeContext, router]);

  // Loading states - wait for both auth and account context
  if (isLoading || isAccountContextLoading) {
    return (
      <div className="hw-page flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Allow family viewers (activeContext without user)
  if (!user && !activeContext) {
    return (
      <div className="hw-page flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (timelineData.isLoading && timelineData.stories.length === 0) {
    return (
      <div
        className="hw-page flex flex-col items-center justify-center gap-4"
        style={{ backgroundColor: ui.isDark ? "#1c1c1d" : "#fafaf9" }}
      >
        <div
          className="animate-spin rounded-full h-12 w-12 border-b-2"
          style={{
            borderBottomColor: ui.isDark ? "#b0b3b8" : "#F59E0B",
          }}
        ></div>
        <p
          className="text-lg"
          style={{ color: ui.isDark ? "#b0b3b8" : "#6B4E42" }}
        >
          Loading your timeline...
        </p>
      </div>
    );
  }

  // Page styling
  const pageStyle = ui.isDark
    ? { backgroundColor: "#1c1c1d", color: "#b0b3b8" }
    : {
      backgroundColor:
        ui.currentColorScheme === "original"
          ? "#fafaf9"
          : ui.currentColorScheme === "white"
            ? "#FFFFFF"
            : ui.currentColorScheme === "inverted"
              ? "#FFFFFF"
              : ui.currentColorScheme === "soft"
                ? "#F9FAFB"
                : ui.currentColorScheme === "cool"
                  ? "#F8FAFC"
                  : ui.currentColorScheme === "dark"
                    ? "#0F0F0F"
                    : ui.currentColorScheme === "retro"
                      ? "#F5E6D3"
                      : "#fafaf9",
      color:
        ui.currentColorScheme === "dark"
          ? "#E5E5E5"
          : ui.currentColorScheme === "retro"
            ? "#6B4E42"
            : undefined,
    };

  return (
    <div className="timeline-page timeline-v2-premium hw-page" style={pageStyle}>
      {/* Header Navigation */}
      <TimelineHeader
        isDark={ui.isDark}
        currentColorScheme={ui.currentColorScheme}
        rightContent={
          <div className="decade-selector-header">
            <DecadeNav entries={timelineData.decadeEntries} />
          </div>
        }
      />

      {/* Timeline Content */}
      <main className="max-w-6xl mx-auto pt-0 pb-24 md:pb-6 timeline-container">
        {/* V3: Only show personal prompts and paywalls when viewing own account */}
        {isViewingOwnAccount && (
          <>
            {/* Paywall Prompt */}
            {user?.freeStoriesUsed === 3 &&
              user?.subscriptionStatus !== "active" && (
                <PaywallPromptCard
                  onSubscribe={() => {
                    toast({
                      title: "Coming soon!",
                      description: "Stripe integration will be added soon.",
                    });
                  }}
                  onDismiss={() => { }}
                />
              )}

            {/* Next Story Prompt */}
            {!(
              user?.freeStoriesUsed === 3 && user?.subscriptionStatus !== "active"
            ) && (
                <NextStoryCard
                  onRecordClick={(promptId) => {
                    router.push("/review/book-style?new=true");
                    if (promptId) {
                      sessionStorage.setItem("activePromptId", promptId);
                    }
                  }}
                />
              )}
          </>
        )}

        <div className="hw-layout">
          {/* Ghost Story Logic */}
          {(() => {
            // Clone stories to avoid mutating original data
            let sortedStories = [...timelineData.stories].sort((a: any, b: any) => {
              const yearA = normalizeYear(a.storyYear);
              const yearB = normalizeYear(b.storyYear);
              return (yearA ?? 0) - (yearB ?? 0);
            });

            // Check if birth story exists
            const hasBirthStory = sortedStories.some(s => normalizeYear(s.storyYear) === birthYear);

            // Inject virtual birth story if missing
            if (!hasBirthStory) {
              const virtualBirthStory: any = {
                id: 'birth-story-virtual',
                userId: user?.id || 'ghost-user',
                title: 'When I was born',
                storyYear: birthYear,
                storyDate: `${birthYear}-01-01`,
                photos: [], // Empty photos triggers "pill" style
                audioUrl: "",
                transcription: "The beginning of my story.",
                includeInTimeline: true,
                createdAt: new Date().toISOString(),
                templateId: 'birth-story', // Link to birth story template
              };
              sortedStories.unshift(virtualBirthStory);
            }

            // Ghost Stories Logic
            // Show ghost stories if we have NO stories, OR if we only have the birth story (virtual or real)
            // This ensures ghost stories persist until the user adds a SECOND memory
            const isGhostMode = sortedStories.length === 0 || (sortedStories.length === 1 && normalizeYear(sortedStories[0].storyYear) === birthYear);

            if (isGhostMode) {
              // Map templates to ghost stories (excluding birth-story since it's already handled)
              const ghostStories = STARTER_TEMPLATES
                .filter(t => t.id !== 'birth-story')
                .map((template) => {
                  let yearOffset = 0;
                  let photoUrl = "";

                  switch (template.id) {
                    case 'childhood-photo':
                      yearOffset = 10;
                      photoUrl = "/demo-dad-boy.png";
                      break;
                    case 'turning-point':
                      yearOffset = 25;
                      photoUrl = "/demo-hiking.png";
                      break;
                    case 'family-memory':
                      yearOffset = 35;
                      photoUrl = "/johnsons.png";
                      break;
                  }

                  return {
                    id: template.id,
                    userId: 'ghost-user',
                    title: template.title,
                    storyYear: birthYear + yearOffset,
                    storyDate: `${birthYear + yearOffset}-01-01`,
                    photos: [{ id: `ghost-photo-${template.id}`, url: photoUrl, isHero: true }],
                    audioUrl: "", // No audio
                    transcription: template.subtitle, // Use subtitle as snippet
                    includeInTimeline: true,
                    createdAt: new Date().toISOString(),
                    templateId: template.id, // Keep track of template
                  };
                });

              sortedStories = [...sortedStories, ...ghostStories];
            }

            // Re-group stories by decade with the new ghost stories
            // We need to rebuild the timeline items structure locally since we modified the stories
            // This is a simplified version of useTimelineData's grouping logic
            const storiesByDecade = new Map<string, Story[]>();
            sortedStories.forEach((story: Story) => {
              const year = normalizeYear(story.storyYear);
              const decade = Math.floor((year ?? 0) / 10) * 10;
              const decadeKey = `${decade}s`;
              if (!storiesByDecade.has(decadeKey)) {
                storiesByDecade.set(decadeKey, []);
              }
              storiesByDecade.get(decadeKey)?.push(story);
            });

            const timelineItems = Array.from(storiesByDecade.entries())
              .sort(([decadeA], [decadeB]) => {
                const yearA = parseInt(decadeA.replace('s', ''));
                const yearB = parseInt(decadeB.replace('s', ''));
                return yearA - yearB;
              })
              .map(([decade, decadeStories]) => ({
                id: decade,
                title: decade,
                subtitle: `${decadeStories.length} memories`,
                stories: decadeStories,
              }));

            // Helper to get ghost action
            const getGhostAction = (story: any) => {
              if (isGhostMode && story.templateId) {
                return {
                  label: story.templateId === 'birth-story' ? 'Add birth info' :
                    story.templateId === 'turning-point' ? 'Record story' :
                      'Add memory',
                  onClick: (s: any) => {
                    const templateId = s.templateId;
                    const template = STARTER_TEMPLATES.find(t => t.id === templateId);
                    if (template) {
                      sessionStorage.setItem('starterTemplate', JSON.stringify({
                        id: template.id,
                        title: template.title,
                      }));
                      router.push('/recording');
                    }
                  }
                };
              }
              return undefined;
            };

            return (
              <>
                <div
                  className="hw-spine"
                  style={
                    ui.isDark ? { backgroundColor: "#ffffff", opacity: 1 } : undefined
                  }
                >
                  {timelineItems.map((item, index) => (
                    <TimelineDecadeSection
                      key={item.id ?? String(index)}
                      decadeId={item.id}
                      title={item.title}
                      subtitle={item.subtitle}
                      stories={item.stories}
                      isActive={navigation.activeDecade === item.id}
                      isDarkTheme={ui.isDark}
                      colorScheme={ui.currentColorScheme}
                      birthYear={birthYear}
                      onRegisterRef={navigation.registerDecadeRef}
                      onGhostPromptClick={handleGhostPromptClick}
                      highlightedStoryId={navigation.highlightedStoryId}
                      returnHighlightId={navigation.returnHighlightId}
                      useV2Features={true}
                      getGhostAction={getGhostAction}
                    />
                  ))}
                </div>

                {/* Timeline End - Terminal node + CTA */}
                <TimelineEnd
                  isDark={ui.isDark}
                  hasCurrentYearContent={sortedStories.some(
                    (s: any) => new Date(s.createdAt).getFullYear() === new Date().getFullYear()
                  )}
                  onAddMemory={() => router.push("/review/book-style?new=true")}
                />
              </>
            );
          })()}
        </div>
      </main>

      <style jsx global>{`
        /* Override DecadeNav to work in header */
        .decade-selector-header .hw-decade-nav {
          display: none !important; /* Hide desktop sidebar version */
        }

        .decade-selector-header .hw-decade-fab {
          position: relative !important;
          display: flex !important;
          bottom: auto !important;
          right: 16px !important;
        }

        .decade-selector-header .hw-decade-pill {
          min-width: 100px;
          height: 36px;
          min-height: 36px;
          font-size: 13px;
          box-shadow: none;
          border: 1px solid #ddd;
          position: relative;
          top: -2px;
        }

        .decade-selector-header .hw-decade-pill .decade-range-text {
          font-size: 13px;
        }

        .decade-selector-header .hw-decade-sheet {
          position: absolute;
          right: 0;
          top: 42px;
          bottom: auto;
        }

        @media (min-width: 768px) {
          .decade-selector-header {
            display: none;
          }
        }

        .particle-button-mobile-corner {
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(65.28% 65.28% at 50% 100%,
              rgba(245, 158, 11, 0.6) 0%,
              rgba(217, 119, 6, 0.3) 50%,
              rgba(245, 158, 11, 0) 100%),
            linear-gradient(135deg, #D97706, #F59E0B, #FBBF24);
          border: none;
          padding: 8px 16px;
          min-height: 38px;
          max-height: 38px;
          height: 38px;
          width: auto;
          max-width: 160px;
          font-size: 14px;
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
          border-radius: 9999px;
          overflow: hidden;
        }

        .particle-button-mobile-corner::before,
        .particle-button-mobile-corner::after {
          content: "";
          position: absolute;
          transition: all 0.5s ease-in-out;
          z-index: 0;
        }

        .particle-button-mobile-corner::before {
          inset: 1px;
          background: linear-gradient(135deg,
              rgba(255, 255, 255, 0.2) 0%,
              rgba(255, 255, 255, 0.05) 50%,
              rgba(255, 255, 255, 0) 100%);
          border-radius: 9999px;
        }

        .particle-button-mobile-corner::after {
          inset: 2px;
          background: radial-gradient(65.28% 65.28% at 50% 100%,
              rgba(245, 158, 11, 0.4) 0%,
              rgba(217, 119, 6, 0.2) 50%,
              rgba(245, 158, 11, 0) 100%),
            linear-gradient(135deg, #D97706, #F59E0B, #FBBF24);
          border-radius: 9999px;
        }

        .particle-button-mobile-corner:active {
          transform: scale(0.95);
        }

        .particle-button-mobile {
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(65.28% 65.28% at 50% 100%,
              rgba(245, 158, 11, 0.6) 0%,
              rgba(217, 119, 6, 0.3) 50%,
              rgba(245, 158, 11, 0) 100%),
            linear-gradient(135deg, #D97706, #F59E0B, #FBBF24);
          border: none;
          padding: 10px 16px;
          min-height: 48px;
          max-height: 48px;
          height: 48px;
          width: auto;
          max-width: 140px;
          font-size: 14px;
          
          box-shadow: 0 4px 12px -4px rgba(245, 158, 11, 0.6),
                      0 0 0 1px rgba(255, 255, 255, 0.1);
        }

        .particle-button-mobile::before,
        .particle-button-mobile::after {
          content: "";
          position: absolute;
          transition: all 0.5s ease-in-out;
          z-index: 0;
        }

        .particle-button-mobile::before {
          inset: 1px;
          background: linear-gradient(135deg,
              rgba(255, 255, 255, 0.2) 0%,
              rgba(255, 255, 255, 0.05) 50%,
              rgba(255, 255, 255, 0) 100%);
          border-radius: 9999px;
        }

        .particle-button-mobile::after {
          inset: 2px;
          background: radial-gradient(65.28% 65.28% at 50% 100%,
              rgba(245, 158, 11, 0.4) 0%,
              rgba(217, 119, 6, 0.2) 50%,
              rgba(245, 158, 11, 0) 100%),
            linear-gradient(135deg, #D97706, #F59E0B, #FBBF24);
          border-radius: 9999px;
        }

        .particle-button-mobile:active {
          transform: scale(0.98);
        }

        .points-wrapper-mobile {
          overflow: hidden;
          width: 100%;
          height: 100%;
          pointer-events: none;
          position: absolute;
          z-index: 1;
        }

        .points-wrapper-mobile .point-mobile {
          bottom: -10px;
          position: absolute;
          animation: floating-points-mobile infinite ease-in-out;
          pointer-events: none;
          width: 2px;
          height: 2px;
          background-color: #FDE68A;
          border-radius: 9999px;
          box-shadow: 0 0 4px rgba(253, 230, 138, 0.8);
        }

        @keyframes floating-points-mobile {
          0% {
            transform: translateY(0);
            opacity: 0.8;
          }
          50% {
            opacity: 1;
          }
          85% {
            opacity: 0.3;
          }
          100% {
            transform: translateY(-40px);
            opacity: 0;
          }
        }

        .points-wrapper-mobile .point-mobile:nth-child(1) {
          left: 15%;
          opacity: 0.9;
          animation-duration: 9.5s;
          animation-delay: 0.3s;
        }

        .points-wrapper-mobile .point-mobile:nth-child(2) {
          left: 25%;
          opacity: 0.7;
          animation-duration: 10.0s;
          animation-delay: 0.7s;
        }

        .points-wrapper-mobile .point-mobile:nth-child(3) {
          left: 35%;
          opacity: 0.8;
          animation-duration: 8.5s;
          animation-delay: 0.2s;
        }

        .points-wrapper-mobile .point-mobile:nth-child(4) {
          left: 50%;
          opacity: 0.6;
          animation-duration: 8.0s;
          animation-delay: 0.1s;
        }

        .points-wrapper-mobile .point-mobile:nth-child(5) {
          left: 60%;
          opacity: 0.9;
          animation-duration: 7.5s;
          animation-delay: 0s;
        }

        .points-wrapper-mobile .point-mobile:nth-child(6) {
          left: 70%;
          opacity: 0.5;
          animation-duration: 9.8s;
          animation-delay: 1.2s;
        }

        .points-wrapper-mobile .point-mobile:nth-child(7) {
          left: 80%;
          opacity: 0.8;
          animation-duration: 9.0s;
          animation-delay: 0.4s;
        }

        .points-wrapper-mobile .point-mobile:nth-child(8) {
          left: 45%;
          opacity: 0.7;
          animation-duration: 10.5s;
          animation-delay: 0.6s;
        }

        .points-wrapper-mobile .point-mobile:nth-child(9) {
          left: 85%;
          opacity: 0.6;
          animation-duration: 7.8s;
          animation-delay: 0.8s;
        }

        .points-wrapper-mobile .point-mobile:nth-child(10) {
          left: 65%;
          opacity: 0.9;
          animation-duration: 8.2s;
          animation-delay: 0.5s;
        }

        .button-inner-mobile {
          z-index: 2;
          position: relative;
          width: 100%;
          color: #ffffff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 600;
          line-height: 1.4;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}

