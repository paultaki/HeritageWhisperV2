import { SEO_CONFIG } from '../config';

export type OrganizationSchema = {
  '@context': 'https://schema.org';
  '@type': 'Organization';
  name: string;
  legalName?: string;
  url: string;
  logo: string;
  description?: string;
  foundingDate?: string;
  sameAs?: string[];
};

/**
 * Generate Organization JSON-LD structured data.
 */
export function generateOrganizationSchema(): OrganizationSchema {
  const { organization } = SEO_CONFIG;

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: organization.name,
    legalName: organization.legalName,
    url: organization.url,
    logo: organization.logoUrl,
    description: organization.description,
    foundingDate: organization.foundingDate,
    sameAs: organization.sameAs,
  };
}
