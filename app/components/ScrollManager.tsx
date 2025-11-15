"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function ScrollManager() {
  const pathname = usePathname();

  useEffect(() => {
    const scrollRoot = document.querySelector("[data-scroll-root]") as HTMLElement | null;

    const resetScroll = () => {
      if (scrollRoot) {
        scrollRoot.scrollTop = 0;
      } else {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }
    };

    // Double requestAnimationFrame to let iOS Safari / Chrome finish its own layout and history logic
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resetScroll();
      });
    });
  }, [pathname]);

  return null;
}
