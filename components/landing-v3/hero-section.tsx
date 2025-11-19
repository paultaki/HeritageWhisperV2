'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function HeroSection() {
  const router = useRouter()

  return (
    <section className="relative pt-24 pb-12 md:pt-32 md:pb-20 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Copy */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-heritage-text-primary">
                Every photo in Mom's albums has a{' '}
                <span className="bg-gradient-to-r from-heritage-deep-slate to-heritage-gold bg-clip-text text-transparent">
                  story only she knows
                </span>
              </h1>

              <p className="text-lg md:text-xl text-heritage-text-primary/70 leading-relaxed max-w-2xl">
                While others make books that end after 52 stories, HeritageWhisper creates
                a <span className="font-semibold text-heritage-text-primary">living timeline</span> that grows with every memory you share.
                Your family gets alerts when you add new stories – keeping you connected, forever.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 min-h-[120px] sm:min-h-[56px]">
              <button
                onClick={() => router.push('/auth/register')}
                className="px-8 py-4 bg-heritage-deep-slate text-white text-lg font-semibold rounded-xl hover:bg-heritage-deep-slate/90 transition-all duration-300 shadow-md hover:shadow-xl transform hover:-translate-y-1 hover:scale-[1.02] h-[56px]"
              >
                Start Free — Unlimited Stories
              </button>

              <button
                onClick={() => router.push('/auth/register')}
                className="px-8 py-4 bg-white text-heritage-gold text-lg font-semibold rounded-xl border-2 border-heritage-gold hover:bg-heritage-gold/5 transition-all duration-300 shadow-md hover:shadow-xl transform hover:-translate-y-1 hover:scale-[1.02] h-[56px]"
              >
                Gift Family Sharing — $79/year
              </button>
            </div>

            {/* Trust Signals */}
            <div className="flex flex-wrap gap-6 text-sm text-heritage-text-primary/70">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-heritage-muted-green" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Record unlimited stories free</span>
              </div>

              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-heritage-muted-green" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>No apps to download</span>
              </div>

              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-heritage-muted-green" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Works on any smartphone</span>
              </div>
            </div>
          </div>

          {/* Right: Visual */}
          <div className="relative">
            <div className="aspect-[4/3] relative rounded-2xl shadow-xl overflow-hidden border border-heritage-deep-slate/10 transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] bg-heritage-deep-slate/5">
              <Image
                src="/grandparent.webp"
                alt="Grandparent with smartphone, mid-story, natural lighting"
                fill
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 600px"
                className="object-cover"
                quality={90}
                placeholder="blur"
                blurDataURL="data:image/webp;base64,UklGRjQAAABXRUJQVlA4ICgAAAAwAQCdASoQAAwAAUAmJaQAA3AA/vuiAA=="
              />
            </div>

            {/* Decorative accent */}
            <div className="hidden lg:block absolute -top-6 -right-6 w-24 h-24 bg-heritage-deep-slate/10 rounded-full opacity-50 blur-2xl" />
            <div className="hidden lg:block absolute -bottom-6 -left-6 w-32 h-32 bg-heritage-gold/20 rounded-full opacity-50 blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  )
}
