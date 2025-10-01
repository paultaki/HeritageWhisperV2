// API Configuration - In Next.js, API routes are under /api
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Get the full API URL for a given path
export function getApiUrl(path: string): string {
  // In Next.js, API routes are always relative to the same domain
  // No need for separate API URL in most cases
  return path;
}