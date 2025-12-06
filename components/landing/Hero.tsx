'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

type TabKey = 'timeline' | 'book' | 'memory'

const tabs: { key: TabKey; label: string; description: string; desktopImage: string; mobileImage: string }[] = [
  { key: 'timeline', label: 'Live Timeline', description: 'Timeline view screenshot', desktopImage: '/timeline.webp', mobileImage: '/Timeline-mobile.webp' },
  { key: 'book', label: 'Living Book', description: 'Book view screenshot', desktopImage: '/book.webp', mobileImage: '/book-mobile.webp' },
  { key: 'memory', label: 'Memory Box', description: 'Memory box screenshot', desktopImage: '/memory-box.webp', mobileImage: '/memory-box-mobile.webp' },
]

// Skeleton loader component for tab content
function TabSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-[var(--hw-surface)] aspect-[4/3] animate-pulse">
      <div className="w-full h-full bg-gradient-to-r from-[var(--hw-border-subtle)] via-[var(--hw-surface)] to-[var(--hw-border-subtle)] bg-[length:200%_100%] animate-shimmer" />
    </div>
  )
}

// Book image component with loading tracking
function BookImage({ tab, onLoad }: { tab: typeof tabs[0]; onLoad: () => void }) {
  const [imagesLoaded, setImagesLoaded] = useState({ desktop: false, mobile: false })
  const hasCalledOnLoad = useRef(false)

  useEffect(() => {
    if (imagesLoaded.desktop && imagesLoaded.mobile && !hasCalledOnLoad.current) {
      hasCalledOnLoad.current = true
      onLoad()
    }
  }, [imagesLoaded, onLoad])

  return (
    <div className="rounded-2xl overflow-hidden shadow-xl bg-[var(--hw-surface)]">
      <Image
        src={tab.desktopImage}
        alt={tab.description}
        width={900}
        height={675}
        className="w-full h-auto hidden md:block"
        priority
        onLoad={() => setImagesLoaded(prev => ({ ...prev, desktop: true }))}
      />
      <Image
        src={tab.mobileImage}
        alt={tab.description}
        width={400}
        height={300}
        className="w-full h-auto md:hidden"
        priority
        onLoad={() => setImagesLoaded(prev => ({ ...prev, mobile: true }))}
      />
    </div>
  )
}

function ScrollingImage({ desktopImage, mobileImage, alt, onLoad }: { desktopImage: string; mobileImage: string; alt: string; onLoad?: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [scrollDirection, setScrollDirection] = useState<'down' | 'up'>('down')
  const animationRef = useRef<number | null>(null)
  const scrollPositionRef = useRef(0)
  const [imagesLoaded, setImagesLoaded] = useState({ desktop: false, mobile: false })
  const hasCalledOnLoad = useRef(false)

  // Track when both images are loaded
  useEffect(() => {
    if (imagesLoaded.desktop && imagesLoaded.mobile && onLoad && !hasCalledOnLoad.current) {
      hasCalledOnLoad.current = true
      onLoad()
    }
  }, [imagesLoaded, onLoad])

  useEffect(() => {
    const container = containerRef.current
    const image = imageRef.current
    if (!container || !image) return

    const scrollSpeed = 0.5

    const animate = () => {
      if (isHovered) {
        animationRef.current = requestAnimationFrame(animate)
        return
      }

      const maxScroll = image.scrollHeight - container.clientHeight

      if (scrollDirection === 'down') {
        scrollPositionRef.current += scrollSpeed
        if (scrollPositionRef.current >= maxScroll) {
          scrollPositionRef.current = maxScroll
          setScrollDirection('up')
        }
      } else {
        scrollPositionRef.current -= scrollSpeed
        if (scrollPositionRef.current <= 0) {
          scrollPositionRef.current = 0
          setScrollDirection('down')
        }
      }

      container.scrollTop = scrollPositionRef.current
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isHovered, scrollDirection])

  const handleScroll = () => {
    if (containerRef.current) {
      scrollPositionRef.current = containerRef.current.scrollTop
    }
  }

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-xl bg-[var(--hw-surface)] aspect-[4/3]">
      {/* Scrollable container */}
      <div
        ref={containerRef}
        className="h-full overflow-y-auto scrollbar-hide"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onScroll={handleScroll}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div ref={imageRef} className="relative">
          {/* Top gradient - scrolls with image */}
          <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-[var(--hw-surface)] to-transparent z-10 pointer-events-none" />

          <Image
            src={desktopImage}
            alt={alt}
            width={900}
            height={1800}
            className="w-full h-auto hidden md:block"
            priority
            onLoad={() => setImagesLoaded(prev => ({ ...prev, desktop: true }))}
          />
          <Image
            src={mobileImage}
            alt={alt}
            width={400}
            height={800}
            className="w-full h-auto md:hidden"
            priority
            onLoad={() => setImagesLoaded(prev => ({ ...prev, mobile: true }))}
          />

          {/* Bottom gradient - scrolls with image */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[var(--hw-surface)] to-transparent z-10 pointer-events-none" />
        </div>
      </div>
    </div>
  )
}

export default function Hero() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabKey>('timeline')
  const [loadedTabs, setLoadedTabs] = useState<Set<TabKey>>(new Set())

  const handleTabLoad = useCallback((tabKey: TabKey) => {
    setLoadedTabs(prev => {
      if (prev.has(tabKey)) return prev // Already loaded, no update needed
      return new Set([...prev, tabKey])
    })
  }, [])

  const isTabLoaded = useCallback((tabKey: TabKey) => loadedTabs.has(tabKey), [loadedTabs])

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
          <h1 className="text-[40px] md:text-[52px] lg:text-[60px] font-serif font-medium leading-[1.1] text-[var(--hw-primary)] mb-8 max-w-4xl mx-auto">
            The story of a lifetime.<br />
            <span className="text-[var(--hw-secondary)] italic">Spoken,</span> not just written.
          </h1>
          <p className="text-lg md:text-xl text-[var(--hw-text-secondary)] leading-relaxed max-w-[55ch] mx-auto">
            HeritageWhisper guides your loved ones through their memories—asking
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
                className={`flex-1 min-h-[48px] py-3 text-base font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--hw-primary)] flex items-center justify-center text-center ${
                  activeTab === tab.key
                    ? 'bg-[var(--hw-primary)] text-white shadow-sm'
                    : 'bg-[var(--hw-surface)] text-[var(--hw-text-secondary)] border border-[var(--hw-border-subtle)] hover:bg-[var(--hw-section-bg)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content - Product Screenshot */}
          <div className="relative">
            {/* Skeleton - shows when active tab is loading */}
            <div
              className={`transition-opacity duration-300 ${
                isTabLoaded(activeTab) ? 'absolute inset-0 opacity-0 pointer-events-none' : 'opacity-100'
              }`}
            >
              <TabSkeleton />
            </div>

            {/* All tab contents - rendered for preloading, visibility controlled by opacity */}
            {tabs.map((tab) => (
              <div
                key={tab.key}
                className={`${activeTab === tab.key ? '' : 'absolute inset-0'} transition-opacity duration-300 ${
                  activeTab === tab.key && isTabLoaded(tab.key)
                    ? 'opacity-100'
                    : activeTab === tab.key
                      ? 'opacity-0'
                      : 'opacity-0 pointer-events-none'
                }`}
                aria-hidden={activeTab !== tab.key}
              >
                {tab.key === 'book' ? (
                  // Book view - static image, no scroll, no gradient
                  <BookImage
                    tab={tab}
                    onLoad={() => handleTabLoad(tab.key)}
                  />
                ) : (
                  // Timeline and Memory Box - scrolling with gradients
                  <ScrollingImage
                    desktopImage={tab.desktopImage}
                    mobileImage={tab.mobileImage}
                    alt={tab.description}
                    onLoad={() => handleTabLoad(tab.key)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
