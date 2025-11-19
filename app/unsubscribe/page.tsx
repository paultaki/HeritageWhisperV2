'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertCircle, Mail } from 'lucide-react';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const status = searchParams?.get('status');
  const error = searchParams?.get('error');
  const name = searchParams?.get('name');

  // ============================================================================
  // SUCCESS STATE
  // ============================================================================
  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
        <Card className="max-w-md w-full border-green-200 shadow-xl">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>

            <h1 className="text-3xl font-serif font-bold text-gray-800 mb-3">
              You've Been Unsubscribed
            </h1>

            <p className="text-xl text-gray-700 mb-6 leading-relaxed">
              {name ? `${name}, you` : 'You'} will no longer receive email notifications about new stories.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-amber-800 leading-relaxed">
                You can still access all stories by visiting the HeritageWhisper app directly.
                Your account remains active.
              </p>
            </div>

            <div className="text-sm text-gray-600">
              <p>Changed your mind?</p>
              <p className="mt-2">
                Contact the person who invited you to update your preferences.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============================================================================
  // ALREADY UNSUBSCRIBED STATE
  // ============================================================================
  if (status === 'already-unsubscribed') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
        <Card className="max-w-md w-full border-blue-200 shadow-xl">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
              <Mail className="w-10 h-10 text-white" />
            </div>

            <h1 className="text-3xl font-serif font-bold text-gray-800 mb-3">
              Already Unsubscribed
            </h1>

            <p className="text-xl text-gray-700 mb-6 leading-relaxed">
              You are already unsubscribed from story notification emails.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 leading-relaxed">
                You won't receive any email notifications about new stories.
                You can still access stories by visiting the HeritageWhisper app.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============================================================================
  // ERROR STATES
  // ============================================================================
  const errorMessages: Record<string, { title: string; message: string }> = {
    'missing-token': {
      title: 'Invalid Link',
      message: 'This unsubscribe link is missing required information. Please use the link from your email.',
    },
    'invalid-token': {
      title: 'Invalid Link',
      message: 'This unsubscribe link is invalid or has expired. Please use the most recent link from your email.',
    },
    'not-found': {
      title: 'Not Found',
      message: 'We couldn\'t find your subscription. You may already be unsubscribed or the link is outdated.',
    },
    'update-failed': {
      title: 'Update Failed',
      message: 'We couldn\'t update your preferences. Please try again or contact support.',
    },
    'unexpected': {
      title: 'Something Went Wrong',
      message: 'An unexpected error occurred. Please try again later or contact support.',
    },
  };

  const errorInfo = error ? errorMessages[error] : null;

  if (errorInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
        <Card className="max-w-md w-full border-red-200 shadow-xl">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center">
              <XCircle className="w-10 h-10 text-white" />
            </div>

            <h1 className="text-3xl font-serif font-bold text-gray-800 mb-3">
              {errorInfo.title}
            </h1>

            <p className="text-xl text-gray-700 mb-6 leading-relaxed">
              {errorInfo.message}
            </p>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <AlertCircle className="w-5 h-5 mx-auto mb-2 text-red-600" />
              <p className="text-sm text-red-800 leading-relaxed">
                If this problem persists, please contact the person who invited you for assistance.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============================================================================
  // DEFAULT STATE (No query params)
  // ============================================================================
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      <Card className="max-w-md w-full shadow-xl">
        <CardContent className="pt-12 pb-12 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Mail className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-3xl font-serif font-bold text-gray-800 mb-3">
            Unsubscribe from Notifications
          </h1>

          <p className="text-xl text-gray-700 mb-6 leading-relaxed">
            To unsubscribe from story notification emails, please use the link from your email.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800 leading-relaxed">
              Each unsubscribe link is unique to you. Check your email for the correct link.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
          <Card className="max-w-md w-full shadow-xl">
            <CardContent className="pt-12 pb-12 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-600 mx-auto mb-4"></div>
              <p className="text-lg text-gray-600">Loading...</p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <UnsubscribeContent />
    </Suspense>
  );
}
