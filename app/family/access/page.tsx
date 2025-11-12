'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Users, CheckCircle, XCircle, Clock } from 'lucide-react';

interface SessionData {
  sessionToken: string;
  storytellerId: string;
  storytellerName: string;
  familyMemberName: string;
  relationship: string | null;
  permissionLevel: 'viewer' | 'contributor';
  expiresAt: string;
  firstAccess: boolean;
}

type Status = 'loading' | 'success' | 'error';

function FamilyAccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const token = searchParams?.get('token');

    if (!token) {
      setStatus('error');
      setError('No invitation token provided. Please check your invite link.');
      return;
    }

    verifyToken(token);
  }, [searchParams]);

  // Memoized redirect handler to prevent stale closures
  const handleContinue = useCallback(() => {
    if (sessionData) {
      console.log('[Family Access] Redirecting to /timeline with session:', {
        storytellerId: sessionData.storytellerId,
        storytellerName: sessionData.storytellerName,
        permissionLevel: sessionData.permissionLevel,
        expiresAt: sessionData.expiresAt
      });
      router.push('/timeline');
    }
  }, [sessionData, router]);

  // Countdown timer effect
  useEffect(() => {
    if (showWelcome && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (showWelcome && countdown === 0) {
      handleContinue();
    }
  }, [showWelcome, countdown, handleContinue]);

  async function verifyToken(token: string) {
    try {
      const response = await fetch(`/api/family/verify?token=${token}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      // Store session in localStorage
      const familySession: SessionData = {
        sessionToken: data.sessionToken,
        storytellerId: data.storyteller.id,
        storytellerName: data.storyteller.name,
        familyMemberName: data.familyMember.name || 'Family Member',
        relationship: data.familyMember.relationship,
        permissionLevel: data.familyMember.permissionLevel || 'viewer',
        expiresAt: data.expiresAt,
        firstAccess: true,
      };

      localStorage.setItem('family_session', JSON.stringify(familySession));
      setSessionData(familySession);
      setStatus('success');
      setShowWelcome(true);
    } catch (err: any) {
      console.error('Token verification error:', err);
      setStatus('error');
      setError(err.message || 'Failed to verify invitation');
    }
  }

  // Loading State
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
        <Card className="max-w-md w-full">
          <CardContent className="pt-12 pb-12 text-center">
            <Loader2 className="w-16 h-16 mx-auto mb-6 text-amber-600 animate-spin" />
            <h2 className="text-2xl font-serif font-bold text-gray-800 mb-2">
              Verifying your invitation...
            </h2>
            <p className="text-gray-600">
              Please wait while we set up your access
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error State
  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
        <Card className="max-w-md w-full border-red-200">
          <CardContent className="pt-12 pb-12 text-center">
            <XCircle className="w-16 h-16 mx-auto mb-6 text-red-500" />
            <h2 className="text-2xl font-serif font-bold text-gray-800 mb-3">
              {error?.includes('expired') ? 'Invite Expired' : 'Invalid Invitation'}
            </h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              {error || 'This invitation link is not valid.'}
            </p>
            
            {error?.includes('expired') && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <Clock className="w-5 h-5 mx-auto mb-2 text-amber-600" />
                <p className="text-sm text-amber-800">
                  Invitation links expire after 7 days. Please contact the person who invited you to request a new invitation.
                </p>
              </div>
            )}

            <Button
              onClick={() => router.push('/')}
              variant="outline"
              className="mt-4"
            >
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success State - Welcome Screen
  if (status === 'success' && showWelcome && sessionData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
        <Card className="max-w-2xl w-full border-amber-200 shadow-xl">
          <CardContent className="pt-12 pb-12">
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-serif font-bold text-gray-800 mb-3">
                👋 Welcome{sessionData.familyMemberName ? `, ${sessionData.familyMemberName}` : ''}!
              </h1>
              <p className="text-xl text-gray-700 leading-relaxed">
                {sessionData.storytellerName} has invited you to view their life stories.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 mb-8 border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                You can now:
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-gray-700">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>View their timeline of memories and milestones</span>
                </li>
                <li className="flex items-start gap-3 text-gray-700">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>Read their stories with photos and context</span>
                </li>
                <li className="flex items-start gap-3 text-gray-700">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>Listen to audio recordings in their own voice</span>
                </li>
                <li className="flex items-start gap-3 text-gray-700">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>Browse their memory book organized by decade</span>
                </li>
              </ul>
            </div>

            <div className="text-center">
              <Button
                onClick={handleContinue}
                size="lg"
                className="bg-gradient-to-r from-amber-500 via-orange-400 to-rose-400 hover:from-amber-600 hover:via-orange-500 hover:to-rose-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 h-14 px-8 text-lg"
              >
                Continue to Timeline
              </Button>
              <p className="text-sm text-gray-500 mt-4">
                Redirecting automatically in {countdown} second{countdown !== 1 ? 's' : ''}...
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600">
                Your access will remain active for 30 days. You can return anytime using the same link.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}

export default function FamilyAccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
        <Card className="max-w-md w-full">
          <CardContent className="pt-12 pb-12 text-center">
            <Loader2 className="w-16 h-16 mx-auto mb-6 text-amber-600 animate-spin" />
            <h2 className="text-2xl font-serif font-bold text-gray-800 mb-2">
              Loading...
            </h2>
          </CardContent>
        </Card>
      </div>
    }>
      <FamilyAccessContent />
    </Suspense>
  );
}
