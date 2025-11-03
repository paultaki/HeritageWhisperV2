"use client";

import { useAuth } from "@/lib/auth";
import MobileBookViewV2 from "./components/MobileBookViewV2";
import { Caveat } from "next/font/google";

const caveat = Caveat({
  subsets: ["latin"],
  display: "swap",
});

export default function BookNewPage() {
  const { user, isLoading } = useAuth();

  console.log('[BookNewPage] Render - isLoading:', isLoading, 'user:', !!user);

  // Show loading state while checking auth
  if (isLoading) {
    console.log('[BookNewPage] Showing loading state');
    return (
      <div className="flex h-[100dvh] w-screen items-center justify-center bg-neutral-950">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white"></div>
          <p className="text-sm text-white/60">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show nothing (auth guard will redirect)
  if (!user) {
    console.log('[BookNewPage] No user, showing auth check state');
    return (
      <div className="flex h-[100dvh] w-screen items-center justify-center bg-neutral-950">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white"></div>
          <p className="text-sm text-white/60">Checking authentication...</p>
        </div>
      </div>
    );
  }

  console.log('[BookNewPage] Rendering MobileBookViewV2');
  return (
    <div className="relative h-[100dvh] w-screen overflow-hidden bg-neutral-950">
      <MobileBookViewV2 caveatFont={caveat.className} />
    </div>
  );
}
