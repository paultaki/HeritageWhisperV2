type JsonLdProps = {
  data: Record<string, unknown>;
};

/**
 * Renders JSON-LD structured data as a script tag.
 *
 * @example
 * <JsonLd data={generateOrganizationSchema()} />
 */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data, null, 0),
      }}
    />
  );
}
