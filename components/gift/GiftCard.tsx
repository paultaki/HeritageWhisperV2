import Image from 'next/image'

interface GiftCardProps {
  code: string
  expiresAt: string | Date
}

/**
 * GiftCard - A reusable gift card layout for both on-screen display and print.
 *
 * Used by:
 * - Gift success page (after purchase)
 * - Print view (triggered by window.print())
 *
 * Features:
 * - Static QR code linking to the general redeem page
 * - Prominent gift code display
 * - Two-column layout on desktop (QR left, instructions right)
 * - Stacks on mobile and print for clarity
 * - Senior-friendly typography (18px+ body, high contrast)
 */
export function GiftCard({ code, expiresAt }: GiftCardProps) {
  const formattedDate = new Date(expiresAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="bg-[var(--hw-surface)] rounded-2xl p-8 border border-[var(--hw-border-subtle)] shadow-sm print:border print:shadow-none print:bg-white print:p-6">
      {/* Card Header */}
      <div className="text-center mb-8">
        <Image
          src="/final logo/logo-new.svg"
          alt="HeritageWhisper"
          width={180}
          height={43}
          className="h-10 w-auto mx-auto mb-4"
          priority
        />
        <h2 className="text-2xl font-semibold text-[var(--hw-text-primary)] print:text-[#1F1F1F]">
          A Gift for You
        </h2>
        <p className="text-[var(--hw-text-secondary)] mt-1 print:text-[#4A4A4A]">
          One year of HeritageWhisper Premium
        </p>
      </div>

      {/* Gift Code Display */}
      <div className="mb-8">
        <p className="text-sm font-medium text-[var(--hw-text-muted)] uppercase tracking-wide mb-3 text-center print:text-[#8A8378]">
          Your Gift Code
        </p>
        <div className="bg-[var(--hw-page-bg)] rounded-xl p-6 print:bg-[#F5F5F5]">
          <p className="text-3xl md:text-4xl font-mono font-bold text-[var(--hw-primary)] tracking-[0.1em] text-center print:text-[#203954]">
            {code}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[var(--hw-border-subtle)] my-8 print:border-[#D2C9BD]" />

      {/* QR Code and Redemption Instructions - Two column on desktop, stacked on mobile/print */}
      <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
        {/* QR Code */}
        <div className="flex-shrink-0 mx-auto md:mx-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/gift-qr-code.svg"
            alt="Scan to redeem your HeritageWhisper gift"
            className="h-28 w-28 md:h-32 md:w-32 print:h-28 print:w-28"
          />
        </div>

        {/* Redemption Instructions */}
        <div className="flex-1">
          <h3 className="font-semibold text-[var(--hw-text-primary)] mb-4 text-lg print:text-[#1F1F1F]">
            How to redeem your gift
          </h3>
          <ol className="space-y-3 text-[var(--hw-text-secondary)] print:text-[#4A4A4A]">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[var(--hw-secondary)] text-white text-sm flex items-center justify-center flex-shrink-0 print:bg-[#3E6A5A]">
                1
              </span>
              <span>
                Scan the QR code or visit{' '}
                <span className="font-medium">heritagewhisper.com/gift/redeem</span>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[var(--hw-secondary)] text-white text-sm flex items-center justify-center flex-shrink-0 print:bg-[#3E6A5A]">
                2
              </span>
              <span>Enter the gift code exactly as shown above</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[var(--hw-secondary)] text-white text-sm flex items-center justify-center flex-shrink-0 print:bg-[#3E6A5A]">
                3
              </span>
              <span>Create or sign in to your account to activate</span>
            </li>
          </ol>
        </div>
      </div>

      {/* Fallback text for print (if QR doesn't scan) */}
      <p className="hidden print:block text-sm text-[#8A8378] text-center mt-6">
        If the QR code does not scan, visit heritagewhisper.com/gift/redeem and enter the code above.
      </p>

      {/* Expiration */}
      <p className="mt-8 text-sm text-[var(--hw-text-muted)] text-center print:text-[#8A8378]">
        Valid until {formattedDate}
      </p>
    </div>
  )
}
