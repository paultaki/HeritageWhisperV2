"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";

function ReviewEditRedirectContent() {
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const id = params.id as string;
    if (id) {
      // Redirect to book-style route with edit mode
      router.replace(`/review/book-style?edit=${id}`);
    } else {
      router.replace('/timeline');
    }
  }, [router, params]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-coral-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading your memory...</p>
      </div>
    </div>
  );
}

export default function ReviewEditRedirect() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-coral-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <ReviewEditRedirectContent />
    </Suspense>
  );
}
