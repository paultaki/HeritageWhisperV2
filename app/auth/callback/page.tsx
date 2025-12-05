"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";

// Prevent static generation for this auth callback page
export const dynamic = 'force-dynamic';

export default function AuthCallback() {
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check URL parameters to determine auth type
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const type = hashParams.get('type');

        // Get the session from the URL hash
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting session:", error);
          router.push("/auth/login?error=callback_failed");
          return;
        }

        if (!session) {
          console.error("No session found");
          router.push("/auth/login?error=no_session");
          return;
        }

        // Clear any existing family_session cookie to prevent viewing mode conflict
        // This ensures the user sees their own account after logging in, not a stale family view
        document.cookie = "family_session=; path=/; max-age=0; SameSite=Strict";

        // Also clear the localStorage context to force fresh state
        localStorage.removeItem('hw_active_storyteller_context');

        // Invalidate queries to fetch fresh user data
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });

        // Wait for the backend to process the new user and ensure database is synced
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Route based on auth type
        if (type === 'recovery') {
          // Password reset - go to reset password page
          router.push("/auth/reset-password");
        } else {
          // Email confirmation or other - go to timeline
          // New users already provided birth year and accepted agreements at signup
          router.push("/timeline");
        }
      } catch (error) {
        console.error("Callback error:", error);
        router.push("/auth/login?error=callback_error");
      }
    };

    handleCallback();
  }, [router, queryClient]);

  return (
    <div className="hw-page flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-lg text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}
