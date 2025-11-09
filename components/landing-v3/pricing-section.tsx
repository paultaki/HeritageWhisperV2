'use client'

import { useRouter } from 'next/navigation'

export default function PricingSection() {
  const router = useRouter()

  const features = [
    'Unlimited stories forever',
    'Share with entire family',
    'Wisdom extraction',
    'Beautiful timeline & book views',
    'Family can submit questions',
    'Memory box for treasures',
    'Download everything anytime'
  ]

  return (
    <section className="py-16 md:py-24 px-6 md:px-12 bg-[#faf8f5]">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-stone-200 shadow-sm mb-6">
            <span className="text-sm font-semibold text-gray-700">Simple Pricing</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            One Simple Price
          </h2>
        </div>

        {/* Pricing card */}
        <div className="bg-gradient-to-br from-white to-blue-50 rounded-3xl shadow-2xl border-2 border-blue-200 overflow-hidden">
          {/* Badge */}
          <div className="bg-blue-600 text-white text-center py-3 px-6">
            <p className="font-semibold">Best Value for Your Family's Legacy</p>
          </div>

          <div className="p-8 md:p-12">
            {/* Price */}
            <div className="text-center mb-8">
              <div className="flex items-baseline justify-center gap-2 mb-2">
                <span className="text-6xl md:text-7xl font-bold text-gray-900">$79</span>
                <span className="text-2xl text-gray-600">/year</span>
              </div>
              <p className="text-gray-600 text-lg">
                That's <span className="font-semibold text-gray-900">$6.58/month</span> to preserve unlimited memories
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4 mb-8">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700 text-lg">{feature}</span>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <button
                onClick={() => router.push('/auth/register')}
                className="flex-1 px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Start Free - 3 Stories
              </button>

              <button
                onClick={() => router.push('/auth/register')}
                className="flex-1 px-8 py-4 bg-white text-blue-600 text-lg font-semibold rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Give as Gift
              </button>
            </div>

            {/* Lifetime option */}
            <div className="text-center pt-6 border-t border-gray-200">
              <p className="text-gray-600">
                <span className="font-semibold text-gray-900">Lifetime Option:</span> $399 once, yours forever
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
