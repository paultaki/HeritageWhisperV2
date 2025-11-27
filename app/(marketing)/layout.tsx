import { ProductSchema } from '@/lib/seo/components/ProductSchema';

/**
 * Marketing layout - wraps all SEO content pages.
 * Includes ProductSchema for SoftwareApplication structured data.
 */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ProductSchema />
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </>
  );
}
