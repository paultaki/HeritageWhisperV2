"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Crown } from "lucide-react";
import { useState, useEffect } from "react";

interface PaywallPromptCardProps {
  onSubscribe: () => void;
  onDismiss: () => void;
}

interface Prompt {
  id: string | null;
  prompt_text: string;
  context_note: string | null;
  tier: number;
  anchor_year?: number;
}

export function PaywallPromptCard({ onSubscribe, onDismiss }: PaywallPromptCardProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  // Check localStorage for dismissal
  useEffect(() => {
    const dismissed = localStorage.getItem("paywallPromptDismissed");
    if (dismissed === "true") {
      setIsDismissed(true);
    }
  }, []);

  // Fetch the best prompt (should be the unlocked Story 3 Tier 3 prompt)
  const { data, isLoading } = useQuery<{ prompt: Prompt | null }>({
    queryKey: ["/api/prompts/next"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const prompt = data?.prompt;

  const handleDismiss = () => {
    localStorage.setItem("paywallPromptDismissed", "true");
    setIsDismissed(true);
    onDismiss();
  };

  // Don't show if dismissed or no prompt
  if (isDismissed || isLoading || !prompt) {
    return null;
  }

  // Only show for Tier 3 (milestone) prompts
  if (prompt.tier !== 3) {
    return null;
  }

  // Extract years from context if available
  const contextYears = prompt.context_note?.match(/\d{4}/g) || [];

  return (
    <div className="transition-all duration-500 ease-out">
      <Card className="bg-gradient-to-br from-amber-100 via-orange-50 to-yellow-50 border-3 border-amber-300 shadow-2xl relative overflow-hidden">
        {/* Decorative sparkle effect */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-300/30 to-transparent rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-orange-300/20 to-transparent rounded-full blur-2xl"></div>

        <CardContent className="p-8 space-y-6 relative z-10">
          {/* Header with premium badge */}
          <div className="flex items-center justify-center gap-3 mb-2">
            <Crown className="w-8 h-8 text-amber-600" />
            <h3 className="text-2xl font-bold text-heritage-brown">
              ✨ YOUR STORY 3 INSIGHT
            </h3>
          </div>

          {/* The best prompt */}
          <div className="space-y-3">
            <p className="text-2xl md:text-3xl font-semibold text-heritage-brown leading-relaxed text-center px-4">
              {prompt.prompt_text}
            </p>

            {/* Context note with years */}
            {prompt.context_note && (
              <p className="text-base text-gray-700 text-center flex items-center justify-center gap-2">
                <span className="text-lg">📝</span>
                {prompt.context_note}
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="border-t-2 border-amber-300/50 my-6"></div>

          {/* Value proposition */}
          <div className="space-y-4 text-center">
            <div className="flex items-start justify-center gap-3">
              <Sparkles className="w-6 h-6 text-amber-600 mt-1 flex-shrink-0" />
              <p className="text-lg text-heritage-brown leading-relaxed max-w-xl">
                I've analyzed your first 3 stories and found{" "}
                <span className="font-semibold text-amber-700">3 more specific memories</span>{" "}
                you should record.
              </p>
            </div>

            <p className="text-base text-gray-700 italic">
              Ready to unlock your full story?
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button
              onClick={onSubscribe}
              size="lg"
              className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-lg py-6 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
            >
              <Crown className="w-5 h-5 mr-2" />
              See What I Found - $149/year
            </Button>
          </div>

          <Button
            onClick={handleDismiss}
            variant="ghost"
            className="w-full text-gray-600 hover:text-heritage-brown"
          >
            Maybe later
          </Button>

          {/* Additional benefits teaser */}
          <div className="pt-4 border-t border-amber-200/50">
            <p className="text-sm text-gray-600 text-center">
              Plus: Unlimited stories • Full book export • Share with family
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
