"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, ChevronDown, ChevronUp } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRecordModal } from "@/hooks/use-record-modal";
import RecordModal from "@/components/RecordModal";
import MoreIdeas from "@/components/MoreIdeas";
import PromptCard from "@/components/PromptCard";

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

export default function PromptsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isOpen, openModal, closeModal, handleSave, initialData } = useRecordModal();
  const [showArchived, setShowArchived] = useState(false);
  const [showAllQueued, setShowAllQueued] = useState(false);
  const [showAllActive, setShowAllActive] = useState(false);

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

  const handleRecord = (promptId: string, promptText: string, source: 'ai' | 'catalog') => {
    // Store prompt ID for tracking
    if (source === 'ai') {
      sessionStorage.setItem("activePromptId", promptId);
    }
    // Open recording modal with the selected prompt
    openModal({ prompt: promptText });
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
    <div className="min-h-screen pb-20 md:pb-0" style={{ background: "#e8e5e4" }}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold" style={{ color: "#000000" }}>Prompts</h1>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Section 1: Your Prompt Queue */}
        <section style={{ marginTop: "24px" }}>
          <h2
            className="font-bold mb-4"
            style={{
              fontSize: "20px",
              color: "#000000",
              lineHeight: "1.4"
            }}
          >
            Your Prompt Queue
          </h2>

          <div
            className="bg-white rounded-lg shadow-sm"
            style={{
              padding: "16px",
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
                    className="mt-4 text-base font-medium text-gray-700 hover:text-gray-900 underline"
                  >
                    Show {queuedPrompts.length - 2} more
                  </button>
                )}
                {showAllQueued && queuedPrompts.length > 2 && (
                  <button
                    onClick={() => setShowAllQueued(false)}
                    className="mt-4 text-base font-medium text-gray-700 hover:text-gray-900 underline"
                  >
                    Show less
                  </button>
                )}
              </>
            )}
          </div>
        </section>

        {/* Section 2: Prompts for {FirstName} (Personalized) */}
        <section style={{ marginTop: "32px" }}>
          <h2
            className="font-bold mb-4"
            style={{
              fontSize: "20px",
              color: "#000000",
              lineHeight: "1.4"
            }}
          >
            Prompts for {firstName}
          </h2>

          <div
            className="bg-white rounded-lg shadow-sm"
            style={{
              padding: "16px",
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
            }}
          >
            {activeLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading your personalized prompts...</p>
              </div>
            ) : activePrompts.length === 0 ? (
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
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
                    className="mt-4 text-base font-medium text-gray-700 hover:text-gray-900 underline"
                  >
                    Show {activePrompts.length - 2} more
                  </button>
                )}
                {showAllActive && activePrompts.length > 2 && (
                  <button
                    onClick={() => setShowAllActive(false)}
                    className="mt-4 text-base font-medium text-gray-700 hover:text-gray-900 underline"
                  >
                    Show less
                  </button>
                )}
              </>
            )}
          </div>
        </section>

        {/* More Ideas Section */}
        <section style={{ marginTop: "32px" }}>
          <div
            className="bg-white rounded-lg shadow-sm"
            style={{
              padding: "16px",
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
            }}
          >
            <MoreIdeas />
          </div>
        </section>

        {/* Section 3: Prompt Archive (Dismissed) */}
        <section style={{ marginTop: "32px" }}>
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="flex items-center gap-2 font-bold w-full mb-4 hover:opacity-80 transition-opacity"
            style={{
              fontSize: "20px",
              color: "#000000",
              lineHeight: "1.4"
            }}
          >
            <span className="flex-1 text-left">Prompt Archive</span>
            {archivedLoading ? (
              <span className="text-sm text-gray-400" style={{ opacity: 0.7 }}>(...)</span>
            ) : (
              <span className="text-sm text-gray-500" style={{ opacity: 0.7 }}>({archivedPrompts.length})</span>
            )}
            {showArchived ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>

          {showArchived && (
            <div
              className="bg-white rounded-lg shadow-sm"
              style={{
                padding: "16px",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
              }}
            >
              {archivedPrompts.length === 0 ? (
                <p className="text-gray-500 text-base p-4">
                  Dismissed prompts will appear here
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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

      {/* Record Modal */}
      <RecordModal
        isOpen={isOpen}
        onClose={closeModal}
        onSave={handleSave}
        initialPrompt={initialData?.prompt}
        initialTitle={initialData?.title}
        initialYear={initialData?.year}
      />
    </div>
  );
}
