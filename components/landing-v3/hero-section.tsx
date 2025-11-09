'use client'

import { useRouter } from 'next/navigation'

export default function HeroSection() {
  const router = useRouter()

  return (
    <section className="relative pt-16 pb-12 md:pt-24 md:pb-20 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Copy */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-gray-900">
                Your grandkids will still be hearing{' '}
                <span className="text-blue-600">new stories</span> from you next Christmas
              </h1>

              <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl">
                While others make books that end after 52 stories, HeritageWhisper creates
                a <span className="font-semibold text-gray-900">living timeline</span> that grows with every memory you share.
                Your family gets alerts when you add new stories – keeping you connected, forever.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => router.push('/auth/register')}
                className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Start Your Timeline Free
              </button>

              <button
                onClick={() => router.push('/auth/register')}
                className="px-8 py-4 bg-white text-blue-600 text-lg font-semibold rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Give This Gift - $79
              </button>
            </div>

            {/* Trust Signals */}
            <div className="flex flex-wrap gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>First 3 stories free</span>
              </div>

              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>No credit card</span>
              </div>

              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Takes 2 minutes</span>
              </div>
            </div>
          </div>

          {/* Right: Visual */}
          <div className="relative">
            <div className="aspect-[4/3] bg-gradient-to-br from-stone-200 to-stone-300 rounded-2xl shadow-2xl overflow-hidden flex items-center justify-center border border-stone-300">
              <div className="text-center px-8">
                <p className="text-gray-600 text-lg font-medium">
                  Photo: Grandparent with smartphone,<br />
                  mid-story, natural lighting
                </p>
              </div>
            </div>

            {/* Decorative accent */}
            <div className="hidden lg:block absolute -top-6 -right-6 w-24 h-24 bg-blue-100 rounded-full opacity-50 blur-2xl" />
            <div className="hidden lg:block absolute -bottom-6 -left-6 w-32 h-32 bg-orange-100 rounded-full opacity-50 blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  )
}
