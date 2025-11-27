import { JsonLd } from './JsonLd';
import { generateOrganizationSchema } from '../schema/organization';

/**
 * Renders Organization JSON-LD structured data.
 * Include in root layout for sitewide presence.
 */
export function OrganizationSchema() {
  return <JsonLd data={generateOrganizationSchema()} />;
}
