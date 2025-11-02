import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Print Preview - HeritageWhisper",
  description: "Print-optimized book layout",
};

export default function PrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
