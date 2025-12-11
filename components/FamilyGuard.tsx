'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFamilyAuth } from '@/hooks/use-family-auth';
import { useAuth } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

// Storage key for signed-in users' active storyteller context
const STORYTELLER_CONTEXT_KEY = 'hw_active_storyteller_context';

export function FamilyGuard({
  children,
  userId,
}: {
  children: React.ReactNode;
  userId: string;
}) {
  const { session, loading: familyLoading, isAuthenticated: hasFamilySession } = useFamilyAuth();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [checkingAccess, setCheckingAccess] = useState(false);

  useEffect(() => {
    // Wait for both auth checks to complete
    if (familyLoading || authLoading) {
      return;
    }

    // CASE 1: Logged-in subscriber
    if (user) {
      // If viewing their own account, redirect to main timeline
      if (user.id === userId) {
        console.log('[FamilyGuard] Owner visiting family URL, redirecting to /timeline');
        router.replace('/timeline');
        return;
      }

      // Check if they have family access via database
      setCheckingAccess(true);
      checkFamilyAccess(user.id, userId).then((hasAccess) => {
        setCheckingAccess(false);

        if (hasAccess) {
          console.log('[FamilyGuard] Signed-in user has family access, setting up context');
          // Set up the viewing context and redirect to main timeline
          const viewerContext = {
            storytellerId: userId,
            storytellerName: hasAccess.storytellerName || 'Family Member',
            type: 'viewing',
            permissionLevel: hasAccess.permissionLevel || 'viewer',
            relationship: hasAccess.relationship,
          };
          localStorage.setItem(STORYTELLER_CONTEXT_KEY, JSON.stringify(viewerContext));

          // Full page reload to ensure context is picked up fresh
          window.location.href = '/timeline';
        } else {
          // No family access
          console.log('[FamilyGuard] Signed-in user does not have family access');
          router.push('/family/unauthorized');
        }
      });
      return;
    }

    // CASE 2: Unauthenticated family viewer
    if (!hasFamilySession) {
      router.push('/family/expired');
      return;
    }

    // Verify userId matches storyteller in session
    if (session && session.storytellerId !== userId) {
      console.error('[FamilyGuard] User ID mismatch:', {
        sessionUserId: session.storytellerId,
        requestedUserId: userId
      });
      router.push('/family/unauthorized');
    }
  }, [familyLoading, authLoading, hasFamilySession, session, userId, router, user]);

  // Loading states
  if (familyLoading || authLoading || checkingAccess) {
    return (
      <div className="hw-page flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-amber-600 animate-spin" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Logged-in users are redirected, don't render children
  if (user) {
    return (
      <div className="hw-page flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-amber-600 animate-spin" />
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  if (!hasFamilySession) {
    return null;
  }

  if (session && session.storytellerId !== userId) {
    return null;
  }

  return <>{children}</>;
}

/**
 * Check if a signed-in user has family access to a storyteller via the family_members table
 */
async function checkFamilyAccess(
  currentUserId: string,
  storytellerId: string
): Promise<{ storytellerName: string; permissionLevel: string; relationship: string | null } | null> {
  try {
    const response = await fetch(`/api/accounts/check-family-access?storyteller_id=${storytellerId}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.hasAccess ? data : null;
  } catch (e) {
    console.error('[FamilyGuard] Error checking family access:', e);
    return null;
  }
}
