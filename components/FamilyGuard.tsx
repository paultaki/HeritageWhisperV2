'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFamilyAuth } from '@/hooks/use-family-auth';
import { Loader2 } from 'lucide-react';

export function FamilyGuard({
  children,
  userId,
}: {
  children: React.ReactNode;
  userId: string;
}) {
  const { session, loading, isAuthenticated } = useFamilyAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/family/expired');
      return;
    }

    // Verify userId matches storyteller
    if (session && session.storytellerId !== userId) {
      console.error('User ID mismatch:', { sessionUserId: session.storytellerId, requestedUserId: userId });
      router.push('/family/unauthorized');
    }
  }, [loading, isAuthenticated, session, userId, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-amber-600 animate-spin" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (session && session.storytellerId !== userId) {
    return null;
  }

  return <>{children}</>;
}
