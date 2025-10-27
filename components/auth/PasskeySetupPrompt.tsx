"use client";

/**
 * PasskeySetupPrompt Component
 *
 * Shows after successful email/password login to offer passkey setup.
 * Senior-friendly UI with clear benefits explanation.
 */

import { useState } from "react";
import { startRegistration } from "@simplewebauthn/browser";
import type { PublicKeyCredentialCreationOptionsJSON } from "@simplewebauthn/types";
import { Fingerprint, X, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { logger } from "@/lib/logger";
import { apiRequest } from "@/lib/queryClient";

interface PasskeySetupPromptProps {
  email: string;
  password: string; // We have this from the successful login
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function PasskeySetupPrompt({
  email,
  password,
  isOpen,
  onClose,
  onSuccess,
}: PasskeySetupPromptProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSetup = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Get registration options from server
      const optionsRes = await fetch("/api/passkey/register-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!optionsRes.ok) {
        const data = await optionsRes.json();
        throw new Error(data.error || "Failed to generate passkey options");
      }

      const { options, userId } = await optionsRes.json();

      // Step 2: Prompt user to create passkey
      const credential = await startRegistration(
        options as PublicKeyCredentialCreationOptionsJSON
      );

      // Step 3: Send credential to server for verification
      const verifyRes = await fetch("/api/passkey/register-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          credential,
          challenge: options.challenge,
        }),
      });

      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        throw new Error(data.error || "Failed to verify passkey");
      }

      logger.info("[PasskeySetupPrompt] Setup successful");
      setSuccess(true);

      // Show success message briefly, then close
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (err: any) {
      const message =
        err.name === "NotAllowedError"
          ? "Setup was cancelled. You can set up a passkey anytime in Settings."
          : err.message || "Failed to set up passkey";

      logger.error("[PasskeySetupPrompt] Error:", message);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async (preference: "later" | "never") => {
    try {
      // Store preference in database
      await apiRequest("POST", "/api/user/passkey-preference", { preference });
    } catch (err) {
      logger.error("[PasskeySetupPrompt] Failed to save preference:", err);
      // Still close the dialog even if API fails
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        {success ? (
          // Success state
          <div className="flex flex-col items-center justify-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <DialogTitle className="text-xl text-center mb-2">
              Passkey set up successfully!
            </DialogTitle>
            <DialogDescription className="text-center text-base">
              You can now sign in with your fingerprint or face.
            </DialogDescription>
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center">
                    <Fingerprint className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl">
                      Sign in faster next time?
                    </DialogTitle>
                    <DialogDescription className="text-sm text-gray-500">
                      Set up a passkey in just a few seconds
                    </DialogDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSkip("later")}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900 mb-3">
                  <strong>What's a passkey?</strong>
                </p>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">✓</span>
                    <span>
                      Use your fingerprint, face, or security key to sign in
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">✓</span>
                    <span>No password to remember or type</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">✓</span>
                    <span>More secure than passwords</span>
                  </li>
                </ul>
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                  {error}
                </div>
              )}
            </div>

            <DialogFooter className="flex-col sm:flex-col gap-2">
              <Button
                onClick={handleSetup}
                disabled={isLoading}
                className="w-full h-12 text-base"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <Fingerprint className="w-5 h-5 mr-2" />
                    Set Up Passkey
                  </>
                )}
              </Button>
              <div className="flex flex-col sm:flex-row gap-2 w-full">
                <Button
                  variant="outline"
                  onClick={() => handleSkip("later")}
                  disabled={isLoading}
                  className="flex-1 text-gray-700"
                >
                  Maybe later
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => handleSkip("never")}
                  disabled={isLoading}
                  className="flex-1 text-gray-500"
                >
                  Don't show again
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
