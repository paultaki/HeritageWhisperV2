"use client";

import { useEffect } from "react";
import { cleanupDarkModeArtifacts } from "@/lib/cleanupDarkMode";

export default function DarkModeCleanup() {
  useEffect(() => {
    // Clean up any remaining dark mode artifacts from previous versions
    cleanupDarkModeArtifacts();
  }, []);

  return null;
}


