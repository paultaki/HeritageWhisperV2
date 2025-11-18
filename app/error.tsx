'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import Link from 'next/link';

type ErrorBoundaryProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    // Log error to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-stone-50 to-stone-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center">
            <span className="text-5xl">😔</span>
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-semibold text-stone-900 mb-4">
          Something went wrong
        </h1>

        {/* Body text */}
        <p className="text-lg text-stone-600 mb-8 leading-relaxed">
          Don't worry - we've been notified and will fix this soon.
        </p>

        {/* Action buttons */}
        <div className="space-y-3 mb-6">
          {/* Primary button - Try again */}
          <button
            onClick={reset}
            className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-lg rounded-xl transition-colors shadow-sm"
          >
            Try again
          </button>

          {/* Secondary button - Go home */}
          <Link
            href="/"
            className="block w-full h-14 border-2 border-stone-300 hover:border-stone-400 text-stone-700 font-semibold text-lg rounded-xl transition-colors flex items-center justify-center"
          >
            Go home
          </Link>
        </div>

        {/* Footer */}
        <p className="text-sm text-stone-500">
          Need help? Email us at{' '}
          <a
            href="mailto:support@heritagewhisper.com"
            className="text-emerald-600 hover:text-emerald-700 underline"
          >
            support@heritagewhisper.com
          </a>
        </p>
      </div>
    </div>
  );
}
