'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Gift, Heart, Mic, Clock, Check, ChevronRight } from 'lucide-react'

export default function GiftPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const canceled = searchParams.get('canceled')

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch('/api/gift/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchaserEmail: email,
          purchaserName: name,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout')
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
      setIsLoading(false)
    }
  }

  const features = [
    'One full year of HeritageWhisper Premium',
    'Unlimited story recordings',
    'AI-guided prompts and follow-up questions',
    'Share with unlimited family members',
    'Timeline and book views',
    'Download stories anytime',
  ]

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

      <main className="max-w-[1140px] mx-auto px-6 py-12 md:py-16">
        {/* Canceled Banner */}
        {canceled && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
            <p className="text-amber-800">
              Your checkout was canceled. No worries - your gift is still waiting when you're ready!
            </p>
          </div>
        )}

        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[var(--hw-secondary-soft)] rounded-full mb-6">
            <Gift className="w-10 h-10 text-[var(--hw-secondary)]" />
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-[var(--hw-primary)] mb-4">
            Give the Gift of Their Story
          </h1>
          <p className="text-lg md:text-xl text-[var(--hw-text-secondary)] max-w-2xl mx-auto">
            Help someone you love preserve their memories, wisdom, and voice for generations to come.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* What They'll Receive */}
          <div className="bg-[var(--hw-surface)] rounded-2xl p-8 border border-[var(--hw-border-subtle)]">
            <h2 className="text-xl font-semibold text-[var(--hw-text-primary)] mb-6">
              What They'll Receive
            </h2>

            <ul className="space-y-4 mb-8">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[var(--hw-secondary)] flex-shrink-0 mt-0.5" />
                  <span className="text-[var(--hw-text-secondary)]">{feature}</span>
                </li>
              ))}
            </ul>

            {/* How It Works */}
            <div className="border-t border-[var(--hw-border-subtle)] pt-6">
              <h3 className="text-lg font-medium text-[var(--hw-text-primary)] mb-4">
                How It Works
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--hw-secondary-soft)] flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-[var(--hw-secondary)]">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-[var(--hw-text-primary)]">You purchase the gift</p>
                    <p className="text-sm text-[var(--hw-text-muted)]">Complete your payment securely</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--hw-secondary-soft)] flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-[var(--hw-secondary)]">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-[var(--hw-text-primary)]">Get your gift code</p>
                    <p className="text-sm text-[var(--hw-text-muted)]">A unique code is displayed immediately</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--hw-secondary-soft)] flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-[var(--hw-secondary)]">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-[var(--hw-text-primary)]">Share it your way</p>
                    <p className="text-sm text-[var(--hw-text-muted)]">In a card, text, email - however you'd like</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Purchase Form */}
          <div className="bg-[var(--hw-surface)] rounded-2xl p-8 border border-[var(--hw-border-subtle)]">
            <div className="text-center mb-8">
              <div className="text-5xl font-bold text-[var(--hw-primary)] mb-2">$79</div>
              <p className="text-[var(--hw-text-muted)]">One-time payment • 1 year of Premium</p>
            </div>

            <form onSubmit={handlePurchase} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-[var(--hw-text-primary)] mb-2"
                >
                  Your Email (for receipt)
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-[var(--hw-border-subtle)] bg-[var(--hw-page-bg)] text-[var(--hw-text-primary)] placeholder:text-[var(--hw-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--hw-primary)] focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-[var(--hw-text-primary)] mb-2"
                >
                  Your Name (optional)
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-3 rounded-xl border border-[var(--hw-border-subtle)] bg-[var(--hw-page-bg)] text-[var(--hw-text-primary)] placeholder:text-[var(--hw-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--hw-primary)] focus:border-transparent transition-all"
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !email}
                className="w-full min-h-[56px] px-6 py-4 bg-[var(--hw-primary)] text-white font-semibold rounded-xl hover:bg-[var(--hw-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Give This Gift
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <p className="text-center text-sm text-[var(--hw-text-muted)]">
                Secure payment powered by Stripe
              </p>
            </form>

            {/* Trust Badges */}
            <div className="mt-8 pt-6 border-t border-[var(--hw-border-subtle)]">
              <div className="flex items-center justify-center gap-6 text-[var(--hw-text-muted)]">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Code never expires</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  <span className="text-sm">Perfect for any occasion</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-[var(--hw-text-secondary)] mb-2">
            Already have a gift code?
          </p>
          <Link
            href="/gift/redeem"
            className="text-[var(--hw-primary)] font-medium hover:underline"
          >
            Redeem it here
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--hw-border-subtle)] py-8 mt-16">
        <div className="max-w-[1140px] mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-4 text-sm text-[var(--hw-text-muted)]">
            <Link href="/terms" className="hover:text-[var(--hw-text-primary)]">
              Terms
            </Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-[var(--hw-text-primary)]">
              Privacy
            </Link>
            <span>•</span>
            <Link href="/" className="hover:text-[var(--hw-text-primary)]">
              Home
            </Link>
          </div>
          <p className="mt-4 text-sm text-[var(--hw-text-muted)]">
            © 2025 HeritageWhisper. Preserving wisdom, one story at a time.
          </p>
        </div>
      </footer>
    </div>
  )
}
