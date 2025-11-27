import { SEO_CONFIG } from '../config';

export type ArticleSchemaOptions = {
  title: string;
  description: string;
  url: string;
  authorName?: string;
  datePublished?: string;
  dateModified?: string;
  imageUrl?: string;
};

export type ArticleSchema = {
  '@context': 'https://schema.org';
  '@type': 'Article';
  headline: string;
  description: string;
  url: string;
  author: {
    '@type': 'Organization' | 'Person';
    name: string;
  };
  publisher: {
    '@type': 'Organization';
    name: string;
    logo: {
      '@type': 'ImageObject';
      url: string;
    };
  };
  datePublished: string;
  dateModified: string;
  mainEntityOfPage: {
    '@type': 'WebPage';
    '@id': string;
  };
  image?: string;
};

/**
 * Generate Article JSON-LD structured data.
 */
export function generateArticleSchema(options: ArticleSchemaOptions): ArticleSchema {
  const { title, description, url, authorName, datePublished, dateModified, imageUrl } = options;

  const { organization } = SEO_CONFIG;
  const publishedDate = datePublished || new Date().toISOString().split('T')[0];

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    url,
    author: {
      '@type': authorName ? 'Person' : 'Organization',
      name: authorName || organization.name,
    },
    publisher: {
      '@type': 'Organization',
      name: organization.name,
      logo: {
        '@type': 'ImageObject',
        url: organization.logoUrl,
      },
    },
    datePublished: publishedDate,
    dateModified: dateModified || publishedDate,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    ...(imageUrl && { image: imageUrl }),
  };
}
