import Link from 'next/link';
import path from 'path';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { loadAllMDXContent } from '@/lib/mdx/loader';

export const metadata = buildPageMetadata({
  title: 'StoryWorth Alternatives - Compare Family Story Apps',
  description:
    'Looking for StoryWorth alternatives? Compare HeritageWhisper and other family story preservation tools. Find the best app for recording grandparent stories.',
  path: '/alternatives',
});

const CONTENT_DIR = path.join(
  process.cwd(),
  'app/(marketing)/alternatives/_content'
);

export default function AlternativesPage() {
  const alternatives = loadAllMDXContent(CONTENT_DIR);

  return (
    <article className="prose prose-slate lg:prose-lg max-w-none">
      <h1>StoryWorth Alternatives: Family Story Apps Compared</h1>
      <p className="lead">
        Choosing the right tool to preserve your family&apos;s stories matters.
        We&apos;ve done the research so you can find the perfect fit for your
        family&apos;s needs.
      </p>

      <div className="not-prose mt-8 grid gap-6">
        {alternatives.map((alt) => (
          <Link
            key={alt.slug}
            href={`/alternatives/${alt.slug}`}
            className="group block rounded-lg border border-slate-200 p-6 transition-colors hover:border-slate-300 hover:bg-slate-50"
          >
            <h2 className="text-xl font-semibold text-slate-900 group-hover:text-blue-600">
              {alt.frontmatter.title}
            </h2>
            <p className="mt-2 text-slate-600">{alt.frontmatter.description}</p>
          </Link>
        ))}

        {alternatives.length === 0 && (
          <p className="text-slate-500">Comparisons coming soon...</p>
        )}
      </div>
    </article>
  );
}
