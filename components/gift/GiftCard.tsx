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
 * - Centered layout for print, two-column on desktop screen
 * - Senior-friendly typography (18px+ body, high contrast)
 */
export function GiftCard({ code, expiresAt }: GiftCardProps) {
  const formattedDate = new Date(expiresAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="bg-[var(--hw-surface)] rounded-2xl p-6 sm:p-8 border border-[var(--hw-border-subtle)] shadow-sm print:border print:shadow-none print:bg-white print:p-4 print:max-w-md print:mx-auto">
      {/* Card Header */}
      <div className="text-center mb-6 print:mb-4">
        <Image
          src="/final logo/logo-new.svg"
          alt="HeritageWhisper"
          width={180}
          height={43}
          className="h-10 w-auto mx-auto mb-3 print:h-8 print:mb-2"
          priority
        />
        <h2 className="text-2xl font-semibold text-[var(--hw-text-primary)] print:text-[#1F1F1F] print:text-xl">
          A Gift for You
        </h2>
        <p className="text-[var(--hw-text-secondary)] mt-1 text-center print:text-[#4A4A4A] print:text-sm">
          One year of HeritageWhisper Premium
        </p>
      </div>

      {/* Gift Code Display */}
      <div className="mb-6 print:mb-4">
        <p className="text-sm font-medium text-[var(--hw-text-muted)] uppercase tracking-wide mb-2 text-center print:text-[#8A8378] print:text-xs print:mb-1">
          Your Gift Code
        </p>
        <div className="bg-[var(--hw-page-bg)] rounded-xl p-4 sm:p-6 print:bg-[#F5F5F5] print:p-3 print:rounded-lg">
          {/* Mobile: smaller text, allow wrapping. Desktop/Print: single line */}
          <p className="text-xl sm:text-3xl md:text-4xl font-mono font-bold text-[var(--hw-primary)] tracking-[0.05em] sm:tracking-[0.1em] text-center break-all sm:break-normal print:text-[#203954] print:text-2xl print:tracking-[0.08em]">
            {code}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[var(--hw-border-subtle)] my-6 print:border-[#D2C9BD] print:my-4" />

      {/* QR Code and Redemption Instructions */}
      {/* Desktop: two column. Mobile & Print: stacked and centered */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center md:items-start print:flex-col print:items-center print:gap-3">
        {/* QR Code - centered on mobile/print */}
        <div className="flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/gift-qr-code.svg"
            alt="Scan to redeem your HeritageWhisper gift"
            className="h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32 print:h-20 print:w-20"
          />
        </div>

        {/* Redemption Instructions */}
        <div className="flex-1 w-full">
          <h3 className="font-semibold text-[var(--hw-text-primary)] mb-3 text-lg text-center md:text-left print:text-[#1F1F1F] print:text-base print:text-center print:mb-2">
            How to redeem your gift
          </h3>
          <ol className="space-y-2 sm:space-y-3 text-[var(--hw-text-secondary)] print:text-[#4A4A4A] print:space-y-1">
            <li className="flex items-start gap-2 sm:gap-3">
              <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[var(--hw-secondary)] text-white text-xs sm:text-sm flex items-center justify-center flex-shrink-0 print:bg-[#3E6A5A] print:w-5 print:h-5 print:text-xs">
                1
              </span>
              <span className="text-sm sm:text-base print:text-sm">
                Scan the QR code or visit{' '}
                <span className="font-medium break-all">heritagewhisper.com/gift/redeem</span>
              </span>
            </li>
            <li className="flex items-start gap-2 sm:gap-3">
              <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[var(--hw-secondary)] text-white text-xs sm:text-sm flex items-center justify-center flex-shrink-0 print:bg-[#3E6A5A] print:w-5 print:h-5 print:text-xs">
                2
              </span>
              <span className="text-sm sm:text-base print:text-sm">Enter the gift code exactly as shown</span>
            </li>
            <li className="flex items-start gap-2 sm:gap-3">
              <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[var(--hw-secondary)] text-white text-xs sm:text-sm flex items-center justify-center flex-shrink-0 print:bg-[#3E6A5A] print:w-5 print:h-5 print:text-xs">
                3
              </span>
              <span className="text-sm sm:text-base print:text-sm">Create or sign in to activate</span>
            </li>
          </ol>
        </div>
      </div>

      {/* Fallback text for print (if QR doesn't scan) */}
      <p className="hidden print:block text-xs text-[#8A8378] text-center mt-3">
        If the QR code does not scan, visit heritagewhisper.com/gift/redeem and enter the code above.
      </p>

      {/* Expiration */}
      <p className="mt-6 text-sm text-[var(--hw-text-muted)] text-center print:text-[#8A8378] print:mt-3 print:text-xs">
        Valid until {formattedDate}
      </p>
    </div>
  )
}
