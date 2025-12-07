import { Shield } from "lucide-react";

export function PrivacyInfoCard() {
  return (
    <div className="w-full py-4 px-5 rounded-xl bg-[#EFE6DA] flex items-center gap-3">
      <div className="inline-flex w-10 h-10 rounded-full bg-[#3E6A5A]/15 items-center justify-center shrink-0">
        <Shield className="w-5 h-5 text-[#3E6A5A]" />
      </div>
      <p className="text-base md:text-lg text-[#1F1F1F] leading-snug">
        Your stories are private. Only invited family can listen.
      </p>
    </div>
  );
}
