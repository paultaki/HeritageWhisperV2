import Link from 'next/link';
import path from 'path';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { loadAllMDXContent } from '@/lib/mdx/loader';

export const metadata = buildPageMetadata({
  title: 'Features - HeritageWhisper Story Preservation',
  description:
    'Discover HeritageWhisper features: voice recording, AI transcription, family sharing, book creation, and more. Everything you need to preserve family stories.',
  path: '/features',
});

const CONTENT_DIR = path.join(
  process.cwd(),
  'app/(marketing)/features/_content'
);

export default function FeaturesPage() {
  const features = loadAllMDXContent(CONTENT_DIR);

  return (
    <article className="prose prose-slate lg:prose-lg max-w-none">
      <h1>Features: Everything You Need to Preserve Stories</h1>
      <p className="lead">
        HeritageWhisper makes it easy to record, preserve, and share your
        family&apos;s most precious memories. Here&apos;s how we help you
        capture stories that last forever.
      </p>

      <div className="not-prose mt-8 grid gap-6">
        {features.map((feature) => (
          <Link
            key={feature.slug}
            href={`/features/${feature.slug}`}
            className="group block rounded-lg border border-slate-200 p-6 transition-colors hover:border-slate-300 hover:bg-slate-50"
          >
            <h2 className="text-xl font-semibold text-slate-900 group-hover:text-blue-600">
              {feature.frontmatter.title}
            </h2>
            <p className="mt-2 text-slate-600">
              {feature.frontmatter.description}
            </p>
          </Link>
        ))}

        {features.length === 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900">
              Core Features
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-slate-600">
              <li>
                <strong>Voice Recording</strong> - One-tap recording with guided
                prompts
              </li>
              <li>
                <strong>AI Transcription</strong> - Automatic speech-to-text for
                all recordings
              </li>
              <li>
                <strong>Family Sharing</strong> - Invite family members to
                listen and contribute
              </li>
              <li>
                <strong>Beautiful Book View</strong> - Read stories in a
                book-like format
              </li>
              <li>
                <strong>PDF Export</strong> - Create printed books to share
              </li>
            </ul>
          </div>
        )}
      </div>
    </article>
  );
}
