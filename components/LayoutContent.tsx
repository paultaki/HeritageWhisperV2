"use client";

import { usePathname } from "next/navigation";

export default function LayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Interview-chat page handles its own bottom spacing (ChatInput sticks above nav)
  // All other pages need bottom padding to prevent content from being hidden behind nav bar
  const isInterviewChat = pathname === '/interview-chat';

  return (
    <div className={isInterviewChat ? '' : 'pb-20 md:pb-20'}>
      {children}
    </div>
  );
}
