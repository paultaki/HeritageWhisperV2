import { notFound } from 'next/navigation';
import path from 'path';
import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { loadMDXContent, getAllMDXSlugs } from '@/lib/mdx/loader';
import { ArticleSchema } from '@/lib/seo/components/ArticleSchema';
import { siteUrl } from '@/lib/seo/config';
import { MDXRemote } from 'next-mdx-remote/rsc';

const CONTENT_DIR = path.join(
  process.cwd(),
  'app/(marketing)/alternatives/_content'
);

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const slugs = getAllMDXSlugs(CONTENT_DIR);
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const content = loadMDXContent(CONTENT_DIR, slug);

  if (!content) {
    return {};
  }

  return buildPageMetadata({
    title: content.frontmatter.title,
    description: content.frontmatter.description,
    path: `/alternatives/${slug}`,
    ogType: 'article',
  });
}

export default async function AlternativePage({ params }: Props) {
  const { slug } = await params;
  const content = loadMDXContent(CONTENT_DIR, slug);

  if (!content) {
    notFound();
  }

  const { frontmatter } = content;

  return (
    <>
      <ArticleSchema
        title={frontmatter.title}
        description={frontmatter.description}
        url={`${siteUrl}/alternatives/${slug}`}
        datePublished={frontmatter.datePublished}
        dateModified={frontmatter.dateModified}
      />
      <article className="prose prose-slate lg:prose-lg max-w-none">
        <header className="mb-8 border-b border-slate-200 pb-8">
          <h1>{frontmatter.title}</h1>
          <p className="lead text-slate-600">{frontmatter.description}</p>
          {frontmatter.datePublished && (
            <p className="text-sm text-slate-500">
              Last updated:{' '}
              {new Date(
                frontmatter.dateModified || frontmatter.datePublished
              ).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          )}
        </header>
        <MDXRemote source={content.content} />
      </article>
    </>
  );
}
