'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Gift, Check, ArrowRight, AlertCircle, User } from 'lucide-react'
import { useAuth } from '@/lib/auth'

interface GiftDetails {
  purchaserName: string | null
  expiresAt: string
}

export default function GiftRedeemPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const codeFromUrl = searchParams.get('code')
  const { user, isLoading: authLoading } = useAuth()

  const [step, setStep] = useState<'enter' | 'validate' | 'redeem' | 'success'>('enter')
  const [code, setCode] = useState(codeFromUrl || '')
  const [giftDetails, setGiftDetails] = useState<GiftDetails | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isRedeeming, setIsRedeeming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Auto-validate if code is in URL
  useEffect(() => {
    if (codeFromUrl && !giftDetails) {
      handleValidate()
    }
  }, [codeFromUrl])

  const handleValidate = async () => {
    if (!code.trim()) {
      setError('Please enter a gift code')
      return
    }

    setError(null)
    setIsValidating(true)

    try {
      const response = await fetch('/api/gift/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      })

      const data = await response.json()

      if (!data.valid) {
        setError(data.error || 'Invalid gift code')
        setIsValidating(false)
        return
      }

      setGiftDetails(data.giftDetails)
      setStep('validate')
    } catch (err: any) {
      setError('Unable to validate code. Please try again.')
    } finally {
      setIsValidating(false)
    }
  }

  const handleRedeem = async () => {
    if (!user) {
      // Redirect to login with return URL
      router.push(`/auth/login?redirect=/gift/redeem?code=${encodeURIComponent(code)}`)
      return
    }

    setError(null)
    setIsRedeeming(true)

    try {
      // Get auth token
      const { supabase } = await import('@/lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        router.push(`/auth/login?redirect=/gift/redeem?code=${encodeURIComponent(code)}`)
        return
      }

      const response = await fetch('/api/gift/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ code: code.trim() }),
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.error || 'Failed to redeem gift code')
        setIsRedeeming(false)
        return
      }

      setSuccessMessage(data.message)
      setStep('success')
    } catch (err: any) {
      setError('Unable to redeem code. Please try again.')
    } finally {
      setIsRedeeming(false)
    }
  }

  // Format code as user types (add dashes)
  const handleCodeChange = (value: string) => {
    // Remove all non-alphanumeric
    let cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()

    // Limit to 16 characters (GIFT + 12 chars)
    if (cleaned.length > 16) {
      cleaned = cleaned.slice(0, 16)
    }

    // Add dashes
    if (cleaned.startsWith('GIFT') && cleaned.length > 4) {
      const afterGift = cleaned.slice(4)
      const parts = []
      for (let i = 0; i < afterGift.length; i += 4) {
        parts.push(afterGift.slice(i, i + 4))
      }
      cleaned = `GIFT-${parts.join('-')}`
    }

    setCode(cleaned)
  }

  return (
    <div className="min-h-screen bg-[var(--hw-page-bg)]">
      {/* Simple Header */}
      <header className="bg-[var(--hw-surface)] border-b border-[var(--hw-border-subtle)]">
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

      <main className="max-w-xl mx-auto px-6 py-12 md:py-16">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[var(--hw-secondary-soft)] rounded-full mb-6">
            <Gift className="w-10 h-10 text-[var(--hw-secondary)]" />
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold text-[var(--hw-primary)] mb-3">
            {step === 'success' ? 'Welcome to HeritageWhisper!' : 'Redeem Your Gift'}
          </h1>
          <p className="text-lg text-[var(--hw-text-secondary)]">
            {step === 'success'
              ? 'Your gift has been activated'
              : 'Enter your gift code to get started'}
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-[var(--hw-surface)] rounded-2xl p-8 border border-[var(--hw-border-subtle)] shadow-sm">
          {step === 'enter' && (
            <>
              {/* Code Input - Large and Senior-Friendly */}
              <div className="mb-6">
                <label
                  htmlFor="code"
                  className="block text-lg font-medium text-[var(--hw-text-primary)] mb-3"
                >
                  Gift Code
                </label>
                <input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  placeholder="GIFT-XXXX-XXXX-XXXX"
                  autoComplete="off"
                  autoCapitalize="characters"
                  className="w-full px-5 py-4 text-xl md:text-2xl font-mono tracking-wider text-center rounded-xl border-2 border-[var(--hw-border-subtle)] bg-[var(--hw-page-bg)] text-[var(--hw-text-primary)] placeholder:text-[var(--hw-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--hw-primary)] focus:border-[var(--hw-primary)] transition-all"
                />
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              <button
                onClick={handleValidate}
                disabled={isValidating || !code.trim()}
                className="w-full min-h-[60px] px-6 py-4 bg-[var(--hw-primary)] text-white text-lg font-semibold rounded-xl hover:bg-[var(--hw-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
              >
                {isValidating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </>
          )}

          {step === 'validate' && giftDetails && (
            <>
              {/* Gift Validated */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-[var(--hw-text-primary)] mb-2">
                  Gift Code Valid!
                </h2>
                {giftDetails.purchaserName && (
                  <p className="text-[var(--hw-text-secondary)]">
                    This gift is from <strong>{giftDetails.purchaserName}</strong>
                  </p>
                )}
              </div>

              {/* What You'll Get */}
              <div className="bg-[var(--hw-secondary-soft)] rounded-xl p-5 mb-8">
                <h3 className="font-medium text-[var(--hw-text-primary)] mb-3">
                  What You'll Receive:
                </h3>
                <ul className="space-y-2 text-[var(--hw-text-secondary)]">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[var(--hw-secondary)]" />
                    One full year of Premium access
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[var(--hw-secondary)]" />
                    Unlimited story recordings
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[var(--hw-secondary)]" />
                    Share with unlimited family members
                  </li>
                </ul>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              {/* Sign In or Activate */}
              {authLoading ? (
                <div className="text-center py-4">
                  <div className="w-8 h-8 border-3 border-[var(--hw-primary)]/30 border-t-[var(--hw-primary)] rounded-full animate-spin mx-auto" />
                </div>
              ) : user ? (
                <>
                  <div className="flex items-center gap-3 p-4 bg-[var(--hw-page-bg)] rounded-xl mb-6">
                    <div className="w-10 h-10 rounded-full bg-[var(--hw-primary)] flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-[var(--hw-text-muted)]">Activating for:</p>
                      <p className="font-medium text-[var(--hw-text-primary)]">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleRedeem}
                    disabled={isRedeeming}
                    className="w-full min-h-[60px] px-6 py-4 bg-[var(--hw-primary)] text-white text-lg font-semibold rounded-xl hover:bg-[var(--hw-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                  >
                    {isRedeeming ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Activating...
                      </>
                    ) : (
                      <>
                        Activate My Gift
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <p className="text-center text-[var(--hw-text-secondary)] mb-6">
                    Sign in or create an account to activate your gift
                  </p>
                  <div className="space-y-3">
                    <Link
                      href={`/auth/login?redirect=/gift/redeem?code=${encodeURIComponent(code)}`}
                      className="w-full min-h-[60px] px-6 py-4 bg-[var(--hw-primary)] text-white text-lg font-semibold rounded-xl hover:bg-[var(--hw-primary-hover)] transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                    >
                      Sign In
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                    <Link
                      href={`/auth/register?redirect=/gift/redeem?code=${encodeURIComponent(code)}`}
                      className="w-full min-h-[60px] px-6 py-4 border-2 border-[var(--hw-primary)] text-[var(--hw-primary)] text-lg font-semibold rounded-xl hover:bg-[var(--hw-primary)] hover:text-white transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      Create Account
                    </Link>
                  </div>
                </>
              )}

              <button
                onClick={() => {
                  setStep('enter')
                  setGiftDetails(null)
                  setError(null)
                }}
                className="w-full mt-4 py-3 text-[var(--hw-text-muted)] hover:text-[var(--hw-text-primary)] transition-colors"
              >
                Use a different code
              </button>
            </>
          )}

          {step === 'success' && (
            <>
              {/* Success State */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-semibold text-[var(--hw-text-primary)] mb-4">
                  You're All Set!
                </h2>
                <p className="text-lg text-[var(--hw-text-secondary)] mb-8">
                  {successMessage}
                </p>
                <Link
                  href="/timeline"
                  className="inline-flex items-center justify-center gap-2 min-h-[60px] px-8 py-4 bg-[var(--hw-primary)] text-white text-lg font-semibold rounded-xl hover:bg-[var(--hw-primary-hover)] transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Start Recording Stories
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Help Text */}
        {step !== 'success' && (
          <p className="mt-8 text-center text-sm text-[var(--hw-text-muted)]">
            Need help? Contact us at{' '}
            <a
              href="mailto:support@heritagewhisper.com"
              className="text-[var(--hw-primary)] hover:underline"
            >
              support@heritagewhisper.com
            </a>
          </p>
        )}
      </main>
    </div>
  )
}
