import { MetadataRoute } from 'next';
import { indexingEnabled, siteUrl } from '@/lib/seo/config';

/**
 * Dynamic robots.txt generation.
 * Respects the global `indexingEnabled` flag.
 *
 * When indexingEnabled is false: blocks all crawling.
 * When indexingEnabled is true: allows public pages, blocks app routes.
 */
export default function robots(): MetadataRoute.Robots {
  // Block all crawling when indexing is disabled
  if (!indexingEnabled) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    };
  }

  // Production rules: allow public pages, block authenticated/app routes
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/api/',
        '/timeline',
        '/book',
        '/book-new',
        '/recording',
        '/recording-v2',
        '/profile',
        '/memory-box',
        '/family',
        '/auth/',
        '/upgrade',
        '/prompts',
        '/chapters',
        '/chapters-v2',
        '/interview-chat',
        '/interview-chat-v2',
        '/review',
        '/test-rate-limit',
        '/sentry-example-page',
        '/design-demo',
        '/landing-v2',
        '/unsubscribe',
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
