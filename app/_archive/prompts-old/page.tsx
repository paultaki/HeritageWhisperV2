// @ts-nocheck
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, ChevronDown, ChevronUp, Settings, Brain } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useModeSelection } from "@/hooks/use-mode-selection";
import { ModeSelectionModal } from "@/components/recording/ModeSelectionModal";
import { QuickStoryRecorder } from "@/components/recording/QuickStoryRecorder";
import MoreIdeas from "@/components/MoreIdeas";
import PromptCard from "@/components/PromptCard";
import { useAIConsent } from "@/hooks/use-ai-consent";
import { LeftSidebar } from "@/components/LeftSidebar";
import { useMediaQuery } from "@/hooks/use-media-query";

interface QueuedPrompt {
  id: string;
  prompt_text: string;
  context_note?: string | null;
  source: 'ai' | 'catalog';
  category?: string;
  tier?: number;
  queue_position: number;
  queued_at: string;
  anchor_entity?: string;
  anchor_year?: number;
}

interface ActivePrompt {
  id: string;
  prompt_text: string;
  context_note: string | null;
  tier: number;
  created_at: string;
  shown_count: number;
  anchor_entity?: string;
  anchor_year?: number;
}

interface ArchivedPrompt {
  id: string;
  prompt_text: string;
  context_note?: string | null;
  source: 'ai' | 'catalog';
  category?: string;
  tier?: number;
  dismissed_at: string;
  anchor_entity?: string;
  anchor_year?: number;
}

interface FamilyPrompt {
  id: string;
  prompt_text: string;
  context_note?: string | null;
  source: 'family';
  status: string;
  created_at: string;
  submittedBy: {
    id: string;
    name: string;
    email?: string;
    relationship?: string;
  };
}

export default function PromptsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const modeSelection = useModeSelection();
  const { isEnabled: isAIEnabled, isLoading: isAILoading } = useAIConsent();
  const [showArchived, setShowArchived] = useState(false);
  const [showAllQueued, setShowAllQueued] = useState(false);
  const [showAllActive, setShowAllActive] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  // Fetch user profile to get their name
  const { data: userProfile } = useQuery<{ user: { name: string } }>({
    queryKey: ["/api/user/profile"],
    enabled: !!user,
  });

  // Get user's first name from database or fallback to email
  const firstName = userProfile?.user?.name?.split(' ')[0]
    || user?.user_metadata?.name?.split(' ')[0]
    || user?.user_metadata?.full_name?.split(' ')[0]
    || user?.email?.split('@')[0]
    || 'You';

  // Fetch queued prompts
  const { data: queuedData, isLoading: queuedLoading } = useQuery<{ prompts: QueuedPrompt[] }>({
    queryKey: ["/api/prompts/queued"],
    enabled: !!user,
  });

  // Fetch active (personalized) prompts
  const { data: activeData, isLoading: activeLoading } = useQuery<{ prompts: ActivePrompt[] }>({
    queryKey: ["/api/prompts/active"],
    enabled: !!user,
  });

  // Fetch archived prompts (always fetch to show count, but only display when expanded)
  const { data: archivedData, isLoading: archivedLoading } = useQuery<{ prompts: ArchivedPrompt[] }>({
    queryKey: ["/api/prompts/archived"],
    enabled: !!user,
  });

  // Fetch family-submitted prompts
  const { data: familyData, isLoading: familyLoading } = useQuery<{ prompts: FamilyPrompt[] }>({
    queryKey: ["/api/prompts/family-submitted"],
    enabled: !!user,
  });

  // Queue mutation - adds prompts to queue
  const queueMutation = useMutation({
    mutationFn: async ({ promptId, source, text, category }: {
      promptId: string;
      source: 'ai' | 'catalog';
      text: string;
      category?: string;
    }) => {
      const response = await apiRequest("POST", "/api/prompts/queue", {
        promptId: source === 'ai' ? promptId : undefined,
        source,
        text: source === 'catalog' ? text : undefined,
        category: source === 'catalog' ? category : undefined,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompts/queued"] });
      queryClient.invalidateQueries({ queryKey: ["/api/prompts/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/prompts/archived"] });
      toast({
        title: "Added to queue",
        description: "This prompt is now in your queue",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add to queue",
        variant: "destructive",
      });
    },
  });

  // Dismiss mutation - moves prompts to archive
  const dismissMutation = useMutation({
    mutationFn: async ({ promptId, source, text, category }: {
      promptId: string;
      source: 'ai' | 'catalog';
      text: string;
      category?: string;
    }) => {
      const response = await apiRequest("POST", "/api/prompts/dismiss", {
        promptId: source === 'ai' ? promptId : undefined,
        source,
        text: source === 'catalog' ? text : undefined,
        category: source === 'catalog' ? category : undefined,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompts/queued"] });
      queryClient.invalidateQueries({ queryKey: ["/api/prompts/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/prompts/archived"] });
      toast({
        title: "Moved to archive",
        description: "This prompt has been archived",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to dismiss prompt",
        variant: "destructive",
      });
    },
  });

  // Delete mutation - permanently deletes prompts
  const deleteMutation = useMutation({
    mutationFn: async ({ promptId, source }: {
      promptId: string;
      source: 'ai' | 'catalog';
    }) => {
      // Single endpoint handles both AI and catalog prompts
      const response = await apiRequest("DELETE", `/api/prompts/${promptId}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompts/archived"] });
      toast({
        title: "Prompt deleted",
        description: "This prompt has been permanently removed",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete prompt",
        variant: "destructive",
      });
    },
  });

  // Listen for refresh events from MoreIdeas component
  useEffect(() => {
    const handleRefresh = () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompts/queued"] });
      queryClient.invalidateQueries({ queryKey: ["/api/prompts/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/prompts/archived"] });
    };

    window.addEventListener('refreshPrompts', handleRefresh);
    return () => window.removeEventListener('refreshPrompts', handleRefresh);
  }, [queryClient]);

  const handleRecord = (promptId: string, promptText: string, source: 'ai' | 'catalog' | 'family') => {
    // Store prompt ID for tracking
    if (source === 'ai') {
      sessionStorage.setItem("activePromptId", promptId);
    }
    // Open mode selection modal with the selected prompt question
    modeSelection.openModal(promptText);
  };

  const handleQueue = (id: string, text: string, source: 'ai' | 'catalog', category?: string) => {
    queueMutation.mutate({ promptId: id, source, text, category });
  };

  const handleDismiss = (id: string, text: string, source: 'ai' | 'catalog', category?: string) => {
    dismissMutation.mutate({ promptId: id, source, text, category });
  };

  const handleDelete = (id: string, source: 'ai' | 'catalog') => {
    deleteMutation.mutate({ promptId: id, source });
  };

  const isAnyMutationPending = queueMutation.isPending || dismissMutation.isPending || deleteMutation.isPending;

  const queuedPrompts = queuedData?.prompts || [];
  const activePrompts = activeData?.prompts || [];
  const archivedPrompts = archivedData?.prompts || [];
  const familyPrompts = familyData?.prompts || [];

  // Progressive disclosure: show 2 initially
  const displayedQueuedPrompts = showAllQueued ? queuedPrompts : queuedPrompts.slice(0, 2);
  const displayedActivePrompts = showAllActive ? activePrompts : activePrompts.slice(0, 2);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-gray-600">Please sign in to view your prompts</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: "#FFF8F3" }}
    >
      {/* Left Sidebar */}
      {isDesktop && <LeftSidebar />}

      {/* Main content */}
      <main className="flex-1 min-w-0 pb-20 md:pb-0">
        <div
          style={{
            background: "linear-gradient(to bottom, #fafaf9 0%, #f5f5f4 50%, #fafaf9 100%)",
            minHeight: "100vh",
          }}
        >
          {/* Header */}
          <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-200/50">
        <div className="px-6 py-5" style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div className="flex items-center gap-3">
            <Image
              src="/h-whiper.png"
              alt="Heritage Whisper"
              width={36}
              height={36}
              className="h-9 w-auto"
            />
            <div>
              <h1 className="text-[26px] font-semibold tracking-tight text-gray-900">Story Prompts</h1>
              <p className="text-sm text-gray-600 mt-0.5">Thoughtful questions to spark your next memory</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-6 py-10 space-y-10" style={{ maxWidth: "900px", margin: "0 auto" }}>
        {/* AI Disabled State */}
        {!isAILoading && !isAIEnabled && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <Brain className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  AI Prompts Disabled
                </h3>
                <p className="text-gray-700 mb-4">
                  AI-generated story prompts are currently disabled for your account. Enable AI processing in Settings to get personalized prompts based on your stories.
                </p>
                <Button
                  onClick={() => router.push("/profile#ai-processing")}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Go to Settings
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Section 1: Your Prompt Queue */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-[19px] font-semibold tracking-tight text-gray-900">
              Your Queue
            </h2>
            <span className="text-sm text-gray-500 font-medium">
              {queuedPrompts.length} {queuedPrompts.length === 1 ? 'prompt' : 'prompts'}
            </span>
          </div>

          <div
            className="bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50"
            style={{
              padding: "20px",
              borderRadius: "16px",
            }}
          >
            {queuedLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading your queue...</p>
              </div>
            ) : queuedPrompts.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-base text-gray-600">
                  Your queue is empty. Add prompts from below!
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayedQueuedPrompts.map((prompt, index) => (
                    <PromptCard
                      key={prompt.id}
                      id={prompt.id}
                      promptText={prompt.prompt_text}
                      contextNote={prompt.context_note}
                      source={prompt.source}
                      category={prompt.category}
                      anchorEntity={prompt.anchor_entity}
                      anchorYear={prompt.anchor_year}
                      variant="queue"
                      index={index}
                      onRecord={handleRecord}
                      onDismiss={handleDismiss}
                      onDelete={handleDelete}
                      isLoading={isAnyMutationPending}
                    />
                  ))}
                </div>
                {queuedPrompts.length > 2 && !showAllQueued && (
                  <button
                    onClick={() => setShowAllQueued(true)}
                    className="mt-5 text-[15px] font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200 underline underline-offset-2"
                  >
                    Show {queuedPrompts.length - 2} more
                  </button>
                )}
                {showAllQueued && queuedPrompts.length > 2 && (
                  <button
                    onClick={() => setShowAllQueued(false)}
                    className="mt-5 text-[15px] font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200 underline underline-offset-2"
                  >
                    Show less
                  </button>
                )}
              </>
            )}
          </div>
        </section>

        {/* Section 2: Prompts for {FirstName} (Personalized) */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-[19px] font-semibold tracking-tight text-gray-900">
              For {firstName}
            </h2>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/50">
              Personalized
            </span>
          </div>

          {/* Family-Submitted Prompts (Priority Display) */}
          {familyPrompts.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200/50">
                  💝 From Your Family
                </span>
                <span className="text-sm text-gray-500">
                  {familyPrompts.length} {familyPrompts.length === 1 ? 'question' : 'questions'} they want answered
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {familyPrompts.map((prompt, index) => (
                  <PromptCard
                    key={prompt.id}
                    id={prompt.id}
                    promptText={prompt.prompt_text}
                    contextNote={prompt.context_note}
                    source="family"
                    variant="family"
                    index={index}
                    submittedBy={prompt.submittedBy}
                    onRecord={handleRecord}
                    onQueue={handleQueue}
                    onDismiss={handleDismiss}
                    onDelete={handleDelete}
                    isLoading={isAnyMutationPending}
                  />
                ))}
              </div>
            </div>
          )}

          {/* AI-Generated Personalized Prompts */}
          <div
            className="bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50"
            style={{
              padding: "20px",
              borderRadius: "16px",
            }}
          >
            {activeLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading your personalized prompts...</p>
              </div>
            ) : activePrompts.length === 0 && familyPrompts.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-base text-gray-600 mb-4">
                  New prompts will appear as you share more stories
                </p>
                <Button
                  onClick={() => router.push("/recording")}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium"
                >
                  <Mic className="w-4 h-4 mr-2" />
                  Record Your First Story
                </Button>
              </div>
            ) : activePrompts.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-base text-gray-600">
                  More AI-generated prompts will appear as you share stories
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayedActivePrompts.map((prompt, index) => (
                    <PromptCard
                      key={prompt.id}
                      id={prompt.id}
                      promptText={prompt.prompt_text}
                      contextNote={prompt.context_note}
                      source="ai"
                      anchorEntity={prompt.anchor_entity}
                      anchorYear={prompt.anchor_year}
                      variant="personalized"
                      index={index}
                      onRecord={handleRecord}
                      onQueue={handleQueue}
                      onDismiss={handleDismiss}
                      onDelete={handleDelete}
                      isLoading={isAnyMutationPending}
                    />
                  ))}
                </div>
                {activePrompts.length > 2 && !showAllActive && (
                  <button
                    onClick={() => setShowAllActive(true)}
                    className="mt-5 text-[15px] font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200 underline underline-offset-2"
                  >
                    Show {activePrompts.length - 2} more
                  </button>
                )}
                {showAllActive && activePrompts.length > 2 && (
                  <button
                    onClick={() => setShowAllActive(false)}
                    className="mt-5 text-[15px] font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200 underline underline-offset-2"
                  >
                    Show less
                  </button>
                )}
              </>
            )}
          </div>
        </section>

        {/* More Ideas Section */}
        <section>
          <div
            className="bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50"
            style={{
              padding: "20px",
              borderRadius: "16px",
            }}
          >
            <MoreIdeas />
          </div>
        </section>

        {/* Section 3: Prompt Archive (Dismissed) */}
        <section>
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="flex items-center gap-3 w-full mb-5 hover:opacity-70 transition-opacity group"
          >
            <h2 className="flex-1 text-left text-[19px] font-semibold tracking-tight text-gray-900">
              Archive
            </h2>
            <span className="text-sm text-gray-500 font-medium">
              {archivedLoading ? '...' : `${archivedPrompts.length} dismissed`}
            </span>
            {showArchived ? (
              <ChevronUp className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
            )}
          </button>

          {showArchived && (
            <div
              className="bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50"
              style={{
                padding: "20px",
                borderRadius: "16px",
              }}
            >
              {archivedPrompts.length === 0 ? (
                <p className="text-gray-500 text-base p-4">
                  Dismissed prompts will appear here
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {archivedPrompts.map((prompt, index) => (
                    <PromptCard
                      key={prompt.id}
                      id={prompt.id}
                      promptText={prompt.prompt_text}
                      contextNote={prompt.context_note}
                      source={prompt.source}
                      category={prompt.category}
                      anchorEntity={prompt.anchor_entity}
                      anchorYear={prompt.anchor_year}
                      variant="archived"
                      index={index}
                      onRecord={handleRecord}
                      onQueue={handleQueue}
                      onDismiss={handleDismiss}
                      onDelete={handleDelete}
                      isLoading={isAnyMutationPending}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </div>

          {/* Mode Selection Modal */}
          <ModeSelectionModal
            isOpen={modeSelection.isOpen}
            onClose={modeSelection.closeModal}
            onSelectQuickStory={modeSelection.openQuickRecorder}
            promptQuestion={modeSelection.promptQuestion}
          />

          {/* Quick Story Recorder */}
          <QuickStoryRecorder
            isOpen={modeSelection.quickRecorderOpen}
            onClose={modeSelection.closeQuickRecorder}
            promptQuestion={modeSelection.promptQuestion}
          />
        </div>
      </main>
    </div>
  );
}
