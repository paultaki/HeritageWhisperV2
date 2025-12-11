'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, XCircle, Clock } from 'lucide-react';
import { useAuth } from '@/lib/auth';

// Storage key for signed-in users' active storyteller context
const STORYTELLER_CONTEXT_KEY = 'hw_active_storyteller_context';

// AccountContext type for signed-in users
interface AccountContext {
  storytellerId: string;
  storytellerName: string;
  type: 'own' | 'viewing';
  permissionLevel: 'viewer' | 'contributor' | 'owner';
  relationship: string | null;
}

type Status = 'loading' | 'error';

function FamilyAccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);
  const verificationStarted = useRef(false);

  // Wait for auth to load, then verify token
  useEffect(() => {
    // Don't start verification until auth loading is complete
    if (isAuthLoading) return;
    
    // Prevent double verification
    if (verificationStarted.current) return;
    
    const token = searchParams?.get('token');

    if (!token) {
      setStatus('error');
      setError('No invitation token provided. Please check your invite link.');
      return;
    }

    verificationStarted.current = true;
    verifyToken(token, !!user);
  }, [searchParams, isAuthLoading, user]);

  async function verifyToken(token: string, userIsSignedIn: boolean) {
    try {
      const response = await fetch(`/api/family/verify?token=${token}`, {
        credentials: 'include', // Receive HttpOnly cookie from server
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      // For signed-in users: Store storyteller context for account switcher
      // The family_session token is already set as HttpOnly cookie by the server
      if (userIsSignedIn) {
        const viewerContext: AccountContext = {
          storytellerId: data.storyteller.id,
          storytellerName: data.storyteller.name,
          type: 'viewing',
          permissionLevel: data.familyMember.permissionLevel || 'viewer',
          relationship: data.familyMember.relationship,
        };
        localStorage.setItem(STORYTELLER_CONTEXT_KEY, JSON.stringify(viewerContext));
      }

      // Redirect immediately to timeline after successful verification
      window.location.href = '/timeline';
    } catch (err: any) {
      console.error('Token verification error:', err);
      setStatus('error');
      setError(err.message || 'Failed to verify invitation');
    }
  }

  // Loading State
  if (status === 'loading') {
    return (
      <div className="hw-page flex items-center justify-center p-4 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
        <Card className="max-w-md w-full">
          <CardContent className="pt-12 pb-12 text-center">
            <Loader2 className="w-16 h-16 mx-auto mb-6 text-amber-600 animate-spin" />
            <h2 className="text-2xl font-serif font-bold text-gray-800 mb-2">
              Verifying your invitation...
            </h2>
            <p className="text-gray-600 text-center">
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
      <div className="hw-page flex items-center justify-center p-4 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
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
                  Invitation links expire after 30 days. Please contact the person who invited you to request a new invitation.
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

  return null;
}

export default function FamilyAccessPage() {
  return (
    <Suspense fallback={
      <div className="hw-page flex items-center justify-center p-4 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
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
