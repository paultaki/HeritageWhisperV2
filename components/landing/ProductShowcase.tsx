'use client'

import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'

type Feature = {
  id: string
  tabName: string
  title: string
  description: string
  imageAlt: string
  image: string
  isScrolling: boolean
}

const features: Feature[] = [
  {
    id: 'timeline',
    tabName: 'Live Timeline',
    title: 'The Timeline',
    description: 'Watch 80 years of wisdom unfold before your eyes. Stories organized by decade, patterns revealed across a lifetime. Tap any moment to hear it in their voice.',
    imageAlt: 'Timeline view screenshot showing decade markers, story cards, clean organization',
    image: '/timeline-2.webp',
    isScrolling: true,
  },
  {
    id: 'book',
    tabName: 'Living Book',
    title: 'The Living Book',
    description: 'Read their story like a memoir—but one that speaks. Every chapter flows naturally, with their original recordings embedded throughout. The book that speaks in their voice.',
    imageAlt: 'Book view screenshot showing text with embedded audio players',
    image: '/book.webp',
    isScrolling: false,
  },
  {
    id: 'memory-box',
    tabName: 'Memory Box',
    title: 'The Memory Box',
    description: 'Photos, documents, and keepsakes—each with the story behind it. Upload the artifact, record the memory. Context for every treasure.',
    imageAlt: 'Memory box view showing photos with associated stories',
    image: '/memory-box-2.webp',
    isScrolling: true,
  },
]

// Auto-scrolling image component
function ScrollingImage({ src, alt }: { src: string; alt: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isUserScrollingRef = useRef(false)
  const scrollDirectionRef = useRef<'down' | 'up'>('down')
  const userScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const scrollSpeed = 0.5

    const autoScroll = () => {
      if (!isUserScrollingRef.current && container) {
        const maxScroll = container.scrollHeight - container.clientHeight
        const currentScroll = container.scrollTop

        if (scrollDirectionRef.current === 'down') {
          if (currentScroll >= maxScroll - 1) {
            scrollDirectionRef.current = 'up'
          } else {
            container.scrollTop += scrollSpeed
          }
        } else {
          if (currentScroll <= 1) {
            scrollDirectionRef.current = 'down'
          } else {
            container.scrollTop -= scrollSpeed
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(autoScroll)
    }

    animationFrameRef.current = requestAnimationFrame(autoScroll)

    const handleUserInteraction = () => {
      isUserScrollingRef.current = true

      if (userScrollTimeoutRef.current) {
        clearTimeout(userScrollTimeoutRef.current)
      }

      userScrollTimeoutRef.current = setTimeout(() => {
        isUserScrollingRef.current = false
      }, 2000)
    }

    container.addEventListener('wheel', handleUserInteraction)
    container.addEventListener('touchstart', handleUserInteraction)
    container.addEventListener('mousedown', handleUserInteraction)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (userScrollTimeoutRef.current) {
        clearTimeout(userScrollTimeoutRef.current)
      }
      container.removeEventListener('wheel', handleUserInteraction)
      container.removeEventListener('touchstart', handleUserInteraction)
      container.removeEventListener('mousedown', handleUserInteraction)
    }
  }, [])

  return (
    <div className="relative rounded-xl overflow-hidden shadow-xl border border-[var(--hw-border)]">
      {/* Top fade gradient */}
      <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-white via-white/80 to-transparent z-10 pointer-events-none" />

      {/* Scrolling container */}
      <div
        ref={containerRef}
        className="h-[320px] overflow-y-auto bg-white"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#EBE2D5 transparent',
        }}
      >
        <Image src={src} alt={alt} width={500} height={1000} className="w-full h-auto" />
      </div>

      {/* Bottom fade gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white via-white/80 to-transparent z-10 pointer-events-none" />
    </div>
  )
}

export default function ProductShowcase() {
  const [activeTab, setActiveTab] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const autoRotateRef = useRef<NodeJS.Timeout | null>(null)
  const AUTO_ROTATE_INTERVAL = 6000
  const TOTAL_TABS = 3

  // Auto-rotate tabs
  useEffect(() => {
    const rotateTab = () => {
      setIsTransitioning(true)
      setTimeout(() => {
        setActiveTab((prev) => (prev + 1) % TOTAL_TABS)
        setIsTransitioning(false)
      }, 300)
    }

    autoRotateRef.current = setInterval(rotateTab, AUTO_ROTATE_INTERVAL)

    return () => {
      if (autoRotateRef.current) {
        clearInterval(autoRotateRef.current)
      }
    }
  }, [])

  // Handle manual tab click
  const handleTabClick = (index: number) => {
    if (index === activeTab || isTransitioning) return

    if (autoRotateRef.current) {
      clearInterval(autoRotateRef.current)
    }

    setIsTransitioning(true)
    setTimeout(() => {
      setActiveTab(index)
      setIsTransitioning(false)
    }, 300)

    // Restart auto-rotate
    autoRotateRef.current = setInterval(() => {
      setIsTransitioning(true)
      setTimeout(() => {
        setActiveTab((prev) => (prev + 1) % TOTAL_TABS)
        setIsTransitioning(false)
      }, 300)
    }, AUTO_ROTATE_INTERVAL)
  }

  const currentFeature = features[activeTab]

  return (
    <section className="py-16 md:py-24 bg-[var(--hw-section-bg)]" id="features">
      <div className="max-w-5xl mx-auto px-6 md:px-12">
        {/* Tab Navigation */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex bg-white rounded-full p-1.5 shadow-lg border border-[var(--hw-border)]">
            {features.map((f, i) => (
              <button
                key={f.id}
                onClick={() => handleTabClick(i)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                  activeTab === i
                    ? 'bg-[var(--hw-accent-green)] text-white shadow-md'
                    : 'text-[var(--hw-primary)] hover:text-[var(--hw-accent-green)] hover:bg-[var(--hw-page-bg)]'
                }`}
              >
                {f.tabName}
              </button>
            ))}
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex justify-center gap-2 mb-8">
          {features.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                activeTab === i ? 'w-8 bg-[var(--hw-accent-green)]' : 'w-2 bg-[var(--hw-border)]'
              }`}
            />
          ))}
        </div>

        {/* Content Area */}
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
          {/* Image with fade transition */}
          <div className="flex-1 w-full max-w-md">
            <div
              className={`transition-opacity duration-300 ${
                isTransitioning ? 'opacity-0' : 'opacity-100'
              }`}
            >
              {currentFeature.isScrolling ? (
                <ScrollingImage
                  key={activeTab}
                  src={currentFeature.image}
                  alt={currentFeature.imageAlt}
                />
              ) : (
                <div className="relative rounded-xl overflow-hidden shadow-xl border border-[var(--hw-border)]">
                  <Image
                    src={currentFeature.image}
                    alt={currentFeature.imageAlt}
                    width={500}
                    height={375}
                    className="w-full h-auto max-h-[320px] object-contain bg-white"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Text content with fade transition */}
          <div
            className={`flex-1 space-y-4 transition-opacity duration-300 ${
              isTransitioning ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <h3 className="text-2xl md:text-3xl font-semibold text-[var(--hw-primary)]">
              {currentFeature.title}
            </h3>
            <div className="w-10 h-1 bg-[var(--hw-accent-gold)]" />
            <p className="text-base text-[var(--hw-text-secondary)] leading-relaxed max-w-[50ch]">
              {currentFeature.description}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
