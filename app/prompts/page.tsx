"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, Check, ChevronDown, ChevronUp, RotateCcw, Eye, ArrowRight } from "lucide-react";
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

  // Calculate decade count from answered prompts
  const decades = new Set();
  answeredPrompts.forEach((prompt) => {
    if (prompt.anchor_year) {
      const decade = Math.floor(prompt.anchor_year / 10) * 10;
      decades.add(decade);
    }
  });
  const decadeCount = decades.size;
  const storyCount = answeredPrompts.length;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-gray-600">Please sign in to view your prompts</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8F3] py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-serif text-heritage-brown">
            Your Memory Prompts
          </h1>
          <p className="text-base text-gray-600">
            Quality over quantity
          </p>
        </div>

        {/* Mini Memory Map - Link to profile */}
        {storyCount > 0 && (
          <Link href="/profile" className="block">
            <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border-2 border-amber-200 hover:border-amber-300 transition-colors cursor-pointer">
              <p className="text-sm text-gray-600 mb-1">Your Memory Map</p>
              <div className="flex items-center justify-between">
                <p className="text-lg font-serif text-heritage-brown">
                  {storyCount} {storyCount === 1 ? 'story' : 'stories'} across {decadeCount || 'multiple'} {decadeCount === 1 ? 'decade' : 'decades'}
                </p>
                <div className="flex items-center gap-2 text-amber-600">
                  <span className="text-sm font-medium">Customize</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Section 1: Waiting to be Told (Active) - Maximum 3 */}
        <div className="space-y-4">
          <h2 className="text-2xl font-serif font-semibold text-heritage-brown flex items-center gap-2">
            <span className="text-amber-600">📬</span>
            Ready to Tell
          </h2>
          <p className="text-sm text-gray-600 italic">
            Maximum 3 curated questions at a time
          </p>

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
            <div className="space-y-4">
              {activePrompts.slice(0, 3).map((prompt) => (
                <Card
                  key={prompt.id}
                  className="bg-gradient-to-br from-[#FFFBF0] to-[#FFF5E6] border border-[#E8D5C4] shadow-md hover:shadow-lg transition-shadow"
                >
                  <CardContent className="p-6 space-y-4">
                    {/* Prompt text */}
                    <p 
                      className="text-xl font-serif text-heritage-brown leading-relaxed"
                      style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                    >
                      {prompt.prompt_text}
                    </p>

                    {/* Context whisper */}
                    {prompt.context_note && (
                      <p className="text-sm text-gray-600 italic flex items-center gap-2">
                        <span className="text-base not-italic">✨</span>
                        {prompt.context_note}
                      </p>
                    )}

                    {/* Creation time */}
                    <p className="text-xs text-gray-500">
                      Created {formatTimeAgo(prompt.created_at)}
                      {prompt.shown_count > 0 && ` • Shown ${prompt.shown_count} ${prompt.shown_count === 1 ? 'time' : 'times'}`}
                    </p>

                    {/* Action button */}
                    <Button
                      onClick={() => handleRecord(prompt.id, prompt.prompt_text)}
                      className="w-full bg-[#D4A574] hover:bg-[#C09564] text-white font-semibold"
                      style={{ minHeight: '48px' }}
                    >
                      <Mic className="w-5 h-5 mr-2" />
                      Record This Memory
                    </Button>
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
            <div className="space-y-3">
              {dismissedPrompts.length === 0 ? (
                <p className="text-gray-500 italic pl-8">
                  Questions you skip will appear here
                </p>
              ) : (
                dismissedPrompts.map((prompt) => (
                  <Card
                    key={prompt.id}
                    className="bg-white/60 border border-gray-300"
                  >
                    <CardContent className="p-5 space-y-3">
                      <p className="text-base font-serif text-gray-700 leading-relaxed">
                        {prompt.prompt_text}
                      </p>

                      {prompt.context_note && (
                        <p className="text-xs text-gray-500 italic">
                          {prompt.context_note}
                        </p>
                      )}

                      <div className="flex gap-2">
                        <Button
                          onClick={() => restoreMutation.mutate(prompt.id)}
                          disabled={restoreMutation.isPending}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Restore
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
            <div className="space-y-3">
              {answeredPrompts.length === 0 ? (
                <p className="text-gray-500 italic pl-8">
                  Your answered questions will appear here
                </p>
              ) : (
                answeredPrompts.map((prompt) => (
                  <Card
                    key={prompt.id}
                    className="bg-green-50/50 border border-green-200"
                  >
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 space-y-2">
                          <p className="text-base font-serif text-gray-700 leading-relaxed">
                            {prompt.prompt_text}
                          </p>
                          <p className="text-xs text-gray-500">
                            Recorded {formatTimeAgo(prompt.resolved_at)}
                          </p>
                        </div>
                      </div>

                      {prompt.story_id && (
                        <Button
                          onClick={() => handleViewStory(prompt.story_id!)}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Story
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
