"use client";

import { usePathname } from "next/navigation";

export default function LayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Interview-chat and book pages handle their own bottom spacing
  // All other pages need bottom padding to prevent content from being hidden behind nav bar
  const isInterviewChat = pathname === '/interview-chat';
  const isBookPage = pathname === '/book' || pathname.startsWith('/book/');

  return (
    <div className={(isInterviewChat || isBookPage) ? '' : 'pb-20 md:pb-20'}>
      {children}
    </div>
  );
}
