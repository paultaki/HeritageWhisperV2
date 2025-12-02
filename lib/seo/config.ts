/**
 * SEO Configuration
 *
 * Central configuration for all SEO-related settings.
 * Toggle `indexingEnabled` to true when ready to go live.
 */

export const SEO_CONFIG = {
  /**
   * Master toggle for search engine indexing.
   * Set to `true` when ready to launch and be indexed by Google.
   */
  indexingEnabled: false,

  /** Production site URL (no trailing slash) */
  siteUrl: 'https://heritagewhisper.com',

  /** Default page title for the home page */
  defaultTitle: 'HeritageWhisper - Preserve Your Life Stories',

  /** Title template for child pages. %s is replaced with page title */
  titleTemplate: '%s | HeritageWhisper',

  /** Default meta description */
  defaultDescription:
    'A voice-powered storytelling platform for seniors to capture and share life memories with family. Record unlimited stories, Whisper Storyteller transcribes, family listens anywhere.',

  /** Default OG image path (relative to public/) */
  defaultOgImage: '/og/default.png',

  /** Organization info for structured data */
  organization: {
    name: 'HeritageWhisper',
    legalName: 'Heritage Whisper LLC',
    url: 'https://heritagewhisper.com',
    logoUrl: 'https://heritagewhisper.com/logo.png',
    description:
      'Voice-powered storytelling platform for preserving family memories through voice recording.',
    foundingDate: '2024',
    sameAs: [] as string[],
  },

  /** Product info for SoftwareApplication schema */
  product: {
    name: 'HeritageWhisper',
    description:
      'Record, transcribe, and share family stories with voice-powered storytelling. Preserve your family legacy forever.',
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Web',
    priceRange: 'Free - $79/year',
  },
} as const;

// Convenience exports for common imports
export const { indexingEnabled, siteUrl, defaultTitle, titleTemplate, defaultDescription } =
  SEO_CONFIG;
