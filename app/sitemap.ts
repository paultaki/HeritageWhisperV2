import { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/seo/config';

/**
 * Next.js Sitemap for HeritageWhisper
 * Includes all public, SEO-indexable pages
 * Excludes authenticated-only pages (timeline, book, etc.)
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    // Landing Page
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },

    // Help & Legal Pages
    {
      url: `${siteUrl}/help`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },

    // Gift Page
    {
      url: `${siteUrl}/gift-plans`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },

    // Guides - SEO Content Pages
    {
      url: `${siteUrl}/guides`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/guides/recording-family-stories`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/guides/questions-for-grandparents`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/guides/urgent-story-preservation`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/guides/recording-dying-parent-stories`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },

    // Alternatives - Comparison Pages
    {
      url: `${siteUrl}/alternatives`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/alternatives/storyworth-alternatives`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/alternatives/heritagewhisper-vs-storyworth`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },

    // Features Pages (placeholder for future)
    {
      url: `${siteUrl}/features`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];
}
