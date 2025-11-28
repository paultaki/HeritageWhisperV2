'use client'

import { useRouter } from 'next/navigation'

const features = [
  'Unlimited story recordings',
  'Your stories automatically transcribed',
  'Timeline, Living Book & Memory Box',
  'Share with unlimited family members',
  'Secure and backed up',
]

export default function PricingSection() {
  const router = useRouter()

  return (
    <section id="pricing" className="bg-[var(--hw-section-bg)] py-16 md:py-24 px-6 md:px-12">
      <div className="max-w-[1140px] mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-[28px] md:text-[32px] font-semibold text-[var(--hw-primary)] mb-3">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-[var(--hw-text-secondary)]">
            One simple price. Unlimited memories.
          </p>
        </div>

        {/* Pricing Card */}
        <div className="max-w-[480px] mx-auto">
          <div className="bg-[var(--hw-surface)] rounded-2xl shadow-lg border border-[var(--hw-border-subtle)] overflow-hidden">
            {/* Card Header */}
            <div className="p-8 pb-6 text-center">
              <h3 className="text-xl font-semibold text-[var(--hw-text-primary)] mb-6">
                The Family Legacy Plan
              </h3>

              {/* Price */}
              <div className="mb-4">
                <span className="text-2xl text-[var(--hw-text-muted)] line-through mr-3">$99</span>
                <span className="text-5xl md:text-6xl font-bold text-[var(--hw-primary)]">$79</span>
                <span className="text-xl text-[var(--hw-text-secondary)]">/year</span>
              </div>

              {/* Launch Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--hw-accent-gold-soft)] rounded-full mb-6">
                <span className="text-sm font-semibold text-[var(--hw-accent-gold)]">
                  Launch Special – Save $20
                </span>
              </div>

              {/* CTA Button */}
              <button
                onClick={() => router.push('/auth/register')}
                className="w-full min-h-[60px] px-8 py-4 bg-[var(--hw-primary)] text-white text-lg font-medium rounded-xl shadow-sm hover:bg-[var(--hw-primary-hover)] hover:shadow-md active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--hw-primary)] focus:ring-offset-[var(--hw-surface)] transition-all duration-200"
              >
                Start Your Stories – $79/year
              </button>
            </div>

            {/* Features */}
            <div className="px-8 pb-8">
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[var(--hw-secondary)] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-base text-[var(--hw-text-secondary)]">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Urgency text */}
              <p className="text-sm text-[var(--hw-text-muted)] text-center mt-6">
                Launch pricing ends soon
              </p>

              {/* Comparison text */}
              <p className="text-sm text-[var(--hw-text-secondary)] text-center mt-4 italic">
                "Save $20 compared to StoryWorth's $99/year."
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
