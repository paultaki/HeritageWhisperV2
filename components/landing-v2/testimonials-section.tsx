"use client"

import { useState, useEffect } from "react"
import { Star } from "lucide-react"

export default function TestimonialsSection() {
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const testimonials = [
    {
      quote:
        "I learned stories about my dad I never knew. He opened up about his childhood in a way he never had before. Now my kids will know their grandfather's voice forever. We've preserved 47 stories in 3 months.",
      name: "Sarah Mitchell",
      location: "Austin, TX",
      relation: "Daughter",
      stories: "47 stories saved",
      avatar: "S",
    },
    {
      quote:
        "Mom was hesitant at first, but after the first question, she couldn't stop talking. We laughed, we cried. The smart questions really brought out memories she'd forgotten. I wish I'd started this years ago.",
      name: "David Chen",
      location: "Seattle, WA",
      relation: "Son",
      stories: "62 stories saved",
      avatar: "D",
    },
    {
      quote:
        "The questions were so thoughtful—things I would never have thought to ask. Now we have 50 stories and counting. It's brought our whole family closer. Everyone gets excited when Grandma adds a new one.",
      name: "Jennifer Torres",
      location: "Miami, FL",
      relation: "Daughter",
      stories: "50 stories saved",
      avatar: "J",
    },
  ]

  // Auto-rotate every 12 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true)
      setTimeout(() => {
        setActiveTestimonial((prev) => (prev + 1) % testimonials.length)
        setTimeout(() => {
          setIsTransitioning(false)
        }, 100)
      }, 300)
    }, 12000)

    return () => clearInterval(interval)
  }, [testimonials.length])

  const handleNavigationClick = (index: number) => {
    setIsTransitioning(true)
    setTimeout(() => {
      setActiveTestimonial(index)
      setTimeout(() => {
        setIsTransitioning(false)
      }, 100)
    }, 300)
  }

  return (
    <div className="w-full border-b border-[rgba(55,50,47,0.12)] flex flex-col justify-center items-center py-16">
      {/* Header */}
      <div className="text-center mb-12 max-w-[65ch]">
        <h2 className="text-3xl md:text-4xl font-bold text-[#111827] mb-4 font-serif">
          Families Are Hooked—and Keep Coming Back
        </h2>
        <p className="text-lg text-[#6B7280] font-sans">
          Real stories from adult children who started preserving their parents&apos; stories
        </p>
      </div>

      {/* Testimonial Content */}
      <div className="self-stretch px-2 overflow-hidden flex justify-start items-center">
        <div className="flex-1 flex flex-col md:flex-row justify-center items-center gap-6 max-w-[960px] mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-6 px-3 md:px-12 w-full">
            {/* Avatar */}
            <div
              className="flex-shrink-0 transition-all duration-700 ease-in-out"
              style={{
                opacity: isTransitioning ? 0.6 : 1,
                transform: isTransitioning ? "scale(0.95)" : "scale(1)",
              }}
            >
              <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-gradient-to-br from-[#8b6b7a] to-[#b88b94] flex items-center justify-center text-white text-5xl md:text-7xl font-bold shadow-xl">
                {testimonials[activeTestimonial].avatar}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 px-6 py-6 flex flex-col justify-start items-start gap-6">
              {/* 5 stars */}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-5 h-5 fill-[#8b6b7a] text-[#8b6b7a]" />
                ))}
              </div>

              {/* Quote */}
              <div
                className="text-[#111827] text-xl md:text-2xl font-medium leading-relaxed font-sans min-h-[200px] transition-all duration-700 ease-in-out"
                style={{
                  filter: isTransitioning ? "blur(4px)" : "blur(0px)",
                }}
              >
                &quot;{testimonials[activeTestimonial].quote}&quot;
              </div>

              {/* Author Info */}
              <div
                className="flex flex-col gap-1 transition-all duration-700 ease-in-out"
                style={{
                  filter: isTransitioning ? "blur(4px)" : "blur(0px)",
                }}
              >
                <div className="text-[#111827] text-lg font-bold font-sans">
                  {testimonials[activeTestimonial].name}
                </div>
                <div className="text-[#6B7280] text-base font-sans">
                  {testimonials[activeTestimonial].location}
                </div>
                <div className="text-[#8b6b7a] text-base font-semibold font-sans mt-2">
                  {testimonials[activeTestimonial].stories}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Arrows */}
          <div className="flex md:flex-col gap-4 pr-0 md:pr-6">
            <button
              onClick={() => handleNavigationClick((activeTestimonial - 1 + testimonials.length) % testimonials.length)}
              className="min-w-[48px] min-h-[48px] w-12 h-12 shadow-[0px_1px_2px_rgba(0,0,0,0.08)] overflow-hidden rounded-full border border-[rgba(0,0,0,0.15)] flex justify-center items-center hover:bg-gray-50 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-all"
              aria-label="Previous testimonial"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M15 18L9 12L15 6"
                  stroke="#46413E"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              onClick={() => handleNavigationClick((activeTestimonial + 1) % testimonials.length)}
              className="min-w-[48px] min-h-[48px] w-12 h-12 shadow-[0px_1px_2px_rgba(0,0,0,0.08)] overflow-hidden rounded-full border border-[rgba(0,0,0,0.15)] flex justify-center items-center hover:bg-gray-50 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-all"
              aria-label="Next testimonial"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M9 18L15 12L9 6"
                  stroke="#46413E"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
