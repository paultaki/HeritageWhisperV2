import { JsonLd } from './JsonLd';
import { generateProductSchema } from '../schema/product';

/**
 * Renders SoftwareApplication JSON-LD structured data.
 * Include on landing page or product pages.
 */
export function ProductSchema() {
  return <JsonLd data={generateProductSchema()} />;
}
