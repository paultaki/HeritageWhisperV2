import Image from 'next/image'

export default function SocialProofSnapshot() {
  return (
    <section className="py-16 md:py-20 px-6 md:px-12 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="bg-gradient-to-br from-blue-50 to-orange-50 rounded-3xl p-8 md:p-12 shadow-xl border border-stone-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            {/* Photo */}
            <div className="md:col-span-1">
              <div className="aspect-square relative rounded-2xl shadow-lg overflow-hidden border border-stone-300">
                <Image
                  src="/Margaret.webp"
                  alt="Elderly woman with phone, smiling"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            {/* Testimonial */}
            <div className="md:col-span-2 space-y-4">
              <div className="text-blue-600 text-5xl mb-4">"</div>
              <p className="text-2xl md:text-3xl font-medium text-gray-900 leading-relaxed">
                My kids text me after every story. We're more connected than ever.
              </p>
              <div className="pt-4">
                <p className="text-lg text-gray-600 font-semibold">Margaret, 72</p>
                <p className="text-gray-500">Recording since March</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
