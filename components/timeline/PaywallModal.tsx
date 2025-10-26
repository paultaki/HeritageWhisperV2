/**
 * PaywallModal Component
 *
 * Subscription paywall modal shown when users reach free story limit.
 *
 * Features:
 * - Shows after 3 free stories
 * - Displays pricing and benefits
 * - Call-to-action for subscription
 * - Dismissible modal
 *
 * Created: January 25, 2025
 * Extracted from: TimelineMobile.tsx lines 203-271
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import type { PaywallModalProps } from "@/types/timeline";

/**
 * PaywallModal - Subscription prompt modal
 */
export function PaywallModal({
  isOpen,
  onClose,
  onSubscribe,
}: PaywallModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-lg w-full shadow-2xl shadow-heritage-orange/20 border border-heritage-coral/10">
        <CardContent className="pt-8 pb-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-secondary-foreground" />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              You've Created 3 Beautiful Memories
            </h2>
            <p className="text-xl text-muted-foreground">
              Subscribe to preserve unlimited stories
            </p>
          </div>

          <div className="bg-primary/10 p-6 rounded-xl mb-6 text-center">
            <div className="text-4xl font-bold text-primary mb-2">$149</div>
            <div className="text-muted-foreground">per year</div>
          </div>

          <div className="space-y-3 mb-8">
            {[
              "Unlimited recordings",
              "Full transcriptions",
              "Annual memory book",
              "Share with 5 family members",
              "Download everything",
            ].map((benefit, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground text-xs">✓</span>
                </div>
                <span className="text-foreground">{benefit}</span>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <Button
              onClick={onSubscribe}
              className="w-full py-4 text-xl font-semibold bg-[var(--primary-coral)] hover:bg-[hsl(0,77%,58%)] text-white rounded-3xl shadow-md hover:shadow-lg transition-all"
              data-testid="button-subscribe"
            >
              Preserve My Legacy
            </Button>
            <Button
              variant="ghost"
              onClick={onClose}
              className="w-full py-3 text-muted-foreground hover:text-foreground rounded-3xl transition-all"
              data-testid="button-close-paywall"
            >
              Maybe Later
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
