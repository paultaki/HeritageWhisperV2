'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Heart, XCircle } from 'lucide-react';

type Status = 'loading' | 'form' | 'submitting' | 'error';

interface StorytellerInfo {
  name: string;
  email: string;
}

export default function FamilyJoinPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.userId as string;

  const [status, setStatus] = useState<Status>('loading');
  const [storyteller, setStoryteller] = useState<StorytellerInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [visitorName, setVisitorName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [relationship, setRelationship] = useState('');

  // Load storyteller info
  useEffect(() => {
    if (!userId) {
      setStatus('error');
      setError('Invalid invitation link');
      return;
    }

    async function loadStoryteller() {
      try {
        const response = await fetch(`/api/family/storyteller-info?userId=${userId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load storyteller info');
        }

        setStoryteller(data.storyteller);
        setStatus('form');
      } catch (err: any) {
        console.error('Error loading storyteller:', err);
        setStatus('error');
        setError(err.message || 'This invitation link is not valid');
      }
    }

    loadStoryteller();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!visitorName.trim() || !visitorEmail.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setStatus('submitting');
    setError(null);

    try {
      const response = await fetch('/api/family/join-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storytellerId: userId,
          visitorName: visitorName.trim(),
          visitorEmail: visitorEmail.trim(),
          relationship: relationship.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit request');
      }

      // If they got a token back, redirect to access page
      if (data.token) {
        router.push(`/family/access?token=${data.token}`);
      } else {
        // Request submitted, pending approval
        router.push('/family/pending');
      }
    } catch (err: any) {
      console.error('Error submitting join request:', err);
      setStatus('form');
      setError(err.message || 'Failed to submit request');
    }
  };

  // Loading state
  if (status === 'loading') {
    return (
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
    );
  }

  // Error state
  if (status === 'error' && !storyteller) {
    return (
      <div className="hw-page flex items-center justify-center p-4 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
        <Card className="max-w-md w-full border-red-200">
          <CardContent className="pt-12 pb-12 text-center">
            <XCircle className="w-16 h-16 mx-auto mb-6 text-red-500" />
            <h2 className="text-2xl font-serif font-bold text-gray-800 mb-3">
              Invalid Link
            </h2>
            <p className="text-gray-600 mb-6">
              {error || 'This invitation link is not valid.'}
            </p>
            <Button onClick={() => router.push('/')} variant="outline">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Form state
  return (
    <div className="hw-page flex items-center justify-center p-4 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-8">
          <div className="text-center mb-6">
            <Heart className="w-12 h-12 mx-auto mb-4 text-amber-600" />
            <h1 className="text-2xl font-serif font-bold text-gray-800 mb-2">
              Join {storyteller?.name}'s Stories
            </h1>
            <p className="text-gray-600">
              Enter your details to access their memories
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Your Name *</Label>
              <Input
                id="name"
                type="text"
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                placeholder="Enter your name"
                required
                disabled={status === 'submitting'}
              />
            </div>

            <div>
              <Label htmlFor="email">Your Email *</Label>
              <Input
                id="email"
                type="email"
                value={visitorEmail}
                onChange={(e) => setVisitorEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={status === 'submitting'}
              />
            </div>

            <div>
              <Label htmlFor="relationship">Relationship (optional)</Label>
              <Input
                id="relationship"
                type="text"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                placeholder="e.g., Daughter, Grandson, Friend"
                disabled={status === 'submitting'}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              disabled={status === 'submitting'}
            >
              {status === 'submitting' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Requesting Access...
                </>
              ) : (
                'Request Access'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
