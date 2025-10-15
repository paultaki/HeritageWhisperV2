"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, Check, ChevronDown, ChevronUp, RotateCcw, Eye, Clock, Bookmark, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface Prompt {
  id: string;
  prompt_text: string;
  context_note: string | null;
  tier: number;
  created_at: string;
  shown_count: number;
  anchor_entity?: string;
  anchor_year?: number;
}

interface PromptHistory {
  id: string;
  prompt_text: string;
  context_note?: string;
  outcome: string;
  resolved_at: string;
  story_id?: string;
  anchor_entity?: string;
  anchor_year?: number;
}

export default function PromptsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showDismissed, setShowDismissed] = useState(false);
  const [showAnswered, setShowAnswered] = useState(false);

  // Fetch active prompts
  const { data: activeData, isLoading: activeLoading } = useQuery<{ prompts: Prompt[] }>({
    queryKey: ["/api/prompts/active"],
    enabled: !!user,
  });

  // Fetch dismissed prompts
  const { data: dismissedData } = useQuery<{ prompts: PromptHistory[] }>({
    queryKey: ["/api/prompts/dismissed"],
    enabled: !!user && showDismissed,
  });

  // Fetch answered prompts
  const { data: answeredData } = useQuery<{ prompts: PromptHistory[] }>({
    queryKey: ["/api/prompts/answered"],
    enabled: !!user && showAnswered,
  });

  // Skip/Save for later mutation
  const skipMutation = useMutation({
    mutationFn: async (promptId: string) => {
      const response = await apiRequest("POST", "/api/prompts/skip", { promptId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompts/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/prompts/dismissed"] });
      toast({
        title: "Saved for later",
        description: "This question has been moved to your saved list",
      });
    },
  });

  // Delete prompt mutation (for active prompts)
  const deleteMutation = useMutation({
    mutationFn: async (promptId: string) => {
      const response = await apiRequest("DELETE", `/api/prompts/${promptId}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompts/active"] });
      toast({
        title: "Prompt deleted",
        description: "This question has been permanently removed",
      });
    },
  });

  // Delete history mutation (for saved/answered prompts)
  const deleteHistoryMutation = useMutation({
    mutationFn: async (promptId: string) => {
      const response = await apiRequest("DELETE", `/api/prompts/history/${promptId}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompts/dismissed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/prompts/answered"] });
      toast({
        title: "Prompt deleted",
        description: "This question has been permanently removed",
      });
    },
  });

  // Restore dismissed prompt mutation
  const restoreMutation = useMutation({
    mutationFn: async (promptId: string) => {
      const response = await apiRequest("POST", "/api/prompts/restore", { promptId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompts/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/prompts/dismissed"] });
      toast({
        title: "Prompt restored",
        description: "This question is back in your memory inbox",
      });
    },
  });

  const handleRecord = (promptId: string, promptText: string) => {
    // Store prompt ID for tracking
    sessionStorage.setItem("activePromptId", promptId);
    // Navigate to recording page with prompt
    router.push(`/recording?prompt=${encodeURIComponent(promptText)}`);
  };

  const handleViewStory = (storyId: string) => {
    router.push(`/timeline#story-${storyId}`);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  // Filter out broken prompts as last line of defense
  const filterBrokenPrompts = (prompts: Prompt[]) => {
    return prompts.filter(p => {
      // Grammar error patterns
      const hasGrammarError = /\s(the|a|an)\s+(said|told|was|were)/.test(p.prompt_text);
      const hasBrokenEntity = /\b(impress|mention)\s+(the|a)\s+(said|told)/.test(p.prompt_text);
      const tooShort = p.prompt_text.split(' ').length < 5;
      const missingQuestionMark = !p.prompt_text.includes('?');
      
      return !hasGrammarError && !hasBrokenEntity && !tooShort && !missingQuestionMark;
    });
  };
  
  const activePrompts = filterBrokenPrompts(activeData?.prompts || []);
  const dismissedPrompts = dismissedData?.prompts || [];
  const answeredPrompts = answeredData?.prompts || [];

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

      {/* Toolbar / Controls Section */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* User will specify what goes here */}
          <div className="text-gray-500 text-sm">
            Controls section - content coming soon
          </div>
        </div>
      </section>

      {/* Content with gradient background */}
      <div className="relative overflow-hidden animated-gradient-bg">
      {/* Animated gradient orbs and card animations */}
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
        {/* Section 1: Waiting to be Told (Active) - Maximum 3 */}
        <div className="space-y-4">
          <h2 className="text-2xl font-serif font-semibold text-heritage-brown flex items-center gap-2">
            <span className="text-amber-600">📬</span>
            Ready to Tell
          </h2>

          {activeLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading your questions...</p>
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
                <Card
                  key={prompt.id}
                  className="bg-white/20 backdrop-blur-md border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:bg-white/25 flex flex-col"
                  style={{
                    animation: `slideInUp 0.8s ease-in-out ${index * 0.15}s forwards`,
                    opacity: 0,
                    minHeight: window.innerWidth >= 1024 ? '420px' : '320px',
                  }}
                >
                  <CardContent className="p-4 md:p-6 lg:p-8 flex flex-col h-full justify-between">
                    {/* Header badge */}
                    <div className="flex items-center gap-1 text-xs md:text-sm text-amber-600 mb-3">
                      <span>✨</span>
                      <span className="font-medium">Inspired by your memories</span>
                    </div>

                    {/* Prompt text - centered vertically */}
                    <div className="flex-1 flex items-center justify-center mb-3 md:mb-4">
                      <p 
                        className="text-lg md:text-xl lg:text-2xl font-serif text-gray-800 leading-relaxed drop-shadow-sm text-center"
                        style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                      >
                        {prompt.prompt_text}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="space-y-2">
                      <Button
                        onClick={() => handleRecord(prompt.id, prompt.prompt_text)}
                        className="w-full bg-gradient-to-r from-amber-500 via-orange-400 to-rose-400 hover:from-amber-600 hover:via-orange-500 hover:to-rose-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] text-sm md:text-base py-2 md:py-3"
                      >
                        <Mic className="w-4 h-4 md:w-5 md:h-5 mr-1" />
                        Record
                      </Button>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={() => skipMutation.mutate(prompt.id)}
                          disabled={skipMutation.isPending}
                          variant="outline"
                          className="bg-white/40 backdrop-blur-sm border-white/50 hover:bg-white/60 transition-all duration-300 text-sm md:text-base py-2 md:py-3"
                        >
                          <Bookmark className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                          Save
                        </Button>
                        <Button
                          onClick={() => deleteMutation.mutate(prompt.id)}
                          disabled={deleteMutation.isPending}
                          variant="outline"
                          className="bg-white/40 backdrop-blur-sm border-white/50 hover:bg-red-100 hover:border-red-300 hover:text-red-700 transition-all duration-300 text-sm md:text-base py-2 md:py-3"
                        >
                          <Trash2 className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Saved for Later (Dismissed) */}
        <div className="space-y-4">
          <button
            onClick={() => setShowDismissed(!showDismissed)}
            className="flex items-center gap-2 text-xl font-serif font-semibold text-heritage-brown hover:text-amber-700 transition-colors"
          >
            <span className="text-amber-600">💭</span>
            Saved for Later
            <span className="text-sm text-gray-500">({dismissedPrompts.length})</span>
            {showDismissed ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>

          {showDismissed && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {dismissedPrompts.length === 0 ? (
                <p className="text-gray-500 italic pl-8 col-span-full">
                  Questions you skip will appear here
                </p>
              ) : (
                dismissedPrompts.map((prompt, index) => (
                  <Card
                    key={prompt.id}
                    className="bg-white/20 backdrop-blur-md border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:bg-white/25 flex flex-col"
                    style={{
                      animation: `slideInUp 0.8s ease-in-out ${index * 0.15}s forwards`,
                      opacity: 0,
                      minHeight: window.innerWidth >= 1024 ? '420px' : '320px',
                    }}
                  >
                    <CardContent className="p-4 md:p-6 lg:p-8 flex flex-col h-full justify-between">
                      {/* Header badge */}
                      <div className="flex items-center gap-1 text-xs md:text-sm text-amber-600 mb-3">
                        <span>💭</span>
                        <span className="font-medium">Saved for later</span>
                      </div>

                      {/* Prompt text - centered vertically */}
                      <div className="flex-1 flex items-center justify-center mb-3 md:mb-4">
                        <p 
                          className="text-lg md:text-xl lg:text-2xl font-serif text-gray-800 leading-relaxed drop-shadow-sm text-center"
                          style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                        >
                          {prompt.prompt_text}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={() => restoreMutation.mutate(prompt.id)}
                          disabled={restoreMutation.isPending}
                          variant="outline"
                          className="bg-white/40 backdrop-blur-sm border-white/50 hover:bg-white/60 transition-all duration-300 text-sm md:text-base py-2 md:py-3"
                        >
                          <RotateCcw className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                          Restore
                        </Button>
                        <Button
                          onClick={() => deleteHistoryMutation.mutate(prompt.id)}
                          disabled={deleteHistoryMutation.isPending}
                          variant="outline"
                          className="bg-white/40 backdrop-blur-sm border-white/50 hover:bg-red-100 hover:border-red-300 hover:text-red-700 transition-all duration-300 text-sm md:text-base py-2 md:py-3"
                        >
                          <Trash2 className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>

        {/* Section 3: Stories You've Shared (Answered) */}
        <div className="space-y-4">
          <button
            onClick={() => setShowAnswered(!showAnswered)}
            className="flex items-center gap-2 text-xl font-serif font-semibold text-heritage-brown hover:text-amber-700 transition-colors"
          >
            <span className="text-amber-600">✓</span>
            Stories You've Shared
            <span className="text-sm text-gray-500">({answeredPrompts.length})</span>
            {showAnswered ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>

          {showAnswered && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {answeredPrompts.length === 0 ? (
                <p className="text-gray-500 italic pl-8 col-span-full">
                  Your answered questions will appear here
                </p>
              ) : (
                answeredPrompts.map((prompt, index) => (
                  <Card
                    key={prompt.id}
                    className="bg-white/20 backdrop-blur-md border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:bg-white/25 flex flex-col"
                    style={{
                      animation: `slideInUp 0.8s ease-in-out ${index * 0.15}s forwards`,
                      opacity: 0,
                      minHeight: window.innerWidth >= 1024 ? '420px' : '320px',
                    }}
                  >
                    <CardContent className="p-4 md:p-6 lg:p-8 flex flex-col h-full justify-between">
                      {/* Header badge */}
                      <div className="flex items-center gap-1 text-xs md:text-sm text-green-600 mb-3">
                        <span>✓</span>
                        <span className="font-medium">Story shared</span>
                      </div>

                      {/* Prompt text - centered vertically */}
                      <div className="flex-1 flex items-center justify-center mb-3 md:mb-4">
                        <p 
                          className="text-lg md:text-xl lg:text-2xl font-serif text-gray-800 leading-relaxed drop-shadow-sm text-center"
                          style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                        >
                          {prompt.prompt_text}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="space-y-2">
                        {prompt.story_id && (
                          <Button
                            onClick={() => handleViewStory(prompt.story_id!)}
                            className="w-full bg-gradient-to-r from-amber-500 via-orange-400 to-rose-400 hover:from-amber-600 hover:via-orange-500 hover:to-rose-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] text-sm md:text-base py-2 md:py-3"
                          >
                            <Eye className="w-4 h-4 md:w-5 md:h-5 mr-1" />
                            View Story
                          </Button>
                        )}
                        <Button
                          onClick={() => deleteHistoryMutation.mutate(prompt.id)}
                          disabled={deleteHistoryMutation.isPending}
                          variant="outline"
                          className="w-full bg-white/40 backdrop-blur-sm border-white/50 hover:bg-red-100 hover:border-red-300 hover:text-red-700 transition-all duration-300 text-sm md:text-base py-2 md:py-3"
                        >
                          <Trash2 className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
