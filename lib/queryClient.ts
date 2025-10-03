import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getApiUrl } from "./config";
import { supabase } from "./supabase";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Check if data is FormData (for file uploads)
  const isFormData = data instanceof FormData;

  // Get the Supabase session token with retries for race condition
  let { data: { session }, error } = await supabase.auth.getSession();

  // If no session, retry multiple times (handles race condition after login)
  if (!session && !url.includes('/api/auth/')) {
    for (let attempt = 0; attempt < 5; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      const retryResult = await supabase.auth.getSession();
      if (retryResult.data?.session) {
        session = retryResult.data.session;
        console.log(`[apiRequest] Session found after ${(attempt + 1) * 100}ms retry`);
        break;
      }
    }
  }

  // If still no session or error, try to refresh the session
  if (!session || error) {
    // Try to refresh the session directly
    try {
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();

      if (refreshedSession) {
        session = refreshedSession;
      } else if (refreshError?.message?.includes('refresh_token_not_found')) {
        // Try one more time to get session from storage
        const storageCheck = await supabase.auth.getSession();
        if (storageCheck.data?.session) {
          session = storageCheck.data.session;
        }
      }
    } catch (refreshErr) {
      // Session refresh failed silently
    }
  }

  const headers: HeadersInit = {};

  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  } else {
    // Don't proceed with auth-required requests
    if (!url.includes('/api/share/') && !url.includes('/api/auth/')) {
      throw new Error('Authentication required. Please sign in again.');
    }
  }

  if (data && !isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(getApiUrl(url), {
    method,
    headers,
    body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
    credentials: "include",
  });

  // Special handling for 401 errors
  if (res.status === 401) {
    // Try to refresh one more time
    const { data: { session: lastTry } } = await supabase.auth.refreshSession();
    if (lastTry) {
      headers["Authorization"] = `Bearer ${lastTry.access_token}`;
      const retryRes = await fetch(getApiUrl(url), {
        method,
        headers,
        body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
        credentials: "include",
      });
      await throwIfResNotOk(retryRes);
      return retryRes;
    }
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Get the Supabase session token with retries for race condition
    let { data: { session }, error } = await supabase.auth.getSession();

    // If no session, retry multiple times (handles race condition after login)
    const url = queryKey.join("/") as string;
    if (!session && !url.includes('/api/auth/')) {
      for (let attempt = 0; attempt < 5; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        const retryResult = await supabase.auth.getSession();
        if (retryResult.data?.session) {
          session = retryResult.data.session;
          console.log(`[getQueryFn] Session found after ${(attempt + 1) * 100}ms retry`);
          break;
        }
      }
    }

    // If still no session or error, try to refresh the session
    if (!session || error) {
      const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
      if (refreshedSession) {
        session = refreshedSession;
      }
    }

    const headers: HeadersInit = {};

    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }

    const res = await fetch(getApiUrl(queryKey.join("/") as string), {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,
      staleTime: 1000 * 60 * 30, // 30 minutes instead of Infinity
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
