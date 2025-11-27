'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type TabKey = 'timeline' | 'book' | 'memory'

const tabs: { key: TabKey; label: string; description: string }[] = [
  { key: 'timeline', label: 'Live Timeline', description: 'Timeline view screenshot' },
  { key: 'book', label: 'The Living Book', description: 'Book view screenshot' },
  { key: 'memory', label: 'Memory Box', description: 'Memory box screenshot' },
]

export default function Hero() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabKey>('timeline')

  const scrollToHowItWorks = () => {
    const element = document.getElementById('how-it-works')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section className="relative bg-[var(--hw-page-bg)] pt-28 pb-16 md:pt-36 md:pb-24 px-6 md:px-12">
      <div className="max-w-[1140px] mx-auto">
        {/* Headline & Subhead */}
        <div className="text-center mb-12 md:mb-16">
          <h1 className="text-[36px] md:text-[42px] font-semibold leading-tight text-[var(--hw-primary)] mb-6 max-w-[55ch] mx-auto">
            The story of a lifetime. Spoken, not just written.
          </h1>
          <p className="text-lg md:text-xl text-[var(--hw-text-secondary)] leading-relaxed max-w-[55ch] mx-auto">
            HeritageWhisper's AI interviewer guides your loved ones through their memories—asking
            the questions you never thought to ask, preserving not just facts, but the feeling behind them.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 md:mb-20">
          <button
            onClick={() => router.push('/auth/register')}
            className="min-h-[60px] px-10 py-4 bg-[var(--hw-primary)] text-white text-lg font-medium rounded-xl shadow-sm hover:bg-[var(--hw-primary-hover)] hover:shadow-md active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--hw-primary)] focus:ring-offset-[var(--hw-page-bg)] transition-all duration-200"
          >
            Start Your Stories
          </button>
          <button
            onClick={scrollToHowItWorks}
            className="min-h-[48px] px-8 py-3 bg-[var(--hw-surface)] text-[var(--hw-text-primary)] text-base font-medium border border-[var(--hw-border-subtle)] rounded-xl hover:bg-[var(--hw-section-bg)] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--hw-primary)] focus:ring-offset-[var(--hw-page-bg)] transition-all duration-200"
          >
            See How It Works
          </button>
        </div>

        {/* Product Preview Tabs */}
        <div className="max-w-[900px] mx-auto">
          {/* Tab Navigation */}
          <div className="flex justify-center gap-2 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`min-h-[48px] px-6 py-3 text-base font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--hw-primary)] ${
                  activeTab === tab.key
                    ? 'bg-[var(--hw-primary)] text-white shadow-sm'
                    : 'bg-[var(--hw-surface)] text-[var(--hw-text-secondary)] border border-[var(--hw-border-subtle)] hover:bg-[var(--hw-section-bg)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content - Product Screenshot Placeholder */}
          <div className="bg-[var(--hw-section-bg)] border-2 border-dashed border-[var(--hw-border-subtle)] rounded-2xl flex items-center justify-center aspect-[4/3] shadow-sm">
            <span className="text-[var(--hw-text-muted)] text-base">
              [IMAGE: {tabs.find(t => t.key === activeTab)?.description}]
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
