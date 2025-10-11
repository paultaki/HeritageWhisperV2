"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

interface AgreementStatus {
  needsTerms: boolean;
  needsPrivacy: boolean;
  needsAny: boolean;
  termsVersion: string;
  privacyVersion: string;
  isCompliant: boolean;
  loading: boolean;
}

export function useAgreementCheck(): AgreementStatus {
  const { user } = useAuth();
  const [status, setStatus] = useState<AgreementStatus>({
    needsTerms: false,
    needsPrivacy: false,
    needsAny: false,
    termsVersion: "1.0",
    privacyVersion: "1.0",
    isCompliant: true,
    loading: true,
  });

  useEffect(() => {
    const checkAgreementStatus = async () => {
      if (!user) {
        setStatus((prev) => ({ ...prev, loading: false }));
        return;
      }

      try {
        // Get the current session token with retry logic
        let session = null;
        for (let attempt = 0; attempt < 5; attempt++) {
          const {
            data: { session: checkSession },
          } = await supabase.auth.getSession();
          if (checkSession) {
            session = checkSession;
            break;
          }
          // Wait a bit before retrying
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        if (!session) {
          console.log("[AgreementCheck] No session found after retries");
          setStatus((prev) => ({ ...prev, loading: false }));
          return;
        }

        const response = await fetch("/api/agreements/status", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          console.error(
            "[AgreementCheck] Failed to check agreement status:",
            response.status,
          );
          setStatus((prev) => ({ ...prev, loading: false }));
          return;
        }

        const data = await response.json();
        console.log("[AgreementCheck] Agreement status:", data);

        setStatus({
          needsTerms: data.needsAcceptance.terms,
          needsPrivacy: data.needsAcceptance.privacy,
          needsAny: data.needsAcceptance.any,
          termsVersion: data.currentVersions.terms,
          privacyVersion: data.currentVersions.privacy,
          isCompliant: data.isCompliant,
          loading: false,
        });
      } catch (error) {
        console.error(
          "[AgreementCheck] Error checking agreement status:",
          error,
        );
        setStatus((prev) => ({ ...prev, loading: false }));
      }
    };

    checkAgreementStatus();
  }, [user]);

  return status;
}
