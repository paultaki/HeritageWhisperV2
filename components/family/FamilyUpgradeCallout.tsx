"use client";

import { Users, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";

type FamilyUpgradeCalloutProps = {
  className?: string;
};

/**
 * FamilyUpgradeCallout
 *
 * Prominent banner shown on the Family page for free users
 * Encourages upgrading to unlock family sharing features
 */
export function FamilyUpgradeCallout({ className }: FamilyUpgradeCalloutProps) {
  const router = useRouter();

  const handleUpgrade = () => {
    router.push("/upgrade?reason=family_invite");
  };

  return (
    <Card className={`border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100/50 ${className}`}>
      <CardContent className="p-6 sm:p-8">
        {/* Mobile: stacked layout (unchanged) | Desktop: horizontal with better spacing */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-12">
          {/* Left section: Icon + Content */}
          <div className="flex-1 min-w-0">
            {/* Icon + Title row on desktop */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
              {/* Icon */}
              <div className="flex-shrink-0">
                <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-amber-600 shadow-lg">
                  <Users className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-gray-900 sm:text-2xl">
                    Share Your Stories with Family
                  </h3>
                  <Sparkles className="h-5 w-5 text-amber-600 hidden sm:inline flex-shrink-0" />
                </div>
                <p className="text-gray-700 max-w-lg">
                  Invite children, grandchildren, and loved ones to read, listen, and ask questions about your life memories. Preserve your legacy for generations to come.
                </p>

                {/* Features List - horizontal on desktop */}
                <ul className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2 whitespace-nowrap">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-600 flex-shrink-0" />
                    <span>Unlimited family member invitations</span>
                  </li>
                  <li className="flex items-center gap-2 whitespace-nowrap">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-600 flex-shrink-0" />
                    <span>Let family submit story requests</span>
                  </li>
                  <li className="flex items-center gap-2 whitespace-nowrap">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-600 flex-shrink-0" />
                    <span>See who's listening to your stories</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* CTA - right aligned on desktop */}
          <div className="flex-shrink-0 lg:self-center">
            <Button
              onClick={handleUpgrade}
              size="lg"
              className="w-full sm:w-auto h-12 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              <span className="flex items-center gap-2">
                Upgrade to Founding Family
                <ArrowRight className="h-4 w-4" />
              </span>
            </Button>
            <p className="mt-2 text-center text-xs text-gray-600">
              $79/year • Cancel anytime
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
