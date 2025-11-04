import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./styles/memory-overlay.css";
import "./styles/timeline-v2.css";
import { Providers } from "./providers";
import NavigationWrapper from "@/components/NavigationWrapper";
import AgreementGuard from "@/components/AgreementGuard";
import LayoutContent from "@/components/LayoutContent";
import DarkModeCleanup from "@/components/DarkModeCleanup";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HeritageWhisper - Preserve Your Life Stories",
  description:
    "An AI-powered storytelling platform for seniors to capture and share life memories with family.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Mobile viewport with safe-area support */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />

        {/* Preload critical fonts for book view */}
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Crimson+Text:wght@400;600&display=swap"
          as="style"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Crimson+Text:wght@400;600&display=swap"
        />
      </head>
      <body className={inter.className}>
        <Providers>
          <AgreementGuard>
            <DarkModeCleanup />
            <NavigationWrapper />
            <LayoutContent>{children}</LayoutContent>
          </AgreementGuard>
        </Providers>
      </body>
    </html>
  );
}
