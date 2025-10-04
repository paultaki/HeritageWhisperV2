"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useAgreementCheck } from "@/hooks/use-agreement-check";
import AgreementModal from "./AgreementModal";

// Pages that don't require agreement checking
const EXEMPT_PATHS = [
  "/",
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/callback",
  "/auth/verified",
  "/auth/check-email",
  "/terms",
  "/privacy",
];

interface AgreementGuardProps {
  children: React.ReactNode;
}

export default function AgreementGuard({ children }: AgreementGuardProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const agreementStatus = useAgreementCheck();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Don't show modal if:
    // 1. User is not logged in
    // 2. Still loading
    // 3. User is on an exempt path
    // 4. User is compliant with agreements
    if (!user || agreementStatus.loading) {
      setShowModal(false);
      return;
    }

    const isExemptPath = EXEMPT_PATHS.some((path) =>
      pathname === path || pathname?.startsWith(path + "/")
    );

    if (isExemptPath) {
      setShowModal(false);
      return;
    }

    // Show modal if user needs to accept any agreement
    if (agreementStatus.needsAny) {
      setShowModal(true);
    } else {
      setShowModal(false);
    }
  }, [user, pathname, agreementStatus]);

  const handleAccept = () => {
    setShowModal(false);
    // Trigger a re-check by reloading agreement status
    window.location.reload();
  };

  return (
    <>
      {children}
      {showModal && (
        <AgreementModal
          isOpen={showModal}
          onAccept={handleAccept}
          needsTerms={agreementStatus.needsTerms}
          needsPrivacy={agreementStatus.needsPrivacy}
          termsVersion={agreementStatus.termsVersion}
          privacyVersion={agreementStatus.privacyVersion}
        />
      )}
    </>
  );
}
