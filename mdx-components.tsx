import type { MDXComponents } from 'mdx/types';

/**
 * MDX component overrides.
 * Customize how MDX elements render across the app.
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    // Add custom component overrides here if needed
    // e.g., h1: ({ children }) => <h1 className="custom-h1">{children}</h1>,
  };
}
