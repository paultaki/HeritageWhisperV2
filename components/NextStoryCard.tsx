"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, SkipForward, Sparkles } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";

interface Prompt {
  id: string | null;
  prompt_text: string;
  context_note: string | null;
  tier: number;
  prompt_score?: number;
  anchor_entity?: string;
  anchor_year?: number;
}

interface NextStoryCardProps {
  onRecordClick: (promptId: string | null, promptText: string) => void;
}

export function NextStoryCard({ onRecordClick }: NextStoryCardProps) {
  const queryClient = useQueryClient();
  const [isVisible, setIsVisible] = useState(false);
  const [skipCooldown, setSkipCooldown] = useState(false);

  // Fetch next prompt
  const { data, isLoading, error } = useQuery<{ prompt: Prompt | null }>({
    queryKey: ["/api/prompts/next"],
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const prompt = data?.prompt;

  // Skip mutation
  const skipMutation = useMutation({
    mutationFn: async (promptId: string | null) => {
      if (!promptId) {
        // Can't skip fallback prompts, just refetch to get a new one
        return { success: true, nextPrompt: null };
      }
      const response = await apiRequest("POST", "/api/prompts/skip", { promptId });
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate and refetch prompts
      queryClient.invalidateQueries({ queryKey: ["/api/prompts/next"] });
      
      // Set cooldown to prevent rapid skipping
      setSkipCooldown(true);
      setTimeout(() => setSkipCooldown(false), 5000);
    },
  });

  // Fade in animation on mount
  useEffect(() => {
    if (prompt) {
      setIsVisible(true);
    }
  }, [prompt]);

  // Check localStorage to prevent re-showing same prompt
  useEffect(() => {
    if (prompt?.id) {
      const lastSeenPromptId = localStorage.getItem("lastSeenPromptId");
      if (lastSeenPromptId === prompt.id) {
        // Already seen this prompt, mark as shown
        localStorage.setItem("lastSeenPromptId", prompt.id);
      }
    }
  }, [prompt?.id]);

  const handleSkip = () => {
    if (skipCooldown || skipMutation.isPending) return;
    
    skipMutation.mutate(prompt?.id || null);
    setIsVisible(false);
    
    // Fade in next prompt after a brief delay
    setTimeout(() => setIsVisible(true), 300);
  };

  const handleRecord = () => {
    if (prompt) {
      // Store last seen prompt ID
      if (prompt.id) {
        localStorage.setItem("lastSeenPromptId", prompt.id);
      }
      onRecordClick(prompt.id, prompt.prompt_text);
    }
  };

  // Don't show card if no prompt or loading
  if (isLoading || !prompt) {
    return null;
  }

  // Don't show if error
  if (error) {
    console.error("Error fetching prompt:", error);
    return null;
  }

  return (
    <div
      className={`transition-all duration-500 ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 shadow-lg hover:shadow-xl transition-shadow">
        <CardContent className="p-6 space-y-4">
          {/* Header with icon */}
          <div className="flex items-center gap-2 text-heritage-brown">
            <Sparkles className="w-5 h-5 text-amber-600" />
            <span className="text-sm font-medium text-amber-700">
              {prompt.tier === 3 ? "✨ Personalized Memory" : "Your Next Story"}
            </span>
          </div>

          {/* Prompt text - larger, conversational */}
          <div className="space-y-2">
            <p className="text-xl md:text-2xl font-medium text-heritage-brown leading-relaxed">
              {prompt.prompt_text}
            </p>

            {/* Context note */}
            {prompt.context_note && (
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <span className="text-base">📝</span>
                {prompt.context_note}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              onClick={handleRecord}
              size="lg"
              className="flex-1 bg-heritage-orange hover:bg-heritage-coral text-white font-semibold shadow-md hover:shadow-lg transition-all"
            >
              <Mic className="w-5 h-5 mr-2" />
              Record This Story
            </Button>

            <Button
              onClick={handleSkip}
              disabled={skipCooldown || skipMutation.isPending}
              variant="outline"
              size="lg"
              className="sm:w-auto border-2 border-gray-300 hover:bg-gray-50"
            >
              <SkipForward className="w-4 h-4 mr-2" />
              {skipMutation.isPending ? "Skipping..." : "Skip"}
            </Button>
          </div>

          {/* Quality indicator for high-tier prompts */}
          {prompt.tier === 3 && prompt.prompt_score && prompt.prompt_score >= 80 && (
            <div className="text-xs text-amber-700 text-center pt-1">
              This prompt was specially crafted based on your stories
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
