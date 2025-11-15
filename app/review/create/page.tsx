"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ReviewCreateRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const navId = searchParams.get("nav");
    if (navId) {
      // Redirect to book-style route with nav parameter
      router.replace(`/review/book-style?nav=${navId}`);
    } else {
      router.replace("/timeline");
    }
  }, [router, searchParams]);

  return (
    <div className="hw-page flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-coral-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading your new memory...</p>
      </div>
    </div>
  );
}

export default function ReviewCreateRedirect() {
  return (
    <Suspense
      fallback={
        <div className="hw-page flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-coral-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <ReviewCreateRedirectContent />
    </Suspense>
  );
}
