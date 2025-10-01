import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import NavigationWrapper from "@/components/NavigationWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HeritageWhisper - Preserve Your Life Stories",
  description: "An AI-powered storytelling platform for seniors to capture and share life memories with family.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <NavigationWrapper />
          <div className="md:pl-20 pb-20 md:pb-0">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}