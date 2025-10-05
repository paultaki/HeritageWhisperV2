"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";

export default function AuthCallback() {
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the session from the URL hash
        const { data: { session }, error } = await supabase.auth.getSession();

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

        // Invalidate queries to fetch fresh user data
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });

        // Wait for the backend to process the new user and ensure database is synced
        await new Promise(resolve => setTimeout(resolve, 1000));

        // After email confirmation, always go to timeline
        // New users already provided birth year and accepted agreements at signup
        router.push("/timeline");
      } catch (error) {
        console.error("Callback error:", error);
        router.push("/auth/login?error=callback_error");
      }
    };

    handleCallback();
  }, [router, queryClient]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-lg text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}
