"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Entry = { id: string; label: string; count: number };

export function useDecadeSync(entries: Entry[]) {
  const [activeId, setActiveId] = useState(entries[0]?.id);
  const mapping = useMemo(
    () => new Map(entries.map((e) => [e.id, e])),
    [entries],
  );
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const options: IntersectionObserverInit = {
      root: null,
      rootMargin: "-40% 0px -50% 0px",
      threshold: [0, 1],
    };
    const obs = new IntersectionObserver((io) => {
      let current = activeId;
      for (const e of io) {
        if (e.isIntersecting) current = e.target.id;
      }
      if (current && current !== activeId) setActiveId(current);
    }, options);
    observerRef.current = obs;

    entries.forEach((e) => {
      const n = document.getElementById(e.id);
      if (n) obs.observe(n);
    });

    return () => obs.disconnect();
  }, [entries, activeId]);

  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    el.scrollIntoView({
      behavior: prefersReduced ? "auto" : "smooth",
      block: "start",
    });
  };

  return { activeId, scrollToId, mapping };
}
