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
import { NextStoryCard } from "@/components/NextStoryCard";
import { PaywallPromptCard } from "@/components/PaywallPromptCard";
import { MemoryOverlay } from "@/components/MemoryOverlay";
import DecadeNav from "@/components/ui/DecadeNav";
import { useToast } from "@/hooks/use-toast";
import { type Story } from "@/lib/supabase";
import { type GhostPrompt } from "@/lib/ghostPrompts";

// Hooks
import { useTimelineData } from "@/hooks/use-timeline-data";
import { useTimelineNavigation } from "@/hooks/use-timeline-navigation";
import { useTimelineUI } from "@/hooks/use-timeline-ui";

// V2 Components
import { TimelineHeader } from "@/components/timeline/TimelineHeader";
import { TimelineDecadeSection } from "@/components/timeline/TimelineDecadeSection";
import { PaywallModal } from "@/components/timeline/PaywallModal";

export function TimelineMobileV2() {
  const { user, session, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // Data fetching and processing
  const timelineData = useTimelineData({ user, session });

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
      if (user && !user.isPaid && user.storyCount >= 3) {
        ui.setShowPaywall(true);
      } else {
        router.push("/review/book-style?new=true");
      }
    },
    [user, router, ui],
  );

  const handleSubscribe = useCallback(() => {
    router.push("/subscribe");
  }, [router]);

  const handleOpenOverlay = useCallback(
    (story: Story) => {
      ui.setSelectedStory(story);
      ui.setOverlayOpen(true);
    },
    [ui],
  );

  const handleCloseOverlay = useCallback(() => {
    ui.setOverlayOpen(false);
    ui.setSelectedStory(null);
  }, [ui]);

  const handleNavigateStory = useCallback(
    (storyId: string) => {
      const story = timelineData.stories.find((s: Story) => s.id === storyId);
      if (story) {
        ui.setSelectedStory(story);
      }
    },
    [timelineData.stories, ui],
  );

  // CHANGE 5: Handle Add Memory button click
  const handleAddMemory = useCallback(() => {
    router.push("/review/book-style?new=true");
  }, [router]);

  // Auth redirect
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login");
    }
  }, [isLoading, user, router]);

  // Loading states
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (timelineData.isLoading && timelineData.stories.length === 0) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ backgroundColor: ui.isDark ? "#1c1c1d" : "#FFF8F3" }}
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
            ? "#FFF8F3"
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
                        : "#FFF8F3",
        color:
          ui.currentColorScheme === "dark"
            ? "#E5E5E5"
            : ui.currentColorScheme === "retro"
              ? "#6B4E42"
              : undefined,
      };

  return (
    <div className="timeline-page min-h-screen" style={pageStyle}>
      {/* Header Navigation */}
      <TimelineHeader
        isDark={ui.isDark}
        currentColorScheme={ui.currentColorScheme}
      />

      {/* Timeline Content */}
      <main className="max-w-6xl mx-auto px-3 py-6 pb-24 md:p-6 md:pb-6 md:pr-20">
        {/* Paywall Prompt */}
        {user?.freeStoriesUsed === 3 &&
          user?.subscriptionStatus !== "active" && (
            <div className="mb-8">
              <PaywallPromptCard
                onSubscribe={() => {
                  toast({
                    title: "Coming soon!",
                    description: "Stripe integration will be added soon.",
                  });
                }}
                onDismiss={() => {}}
              />
            </div>
          )}

        {/* Next Story Prompt */}
        {!(
          user?.freeStoriesUsed === 3 && user?.subscriptionStatus !== "active"
        ) && (
          <div className="mb-8">
            <NextStoryCard
              onRecordClick={(promptId) => {
                router.push("/review/book-style?new=true");
                if (promptId) {
                  sessionStorage.setItem("activePromptId", promptId);
                }
              }}
            />
          </div>
        )}

        <div className="hw-layout">
          <div
            className="hw-spine"
            style={
              ui.isDark ? { backgroundColor: "#ffffff", opacity: 1 } : undefined
            }
          >
            {timelineData.allTimelineItems.map((item, index) => (
              <TimelineDecadeSection
                key={item.id ?? String(index)}
                decadeId={item.id}
                title={item.title}
                subtitle={item.subtitle}
                stories={item.stories}
                isActive={navigation.activeDecade === item.id}
                isDarkTheme={ui.isDark}
                colorScheme={ui.currentColorScheme}
                birthYear={user.birthYear}
                onRegisterRef={navigation.registerDecadeRef}
                onGhostPromptClick={handleGhostPromptClick}
                onOpenOverlay={handleOpenOverlay}
                highlightedStoryId={navigation.highlightedStoryId}
                returnHighlightId={navigation.returnHighlightId}
                useV2Features={true}
              />
            ))}
          </div>
        </div>
      </main>

      {/* CHANGE 5: Floating toolbar above nav bar - Add Memory + Decade Selector side by side */}
      <div className="fixed left-0 right-0 px-4 py-2 flex items-center justify-between gap-3 z-40 md:hidden" 
        style={{ 
          bottom: '40px', // Just above the 32px nav bar + 8px gap
          pointerEvents: 'none' // Allow clicks through to content
        }}>
        {/* Add Memory button on left */}
        <button
          onClick={handleAddMemory}
          className="particle-button-mobile text-white font-medium rounded-full transition-all relative overflow-hidden"
          style={{ 
            maxHeight: '48px',
            pointerEvents: 'auto' // Re-enable clicks on button
          }}
        >
          <div className="points-wrapper-mobile">
            <i className="point-mobile"></i>
            <i className="point-mobile"></i>
            <i className="point-mobile"></i>
            <i className="point-mobile"></i>
            <i className="point-mobile"></i>
            <i className="point-mobile"></i>
            <i className="point-mobile"></i>
            <i className="point-mobile"></i>
            <i className="point-mobile"></i>
            <i className="point-mobile"></i>
          </div>

          <span className="button-inner-mobile">
            + Add Memory
          </span>
        </button>

        {/* Decade selector on right */}
        <div style={{ pointerEvents: 'auto' }}>
          <DecadeNav entries={timelineData.decadeEntries} />
        </div>
      </div>

      <style jsx>{`
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
          animation-duration: 2.8s;
          animation-delay: 0.3s;
        }

        .points-wrapper-mobile .point-mobile:nth-child(2) {
          left: 25%;
          opacity: 0.7;
          animation-duration: 3.2s;
          animation-delay: 0.7s;
        }

        .points-wrapper-mobile .point-mobile:nth-child(3) {
          left: 35%;
          opacity: 0.8;
          animation-duration: 2.6s;
          animation-delay: 0.2s;
        }

        .points-wrapper-mobile .point-mobile:nth-child(4) {
          left: 50%;
          opacity: 0.6;
          animation-duration: 2.4s;
          animation-delay: 0.1s;
        }

        .points-wrapper-mobile .point-mobile:nth-child(5) {
          left: 60%;
          opacity: 0.9;
          animation-duration: 2.1s;
          animation-delay: 0s;
        }

        .points-wrapper-mobile .point-mobile:nth-child(6) {
          left: 70%;
          opacity: 0.5;
          animation-duration: 2.9s;
          animation-delay: 1.2s;
        }

        .points-wrapper-mobile .point-mobile:nth-child(7) {
          left: 80%;
          opacity: 0.8;
          animation-duration: 2.7s;
          animation-delay: 0.4s;
        }

        .points-wrapper-mobile .point-mobile:nth-child(8) {
          left: 45%;
          opacity: 0.7;
          animation-duration: 3.0s;
          animation-delay: 0.6s;
        }

        .points-wrapper-mobile .point-mobile:nth-child(9) {
          left: 85%;
          opacity: 0.6;
          animation-duration: 2.3s;
          animation-delay: 0.8s;
        }

        .points-wrapper-mobile .point-mobile:nth-child(10) {
          left: 65%;
          opacity: 0.9;
          animation-duration: 2.5s;
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

      {/* Paywall Modal */}
      <PaywallModal
        isOpen={ui.showPaywall}
        onClose={() => ui.setShowPaywall(false)}
        onSubscribe={handleSubscribe}
      />

      {/* Memory Overlay */}
      {ui.selectedStory && (
        <MemoryOverlay
          story={ui.selectedStory}
          stories={timelineData.stories}
          isOpen={ui.overlayOpen}
          originPath="/timeline-v2"
          onClose={handleCloseOverlay}
          onNavigate={handleNavigateStory}
        />
      )}
    </div>
  );
}

