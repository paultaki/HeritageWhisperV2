import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./styles/memory-overlay.css";
import { Providers } from "./providers";
import NavigationWrapper from "@/components/NavigationWrapper";
import GlassNavWrapper from "@/components/GlassNavWrapper";
import AgreementGuard from "@/components/AgreementGuard";
import LayoutContent from "@/components/LayoutContent";
import DarkModeCleanup from "@/components/DarkModeCleanup";
import { OrganizationSchema } from "@/lib/seo/components/OrganizationSchema";
import { Analytics } from "@vercel/analytics/next";
import {
  SEO_CONFIG,
  indexingEnabled,
  siteUrl,
  defaultTitle,
  titleTemplate,
  defaultDescription,
} from "@/lib/seo/config";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultTitle,
    template: titleTemplate,
  },
  description: defaultDescription,
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
    index: indexingEnabled,
    follow: indexingEnabled,
    googleBot: {
      index: indexingEnabled,
      follow: indexingEnabled,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    title: defaultTitle,
    description: defaultDescription,
    siteName: SEO_CONFIG.organization.name,
    images: [
      {
        url: `${siteUrl}${SEO_CONFIG.defaultOgImage}`,
        width: 1200,
        height: 630,
        alt: defaultTitle,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
    images: [`${siteUrl}${SEO_CONFIG.defaultOgImage}`],
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
        <OrganizationSchema />
        <Providers>
          <AgreementGuard>
            <DarkModeCleanup />
            <NavigationWrapper />
            <GlassNavWrapper />
            <LayoutContent>{children}</LayoutContent>
          </AgreementGuard>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
