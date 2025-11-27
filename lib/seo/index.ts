// Config
export { SEO_CONFIG, indexingEnabled, siteUrl, defaultTitle, titleTemplate, defaultDescription } from './config';

// Metadata builder
export { buildPageMetadata, type BuildPageMetadataOptions } from './metadata';

// Schema generators
export {
  generateOrganizationSchema,
  generateProductSchema,
  generateArticleSchema,
  type ArticleSchemaOptions,
} from './schema';

// Schema types (renamed to avoid collision with components)
export type {
  OrganizationSchema as OrganizationSchemaType,
  SoftwareApplicationSchema as SoftwareApplicationSchemaType,
  ArticleSchema as ArticleSchemaType,
} from './schema';

// Components
export { JsonLd } from './components/JsonLd';
export { OrganizationSchema } from './components/OrganizationSchema';
export { ProductSchema } from './components/ProductSchema';
export { ArticleSchema } from './components/ArticleSchema';
