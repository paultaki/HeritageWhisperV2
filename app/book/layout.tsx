"use client";

import { useEffect, type ReactNode } from "react";

function UseLockedBodyForBook() {
  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    // 1. Make sure the book is fully in view BEFORE locking
    window.scrollTo(0, 0);

    // 2. Lock body/html while we are on the Book route
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    // 3. Cleanup when navigating away from Book
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  return null;
}

export default function BookLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <UseLockedBodyForBook />
      {children}
    </>
  );
}
