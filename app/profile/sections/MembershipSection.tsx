"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, HardDrive, ArrowUpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MembershipSectionProps {
  isPaid: boolean;
  storageUsedGB: string;
  storageLimitGB: number;
  storagePercent: number;
  sessionToken?: string;
}

export function MembershipSection({
  isPaid,
  storageUsedGB,
  storageLimitGB,
  storagePercent,
  sessionToken,
}: MembershipSectionProps) {
  const router = useRouter();
  const { toast } = useToast();

  const handleManageSubscription = async () => {
    try {
      if (!sessionToken) {
        throw new Error('No active session');
      }

      const response = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: 'Error',
        description: 'Failed to open subscription management. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className={isPaid ? "border-2 border-amber-200" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Membership Status
          </CardTitle>
          <Badge
            className={
              isPaid
                ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white"
                : "bg-gray-100 text-gray-600"
            }
          >
            {isPaid ? "Premium" : "Free"}
          </Badge>
        </div>
        <CardDescription>
          {isPaid
            ? "Thank you for being a premium member! Enjoy unlimited family sharing."
            : "Upgrade to Premium to unlock family sharing features"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Storage Usage */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-[var(--hw-text-secondary)]" />
              <span className="text-base font-medium">Storage Used</span>
            </div>
            <span className="text-base text-[var(--hw-text-secondary)]">
              {storageUsedGB} GB / {storageLimitGB} GB
            </span>
          </div>
          <div className="w-full bg-[var(--hw-section-bg)] rounded-full h-2">
            <div
              className="rounded-full h-2 transition-all"
              style={{
                width: `${storagePercent}%`,
                backgroundColor: isPaid ? 'var(--hw-accent-gold)' : 'var(--hw-primary)'
              }}
            />
          </div>
        </div>

        {/* Feature List for Free Users */}
        {!isPaid && (
          <div className="rounded-lg bg-[var(--hw-section-bg)] p-4 space-y-2">
            <p className="text-base font-semibold text-[var(--hw-text-primary)] mb-3">Unlock with Premium:</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-base text-[var(--hw-text-secondary)]">
                <span className="text-[var(--hw-error)]">✕</span>
                <span>Share stories with family members</span>
              </div>
              <div className="flex items-center gap-2 text-base text-[var(--hw-text-secondary)]">
                <span className="text-[var(--hw-error)]">✕</span>
                <span>Family can submit questions</span>
              </div>
              <div className="flex items-center gap-2 text-base text-[var(--hw-text-secondary)]">
                <span className="text-[var(--hw-error)]">✕</span>
                <span>Track family engagement</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!isPaid ? (
          <Button
            onClick={() => router.push('/upgrade?reason=profile')}
            className="w-full min-h-[60px] text-lg font-medium bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
          >
            <ArrowUpCircle className="w-5 h-5 mr-2" />
            Upgrade to Premium - $79/year
          </Button>
        ) : (
          <Button
            onClick={handleManageSubscription}
            variant="outline"
            className="w-full min-h-[48px] text-base font-medium"
          >
            <CreditCard className="w-5 h-5 mr-2" />
            Manage Subscription
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
