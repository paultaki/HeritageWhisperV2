"use client";

import { usePathname } from "next/navigation";
import { useBookFullscreen } from "@/hooks/use-book-fullscreen";

export default function LayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isFullscreen } = useBookFullscreen();

  const isBookPage = pathname === "/book";
  const shouldRemovePadding = isBookPage && isFullscreen;

  return (
    <div
      className="transition-all duration-300 ease-in-out"
      style={{
        paddingLeft: shouldRemovePadding ? "0" : undefined,
        paddingBottom: shouldRemovePadding ? "0" : undefined,
      }}
    >
      <div className={shouldRemovePadding ? "" : "md:pl-28 pb-20 md:pb-0"}>
        {children}
      </div>
    </div>
  );
}
