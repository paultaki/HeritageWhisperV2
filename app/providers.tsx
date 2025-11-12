"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { AuthProvider } from "@/lib/auth";
import { getQueryFn } from "@/lib/queryClient";
import { RecordingProvider } from "@/contexts/RecordingContext";
import { Toaster } from "@/components/ui/toaster";
import { AccountContextProvider } from "@/hooks/use-account-context";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes (was cacheTime)
            queryFn: getQueryFn({ on401: "throw" }),
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AccountContextProvider>
          <RecordingProvider>
            {children}
            <Toaster />
          </RecordingProvider>
        </AccountContextProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
