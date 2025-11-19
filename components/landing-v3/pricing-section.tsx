'use client'

import { useRouter } from 'next/navigation'

export default function PricingSection() {
  const router = useRouter()

  const freeFeatures = [
    'Unlimited voice recordings',
    'Unlimited photos & memories',
    'AI-powered story transcription',
    'Beautiful timeline & book views',
    'Wisdom extraction from stories',
    'Memory box for treasures',
    'Download everything anytime'
  ]

  const premiumFeatures = [
    'Share with unlimited family members',
    'Collaborative family storytelling',
    'Family can submit questions',
    'Gift subscriptions available'
  ]

  return (
    <section className="py-16 md:py-24 px-6 md:px-12 bg-heritage-warm-paper">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/80 backdrop-blur-sm rounded-full border border-heritage-deep-slate/10 shadow-sm mb-6">
            <span className="text-sm font-semibold text-heritage-deep-slate tracking-wide">Simple, Honest Pricing</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-heritage-text-primary mb-4 leading-tight">
            Record Unlimited Memories — Free Forever
          </h2>
          <p className="text-xl text-heritage-text-primary/70 max-w-2xl mx-auto leading-relaxed">
            Unlimited stories, photos, and memories at no cost. Only pay when you're ready to share with family.
          </p>
        </div>

        {/* Pricing card */}
        <div className="bg-gradient-to-br from-white to-heritage-deep-slate/5 rounded-3xl shadow-lg border border-heritage-deep-slate/10 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:scale-[1.01]">
          {/* Badge */}
          <div className="bg-heritage-deep-slate text-center py-3.5 px-6">
            <p className="font-semibold tracking-wide text-white">Free Forever • Family Sharing: $79/year</p>
          </div>

          <div className="p-8 md:p-12">
            {/* Free Features */}
            <div className="mb-10">
              <h3 className="text-xl font-bold text-heritage-text-primary mb-6 flex items-center gap-2">
                <span className="text-2xl">✨</span> Always Free
              </h3>
              <div className="space-y-3">
                {freeFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-heritage-muted-green flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-heritage-text-primary/80 text-base">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Separator */}
            <div className="relative mb-10">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-heritage-deep-slate/10"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 py-2 text-sm font-semibold text-heritage-gold border border-heritage-gold/30 rounded-full">
                  Premium Add-On
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="text-center mb-8">
              <div className="flex items-baseline justify-center gap-2 mb-2">
                <span className="text-6xl md:text-7xl font-bold text-heritage-deep-slate">$79</span>
                <span className="text-2xl text-heritage-text-primary/60">/year</span>
              </div>
              <p className="text-heritage-text-primary/70 text-lg">
                That's <span className="font-semibold text-heritage-text-primary">$6.58/month</span> for family sharing
              </p>
            </div>

            {/* Premium Features */}
            <div className="space-y-3 mb-8">
              {premiumFeatures.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-heritage-gold flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-heritage-text-primary/80 text-base font-medium">{feature}</span>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6 min-h-[120px] sm:min-h-[56px]">
              <button
                onClick={() => router.push('/auth/register')}
                className="flex-1 px-8 py-4 bg-heritage-deep-slate text-white text-lg font-semibold rounded-xl hover:bg-heritage-deep-slate/90 transition-all duration-300 shadow-md hover:shadow-xl transform hover:-translate-y-1 hover:scale-[1.02] h-[56px]"
              >
                Start Free — Unlimited Stories
              </button>

              <button
                onClick={() => router.push('/auth/register')}
                className="flex-1 px-8 py-4 bg-white text-heritage-gold text-lg font-semibold rounded-xl border-2 border-heritage-gold hover:bg-heritage-gold/5 transition-all duration-300 shadow-md hover:shadow-xl transform hover:-translate-y-1 hover:scale-[1.02] h-[56px]"
              >
                Gift Family Sharing
              </button>
            </div>

            {/* Lifetime option */}
            <div className="text-center pt-6 border-t border-heritage-deep-slate/10">
              <p className="text-heritage-text-primary/70">
                <span className="font-semibold text-heritage-text-primary">Lifetime Option:</span> $399 once, yours forever
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
