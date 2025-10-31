"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./queryClient";
import { useRouter } from "next/navigation";
import type { User } from "./supabase";
import { supabase } from "./supabase";
import type { Session } from "@supabase/supabase-js";
import { useActivityTracker } from "@/hooks/useActivityTracker";
import { SessionTimeoutWarning } from "@/components/SessionTimeoutWarning";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<any>;
  register: (
    email: string,
    password: string,
    name: string,
    birthYear: number,
  ) => Promise<void>;
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

  // Handle logout on browser close if "Remember Me" is disabled
  useEffect(() => {
    const handleBeforeUnload = () => {
      const rememberMe = localStorage.getItem('rememberMe');
      // Only clear sessionActive flag, actual logout happens on next page load
      if (rememberMe === 'false') {
        sessionStorage.removeItem('sessionActive');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Initialize and monitor Supabase session
  useEffect(() => {
    // Check "Remember Me" preference and handle session persistence
    const checkSessionPersistence = async () => {
      const rememberMe = localStorage.getItem('rememberMe');
      const sessionActive = sessionStorage.getItem('sessionActive');
      
      // If "Remember Me" is disabled and this is a new browser session (sessionActive is missing)
      // then the user closed their browser and we should logout
      if (rememberMe === 'false' && !sessionActive) {
        console.log('[Auth] Remember Me disabled - clearing session on browser reopen');
        await supabase.auth.signOut();
        return;
      }
      
      // Mark this browser tab session as active
      if (rememberMe === 'false') {
        sessionStorage.setItem('sessionActive', 'true');
      }
    };
    
    checkSessionPersistence();
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      // Refetch user data when auth state changes
      if (session) {
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        
        // If "Remember Me" is unchecked, track session in sessionStorage
        const rememberMe = localStorage.getItem('rememberMe');
        if (rememberMe === 'false') {
          sessionStorage.setItem('sessionActive', 'true');
        }
      } else {
        // Clear user data when session is null (logged out)
        queryClient.setQueryData(["/api/auth/me"], null);
      }
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  const loginMutation = useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      // Authenticate with backend - it will return JWT tokens
      const res = await apiRequest("POST", "/api/auth/login", {
        email,
        password,
      });
      const data = await res.json();

      // Backend now returns real Supabase session for all users
      if (data.session) {
        console.log("[Auth] Backend returned Supabase session");
      }

      return data;
    },
    onSuccess: async (data) => {
      if (data.session) {
        console.log("[Auth] Successfully authenticated with Supabase");
        // Set the Supabase session - this works now because it's a real Supabase session
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
        setSession(data.session);
      } else {
        console.warn("[Auth] No session returned from login");
      }

      // Set the user data immediately (no need to invalidate, we're setting it directly)
      queryClient.setQueryData(["/api/auth/me"], data);

      // Poll for session availability before navigating
      // This ensures Supabase storage has been updated
      console.log("[Auth] Waiting for session to be available in storage...");
      let sessionReady = false;
      for (let attempt = 0; attempt < 20; attempt++) {
        const {
          data: { session: checkSession },
        } = await supabase.auth.getSession();
        if (checkSession?.access_token) {
          console.log(
            `[Auth] Session confirmed available after ${attempt * 50}ms`,
          );
          sessionReady = true;
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      if (!sessionReady) {
        console.error(
          "[Auth] Session not available after 1000ms, proceeding anyway",
        );
      }

      // Note: Navigation is handled by the calling component
      // (login page checks for passkey prompt first)
    },
  });

  const registerMutation = useMutation({
    mutationFn: async ({
      email,
      password,
      name,
      birthYear,
    }: {
      email: string;
      password: string;
      name: string;
      birthYear: number;
    }) => {
      // Register with backend - it will return JWT tokens
      const res = await apiRequest("POST", "/api/auth/register", {
        email,
        password,
        name,
        birthYear,
      });
      const data = await res.json();

      // Backend returns real Supabase session for new users
      if (data.session) {
        console.log("[Auth] Backend returned Supabase session for new user");
      }

      return data;
    },
    onSuccess: async (data) => {
      // Check if email confirmation is required
      if (data.requiresEmailConfirmation) {
        console.log("[Auth] Email confirmation required");
        // Store user data for later use
        queryClient.setQueryData(["/api/auth/pending-confirmation"], data);
        // Redirect to a page that shows "check your email" message with email param
        const email = data.user?.email || "";
        router.push(`/auth/check-email?email=${encodeURIComponent(email)}`);
        return;
      }

      if (data.session) {
        console.log("[Auth] Successfully registered with Supabase");
        // Set the Supabase session - this works now because it's a real Supabase session
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
        setSession(data.session);
      } else {
        console.warn("[Auth] No session returned from registration");
      }

      // Set the user data immediately (no need to invalidate, we're setting it directly)
      queryClient.setQueryData(["/api/auth/me"], data);

      // Poll for session availability before navigating
      // This ensures Supabase storage has been updated
      console.log("[Auth] Waiting for session to be available in storage...");
      let sessionReady = false;
      for (let attempt = 0; attempt < 20; attempt++) {
        const {
          data: { session: checkSession },
        } = await supabase.auth.getSession();
        if (checkSession?.access_token) {
          console.log(
            `[Auth] Session confirmed available after ${attempt * 50}ms`,
          );
          sessionReady = true;
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      if (!sessionReady) {
        console.error(
          "[Auth] Session not available after 1000ms, proceeding anyway",
        );
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
      
      // Only clear saved email if "Remember Me" is NOT checked
      if (typeof window !== 'undefined') {
        const rememberMe = localStorage.getItem('rememberMe');
        
        // If "Remember Me" is unchecked (false or null), clear everything
        if (rememberMe !== 'true') {
          localStorage.removeItem('savedEmail');
          localStorage.removeItem('rememberMe');
        }
        // If "Remember Me" IS checked (true), keep both savedEmail and rememberMe
        // so the email persists for next login
      }
      
      // Navigate to login
      router.push("/auth/login");
    },
  });

  const login = async (email: string, password: string) => {
    const result = await loginMutation.mutateAsync({ email, password });
    return result;
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    birthYear: number,
  ) => {
    await registerMutation.mutateAsync({ email, password, name, birthYear });
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  // Activity tracking for session timeout (only when Remember Me is disabled)
  const [rememberMe, setRememberMe] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('rememberMe') === 'true';
    }
    return true; // Default to true (no timeout) if window is not available
  });

  // Update rememberMe state when session changes
  useEffect(() => {
    if (typeof window !== 'undefined' && session) {
      const stored = localStorage.getItem('rememberMe') === 'true';
      setRememberMe(stored);
    }
  }, [session]);
  
  const shouldTrackActivity = useMemo(
    () => !!session && !rememberMe,
    [session, rememberMe]
  );

  // Memoize callbacks to prevent re-initialization of activity tracker
  const handleTimeout = useCallback(() => {
    console.log('[Auth] Session timed out due to inactivity');
    logout();
  }, [logout]);

  const handleTimeoutLogout = useCallback(() => {
    console.log('[Auth] User logged out from timeout warning');
    logout();
  }, [logout]);

  const activityTracker = useActivityTracker({
    enabled: shouldTrackActivity,
    timeoutDuration: 30 * 60 * 1000, // 30 minutes
    warningDuration: 5 * 60 * 1000, // 5 minutes
    onTimeout: handleTimeout,
  });

  // Handle continue session - use resetTimer directly to avoid recreating callback
  const handleContinueSession = useCallback(() => {
    console.log('[Auth] User chose to continue session');
    activityTracker.resetTimer();
  }, [activityTracker.resetTimer]); // Only depend on the function, not the whole object

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
      
      {/* Session timeout warning modal */}
      {shouldTrackActivity && (
        <SessionTimeoutWarning
          isOpen={activityTracker.isWarning}
          secondsRemaining={activityTracker.secondsRemaining}
          onContinue={handleContinueSession}
          onLogout={handleTimeoutLogout}
        />
      )}
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
