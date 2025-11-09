'use client'

import { useRouter } from 'next/navigation'

export default function FooterCTA() {
  const router = useRouter()

  return (
    <section className="py-20 md:py-28 px-6 md:px-12 bg-gradient-to-br from-blue-600 to-blue-800">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
          Your Stories Don't Have to End
        </h2>

        <p className="text-xl md:text-2xl text-blue-100 leading-relaxed">
          Start your living timeline today.<br />
          First 3 stories free. No credit card.
        </p>

        <div className="pt-4">
          <button
            onClick={() => router.push('/auth/register')}
            className="px-12 py-5 bg-white text-blue-600 text-xl font-bold rounded-lg hover:bg-blue-50 transition-all duration-200 shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 hover:scale-105"
          >
            Begin Your Timeline
          </button>
        </div>
      </div>
    </section>
  )
}
