'use client'

import { useRouter } from 'next/navigation'

export default function FooterCTA() {
  const router = useRouter()

  return (
    <section className="py-20 md:py-28 px-6 md:px-12 bg-gradient-to-br from-heritage-deep-slate to-heritage-deep-slate/80 relative overflow-hidden">
      {/* Decorative accent */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-heritage-gold/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-heritage-muted-green/10 rounded-full blur-3xl" />

      <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
          Your Stories Don't Have to End
        </h2>

        <p className="text-xl md:text-2xl text-white/80 leading-relaxed">
          Start your living timeline today.<br />
          <span className="text-heritage-gold font-semibold">Unlimited memories, free forever.</span>
        </p>

        <div className="pt-4">
          <button
            onClick={() => router.push('/auth/register')}
            className="px-12 py-5 bg-white text-heritage-deep-slate text-xl font-bold rounded-xl hover:bg-white/95 transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 hover:scale-105"
          >
            Start Free — Unlimited Stories
          </button>
        </div>
      </div>
    </section>
  )
}
