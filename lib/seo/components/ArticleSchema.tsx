import { JsonLd } from './JsonLd';
import { generateArticleSchema, type ArticleSchemaOptions } from '../schema/article';

type ArticleSchemaProps = ArticleSchemaOptions;

/**
 * Renders Article JSON-LD structured data.
 * Include on blog posts, guides, and content pages.
 *
 * @example
 * <ArticleSchema
 *   title="How to Record Family Stories"
 *   description="Complete guide to preserving family memories."
 *   url="https://heritagewhisper.com/guides/recording-family-stories"
 *   datePublished="2025-01-15"
 * />
 */
export function ArticleSchema(props: ArticleSchemaProps) {
  return <JsonLd data={generateArticleSchema(props)} />;
}
