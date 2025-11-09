'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Sparkles, Users, MessageSquare, Eye } from 'lucide-react';
import {
  trackPaywallModalShown,
  trackUpgradeClicked,
  trackPaywallDismissed,
} from '@/lib/analytics/paywall';

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: 'family_invite' | 'profile_page' | 'banner_timeline' | 'banner_book' | 'banner_memory_box';
}

export function UpgradeModal({ open, onOpenChange, trigger = 'family_invite' }: UpgradeModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Track when modal is shown
  useEffect(() => {
    if (open) {
      trackPaywallModalShown(trigger);
    }
  }, [open, trigger]);

  const handleUpgrade = async () => {
    setIsLoading(true);
    // Track upgrade click
    trackUpgradeClicked(trigger);

    try {
      // Create Stripe Checkout session
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          triggerLocation: trigger,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Checkout error:', errorData);
        // Fallback to upgrade page on error
        router.push(`/upgrade?reason=${trigger}`);
        return;
      }

      const { url } = await response.json();

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error('Error creating checkout:', error);
      // Fallback to upgrade page on error
      router.push(`/upgrade?reason=${trigger}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    // Track dismissal
    trackPaywallDismissed(trigger);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-amber-600">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <DialogTitle className="text-center text-2xl">
            Share Your Stories with Family
          </DialogTitle>
          <DialogDescription className="text-center">
            Upgrade to Premium to unlock family sharing and keep your memories connected across generations
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
              <Users className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <h4 className="font-medium">Invite unlimited family members</h4>
              <p className="text-sm text-gray-600">Share your stories with children, grandchildren, and extended family</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
              <MessageSquare className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <h4 className="font-medium">Family can submit questions</h4>
              <p className="text-sm text-gray-600">Let your family request stories they want to hear</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
              <Eye className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <h4 className="font-medium">See who's listening</h4>
              <p className="text-sm text-gray-600">Track family engagement and see which stories resonate most</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 p-6 text-center text-white">
          <div className="text-4xl font-bold">$79</div>
          <div className="text-sm opacity-90">per year</div>
          <div className="mt-2 text-xs opacity-75">Cancel anytime • Download your data anytime</div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={handleDismiss}
            className="w-full sm:w-auto"
            disabled={isLoading}
          >
            Maybe Later
          </Button>
          <Button
            onClick={handleUpgrade}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 sm:w-auto"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Upgrade for $79/year'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
