'use client'

import { useRouter } from 'next/navigation'

export default function GiftSection() {
  const router = useRouter()

  return (
    <section className="py-16 md:py-24 px-6 md:px-12 bg-gradient-to-br from-orange-50 to-blue-50">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
            {/* Left: Copy */}
            <div className="p-8 md:p-12 space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-full border border-orange-200 mb-2">
                <span className="text-sm font-semibold text-orange-700">Perfect Gift</span>
              </div>

              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                The Gift That Keeps Giving Stories
              </h2>

              <div className="space-y-4 text-lg text-gray-600">
                <p className="text-xl font-semibold text-gray-900">
                  Perfect for parents who "have everything"
                </p>
                <p>
                  They already have things. Give them a way to share their memories.
                </p>
              </div>

              {/* Occasions */}
              <div className="flex flex-wrap gap-3 py-4">
                {['Mother\'s Day', 'Father\'s Day', 'Birthdays', 'Any Day'].map((occasion, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold border border-blue-200"
                  >
                    {occasion}
                  </span>
                ))}
              </div>

              {/* CTA */}
              <button
                onClick={() => router.push('/auth/register')}
                className="w-full sm:w-auto px-8 py-4 bg-orange-600 text-white text-lg font-semibold rounded-lg hover:bg-orange-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Give the Gift of Stories
              </button>
            </div>

            {/* Right: Testimonial */}
            <div className="bg-gradient-to-br from-blue-50 to-orange-50 p-8 md:p-12 flex items-center">
              <div className="space-y-4">
                <div className="text-blue-600 text-5xl mb-4">"</div>
                <p className="text-xl md:text-2xl font-medium text-gray-900 leading-relaxed">
                  Best gift I've ever given my dad. He's told us more in 3 months than the previous 30 years.
                </p>
                <div className="pt-4">
                  <p className="text-lg text-gray-700 font-semibold">David K.</p>
                  <p className="text-gray-600">Gave to his father</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
