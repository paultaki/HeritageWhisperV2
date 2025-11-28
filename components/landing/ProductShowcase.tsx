'use client'

import { useRef, useEffect, useState } from 'react'
import Image from 'next/image'

type Feature = {
  id: string
  title: string
  description: string
  imageAlt: string
  imagePosition: 'left' | 'right'
  desktopImage: string
  mobileImage: string
}

const features: Feature[] = [
  {
    id: 'timeline',
    title: 'The Timeline',
    description: 'Watch 80 years of wisdom unfold before your eyes. Stories organized by decade, patterns revealed across a lifetime. Tap any moment to hear it in their voice.',
    imageAlt: 'Timeline view screenshot showing decade markers, story cards, clean organization',
    imagePosition: 'left',
    desktopImage: '/TimeLine.webp',
    mobileImage: '/Timeline-mobile.webp',
  },
  {
    id: 'book',
    title: 'The Living Book',
    description: 'Read their story like a memoir—but one that speaks. Every chapter flows naturally, with their original recordings embedded throughout. The book that speaks in their voice.',
    imageAlt: 'Book view screenshot showing text with embedded audio players',
    imagePosition: 'right',
    desktopImage: '/book.webp',
    mobileImage: '/book-mobile.webp',
  },
  {
    id: 'memory-box',
    title: 'The Memory Box',
    description: 'Photos, documents, and keepsakes—each with the story behind it. Upload the artifact, record the memory. Context for every treasure.',
    imageAlt: 'Memory box view showing photos with associated stories',
    imagePosition: 'left',
    desktopImage: '/memory-box.webp',
    mobileImage: '/memory-box-mobile.webp',
  },
]

function ScrollingImage({ desktopImage, mobileImage, alt }: { desktopImage: string; mobileImage: string; alt: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [scrollDirection, setScrollDirection] = useState<'down' | 'up'>('down')
  const animationRef = useRef<number | null>(null)
  const scrollPositionRef = useRef(0)

  useEffect(() => {
    const container = containerRef.current
    const image = imageRef.current
    if (!container || !image) return

    const scrollSpeed = 0.5 // pixels per frame (slow scroll)

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

  // Sync manual scroll with animation
  const handleScroll = () => {
    if (containerRef.current) {
      scrollPositionRef.current = containerRef.current.scrollTop
    }
  }

  return (
    <div
      className="relative rounded-2xl overflow-hidden shadow-xl bg-[var(--hw-surface)]"
      style={{ height: '400px' }}
    >
      {/* Gradient overlays */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-[var(--hw-surface)] to-transparent z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[var(--hw-surface)] to-transparent z-10 pointer-events-none" />

      {/* Scrollable container */}
      <div
        ref={containerRef}
        className="h-full overflow-y-auto scrollbar-hide"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onScroll={handleScroll}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div ref={imageRef}>
          {/* Desktop image */}
          <Image
            src={desktopImage}
            alt={alt}
            width={600}
            height={1200}
            className="w-full h-auto hidden md:block"
            priority
          />
          {/* Mobile image */}
          <Image
            src={mobileImage}
            alt={alt}
            width={400}
            height={800}
            className="w-full h-auto md:hidden"
            priority
          />
        </div>
      </div>
    </div>
  )
}

export default function ProductShowcase() {
  return (
    <section className="py-16 md:py-24" id="features">
      {features.map((feature, index) => (
        <div
          key={feature.id}
          className={`${index % 2 === 0 ? 'bg-[var(--hw-page-bg)]' : 'bg-[var(--hw-section-bg)]'} py-16 md:py-20 px-6 md:px-12`}
        >
          <div className="max-w-[1140px] mx-auto">
            <div className={`grid md:grid-cols-2 gap-12 items-center ${feature.imagePosition === 'right' ? '' : ''}`}>
              {/* Image */}
              <div className={`${feature.imagePosition === 'right' ? 'order-1 md:order-2' : 'order-1'}`}>
                <ScrollingImage
                  desktopImage={feature.desktopImage}
                  mobileImage={feature.mobileImage}
                  alt={feature.imageAlt}
                />
              </div>

              {/* Text */}
              <div className={`${feature.imagePosition === 'right' ? 'order-2 md:order-1' : 'order-2'}`}>
                <h3 className="text-[28px] md:text-[32px] font-semibold text-[var(--hw-primary)] mb-4">
                  {feature.title}
                </h3>
                <p className="text-lg text-[var(--hw-text-secondary)] leading-relaxed max-w-[50ch]">
                  {feature.description}
                </p>
              </div>
            </div>
          </div>

          {/* Gold accent line between sections (except after last) */}
          {index < features.length - 1 && (
            <div className="max-w-[200px] mx-auto mt-16 md:mt-20">
              <div className="h-px bg-gradient-to-r from-transparent via-[var(--hw-accent-gold)] to-transparent opacity-50" />
            </div>
          )}
        </div>
      ))}
    </section>
  )
}
