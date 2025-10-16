"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, ChevronDown, ChevronUp } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
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
      if (source === 'ai') {
        const response = await apiRequest("DELETE", `/api/prompts/${promptId}`, {});
        return response.json();
      } else {
        const response = await apiRequest("DELETE", `/api/prompts/history/${promptId}`, {});
        return response.json();
      }
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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-gray-600">Please sign in to view your prompts</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0" style={{ background: "var(--color-page)" }}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8" style={{ color: "#1f0f08" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h1 className="text-2xl font-bold">Prompts</h1>
          </div>
        </div>
      </header>

      {/* Content with gradient background */}
      <div className="relative overflow-hidden animated-gradient-bg">
        {/* Animated gradient orbs */}
        <style jsx global>{`
        .animated-gradient-bg {
          background: linear-gradient(135deg, #fef3c7, #ffedd5, #fed7aa, #fecdd3);
          background-size: 400% 400%;
          animation: gradientShift 15s ease infinite;
        }

        @keyframes gradientShift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        .orb {
          position: absolute;
          border-radius: 9999px;
          filter: blur(64px);
          opacity: 0.4;
          mix-blend-mode: lighten;
          z-index: 0;
          pointer-events: none;
          transition: opacity 0.3s;
        }
        .orb1 {
          width: 420px;
          height: 420px;
          left: -120px;
          top: 100px;
          background: radial-gradient(circle at 40% 40%, #fbbf24 20%, #fb923c 90%);
          animation: orb1move 13s ease-in-out infinite alternate;
        }
        .orb2 {
          width: 340px;
          height: 340px;
          right: -70px;
          top: 300px;
          background: radial-gradient(circle at 70% 30%, #fb923c 10%, #fb7185 90%);
          animation: orb2move 11s ease-in-out infinite alternate;
        }
        .orb3 {
          width: 350px;
          height: 350px;
          left: 50%;
          bottom: -140px;
          background: radial-gradient(circle at 30% 70%, #fbbf24 0%, #fb923c 100%);
          transform: translateX(-50%);
          animation: orb3move 15s ease-in-out infinite alternate;
        }
        @keyframes orb1move {
          0% { transform: scale(1) translateY(0) rotate(0deg); }
          100% { transform: scale(1.12) translateY(40px) rotate(30deg); }
        }
        @keyframes orb2move {
          0% { transform: scale(1) translateY(0) rotate(0deg); }
          100% { transform: scale(1.05) translateY(-65px) rotate(-25deg); }
        }
        @keyframes orb3move {
          0% { transform: translateX(-50%) scale(1) rotate(0deg); }
          100% { transform: translateX(-50%) scale(1.12) translateY(-45px) rotate(16deg); }
        }
        @keyframes slideInUp {
          0% {
            opacity: 0;
            transform: translateY(40px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

        <div className="orb orb1"></div>
        <div className="orb orb2"></div>
        <div className="orb orb3"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 space-y-8">
          {/* Section 1: Your Prompt Queue */}
          <div className="space-y-4">
            <h2 className="text-2xl font-serif font-semibold text-heritage-brown flex items-center gap-2">
              <span className="text-amber-600">📋</span>
              Your Prompt Queue
            </h2>

            {queuedLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading your queue...</p>
              </div>
            ) : queuedPrompts.length === 0 ? (
              <Card className="bg-gradient-to-br from-[#FFFBF0] to-[#FFF5E6] border border-[#E8D5C4]">
                <CardContent className="p-8 text-center">
                  <p className="text-lg text-gray-600 italic font-serif">
                    Your queue is empty. Add prompts from below!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {queuedPrompts.map((prompt, index) => (
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
            )}
          </div>

          {/* Section 2: Prompts for {FirstName} (Personalized) */}
          <div className="space-y-4">
            <h2 className="text-2xl font-serif font-semibold text-heritage-brown flex items-center gap-2">
              <span className="text-amber-600">✨</span>
              Prompts for {firstName}
            </h2>

            {activeLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading your personalized prompts...</p>
              </div>
            ) : activePrompts.length === 0 ? (
              <Card className="bg-gradient-to-br from-[#FFFBF0] to-[#FFF5E6] border border-[#E8D5C4]">
                <CardContent className="p-8 text-center">
                  <p className="text-lg text-gray-600 italic font-serif">
                    New prompts will appear as you share more stories
                  </p>
                  <Button
                    onClick={() => router.push("/recording")}
                    className="mt-6 bg-[#D4A574] hover:bg-[#C09564]"
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    Record Your First Story
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activePrompts.slice(0, 6).map((prompt, index) => (
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
            )}
          </div>

          {/* More Ideas Section */}
          <MoreIdeas />

          {/* Section 3: Prompt Archive (Dismissed) */}
          <div className="space-y-4">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="flex items-center gap-2 text-xl font-serif font-semibold text-heritage-brown hover:text-amber-700 transition-colors"
            >
              <span className="text-amber-600">📦</span>
              Prompt Archive
              {archivedLoading ? (
                <span className="text-sm text-gray-400">(...)</span>
              ) : (
                <span className="text-sm text-gray-500">({archivedPrompts.length})</span>
              )}
              {showArchived ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>

            {showArchived && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {archivedPrompts.length === 0 ? (
                  <p className="text-gray-500 italic pl-8 col-span-full">
                    Dismissed prompts will appear here
                  </p>
                ) : (
                  archivedPrompts.map((prompt, index) => (
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
                  ))
                )}
              </div>
            )}
          </div>
        </div>
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
