'use client'

import { useScrollFadeIn, fadeInClasses } from '@/lib/scroll-animations'

export default function ThreePillars() {
  const { ref, isVisible } = useScrollFadeIn()

  const pillars = [
    {
      icon: '📱',
      title: 'Record in 2 Minutes',
      lines: ['Talk to your phone.', 'No typing. No homework.', 'Just your voice, preserved.']
    },
    {
      icon: '🔔',
      title: 'Family Gets Alerts',
      lines: ['"Grandma just shared a story"', 'Instant connection across', 'any distance.']
    },
    {
      icon: '♾️',
      title: 'Never "Complete"',
      lines: ['Add stories forever.', 'Your timeline grows.', 'Life doesn\'t stop at 52.']
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
              <div className="text-5xl mb-6">{pillar.icon}</div>
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
