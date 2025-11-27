import type { Metadata } from 'next';
import { SEO_CONFIG } from './config';

export type BuildPageMetadataOptions = {
  /** Page title (will be combined with title template) */
  title: string;
  /** Meta description for the page */
  description: string;
  /** URL path (e.g., '/help' or '/guides/recording-family-stories') */
  path?: string;
  /** Relative path to OG image (e.g., '/og/help.png'). Defaults to /og/default.png */
  ogImageRelativePath?: string;
  /** Open Graph type. Defaults to 'website' */
  ogType?: 'website' | 'article';
  /** Override robots (defaults to global indexingEnabled setting) */
  noIndex?: boolean;
};

/**
 * Build consistent metadata for any page.
 *
 * @example
 * export const metadata = buildPageMetadata({
 *   title: 'Help & FAQ',
 *   description: 'Get answers about HeritageWhisper.',
 *   path: '/help',
 * });
 */
export function buildPageMetadata(options: BuildPageMetadataOptions): Metadata {
  const {
    title,
    description,
    path = '',
    ogImageRelativePath = SEO_CONFIG.defaultOgImage,
    ogType = 'website',
    noIndex,
  } = options;

  const canonicalUrl = `${SEO_CONFIG.siteUrl}${path}`;
  const ogImageUrl = `${SEO_CONFIG.siteUrl}${ogImageRelativePath}`;

  // Use page-level noIndex override, or fall back to global indexingEnabled
  const shouldNoIndex = noIndex !== undefined ? noIndex : !SEO_CONFIG.indexingEnabled;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: !shouldNoIndex,
      follow: !shouldNoIndex,
      googleBot: {
        index: !shouldNoIndex,
        follow: !shouldNoIndex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: ogType,
      url: canonicalUrl,
      title,
      description,
      siteName: SEO_CONFIG.organization.name,
      locale: 'en_US',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  };
}
