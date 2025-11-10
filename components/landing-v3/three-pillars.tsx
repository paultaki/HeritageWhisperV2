'use client'

import Image from 'next/image'
import { useScrollFadeIn, fadeInClasses } from '@/lib/scroll-animations'

export default function ThreePillars() {
  const { ref, isVisible } = useScrollFadeIn()

  const pillars = [
    {
      icon: '/mic photo.svg',
      title: 'Photos Come Alive',
      lines: ['"Who\'s that in the uniform?"', 'Every photo has a story only they can tell. Capture them in 90 seconds.', 'No typing. Just talking.']
    },
    {
      icon: '/bell.svg',
      title: 'Instant Family Alerts',
      lines: ['"Mom just recorded the story behind the wedding photo"', 'Instant alerts when new memories are added. Listen immediately, wherever you are.']
    },
    {
      icon: '/phone album.svg',
      title: 'Living Timeline',
      lines: ['Those boxes in the attic? Now accessible on every phone.', 'Transform physical photos into a living, growing family timeline that never ends.']
    }
  ]

  return (
    <section className="py-16 md:py-24 px-6 md:px-12 bg-[#faf8f5]">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div
          ref={ref}
          className={`text-center mb-12 ${fadeInClasses.initial} ${isVisible ? fadeInClasses.animate : ''}`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-stone-200 shadow-sm mb-4">
            <span className="text-sm font-semibold text-gray-700">Three Core Features</span>
          </div>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pillars.map((pillar, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 shadow-lg border border-stone-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="mb-6 w-24 h-24 relative">
                <Image
                  src={pillar.icon}
                  alt={pillar.title}
                  width={96}
                  height={96}
                  className="w-full h-full object-contain"
                />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{pillar.title}</h3>
              <div className="space-y-1 text-gray-600 leading-relaxed">
                {pillar.lines.map((line, lineIndex) => (
                  <p key={lineIndex}>{line}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
