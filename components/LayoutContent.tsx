"use client";

import { usePathname } from "next/navigation";

export default function LayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isBookPage = pathname === "/book";

  // Book page has no navigation sidebar, so no left padding needed
  // Also remove bottom padding since it has its own navigation
  return (
    <div className={isBookPage ? "" : "md:pl-28 pb-20 md:pb-0"}>
      {children}
    </div>
  );
}
