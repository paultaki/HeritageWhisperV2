import { NextRequest } from 'next/server';

/**
 * Helper to build a NextRequest with authorization header
 */
export function createAuthRequest(
  url: string,
  token: string = 'VALID',
  options: RequestInit = {}
): NextRequest {
  return new NextRequest(url, {
    ...options,
    headers: {
      authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
}

/**
 * Helper to create a POST request with JSON body
 */
export function createPostRequest(
  url: string,
  body: any,
  token: string = 'VALID'
): NextRequest {
  return new NextRequest(url, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

/**
 * Helper to add days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Helper to create a future date ISO string
 */
export function futureDate(days: number = 7): string {
  return addDays(new Date(), days).toISOString();
}

/**
 * Helper to create a past date ISO string
 */
export function pastDate(days: number = 7): string {
  return addDays(new Date(), -days).toISOString();
}
