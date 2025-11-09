'use client';

import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Users, MessageSquare, Eye, Check, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';

function UpgradePageContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');
  const router = useRouter();

  const getReasonText = () => {
    switch (reason) {
      case 'family_invite':
        return 'Unlock family sharing to invite your loved ones';
      case 'profile':
        return 'Upgrade to Premium for family sharing';
      case 'banner':
        return 'Share your stories with family today';
      default:
        return 'Preserve your legacy for generations';
    }
  };

  const handleUpgrade = async () => {
    try {
      // Create Stripe Checkout session
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          triggerLocation: reason || 'direct_link',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Checkout error:', errorData);
        alert('Failed to start checkout. Please try again.');
        return;
      }

      const { url } = await response.json();

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error('Error creating checkout:', error);
      alert('An error occurred. Please try again.');
    }
  };

  const handleStayFree = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white py-12">
      <div className="container mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-amber-600">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="mb-2 text-4xl font-bold">Upgrade to Premium</h1>
          <p className="text-lg text-gray-600">{getReasonText()}</p>
        </div>

        {/* Main Card */}
        <Card className="mb-6 border-2 border-amber-200 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-amber-500 to-amber-600 text-white">
            <CardTitle className="text-center text-3xl">Premium Plan</CardTitle>
            <CardDescription className="text-center text-amber-50">
              Share your stories with unlimited family members
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            {/* Price */}
            <div className="mb-8 text-center">
              <div className="text-5xl font-bold text-gray-900">$79</div>
              <div className="text-lg text-gray-600">per year</div>
              <div className="mt-2 text-sm text-gray-500">That's less than $7/month</div>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <h3 className="mb-4 text-center text-xl font-semibold">What's Included</h3>

              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
                  <Users className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h4 className="font-semibold">Unlimited Family Invitations</h4>
                  <p className="text-gray-600">Share your stories with children, grandchildren, siblings, and extended family</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
                  <MessageSquare className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h4 className="font-semibold">Family Question Submissions</h4>
                  <p className="text-gray-600">Let your family request specific stories they want to hear from you</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
                  <Eye className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h4 className="font-semibold">Activity Tracking</h4>
                  <p className="text-gray-600">See who's listening and which stories resonate most with your family</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold">Everything Free Users Get</h4>
                  <p className="text-gray-600">Unlimited recordings, AI transcription, lessons learned extraction - all included</p>
                </div>
              </div>
            </div>

            {/* Trust Signals */}
            <div className="mt-8 rounded-lg bg-gray-50 p-4">
              <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Cancel anytime</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Download your data anytime</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Secure payment via Stripe</span>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 p-8">
            <Button
              onClick={handleUpgrade}
              className="h-14 w-full bg-gradient-to-r from-amber-500 to-amber-600 text-lg hover:from-amber-600 hover:to-amber-700"
            >
              Upgrade for $79/year
            </Button>
            <Button
              variant="ghost"
              onClick={handleStayFree}
              className="w-full"
            >
              Stay on Free Plan
            </Button>
          </CardFooter>
        </Card>

        {/* Comparison */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <X className="h-5 w-5 text-gray-400" />
                Free Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-500">
                <X className="h-4 w-4" />
                <span>No family sharing</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <X className="h-4 w-4" />
                <span>No family question submissions</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <X className="h-4 w-4" />
                <span>No activity tracking</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <Check className="h-4 w-4" />
                <span>Unlimited recordings</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <Check className="h-4 w-4" />
                <span>AI transcription</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-amber-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-600">
                <Sparkles className="h-5 w-5" />
                Premium Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-green-600">
                <Check className="h-4 w-4" />
                <span>Unlimited family sharing</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <Check className="h-4 w-4" />
                <span>Family question submissions</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <Check className="h-4 w-4" />
                <span>Activity tracking</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <Check className="h-4 w-4" />
                <span>Unlimited recordings</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <Check className="h-4 w-4" />
                <span>AI transcription</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function UpgradePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <UpgradePageContent />
    </Suspense>
  );
}
