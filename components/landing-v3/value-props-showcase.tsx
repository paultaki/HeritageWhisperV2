'use client'

import Image from 'next/image'
import { useScrollFadeIn, fadeInClasses } from '@/lib/scroll-animations'

export default function ValuePropsShowcase() {
  const features = [
    {
      badge: 'Timeline View',
      title: 'Your Life in Beautiful Cards',
      description: 'Every story becomes a moment on your timeline. Photos, voice, and wisdom extracted by our Storyteller. Scroll through decades in seconds.',
      image: '/timeline.webp',
      imageAlt: 'Timeline view showing story cards',
      isScrolling: true,
      imagePosition: 'left'
    },
    {
      badge: 'Book View',
      title: 'A Digital Book That Never Ends',
      description: 'Beautiful dual-page layout for reading. But unlike printed books, add new chapters forever. Your grandkids read it on their phones.',
      image: '/book full.webp',
      imageAlt: 'Book view with dual-page layout',
      isScrolling: false,
      imagePosition: 'right'
    },
    {
      badge: 'Memory Box',
      title: 'More Than Stories',
      description: 'Store recipes, heirlooms, keepsakes. One place for everything you want to pass down. Not just stories – treasures.',
      image: '/treasurebox.webp?v=2',
      imageAlt: 'Memory Box interface showing recipes, photos, and keepsakes',
      isScrolling: false,
      imagePosition: 'left'
    }
  ]

  return (
    <section className="py-16 md:py-24 px-6 md:px-12 bg-heritage-warm-paper">
      <div className="max-w-7xl mx-auto space-y-24">
        {/* Section header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/80 backdrop-blur-sm rounded-full border border-heritage-deep-slate/10 shadow-sm mb-6">
            <span className="text-sm font-semibold text-heritage-deep-slate tracking-wide">Premium Experience</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-heritage-text-primary leading-tight">
            Three Ways to Experience Your Legacy
          </h2>
        </div>

        {/* Features */}
        {features.map((feature, index) => {
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const { ref, isVisible } = useScrollFadeIn(0.2, index * 100)

          return (
          <div
            key={index}
            ref={ref}
            className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${
              feature.imagePosition === 'right' ? 'lg:flex-row-reverse' : ''
            } ${fadeInClasses.initial} ${isVisible ? fadeInClasses.animate : ''}`}
          >
            {/* Copy */}
            <div className={`space-y-6 ${feature.imagePosition === 'right' ? 'lg:order-2' : 'lg:order-1'}`}>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-heritage-deep-slate/5 rounded-full border border-heritage-deep-slate/20 transition-all duration-300 hover:bg-heritage-deep-slate/10">
                <span className="text-sm font-semibold text-heritage-deep-slate tracking-wide">{feature.badge}</span>
              </div>

              <h3 className="text-3xl md:text-4xl font-bold text-heritage-text-primary leading-tight">
                {feature.title}
              </h3>

              <p className="text-lg md:text-xl text-heritage-text-primary/70 leading-relaxed">
                {feature.description}
              </p>
            </div>

            {/* Image */}
            <div className={`${feature.imagePosition === 'right' ? 'lg:order-1' : 'lg:order-2'}`}>
              {feature.image ? (
                <div className={`relative rounded-2xl overflow-hidden shadow-lg border border-heritage-deep-slate/10 bg-white transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] group ${feature.isScrolling ? 'h-[500px]' : ''}`}>
                  <Image
                    src={feature.image}
                    alt={feature.imageAlt || ''}
                    width={600}
                    height={feature.isScrolling ? 800 : 600}
                    quality={100}
                    className={`w-full ${feature.isScrolling ? 'animate-scroll-slow' : 'h-auto transition-transform duration-500 group-hover:scale-105'}`}
                  />
                </div>
              ) : (
                <div className="aspect-[4/3] bg-gradient-to-br from-stone-200 to-stone-300 rounded-2xl shadow-2xl overflow-hidden flex items-center justify-center border border-stone-300 p-8">
                  <p className="text-gray-600 text-lg font-medium text-center">
                    {feature.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        )})}
      </div>

      <style jsx>{`
        @keyframes scroll-slow {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(-70%);
          }
        }

        :global(.animate-scroll-slow) {
          animation: scroll-slow 20s ease-in-out infinite alternate;
        }
      `}</style>
    </section>
  )
}
