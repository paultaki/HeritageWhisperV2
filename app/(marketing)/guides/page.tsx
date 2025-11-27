import Link from 'next/link';
import path from 'path';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { loadAllMDXContent } from '@/lib/mdx/loader';

export const metadata = buildPageMetadata({
  title: 'Guides - How to Preserve Family Stories',
  description:
    'Learn how to record, preserve, and share your family stories. Expert guides on capturing memories from grandparents, parents, and loved ones.',
  path: '/guides',
});

const CONTENT_DIR = path.join(
  process.cwd(),
  'app/(marketing)/guides/_content'
);

export default function GuidesPage() {
  const guides = loadAllMDXContent(CONTENT_DIR);

  return (
    <article className="prose prose-slate lg:prose-lg max-w-none">
      <h1>Guides: Preserving Family Stories</h1>
      <p className="lead">
        Expert advice on recording, preserving, and sharing the stories that
        matter most. Whether you&apos;re helping a grandparent share their
        memories or racing against time to capture a loved one&apos;s voice,
        we&apos;ve got you covered.
      </p>

      <div className="not-prose mt-8 grid gap-6">
        {guides.map((guide) => (
          <Link
            key={guide.slug}
            href={`/guides/${guide.slug}`}
            className="group block rounded-lg border border-slate-200 p-6 transition-colors hover:border-slate-300 hover:bg-slate-50"
          >
            <h2 className="text-xl font-semibold text-slate-900 group-hover:text-blue-600">
              {guide.frontmatter.title}
            </h2>
            <p className="mt-2 text-slate-600">
              {guide.frontmatter.description}
            </p>
          </Link>
        ))}

        {guides.length === 0 && (
          <p className="text-slate-500">Guides coming soon...</p>
        )}
      </div>
    </article>
  );
}
