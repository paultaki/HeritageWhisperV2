"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./queryClient";
import { useRouter } from "next/navigation";
import type { User } from "./supabase";
import { supabase } from "./supabase";
import type { Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, birthYear: number) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);

  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Initialize and monitor Supabase session
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      // Refetch user data when auth state changes
      if (session) {
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      } else {
        // Clear user data when session is null (logged out)
        queryClient.setQueryData(["/api/auth/me"], null);
      }
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      // Authenticate with backend - it will return JWT tokens
      const res = await apiRequest("POST", "/api/auth/login", { email, password });
      const data = await res.json();

      // Backend now returns real Supabase session for all users
      if (data.session) {
        console.log('[Auth] Backend returned Supabase session');
      }

      return data;
    },
    onSuccess: async (data) => {
      if (data.session) {
        console.log('[Auth] Successfully authenticated with Supabase');
        // Set the Supabase session - this works now because it's a real Supabase session
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        });
        setSession(data.session);
      } else {
        console.warn('[Auth] No session returned from login');
      }

      // Set the user data immediately (no need to invalidate, we're setting it directly)
      queryClient.setQueryData(["/api/auth/me"], data);

      // Poll for session availability before navigating
      // This ensures Supabase storage has been updated
      console.log('[Auth] Waiting for session to be available in storage...');
      let sessionReady = false;
      for (let attempt = 0; attempt < 20; attempt++) {
        const { data: { session: checkSession } } = await supabase.auth.getSession();
        if (checkSession?.access_token) {
          console.log(`[Auth] Session confirmed available after ${attempt * 50}ms`);
          sessionReady = true;
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      if (!sessionReady) {
        console.error('[Auth] Session not available after 1000ms, proceeding anyway');
      }

      // Now navigate to timeline - session should be available
      router.push("/timeline");
    },
  });

  const registerMutation = useMutation({
    mutationFn: async ({ email, password, name, birthYear }: { email: string; password: string; name: string; birthYear: number }) => {
      // Register with backend - it will return JWT tokens
      const res = await apiRequest("POST", "/api/auth/register", { email, password, name, birthYear });
      const data = await res.json();

      // Backend returns real Supabase session for new users
      if (data.session) {
        console.log('[Auth] Backend returned Supabase session for new user');
      }

      return data;
    },
    onSuccess: async (data) => {
      // Check if email confirmation is required
      if (data.requiresEmailConfirmation) {
        console.log('[Auth] Email confirmation required');
        // Store user data for later use
        queryClient.setQueryData(["/api/auth/pending-confirmation"], data);
        // Redirect to a page that shows "check your email" message with email param
        const email = data.user?.email || '';
        router.push(`/auth/check-email?email=${encodeURIComponent(email)}`);
        return;
      }

      if (data.session) {
        console.log('[Auth] Successfully registered with Supabase');
        // Set the Supabase session - this works now because it's a real Supabase session
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        });
        setSession(data.session);
      } else {
        console.warn('[Auth] No session returned from registration');
      }

      // Set the user data immediately (no need to invalidate, we're setting it directly)
      queryClient.setQueryData(["/api/auth/me"], data);

      // Poll for session availability before navigating
      // This ensures Supabase storage has been updated
      console.log('[Auth] Waiting for session to be available in storage...');
      let sessionReady = false;
      for (let attempt = 0; attempt < 20; attempt++) {
        const { data: { session: checkSession } } = await supabase.auth.getSession();
        if (checkSession?.access_token) {
          console.log(`[Auth] Session confirmed available after ${attempt * 50}ms`);
          sessionReady = true;
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      if (!sessionReady) {
        console.error('[Auth] Session not available after 1000ms, proceeding anyway');
      }

      // Now navigate to timeline - session should be available
      router.push("/timeline");
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Sign out from Supabase first
      await supabase.auth.signOut();
      // Then clear backend session
      await apiRequest("POST", "/api/auth/logout", {});
    },
    onSuccess: () => {
      // Clear the session state
      setSession(null);
      // Clear all cached queries
      queryClient.clear();
      // Navigate to login
      router.push("/auth/login");
    },
  });

  const login = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password });
  };

  const register = async (email: string, password: string, name: string, birthYear: number) => {
    await registerMutation.mutateAsync({ email, password, name, birthYear });
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  return (
    <AuthContext.Provider
      value={{
        user: (user as any)?.user || null,
        session,
        login,
        register,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}