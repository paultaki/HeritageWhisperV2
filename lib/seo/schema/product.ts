import { SEO_CONFIG } from '../config';

export type SoftwareApplicationSchema = {
  '@context': 'https://schema.org';
  '@type': 'SoftwareApplication';
  name: string;
  description: string;
  applicationCategory: string;
  operatingSystem: string;
  url: string;
  offers: {
    '@type': 'AggregateOffer';
    priceCurrency: string;
    lowPrice: string;
    highPrice: string;
    offerCount: number;
  };
};

/**
 * Generate SoftwareApplication JSON-LD structured data for HeritageWhisper.
 */
export function generateProductSchema(): SoftwareApplicationSchema {
  const { product, siteUrl } = SEO_CONFIG;

  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: product.name,
    description: product.description,
    applicationCategory: product.applicationCategory,
    operatingSystem: product.operatingSystem,
    url: siteUrl,
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'USD',
      lowPrice: '0',
      highPrice: '79',
      offerCount: 2,
    },
  };
}
