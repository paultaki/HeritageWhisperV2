"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { CheckCircle2, Book, Users, Clock, ArrowRight } from "lucide-react";

type SubscriptionStatus = {
  isPaid: boolean;
  subscriptionStatus: string;
  planType: string | null;
  currentPeriodEnd: string | null;
};

function UpgradeSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { session } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      router.push("/auth/signin?redirect=/upgrade/success");
      return;
    }

    // Fetch subscription status
    const fetchStatus = async () => {
      try {
        const token = session.access_token;
        const response = await fetch("/api/user/subscription-status", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setSubscriptionStatus(data);
        }
      } catch (error) {
        console.error("Error fetching subscription status:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [session, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Confirming your subscription...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container max-w-3xl mx-auto px-4 py-16">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>

          <h1 className="text-4xl font-bold mb-4">
            Welcome to the Founding Family!
          </h1>

          <p className="text-xl text-muted-foreground mb-2">
            Your subscription is now active
          </p>

          {subscriptionStatus?.currentPeriodEnd && (
            <p className="text-sm text-muted-foreground">
              Active until{" "}
              {new Date(subscriptionStatus.currentPeriodEnd).toLocaleDateString(
                "en-US",
                {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }
              )}
            </p>
          )}
        </div>

        {/* What's Next Section */}
        <div className="bg-card border rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6">What's next?</h2>

          <div className="space-y-6">
            {/* Timeline */}
            <Link
              href="/timeline"
              className="flex items-start gap-4 p-4 rounded-lg border hover:border-primary/50 hover:bg-muted/50 transition-all group"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                  Continue Your Story
                </h3>
                <p className="text-sm text-muted-foreground">
                  Record more memories and watch your timeline grow
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-3" />
            </Link>

            {/* Book View */}
            <Link
              href="/book"
              className="flex items-start gap-4 p-4 rounded-lg border hover:border-primary/50 hover:bg-muted/50 transition-all group"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Book className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                  View Your Book
                </h3>
                <p className="text-sm text-muted-foreground">
                  See your stories laid out in beautiful book format
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-3" />
            </Link>

            {/* Family Sharing */}
            <Link
              href="/family"
              className="flex items-start gap-4 p-4 rounded-lg border hover:border-primary/50 hover:bg-muted/50 transition-all group"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                  Invite Your Family
                </h3>
                <p className="text-sm text-muted-foreground">
                  Share your stories with loved ones and collaborate together
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-3" />
            </Link>
          </div>
        </div>

        {/* Premium Features Unlocked */}
        <div className="bg-muted/30 rounded-lg p-6 mb-8">
          <h3 className="font-semibold mb-4">Premium Features Unlocked:</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm">Unlimited stories and memories</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm">Family sharing and collaboration</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm">Beautiful book and timeline views</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm">Safe cloud backup forever</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm">PDF export for printing</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm">Priority email support</span>
            </li>
          </ul>
        </div>

        {/* Billing Management */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Need to update your payment method or manage your subscription?{" "}
            <Link
              href="/profile"
              className="text-primary hover:underline font-medium"
            >
              Visit your profile
            </Link>
          </p>
        </div>

        {sessionId && (
          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground">
              Session ID: {sessionId.slice(0, 20)}...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UpgradeSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <UpgradeSuccessContent />
    </Suspense>
  );
}
