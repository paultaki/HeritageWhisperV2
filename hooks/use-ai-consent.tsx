"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";

interface AIConsentData {
  ai_processing_enabled: boolean;
}

/**
 * Hook to check if the current user has AI processing enabled
 * Provides cached consent status with automatic refetching
 *
 * @returns {
 *   isEnabled: boolean - Whether AI features are enabled (defaults to true)
 *   isLoading: boolean - Whether the consent status is being fetched
 * }
 *
 * @example
 * const { isEnabled, isLoading } = useAIConsent();
 * if (!isLoading && !isEnabled) {
 *   // Show disabled state
 * }
 */
export function useAIConsent() {
  const { session } = useAuth();

  const { data, isLoading } = useQuery<AIConsentData>({
    queryKey: ["/api/user/ai-settings"],
    queryFn: async () => {
      if (!session?.access_token) {
        throw new Error("No session token");
      }

      const response = await fetch("/api/user/ai-settings", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch AI settings");
      }

      return response.json();
    },
    enabled: !!session?.access_token,
    staleTime: 5 * 60 * 1000, // 5 minutes - consent doesn't change often
    retry: 1, // Only retry once on failure
  });

  return {
    isEnabled: data?.ai_processing_enabled ?? true, // Fail-safe default
    isLoading,
  };
}
