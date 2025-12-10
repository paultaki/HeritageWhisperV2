'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Gift, Copy, Check, Download, Mail } from 'lucide-react'
import { GiftCard } from '@/components/gift/GiftCard'

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
    <div className="min-h-screen bg-[var(--hw-page-bg)] print:bg-white">
      <header className="bg-[var(--hw-surface)] border-b border-[var(--hw-border-subtle)] print:hidden">
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

  return (
    <div className="min-h-screen bg-[var(--hw-page-bg)] print:bg-white">
      {/* Simple Header - hidden when printing */}
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

      <main className="max-w-2xl mx-auto px-6 py-12 md:py-16 print:py-8 print:px-4">
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
            {/* Success Header - hidden when printing */}
            <div className="text-center mb-10 print:hidden">
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

            {/* Gift Card - shared layout for screen and print */}
            <GiftCard code={giftCode.code} expiresAt={giftCode.expiresAt} />

            {/* Action Buttons - hidden when printing */}
            <div className="mt-8 print:hidden">
              <div className="flex flex-col sm:flex-row gap-3">
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
            </div>

            {/* Receipt Note - hidden when printing */}
            <p className="mt-8 text-center text-sm text-[var(--hw-text-muted)] print:hidden">
              <Mail className="w-4 h-4 inline-block mr-1" />
              A receipt has been sent to your email
            </p>
          </>
        ) : null}
      </main>
    </div>
  )
}
