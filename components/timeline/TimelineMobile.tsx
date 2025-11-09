/**
 * TimelineMobile - Timeline orchestrator component
 *
 * Refactored: January 25, 2025
 * Original: 1,678 lines → New: ~310 lines (82% reduction)
 *
 * Architecture (Research-Informed):
 * - Hooks: use-timeline-data, use-timeline-navigation, use-timeline-ui
 * - Components: TimelineHeader, TimelineDecadeSection, MemoryCard
 * - Principle: <200 lines per file, granular state, logic extraction
 *
 * Research Sources:
 * - React.dev: Performance optimization patterns (React.memo, useCallback)
 * - Industry: Component size best practices
 * - RecordModal refactor: Proven extraction methodology
 */

"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useModeSelection } from "@/hooks/use-mode-selection";
import { ModeSelectionModal } from "@/components/recording/ModeSelectionModal";
import { QuickStoryRecorder } from "@/components/recording/QuickStoryRecorder";
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

// Components
import { TimelineHeader } from "./TimelineHeader";
import { TimelineDecadeSection } from "./TimelineDecadeSection";

/**
 * Color scheme configuration
 * Used for theme switching via keyboard shortcuts (Cmd+1-7)
 */
const colorSchemes = {
  original: {
    name: "Original",
    page: "bg-heritage-warm-bg",
    card: "bg-white",
    header: "bg-white/95",
    text: "text-foreground",
    timelineLine: "from-heritage-orange to-heritage-coral",
  },
  white: {
    name: "Clean White",
    page: "bg-white",
    card: "bg-white border border-gray-200",
    header: "bg-white/95",
    text: "text-foreground",
    timelineLine: "from-gray-300 to-gray-400",
  },
  inverted: {
    name: "Inverted",
    page: "bg-white",
    card: "bg-heritage-warm-bg",
    header: "bg-heritage-warm-bg/95",
    text: "text-foreground",
    timelineLine: "from-heritage-orange to-heritage-coral",
  },
  soft: {
    name: "Soft Gray",
    page: "bg-gray-50",
    card: "bg-white",
    header: "bg-gray-50/95",
    text: "text-foreground",
    timelineLine: "from-gray-400 to-gray-500",
  },
  cool: {
    name: "Cool Blue",
    page: "bg-slate-50",
    card: "bg-white",
    header: "bg-slate-50/95",
    text: "text-foreground",
    timelineLine: "from-blue-400 to-blue-500",
  },
  dark: {
    name: "Dark Mode",
    page: "bg-gray-900",
    card: "bg-gray-800 text-white",
    header: "bg-gray-900/95",
    text: "text-white",
    timelineLine: "from-gray-600 to-gray-700",
  },
  retro: {
    name: "Retro Radio",
    page: "bg-[#F5E6D3]",
    card: "bg-white",
    header: "bg-[#F5E6D3]/95",
    text: "text-[#6B4E42]",
    timelineLine: "from-[#D4654F] to-[#5BB5B0]",
  },
};

/**
 * TimelineMobile - Main timeline view component
 */
export function TimelineMobile() {
  const { user, session, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const modeSelection = useModeSelection();

  // ==================================================================================
  // Custom Hooks
  // ==================================================================================

  // Data fetching and processing
  const timelineData = useTimelineData({ user, session });

  // Navigation and scroll tracking
  const navigation = useTimelineNavigation({
    user,
    storiesData: timelineData.stories,
  });

  // UI state (color scheme, modals, theme)
  const ui = useTimelineUI();

  // ==================================================================================
  // Event Handlers (Memoized)
  // ==================================================================================

  const handleGhostPromptClick = useCallback(
    (prompt: GhostPrompt) => {
      // Open mode selection modal
      modeSelection.openModal();
    },
    [modeSelection],
  );

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
      const story = timelineData.stories.find((s: any) => s.id === storyId);
      if (story) {
        ui.setSelectedStory(story);
      }
    },
    [timelineData.stories, ui],
  );

  // ==================================================================================
  // Auth Redirect
  // ==================================================================================

  // Handle redirect to login page in useEffect (not during render)
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login");
    }
  }, [isLoading, user, router]);

  // ==================================================================================
  // Loading States
  // ==================================================================================

  // Check if auth is still loading - don't redirect until we know auth state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Show loading while redirecting to login
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Show loading state while fetching stories data
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

  // ==================================================================================
  // Page Styling
  // ==================================================================================

  // Apply styles directly to ensure they work
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

  // ==================================================================================
  // Render
  // ==================================================================================

  return (
    <div className="timeline-page min-h-screen" style={pageStyle}>
      {/* Header Navigation */}
      <TimelineHeader
        isDark={ui.isDark}
        currentColorScheme={ui.currentColorScheme}
      />

      {/* Timeline Content with Vertical Timeline Design */}
      <main className="max-w-6xl mx-auto px-3 pb-20 md:p-6 md:pb-6 md:pr-20" style={{ paddingTop: '58px' }}>
        {/* Paywall Prompt for Story 3 (if applicable) */}
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
                onDismiss={() => {
                  // Dismissed - will be hidden via localStorage
                }}
              />
            </div>
          )}

        {/* AI-Generated Next Story Prompt (show if not at paywall) */}
        {!(
          user?.freeStoriesUsed === 3 && user?.subscriptionStatus !== "active"
        ) && (
          <div className="mb-8">
            <NextStoryCard
              onRecordClick={(promptId, promptText) => {
                modeSelection.openModal();
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
            {/* All stories sorted chronologically */}
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
                highlightedStoryId={navigation.highlightedStoryId}
                returnHighlightId={navigation.returnHighlightId}
              />
            ))}
            <DecadeNav entries={timelineData.decadeEntries} />
          </div>
        </div>
      </main>

      {/* Mode Selection Modal */}
      <ModeSelectionModal
        isOpen={modeSelection.isOpen}
        onClose={modeSelection.closeModal}
        onSelectQuickStory={modeSelection.openQuickRecorder}
      />

      {/* Quick Story Recorder */}
      <QuickStoryRecorder
        isOpen={modeSelection.quickRecorderOpen}
        onClose={modeSelection.closeQuickRecorder}
      />

      {/* Memory Overlay */}
      {ui.selectedStory && (
        <MemoryOverlay
          story={ui.selectedStory}
          stories={timelineData.stories}
          isOpen={ui.overlayOpen}
          originPath="/timeline"
          onClose={handleCloseOverlay}
          onNavigate={handleNavigateStory}
        />
      )}
    </div>
  );
}
