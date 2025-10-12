"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, X, Sparkles } from "lucide-react";
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

// Track dismissals per prompt
interface DismissalData {
  promptId: string;
  dismissedAt: number;
  count: number;
}

// Check if we should show the prompt today
function shouldShowPromptToday(promptId: string | null): boolean {
  if (!promptId) return true; // Always show fallback prompts
  
  const dismissalsKey = "promptDismissals";
  const today = new Date().toDateString();
  const lastShownKey = `lastPromptShown_${today}`;
  
  try {
    const dismissalsJson = localStorage.getItem(dismissalsKey);
    const dismissals: DismissalData[] = dismissalsJson ? JSON.parse(dismissalsJson) : [];
    
    // Find this prompt's dismissal record
    const promptDismissal = dismissals.find(d => d.promptId === promptId);
    
    // If dismissed 3+ times total, don't show for 24 hours after last dismissal
    if (promptDismissal && promptDismissal.count >= 3) {
      const hoursSinceLastDismissal = (Date.now() - promptDismissal.dismissedAt) / (1000 * 60 * 60);
      if (hoursSinceLastDismissal < 24) {
        return false;
      }
    }
    
    // Check if already shown today
    const lastShown = localStorage.getItem(lastShownKey);
    if (lastShown === promptId) {
      return false;
    }
    
    return true;
  } catch {
    return true; // Show if localStorage fails
  }
}

// Track that we've shown this prompt today
function markPromptShown(promptId: string | null) {
  if (!promptId) return;
  const today = new Date().toDateString();
  const lastShownKey = `lastPromptShown_${today}`;
  localStorage.setItem(lastShownKey, promptId);
}

// Check if this is the first prompt shown today (for sparkle animation)
function isFirstPromptToday(): boolean {
  const today = new Date().toDateString();
  const shownTodayKey = `promptsShownToday_${today}`;
  const shown = localStorage.getItem(shownTodayKey);
  
  if (!shown) {
    localStorage.setItem(shownTodayKey, "true");
    return true;
  }
  return false;
}

// Get time-aware greeting
function getTimeAwareGreeting(): string {
  const hour = new Date().getHours();
  
  if (hour < 12) return "Good morning! I have a question for you...";
  if (hour < 17) return "I've been thinking about your stories...";
  if (hour < 21) return "As the day winds down, I'm curious...";
  return "Before you rest, one more thought...";
}

export function NextStoryCard({ onRecordClick }: NextStoryCardProps) {
  const queryClient = useQueryClient();
  const [isVisible, setIsVisible] = useState(false);
  const [showSparkle, setShowSparkle] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Fetch next prompt
  const { data, isLoading, error } = useQuery<{ prompt: Prompt | null }>({
    queryKey: ["/api/prompts/next"],
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const prompt = data?.prompt;

  // Check if we should show this prompt
  useEffect(() => {
    if (prompt?.id) {
      const shouldShow = shouldShowPromptToday(prompt.id);
      if (!shouldShow) {
        setIsDismissed(true);
        return;
      }
      
      // Mark as shown
      markPromptShown(prompt.id);
      
      // Show sparkle animation if first prompt today
      const isFirst = isFirstPromptToday();
      setShowSparkle(isFirst);
      
      // Gentle slide-down animation
      setTimeout(() => setIsVisible(true), 100);
    }
  }, [prompt?.id]);

  // Skip prompt mutation
  const skipMutation = useMutation({
    mutationFn: async (promptId: string) => {
      return apiRequest("POST", "/api/prompts/skip", { promptId });
    },
    onSuccess: () => {
      // Refetch next prompt
      queryClient.invalidateQueries({ queryKey: ["/api/prompts/next"] });
    },
  });

  // Handle "Not today" dismissal
  const handleDismiss = async () => {
    if (!prompt?.id) return;
    
    // Fade out animation immediately for smooth UX
    setIsVisible(false);
    setTimeout(() => setIsDismissed(true), 300);
    
    // Call skip API to increment shown_count in database
    // After 3 skips, prompt will be retired to history
    try {
      await skipMutation.mutateAsync(prompt.id);
    } catch (e) {
      console.error("Failed to skip prompt:", e);
      // Continue with local dismissal even if API fails
    }
    
    // Track local dismissal for UI state
    const dismissalsKey = "promptDismissals";
    try {
      const dismissalsJson = localStorage.getItem(dismissalsKey);
      const dismissals: DismissalData[] = dismissalsJson ? JSON.parse(dismissalsJson) : [];
      
      // Find or create dismissal record
      const existingIndex = dismissals.findIndex(d => d.promptId === prompt.id);
      if (existingIndex >= 0) {
        dismissals[existingIndex].dismissedAt = Date.now();
        dismissals[existingIndex].count += 1;
      } else {
        dismissals.push({
          promptId: prompt.id,
          dismissedAt: Date.now(),
          count: 1,
        });
      }
      
      localStorage.setItem(dismissalsKey, JSON.stringify(dismissals));
    } catch (e) {
      console.error("Failed to save local dismissal:", e);
    }
  };

  const handleRecord = () => {
    if (prompt) {
      onRecordClick(prompt.id, prompt.prompt_text);
    }
  };

  // Don't show if loading, no prompt, error, or dismissed
  if (isLoading || !prompt || error || isDismissed) {
    return null;
  }

  const greeting = getTimeAwareGreeting();

  return (
    <div
      className={`transition-all duration-400 ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8"
      }`}
    >
      <Card className="relative bg-gradient-to-br from-[#FFFBF0] to-[#FFF5E6] border border-[#E8D5C4] shadow-xl overflow-hidden">
        {/* Sparkle animation for first prompt of the day */}
        {showSparkle && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-4 right-4 w-8 h-8 animate-pulse">
              <Sparkles className="w-8 h-8 text-amber-400 drop-shadow-lg" />
            </div>
            <div className="absolute top-8 right-12 w-4 h-4 animate-ping animation-delay-150">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
          </div>
        )}

        <CardContent className="p-8 space-y-5 relative z-10">
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-amber-100 transition-colors"
            aria-label="Not today"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          {/* Time-aware greeting */}
          <div className="pr-12">
            <p className="text-base text-amber-800 italic font-serif">
              {greeting}
            </p>
          </div>

          {/* Prompt text - serif font, larger, conversational */}
          <div className="space-y-3">
            <p 
              className="text-xl md:text-2xl font-serif text-heritage-brown leading-relaxed"
              style={{ 
                fontSize: '20px', 
                lineHeight: '1.6',
                fontFamily: 'Georgia, "Times New Roman", serif'
              }}
            >
              {prompt.prompt_text}
            </p>

            {/* Context whisper */}
            {prompt.context_note && (
              <p className="text-sm text-gray-600 italic flex items-center gap-2 font-serif">
                <span className="text-base not-italic">✨</span>
                {prompt.context_note}
              </p>
            )}
          </div>

          {/* Action button - prominent */}
          <div className="pt-4">
            <Button
              onClick={handleRecord}
              size="lg"
              className="w-full bg-[#D4A574] hover:bg-[#C09564] text-white font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              style={{ minHeight: '48px', fontSize: '18px' }}
            >
              <Mic className="w-5 h-5 mr-3" />
              Record This Memory
            </Button>
          </div>

          {/* "Not today" text button - gentle, below main action */}
          <div className="text-center">
            <button
              onClick={handleDismiss}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors underline decoration-dotted"
            >
              Not today
            </button>
          </div>

          {/* Subtle quality indicator for Tier 3 prompts */}
          {prompt.tier === 3 && (
            <div className="text-xs text-amber-700 text-center pt-2 italic font-serif border-t border-amber-200/50">
              This question was crafted especially for you
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
