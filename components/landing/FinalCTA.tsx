'use client'

import { useRouter } from 'next/navigation'

export default function FinalCTA() {
  const router = useRouter()

  return (
    <section className="bg-[var(--hw-primary)] py-16 md:py-24 px-6 md:px-12">
      <div className="max-w-[800px] mx-auto text-center">
        <h2 className="text-[32px] md:text-[36px] font-semibold text-white mb-4 leading-tight">
          Start Before the Moment Passes
        </h2>

        <p className="text-lg md:text-xl text-white/90 mb-10 max-w-[50ch] mx-auto">
          Every family has stories worth saving. Every voice deserves to be heard.
        </p>

        <button
          onClick={() => router.push('/auth/register')}
          className="min-h-[60px] px-12 py-4 bg-white text-[var(--hw-primary)] text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white focus:ring-offset-[var(--hw-primary)] transition-all duration-200"
        >
          Start Your Stories
        </button>

        <p className="text-sm text-white/70 mt-6 text-center">
          No credit card required to explore
        </p>
      </div>
    </section>
  )
}
