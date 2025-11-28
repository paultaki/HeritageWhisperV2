'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Play, Pause } from 'lucide-react'

export default function VoiceSection() {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  const togglePlay = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleEnded = () => {
    setIsPlaying(false)
  }

  return (
    <section className="bg-[var(--hw-page-bg)] py-16 md:py-24 px-6 md:px-12">
      <div className="max-w-[1140px] mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="order-2 md:order-1">
            <h2 className="text-[28px] md:text-[32px] font-semibold text-[var(--hw-primary)] mb-6 leading-tight">
              Text captures the facts. Voice captures the soul.
            </h2>
            <p className="text-lg text-[var(--hw-text-secondary)] leading-relaxed max-w-[50ch]">
              When Dad talks about his first car, you don't just get the make and model—you hear
              the pride in his voice when he describes saving every paycheck. When Mom recalls
              her wedding day, you hear the catch in her throat. That's what gets preserved.
            </p>

            {/* Audio player */}
            <div className="mt-8">
              <button
                onClick={togglePlay}
                className="group flex items-center gap-4 px-5 py-3 bg-[var(--hw-surface)] border border-[var(--hw-border-subtle)] rounded-xl hover:border-[var(--hw-secondary)] hover:shadow-md transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-full bg-[var(--hw-secondary)] flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                  {isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5 ml-0.5" />
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-end gap-1 h-6">
                    {[3, 5, 8, 6, 9, 4, 7, 5, 8, 6, 4, 7, 5, 3].map((height, i) => (
                      <div
                        key={i}
                        className={`w-1 rounded-full transition-all duration-150 ${
                          isPlaying
                            ? 'bg-[var(--hw-secondary)] animate-pulse'
                            : 'bg-[var(--hw-secondary)] opacity-60'
                        }`}
                        style={{
                          height: `${height * 2.5}px`,
                          animationDelay: isPlaying ? `${i * 50}ms` : '0ms'
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-[var(--hw-text-secondary)]">
                    {isPlaying ? 'Now playing...' : 'Hear the difference'}
                  </span>
                </div>
              </button>
              <audio
                ref={audioRef}
                src="/Pocket Watch.mp3"
                onEnded={handleEnded}
                preload="metadata"
              />
            </div>
          </div>

          {/* Image */}
          <div className="order-1 md:order-2">
            <div className="rounded-2xl overflow-hidden shadow-lg">
              <Image
                src="/grandpa-story.webp"
                alt="Grandpa sharing stories with family"
                width={600}
                height={450}
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
