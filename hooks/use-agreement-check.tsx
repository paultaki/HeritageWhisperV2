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
        // Get the current session token
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          setStatus((prev) => ({ ...prev, loading: false }));
          return;
        }

        const response = await fetch("/api/agreements/status", {
          headers: {
            "Authorization": `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          console.error("Failed to check agreement status");
          setStatus((prev) => ({ ...prev, loading: false }));
          return;
        }

        const data = await response.json();

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
        console.error("Error checking agreement status:", error);
        setStatus((prev) => ({ ...prev, loading: false }));
      }
    };

    checkAgreementStatus();
  }, [user]);

  return status;
}
