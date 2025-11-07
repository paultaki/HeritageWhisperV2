/**
 * TimelineMobileV2 - Enhanced Mobile Timeline Experience
 *
 * V2 Grid Architecture:
 * 5-column grid: [outer] [spine] [inner-gap] [cards] [outer]
 * - Outer gutters match inner gap (G = 24px)
 * - Spine positioned in grid column 2 (no absolute positioning)
 * - Cards use gap-y for vertical rhythm (no ad-hoc margins)
 * - Decade banners outside grid with mt-12/mb-16 for 36/48px spacing
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
import { PaywallModal } from "./PaywallModal";

/**
 * V2 Color schemes with improved contrast and accessibility
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
    card: "bg-white",
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
 * TimelineMobileV2 - Main mobile timeline component with 5-column grid
 */
export function TimelineMobileV2() {
  const { user, session, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const modeSelection = useModeSelection();

  // ==================================================================================
  // Custom Hooks
  // ==================================================================================

  const timelineData = useTimelineData({ user, session });
  const navigation = useTimelineNavigation({
    user,
    storiesData: timelineData.stories,
  });
  const ui = useTimelineUI();

  // ==================================================================================
  // Event Handlers
  // ==================================================================================

  const handleGhostPromptClick = useCallback(
    (prompt: GhostPrompt) => {
      if (user && !user.isPaid && user.storyCount >= 3) {
        ui.setShowPaywall(true);
      } else {
        modeSelection.openModal();
      }
    },
    [user, modeSelection, ui],
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

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login");
    }
  }, [isLoading, user, router]);

  // ==================================================================================
  // Loading States
  // ==================================================================================

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

  // ==================================================================================
  // Page Styling
  // ==================================================================================

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

      {/* Main Timeline Container */}
      <main
        className="timeline-main"
        style={{
          paddingBottom: '80px',
        }}
      >
        {/* Paywall Prompt */}
        {user?.freeStoriesUsed === 3 &&
          user?.subscriptionStatus !== "active" && (
            <div className="mb-8 px-6">
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

        {/* AI-Generated Next Story Prompt */}
        {!(
          user?.freeStoriesUsed === 3 && user?.subscriptionStatus !== "active"
        ) && (
          <div className="mb-8 px-6">
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

        {/* V2: 5-Column Grid Timeline */}
        <div className="timeline-container-v2">
          {timelineData.allTimelineItems.map((item, sectionIndex) => (
            <section key={item.id ?? String(sectionIndex)} className="timeline-section">
              {/* Decade Banner */}
              <div className="decade-banner-v2">
                <div className="decade-banner-content">
                  <h2 className="decade-title">{item.title}</h2>
                  {item.subtitle && (
                    <p className="decade-subtitle">{item.subtitle}</p>
                  )}
                </div>
              </div>

              {/* 5-Column Grid for Cards */}
              <div className="timeline-grid-v2">
                {/* Column 2: Timeline Spine */}
                <div className="grid-spine" />

                {/* Column 4: Cards */}
                <div className="grid-cards">
                  {item.stories?.map((story: any, cardIndex: number) => (
                    <div
                      key={story.id}
                      className="timeline-card-wrapper"
                      onClick={() => handleOpenOverlay(story)}
                    >
                      {/* Year Badge */}
                      <div
                        className="year-badge-mobile-v2"
                        style={{
                          position: 'absolute',
                          left: 'calc(-24px - 18px - 4px)', // Moved 4px left
                          top: '82px', // Moved down 70px (was 12px)
                          fontSize: '14px',
                          padding: '2px 6px 6px 6px',
                          fontFamily: 'var(--font-serif)',
                          fontWeight: '500',
                          lineHeight: '1',
                          color: '#6A4D58',
                          background: '#F9E5E8',
                          border: '1px solid rgba(139, 107, 122, 0.2)',
                          borderRadius: '5px',
                          boxShadow: '0 2px 6px -2px rgba(0, 0, 0, 0.1), 0 1px 3px -1px rgba(0, 0, 0, 0.08)',
                          whiteSpace: 'nowrap',
                          pointerEvents: 'none',
                          zIndex: 2
                        }}
                      >
                        {story.storyYear || new Date(story.createdAt).getFullYear()}
                      </div>

                      {/* Connector Line */}
                      <div className="connector-line" />

                      {/* Card Content */}
                      <div className="story-card">
                        {/* Photo - check multiple possible sources */}
                        {(story.photoUrl || (story.photos && story.photos.length > 0 && story.photos[0]?.url)) && (
                          <div className="card-photo">
                            <img
                              src={
                                story.photos && story.photos.length > 0 && story.photos[0]?.url
                                  ? story.photos[0].url
                                  : story.photoUrl
                              }
                              alt={story.title}
                              className="photo-img"
                            />
                            {story.photos && story.photos.length > 1 && (
                              <div className="photo-count">
                                {story.photos.length} photos
                              </div>
                            )}
                          </div>
                        )}

                        {/* Card Body */}
                        <div className="card-body">
                          <h3 className="card-title">{story.title}</h3>
                          <div className="card-meta">
                            <span>{story.storyYear || new Date(story.createdAt).getFullYear()}</span>
                            {story.lifeAge !== null && story.lifeAge !== undefined && (
                              <>
                                <span className="meta-divider">•</span>
                                <span>
                                  {story.lifeAge > 0 && `Age ${story.lifeAge}`}
                                  {story.lifeAge === 0 && `Birthday`}
                                  {story.lifeAge < 0 && `Before birth`}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ))}

          <DecadeNav entries={timelineData.decadeEntries} />
        </div>
      </main>

      {/* Modals */}
      <PaywallModal
        isOpen={ui.showPaywall}
        onClose={() => ui.setShowPaywall(false)}
        onSubscribe={handleSubscribe}
      />

      <ModeSelectionModal
        isOpen={modeSelection.isOpen}
        onClose={modeSelection.closeModal}
        onSelectQuickStory={modeSelection.openQuickRecorder}
      />

      <QuickStoryRecorder
        isOpen={modeSelection.quickRecorderOpen}
        onClose={modeSelection.closeQuickRecorder}
      />

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

      {/* V2 Grid Styles */}
      <style jsx global>{`
        /* ==================================================================================
           V2 5-COLUMN GRID ARCHITECTURE
           ================================================================================== */

        /* Constants */
        :root {
          --G: 24px;                    /* Gap size (outer gutters = inner gap) */
          --spine-width: 4px;           /* Spine line width */
          --connector-length: 20px;     /* Connector line length */
          --year-badge-offset: 48px;    /* Year badge position from spine */
        }

        /* Main Timeline Container */
        .timeline-container-v2 {
          width: 100%;
          max-width: 100%;
        }

        /* Timeline Section */
        .timeline-section {
          position: relative;
          margin-bottom: 0;
        }

        /* Decade Banner - Outside Grid */
        .decade-banner-v2 {
          position: sticky;
          top: calc(env(safe-area-inset-top, 0px) + 47px);
          z-index: 5;

          /* Glass effect */
          backdrop-filter: blur(20px) saturate(1.3) contrast(1.15) brightness(0.98);
          -webkit-backdrop-filter: blur(20px) saturate(1.3) contrast(1.15) brightness(0.98);
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.05)),
                      rgba(134, 108, 122, 0.14);
          border-top: 1.5px solid rgba(255, 255, 255, 0.4);
          border-bottom: 1.5px solid rgba(255, 255, 255, 0.4);
          box-shadow: 0 4px 16px -4px rgba(0, 0, 0, 0.15);

          /* Full-width bleed */
          margin-left: calc(-1 * max(var(--G), env(safe-area-inset-left, 0px)));
          margin-right: calc(-1 * max(var(--G), env(safe-area-inset-right, 0px)));
          padding: 6px max(var(--G), env(safe-area-inset-left, 0px));

          /* Spacing: 36px above, 48px below on mobile */
          margin-top: 36px;
          margin-bottom: 48px;

          text-align: center;
        }

        /* First section banner has no top margin */
        .timeline-section:first-child .decade-banner-v2 {
          margin-top: 0;
        }

        /* Desktop: Increase banner margins */
        @media (min-width: 768px) {
          .decade-banner-v2 {
            margin-top: 48px;
            margin-bottom: 64px;
          }

          .timeline-section:first-child .decade-banner-v2 {
            margin-top: 0;
          }
        }

        .decade-banner-content {
          width: 100%;
        }

        .decade-title {
          font-family: var(--font-serif);
          font-size: 18px;
          letter-spacing: -0.01em;
          color: #1f0f08;
          margin: 0;
        }

        .decade-subtitle {
          display: none; /* Hide on mobile */
          margin: 0;
          margin-top: 4px;
          font: 400 12px var(--font-sans);
          color: var(--color-text-muted);
        }

        /* 5-Column Grid Layout */
        .timeline-grid-v2 {
          display: grid;
          grid-template-columns:
            0                           /* Col 1: No outer gutter (padding handles it) */
            var(--spine-width)          /* Col 2: Spine */
            var(--G)                    /* Col 3: Inner gap */
            1fr                         /* Col 4: Cards */
            0;                          /* Col 5: No outer gutter (padding handles it) */

          gap: 0;
          row-gap: 0;

          /* Section padding matches gap size */
          padding-inline: var(--G);
          padding-block: 0;

          position: relative;
          min-height: 100px; /* Ensure grid has height */
        }

        /* Column 2: Timeline Spine */
        .grid-spine {
          grid-column: 2;
          grid-row: 1;
          position: relative;
          background: rgba(196, 167, 183, 0.4);
          box-shadow: 0 2px 6px -2px rgba(0, 0, 0, 0.1), 0 1px 3px -1px rgba(0, 0, 0, 0.08);
          border-radius: 2px;
          align-self: stretch; /* Make it stretch to grid height */
          width: var(--spine-width);
          min-height: 200px; /* Ensure it has height */
        }

        /* Column 4: Cards Container */
        .grid-cards {
          grid-column: 4;
          grid-row: 1;

          display: flex;
          flex-direction: column;
          gap: var(--G);  /* Vertical rhythm via gap-y */
        }

        /* ==================================================================================
           CARD COMPONENTS
           ================================================================================== */

        /* Card Wrapper - No ad-hoc margins! */
        .timeline-card-wrapper {
          position: relative;
          margin: 0;  /* All spacing via grid gap */
          cursor: pointer;
        }

        /* Year Badge */
        .year-badge {
          position: absolute;
          left: calc(-1 * var(--G) - 18px); /* Moved much closer to spine */
          top: 12px;

          font-family: var(--font-serif);
          font-weight: 500;
          font-size: 14px; /* Reduced from 16px */
          line-height: 1;
          color: #6A4D58;
          background: #F9E5E8;
          padding: 2px 6px 6px 6px; /* Reduced padding */
          border: 1px solid rgba(139, 107, 122, 0.2);
          border-radius: 5px; /* Slightly smaller radius */
          box-shadow: 0 2px 6px -2px rgba(0, 0, 0, 0.1), 0 1px 3px -1px rgba(0, 0, 0, 0.08);
          white-space: nowrap;
          pointer-events: none;
          z-index: 2;
        }

        /* Connector Line */
        .connector-line {
          position: absolute;
          left: calc(-1 * var(--G) - var(--connector-length) + 20px); /* Moved right 20px */
          top: 140px; /* Moved down 100px more (was 40px) */
          width: var(--connector-length);
          height: 3.5px;
          background: linear-gradient(to right, rgba(196, 167, 183, 0.55), rgba(196, 167, 183, 0.25));
          box-shadow: 0 2px 6px -2px rgba(0, 0, 0, 0.1), 0 1px 3px -1px rgba(0, 0, 0, 0.08);
          border-radius: 1px;
          pointer-events: none;
          z-index: 1;
          transition: width 150ms ease-out, background 150ms ease-out;
        }

        .timeline-card-wrapper:hover .connector-line {
          width: calc(var(--connector-length) + 6px);
          background: rgba(196, 167, 183, 0.7);
        }

        /* Story Card */
        .story-card {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 2px 8px -2px rgba(0, 0, 0, 0.08), 0 1px 3px -1px rgba(0, 0, 0, 0.06);
          transition: box-shadow 200ms ease-out, transform 200ms ease-out;
          transform: translate3d(0, 0, 0);
        }

        .timeline-card-wrapper:hover .story-card {
          box-shadow: 0 4px 12px -3px rgba(0, 0, 0, 0.12), 0 2px 5px -1px rgba(0, 0, 0, 0.08);
          transform: translate3d(0, -2px, 0);
        }

        /* Card Photo */
        .card-photo {
          position: relative;
          width: 100%;
          aspect-ratio: 16/10;
          overflow: hidden;
        }

        .photo-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .photo-count {
          position: absolute;
          top: 12px;
          left: 12px;
          background: rgba(0, 0, 0, 0.6);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        /* Card Body */
        .card-body {
          padding: 16px;
        }

        .card-title {
          font-family: var(--font-sans);
          font-size: 17px;
          font-weight: 600;
          color: #1f0f08;
          margin: 0 0 8px 0;
          line-height: 1.3;

          /* Line clamp */
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .card-meta {
          font-family: var(--font-sans);
          font-size: 14px;
          color: #6B7280;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .meta-divider {
          color: #D1D5DB;
        }

        /* ==================================================================================
           RESPONSIVE & ACCESSIBILITY
           ================================================================================== */

        /* Reduced Motion */
        @media (prefers-reduced-motion: reduce) {
          .story-card,
          .connector-line {
            transition: none !important;
            transform: none !important;
          }
        }

        /* Dark Mode */
        .dark-theme .spine-line {
          background: rgba(176, 179, 184, 0.35);
        }

        .dark-theme .decade-banner-v2 {
          background: linear-gradient(180deg, rgba(40, 40, 40, 0.9), rgba(30, 30, 30, 0.9)),
                      rgba(60, 60, 60, 0.2);
          border-top: 1.5px solid rgba(100, 100, 100, 0.4);
          border-bottom: 1.5px solid rgba(100, 100, 100, 0.4);
        }

        .dark-theme .story-card {
          background: #1f1f1f;
        }

        .dark-theme .card-title {
          color: #e5e5e5;
        }

        .dark-theme .connector-line {
          background: linear-gradient(to right, rgba(176, 179, 184, 0.4), rgba(176, 179, 184, 0.15));
        }

        .dark-theme .timeline-card-wrapper:hover .connector-line {
          background: rgba(176, 179, 184, 0.6);
        }

        /* Desktop: Switch to desktop component */
        @media (min-width: 768px) {
          .timeline-container-v2 {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
