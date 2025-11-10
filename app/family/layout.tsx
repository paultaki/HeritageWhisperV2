import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Family Stories - HeritageWhisper",
  description: "View family member's life stories",
};

export default function FamilyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Family routes use their own navigation (guest nav in timeline/book)
  // Don't include NavigationWrapper or GlassNavWrapper from root layout
  return <>{children}</>;
}
