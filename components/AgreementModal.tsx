"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface AgreementModalProps {
  isOpen: boolean;
  onAccept: () => void;
  needsTerms: boolean;
  needsPrivacy: boolean;
  termsVersion: string;
  privacyVersion: string;
}

export default function AgreementModal({
  isOpen,
  onAccept,
  needsTerms,
  needsPrivacy,
  termsVersion,
  privacyVersion,
}: AgreementModalProps) {
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAccept = async () => {
    if (!agreed) {
      toast({
        title: "Agreement Required",
        description: "Please check the box to accept the updated terms",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Get the auth token from Supabase
      const token = (await import("@/lib/supabase")).supabase.auth
        .getSession()
        .then((res) => res.data.session?.access_token);

      if (!token) {
        throw new Error("No auth token found");
      }

      const agreementsToAccept = [];

      if (needsTerms) {
        agreementsToAccept.push(
          fetch("/api/agreements/accept", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${await token}`,
            },
            body: JSON.stringify({
              agreementType: "terms",
              version: termsVersion,
              method: "reacceptance",
            }),
          }),
        );
      }

      if (needsPrivacy) {
        agreementsToAccept.push(
          fetch("/api/agreements/accept", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${await token}`,
            },
            body: JSON.stringify({
              agreementType: "privacy",
              version: privacyVersion,
              method: "reacceptance",
            }),
          }),
        );
      }

      const responses = await Promise.all(agreementsToAccept);

      // Check if all requests succeeded
      const allSuccessful = responses.every((res) => res.ok);

      if (!allSuccessful) {
        throw new Error("Failed to record agreement acceptance");
      }

      toast({
        title: "Agreement Accepted",
        description: "Thank you for accepting the updated terms",
      });

      onAccept();
    } catch (error) {
      console.error("Error accepting agreements:", error);
      toast({
        title: "Error",
        description: "Failed to record your acceptance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getDescription = () => {
    if (needsTerms && needsPrivacy) {
      return `We've updated our Terms of Service (v${termsVersion}) and Privacy Policy (v${privacyVersion}). Please review and accept the updated documents to continue using HeritageWhisper.`;
    } else if (needsTerms) {
      return `We've updated our Terms of Service to version ${termsVersion}. Please review and accept the updated terms to continue using HeritageWhisper.`;
    } else if (needsPrivacy) {
      return `We've updated our Privacy Policy to version ${privacyVersion}. Please review and accept the updated policy to continue using HeritageWhisper.`;
    }
    return "";
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}} modal>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Updated Legal Documents</DialogTitle>
          <DialogDescription className="text-base pt-2">
            {getDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex gap-4">
            {needsTerms && (
              <Link
                href="/terms"
                target="_blank"
                className="flex-1 text-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium transition-colors"
              >
                View Terms of Service
              </Link>
            )}
            {needsPrivacy && (
              <Link
                href="/privacy"
                target="_blank"
                className="flex-1 text-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium transition-colors"
              >
                View Privacy Policy
              </Link>
            )}
          </div>

          <div className="flex items-start space-x-2 pt-4">
            <Checkbox
              id="agreement-modal"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked as boolean)}
            />
            <Label
              htmlFor="agreement-modal"
              className="text-sm leading-relaxed cursor-pointer"
            >
              I have read and agree to the updated{" "}
              {needsTerms &&
                needsPrivacy &&
                "Terms of Service and Privacy Policy"}
              {needsTerms && !needsPrivacy && "Terms of Service"}
              {!needsTerms && needsPrivacy && "Privacy Policy"}
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleAccept}
            disabled={!agreed || loading}
            className="w-full"
          >
            {loading ? "Accepting..." : "Accept and Continue"}
          </Button>
        </DialogFooter>

        <p className="text-xs text-muted-foreground text-center">
          You must accept the updated documents to continue using
          HeritageWhisper
        </p>
      </DialogContent>
    </Dialog>
  );
}
