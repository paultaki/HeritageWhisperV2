'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Gift, Copy, Check, Download, Mail } from 'lucide-react'

interface GiftCodeData {
  code: string
  expiresAt: string
  purchaserName: string | null
}

// Wrapper with Suspense boundary for useSearchParams
export default function GiftSuccessPage() {
  return (
    <Suspense fallback={<SuccessPageSkeleton />}>
      <GiftSuccessContent />
    </Suspense>
  )
}

function SuccessPageSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--hw-page-bg)]">
      <header className="bg-[var(--hw-surface)] border-b border-[var(--hw-border-subtle)]">
        <div className="max-w-[1140px] mx-auto px-6 py-4">
          <div className="h-10 w-[200px] bg-gray-200 rounded animate-pulse" />
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-[var(--hw-primary)]/30 border-t-[var(--hw-primary)] rounded-full animate-spin mx-auto mb-6" />
          <div className="h-8 w-64 bg-gray-200 rounded mx-auto mb-2 animate-pulse" />
          <div className="h-5 w-48 bg-gray-200 rounded mx-auto animate-pulse" />
        </div>
      </main>
    </div>
  )
}

function GiftSuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  const [giftCode, setGiftCode] = useState<GiftCodeData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!sessionId) {
      setError('Missing session information')
      setIsLoading(false)
      return
    }

    // Fetch the gift code from the API
    const fetchGiftCode = async () => {
      try {
        const response = await fetch(`/api/gift/session/${sessionId}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to retrieve gift code')
        }

        setGiftCode(data)
      } catch (err: any) {
        setError(err.message || 'Failed to load gift code')
      } finally {
        setIsLoading(false)
      }
    }

    // Poll for the gift code (webhook may take a moment)
    let attempts = 0
    const maxAttempts = 10
    const pollInterval = setInterval(async () => {
      attempts++
      try {
        const response = await fetch(`/api/gift/session/${sessionId}`)
        if (response.ok) {
          const data = await response.json()
          setGiftCode(data)
          setIsLoading(false)
          clearInterval(pollInterval)
        } else if (attempts >= maxAttempts) {
          setError('Gift code is being generated. Please refresh in a moment.')
          setIsLoading(false)
          clearInterval(pollInterval)
        }
      } catch {
        if (attempts >= maxAttempts) {
          setError('Unable to retrieve gift code. Please check your email for details.')
          setIsLoading(false)
          clearInterval(pollInterval)
        }
      }
    }, 2000)

    return () => clearInterval(pollInterval)
  }, [sessionId])

  const handleCopy = async () => {
    if (!giftCode) return
    try {
      await navigator.clipboard.writeText(giftCode.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = giftCode.code
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const redeemUrl = giftCode ? `${window.location.origin}/gift/redeem?code=${giftCode.code}` : ''

  return (
    <div className="min-h-screen bg-[var(--hw-page-bg)]">
      {/* Simple Header */}
      <header className="bg-[var(--hw-surface)] border-b border-[var(--hw-border-subtle)] print:hidden">
        <div className="max-w-[1140px] mx-auto px-6 py-4">
          <Link href="/" className="inline-block">
            <Image
              src="/final logo/logo-new.svg"
              alt="HeritageWhisper"
              width={200}
              height={48}
              className="h-10 w-auto"
              priority
            />
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12 md:py-16">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-[var(--hw-primary)]/30 border-t-[var(--hw-primary)] rounded-full animate-spin mx-auto mb-6" />
            <h2 className="text-xl font-semibold text-[var(--hw-text-primary)] mb-2">
              Generating your gift code...
            </h2>
            <p className="text-[var(--hw-text-muted)]">
              This will only take a moment
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-6">
              <Gift className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-semibold text-[var(--hw-text-primary)] mb-2">
              Almost there!
            </h2>
            <p className="text-[var(--hw-text-secondary)] mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-[var(--hw-primary)] text-white font-medium rounded-xl hover:bg-[var(--hw-primary-hover)] transition-colors"
            >
              Refresh Page
            </button>
          </div>
        ) : giftCode ? (
          <>
            {/* Success Header */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-3xl md:text-4xl font-semibold text-[var(--hw-text-primary)] mb-3">
                Your Gift is Ready!
              </h1>
              <p className="text-lg text-[var(--hw-text-secondary)]">
                Share this code with your loved one
              </p>
            </div>

            {/* Gift Code Card */}
            <div className="bg-[var(--hw-surface)] rounded-2xl p-8 border-2 border-[var(--hw-secondary)] shadow-lg mb-8 print:border print:shadow-none">
              {/* Printable Header - only shows when printing */}
              <div className="hidden print:block text-center mb-8">
                <Image
                  src="/final logo/logo-new.svg"
                  alt="HeritageWhisper"
                  width={200}
                  height={48}
                  className="h-12 w-auto mx-auto mb-4"
                />
                <h2 className="text-2xl font-semibold">A Gift for You</h2>
                <p className="text-gray-600">
                  One year of HeritageWhisper Premium
                </p>
              </div>

              <div className="text-center">
                <p className="text-sm font-medium text-[var(--hw-text-muted)] uppercase tracking-wide mb-3">
                  Your Gift Code
                </p>
                <div className="bg-[var(--hw-page-bg)] rounded-xl p-6 mb-6">
                  <p className="text-3xl md:text-4xl font-mono font-bold text-[var(--hw-primary)] tracking-wider">
                    {giftCode.code}
                  </p>
                </div>

                {/* Action Buttons - hide on print */}
                <div className="flex flex-col sm:flex-row gap-3 print:hidden">
                  <button
                    onClick={handleCopy}
                    className="flex-1 min-h-[48px] px-6 py-3 bg-[var(--hw-primary)] text-white font-medium rounded-xl hover:bg-[var(--hw-primary-hover)] transition-all flex items-center justify-center gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="w-5 h-5" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5" />
                        Copy Code
                      </>
                    )}
                  </button>
                  <button
                    onClick={handlePrint}
                    className="flex-1 min-h-[48px] px-6 py-3 border border-[var(--hw-border-subtle)] text-[var(--hw-text-primary)] font-medium rounded-xl hover:bg-[var(--hw-section-bg)] transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Print Gift Card
                  </button>
                </div>

                {/* Redemption Link */}
                <div className="mt-6 pt-6 border-t border-[var(--hw-border-subtle)]">
                  <p className="text-sm text-[var(--hw-text-muted)] mb-2">
                    Or share this redemption link:
                  </p>
                  <div className="flex items-center gap-2 bg-[var(--hw-page-bg)] rounded-lg p-3">
                    <input
                      type="text"
                      readOnly
                      value={redeemUrl}
                      className="flex-1 bg-transparent text-sm text-[var(--hw-text-secondary)] outline-none"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(redeemUrl)
                        setCopied(true)
                        setTimeout(() => setCopied(false), 2000)
                      }}
                      className="p-2 text-[var(--hw-primary)] hover:bg-[var(--hw-secondary-soft)] rounded-lg transition-colors print:hidden"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expiration */}
                <p className="mt-6 text-sm text-[var(--hw-text-muted)]">
                  Valid until{' '}
                  {new Date(giftCode.expiresAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-[var(--hw-secondary-soft)] rounded-2xl p-6 print:bg-gray-100">
              <h3 className="font-semibold text-[var(--hw-text-primary)] mb-4">
                How to Share Your Gift
              </h3>
              <ul className="space-y-3 text-[var(--hw-text-secondary)]">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[var(--hw-secondary)] text-white text-sm flex items-center justify-center flex-shrink-0">
                    1
                  </span>
                  <span>Copy the code or print this page as a gift card</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[var(--hw-secondary)] text-white text-sm flex items-center justify-center flex-shrink-0">
                    2
                  </span>
                  <span>Share it in person, in a card, or via text/email</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[var(--hw-secondary)] text-white text-sm flex items-center justify-center flex-shrink-0">
                    3
                  </span>
                  <span>
                    They visit{' '}
                    <span className="font-medium">heritagewhisper.com/gift/redeem</span>{' '}
                    to activate
                  </span>
                </li>
              </ul>
            </div>

            {/* Receipt Note */}
            <p className="mt-8 text-center text-sm text-[var(--hw-text-muted)] print:hidden">
              <Mail className="w-4 h-4 inline-block mr-1" />
              A receipt has been sent to your email
            </p>
          </>
        ) : null}
      </main>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
        }
      `}</style>
    </div>
  )
}
