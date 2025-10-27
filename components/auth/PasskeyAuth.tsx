"use client";

/**
 * PasskeyAuth Component
 *
 * Provides passkey authentication UI with senior-friendly design.
 * Supports both registration (after email/password) and authentication (sign-in).
 */

import { useState } from "react";
import { startRegistration, startAuthentication } from "@simplewebauthn/browser";
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/types";
import { Fingerprint, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";

interface PasskeyAuthProps {
  mode: "register" | "authenticate";
  email?: string; // Required for registration
  password?: string; // Required for registration
  onSuccess: (user: { id: string; email: string; name: string }) => void;
  onError?: (error: string) => void;
}

export function PasskeyAuth({
  mode,
  email,
  password,
  onSuccess,
  onError,
}: PasskeyAuthProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!email || !password) {
      const msg = "Email and password required for passkey setup";
      setError(msg);
      onError?.(msg);
      return;
    }

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
      const credential = await startRegistration({
        optionsJSON: options as PublicKeyCredentialCreationOptionsJSON,
      } as any);

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

      const result = await verifyRes.json();
      logger.info("[PasskeyAuth] Registration successful", result);

      // Success!
      onSuccess({ id: userId, email, name: email.split("@")[0] });
    } catch (err: any) {
      let message: string;

      if (err.name === "NotAllowedError") {
        message = "Passkey setup was cancelled";
      } else if (err.message?.includes("RP ID") || err.message?.includes("invalid for this domain")) {
        // RP_ID mismatch error - provide helpful troubleshooting
        message =
          "Passkey configuration error. This usually resolves by refreshing the page. " +
          "If the issue persists, please contact support.";
        logger.error(
          "[PasskeyAuth] RP_ID mismatch detected. Check ORIGIN and RP_ID environment variables. " +
            "For localhost, use RP_ID=localhost. For production, ensure RP_ID matches your domain.",
          err.message
        );
      } else {
        message = err.message || "Failed to set up passkey";
      }

      logger.error("[PasskeyAuth] Registration error:", message);
      setError(message);
      onError?.(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthenticate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Get authentication options from server
      const optionsRes = await fetch("/api/passkey/auth-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!optionsRes.ok) {
        throw new Error("Failed to generate authentication options");
      }

      const { options } = await optionsRes.json();

      // Step 2: Prompt user to authenticate with passkey
      const credential = await startAuthentication({
        optionsJSON: options as PublicKeyCredentialRequestOptionsJSON,
      } as any);

      // Step 3: Send credential to server for verification
      const verifyRes = await fetch("/api/passkey/auth-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credential,
          challenge: options.challenge,
        }),
      });

      if (!verifyRes.ok) {
        const data = await verifyRes.json();

        // Handle counter regression specifically
        if (data.code === "COUNTER_REGRESSION") {
          throw new Error(
            "Security alert: This passkey appears to have been copied. Please use a different sign-in method."
          );
        }

        throw new Error(data.error || "Failed to verify passkey");
      }

      const { user } = await verifyRes.json();
      logger.info("[PasskeyAuth] Authentication successful");

      // Success!
      onSuccess(user);
    } catch (err: any) {
      let message: string;

      if (err.name === "NotAllowedError") {
        message = "Sign-in was cancelled";
      } else if (err.message?.includes("RP ID") || err.message?.includes("invalid for this domain")) {
        // RP_ID mismatch error - provide helpful troubleshooting
        message =
          "Passkey configuration error. This usually resolves by refreshing the page. " +
          "If the issue persists, please contact support.";
        logger.error(
          "[PasskeyAuth] RP_ID mismatch detected. Check ORIGIN and RP_ID environment variables. " +
            "For localhost, use RP_ID=localhost. For production, ensure RP_ID matches your domain.",
          err.message
        );
      } else {
        message = err.message || "Failed to sign in with passkey";
      }

      logger.error("[PasskeyAuth] Authentication error:", message);
      setError(message);
      onError?.(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = () => {
    if (mode === "register") {
      handleRegister();
    } else {
      handleAuthenticate();
    }
  };

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        className="w-full h-12 text-base font-medium"
        onClick={handleClick}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
        ) : (
          <Fingerprint className="w-5 h-5 mr-2" />
        )}
        {mode === "register"
          ? isLoading
            ? "Setting up..."
            : "Set up Passkey"
          : isLoading
            ? "Signing in..."
            : "Sign in with Passkey"}
      </Button>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
          {error}
        </div>
      )}

      {mode === "authenticate" && (
        <p className="text-xs text-gray-500 text-center">
          Use your fingerprint, face, or security key to sign in
        </p>
      )}
    </div>
  );
}
