'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Mail } from 'lucide-react';

export default function FamilyExpiredPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      <Card className="max-w-md w-full border-amber-200">
        <CardContent className="pt-12 pb-12 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-100 flex items-center justify-center">
            <Clock className="w-10 h-10 text-amber-600" />
          </div>
          
          <h1 className="text-2xl font-serif font-bold text-gray-800 mb-3">
            Session Expired
          </h1>
          
          <p className="text-gray-600 mb-6 leading-relaxed">
            Your family viewing session has expired. Sessions last for 30 days from your last visit.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <Mail className="w-5 h-5 mx-auto mb-2 text-amber-600" />
            <p className="text-sm text-amber-800">
              Please check your email for the original invitation link, or contact the person who invited you to request a new invitation.
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
