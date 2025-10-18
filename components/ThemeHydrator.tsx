"use client";

import { useEffect } from "react";

export default function ThemeHydrator() {
  useEffect(() => {
    try {
      const stored = localStorage.getItem("hw-theme");
      const isDark = stored ? stored === "dark" : false;
      if (isDark) {
        document.documentElement.classList.add("dark");
        document.body.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
        document.body.classList.remove("dark");
      }
      window.dispatchEvent(new CustomEvent("hw-theme-change", { detail: { isDark } }));
    } catch {
      // no-op
    }
  }, []);

  return null;
}


