"use client";

import { usePathname } from "next/navigation";

export default function LayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // All pages now have bottom navigation
  // Book page needs special handling for progress bar
  return (
    <div className="pb-20 md:pb-20">
      {children}
    </div>
  );
}
