'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';

export default function FamilyUnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      <Card className="max-w-md w-full border-red-200">
        <CardContent className="pt-12 pb-12 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
            <ShieldAlert className="w-10 h-10 text-red-600" />
          </div>
          
          <h1 className="text-2xl font-serif font-bold text-gray-800 mb-3">
            Unauthorized Access
          </h1>
          
          <p className="text-gray-600 mb-6 leading-relaxed">
            You don't have permission to view these stories. Your invitation is for a different family member's collection.
          </p>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800">
              If you believe this is an error, please contact the person who invited you.
            </p>
          </div>

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
