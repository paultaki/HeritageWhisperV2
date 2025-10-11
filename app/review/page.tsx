"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ReviewRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // If there's a nav parameter, this is coming from recording
    // If there's an edit parameter, redirect to that story
    const editId = searchParams.get("edit");
    const navId = searchParams.get("nav");

    if (editId) {
      // Redirect to book-style route with edit mode
      router.replace(`/review/book-style?edit=${editId}`);
    } else if (navId) {
      // This is a new story from recording, redirect to book-style route
      router.replace(`/review/book-style?nav=${navId}`);
    } else {
      // No parameters, redirect to timeline
      router.replace("/timeline");
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

export default function ReviewRedirect() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <ReviewRedirectContent />
    </Suspense>
  );
}
