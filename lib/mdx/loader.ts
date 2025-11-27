import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export type MDXFrontmatter = {
  title: string;
  description: string;
  datePublished?: string;
  dateModified?: string;
  author?: string;
  ogImage?: string;
};

export type MDXContent = {
  frontmatter: MDXFrontmatter;
  content: string;
  slug: string;
};

/**
 * Load a single MDX file by slug from a content directory.
 */
export function loadMDXContent(
  contentDir: string,
  slug: string
): MDXContent | null {
  const filePath = path.join(contentDir, `${slug}.mdx`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(fileContent);

  return {
    frontmatter: data as MDXFrontmatter,
    content,
    slug,
  };
}

/**
 * Get all MDX slugs from a content directory.
 */
export function getAllMDXSlugs(contentDir: string): string[] {
  if (!fs.existsSync(contentDir)) {
    return [];
  }

  return fs
    .readdirSync(contentDir)
    .filter((file) => file.endsWith('.mdx'))
    .map((file) => file.replace(/\.mdx$/, ''));
}

/**
 * Load all MDX files from a content directory.
 */
export function loadAllMDXContent(contentDir: string): MDXContent[] {
  const slugs = getAllMDXSlugs(contentDir);
  return slugs
    .map((slug) => loadMDXContent(contentDir, slug))
    .filter((content): content is MDXContent => content !== null);
}
