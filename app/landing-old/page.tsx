"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Mic, Lock, Shield, CheckCircle } from "lucide-react"
import TestimonialsSection from "@/components/landing-v2/testimonials-section"
import PricingSection from "@/components/landing-v2/pricing-section"
import FAQSection from "@/components/landing-v2/faq-section"
import CTASection from "@/components/landing-v2/cta-section"

export default function Home() {
  const router = useRouter()
  const [activeCard, setActiveCard] = useState(0)
  const [progress, setProgress] = useState(0)
  const mountedRef = useRef(true)

  // Auto-rotate feature cards every 5 seconds
  useEffect(() => {
    const progressInterval = setInterval(() => {
      if (!mountedRef.current) return

      setProgress((prev) => {
        if (prev >= 100) {
          if (mountedRef.current) {
            setActiveCard((current) => (current + 1) % 3) // 3 feature cards
          }
          return 0
        }
        return prev + 2 // 2% every 100ms = 5 seconds total
      })
    }, 100)

    return () => {
      clearInterval(progressInterval)
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  const handleCardClick = (index: number) => {
    if (!mountedRef.current) return
    setActiveCard(index)
    setProgress(0)
  }

  const featureCards = [
    {
      title: "Just Press Record",
      description: "No typing, no complexity. Your own voice, your own pace—transcribed beautifully.",
      image: "/microphone 2.webp",
    },
    {
      title: "AI Transcribes Everything",
      description: "Smart technology captures every word and organizes stories automatically.",
      image: "/book full.webp",
    },
    {
      title: "Beautiful Timeline",
      description: "Stories organized by decade with photos, audio, and extracted wisdom.",
      image: "/timeline.webp",
    },
  ]

  return (
    <div className="w-full min-h-screen relative bg-[#faf8f5] overflow-x-hidden flex flex-col justify-start items-center">
      <div className="relative flex flex-col justify-start items-center w-full">
        {/* Main container */}
        <div className="w-full max-w-none px-4 sm:px-6 md:px-8 lg:px-0 lg:max-w-[1060px] lg:w-[1060px] relative flex flex-col justify-start items-start min-h-screen">
          {/* Left vertical line */}
          <div className="w-[1px] h-full absolute left-4 sm:left-6 md:left-8 lg:left-0 top-0 bg-[rgba(55,50,47,0.12)] shadow-[1px_0px_0px_white] z-0"></div>

          {/* Right vertical line */}
          <div className="w-[1px] h-full absolute right-4 sm:right-6 md:right-8 lg:right-0 top-0 bg-[rgba(55,50,47,0.12)] shadow-[1px_0px_0px_white] z-0"></div>

          <div className="self-stretch pt-[9px] overflow-hidden border-b border-[rgba(55,50,47,0.06)] flex flex-col justify-center items-center gap-4 sm:gap-6 md:gap-8 lg:gap-[66px] relative z-10">
            {/* Navigation */}
            <div className="w-full h-12 sm:h-14 md:h-16 lg:h-[84px] absolute left-0 top-0 flex justify-center items-center z-20 px-6 sm:px-8 md:px-12 lg:px-0">
              <div className="w-full h-0 absolute left-0 top-6 sm:top-7 md:top-8 lg:top-[42px] border-t border-[rgba(55,50,47,0.12)] shadow-[0px_1px_0px_white]"></div>

              <div className="w-full max-w-[calc(100%-32px)] sm:max-w-[calc(100%-48px)] md:max-w-[calc(100%-64px)] lg:max-w-[700px] lg:w-[700px] min-h-[48px] py-2 sm:py-2 px-4 sm:px-4 md:px-4 pr-3 sm:pr-3 bg-[#faf8f5] backdrop-blur-sm shadow-[0px_0px_0px_2px_white] rounded-[50px] flex justify-between items-center relative z-30 gap-2">
                <div className="flex flex-row items-center gap-3 sm:gap-4 md:gap-5">
                  <button
                    onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                    className="text-[rgba(49,45,43,0.80)] text-xs sm:text-sm md:text-[14px] font-medium hover:text-[#2563EB] transition-colors whitespace-nowrap"
                  >
                    Features
                  </button>
                  <button
                    onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                    className="text-[rgba(49,45,43,0.80)] text-xs sm:text-sm md:text-[14px] font-medium hover:text-[#2563EB] transition-colors whitespace-nowrap"
                  >
                    Pricing
                  </button>
                  <button
                    onClick={() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })}
                    className="text-[rgba(49,45,43,0.80)] text-xs sm:text-sm md:text-[14px] font-medium hover:text-[#2563EB] transition-colors whitespace-nowrap"
                  >
                    FAQ
                  </button>
                </div>
                <button
                  onClick={() => router.push("/auth/login")}
                  className="px-3 py-1 bg-white shadow-[0px_1px_2px_rgba(55,50,47,0.12)] rounded-full hover:bg-gray-50 transition-colors flex-shrink-0 w-auto max-w-fit"
                >
                  <span className="text-[#37322F] text-xs font-medium whitespace-nowrap">Log in</span>
                </button>
              </div>
            </div>

            {/* Hero Section */}
            <div className="pt-16 sm:pt-20 md:pt-24 lg:pt-[216px] pb-8 sm:pb-12 md:pb-16 flex flex-col justify-start items-center px-2 sm:px-4 md:px-8 lg:px-0 w-full">
              <div className="w-full max-w-[937px] lg:w-[937px] flex flex-col justify-center items-center gap-3 sm:gap-4 md:gap-5 lg:gap-6">
                <div className="self-stretch rounded-[3px] flex flex-col justify-center items-center gap-4 sm:gap-5 md:gap-6 lg:gap-8">
                  {/* Headline */}
                  <h1 className="w-full max-w-[748.71px] lg:w-[748.71px] text-center text-[#37322F] text-[32px] xs:text-[36px] sm:text-[44px] md:text-[56px] lg:text-[72px] font-normal leading-[1.1] sm:leading-[1.15] md:leading-[1.2] font-serif px-2 sm:px-4 md:px-0">
                    Your Family&apos;s Living Legacy—
                    <br />
                    Told in Their Own Voice
                  </h1>

                  {/* Subheadline */}
                  <p className="w-full max-w-[506.08px] lg:w-[506.08px] text-center text-[rgba(55,50,47,0.80)] text-lg leading-[1.5] font-sans px-2 sm:px-4 md:px-0 font-medium">
                    No writing required. Just press record and talk.
                    <br className="hidden sm:block" />
                    Our story system transcribes, organizes, and preserves every memory forever.
                  </p>
                </div>
              </div>

              {/* CTA Button */}
              <div className="w-full max-w-[497px] lg:w-[497px] flex flex-col justify-center items-center gap-6 sm:gap-8 md:gap-10 lg:gap-12 relative z-10 mt-6 sm:mt-8 md:mt-10 lg:mt-12">
                <div className="flex justify-start items-center gap-4">
                  <button
                    onClick={() => router.push("/auth/register")}
                    className="min-h-[60px] px-12 py-4 bg-blue-600 text-white text-lg font-medium rounded-xl shadow-sm hover:shadow-md hover:bg-blue-700 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all duration-200 flex items-center gap-3"
                  >
                    <Mic className="w-6 h-6" />
                    Start Your Living Legacy
                  </button>
                </div>
                <p className="text-base text-[#6B7280] text-center">
                  No credit card required • 30-day money-back guarantee
                </p>
              </div>

              {/* Feature Preview Cards */}
              <div id="features" className="w-full max-w-[960px] lg:w-[960px] pt-2 sm:pt-4 pb-6 sm:pb-8 md:pb-10 px-2 sm:px-4 md:px-6 lg:px-11 flex flex-col justify-center items-center gap-2 relative z-5 my-8 sm:my-12 md:my-16 lg:my-16 mb-0 lg:pb-0">
                <div className="w-full max-w-[960px] lg:w-[960px] h-[200px] sm:h-[280px] md:h-[450px] lg:h-[695.55px] bg-white shadow-[0px_0px_0px_0.9056603908538818px_rgba(0,0,0,0.08)] overflow-hidden rounded-[6px] sm:rounded-[8px] lg:rounded-[9.06px] flex flex-col justify-start items-start">
                  {/* Dashboard Content - Rotating Images */}
                  <div className="self-stretch flex-1 flex justify-start items-start">
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="relative w-full h-full overflow-hidden">
                        {featureCards.map((card, index) => (
                          <div
                            key={index}
                            className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                              activeCard === index ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-98 blur-md"
                            }`}
                          >
                            {/* Special scrolling animation for timeline */}
                            {card.image === "/timeline.webp" ? (
                              <div className="w-full h-full overflow-hidden bg-gradient-to-br from-[#faf8f5] to-white relative">
                                <style dangerouslySetInnerHTML={{__html: `
                                  @keyframes timelineScroll {
                                    0% { transform: translateY(0); opacity: 0; }
                                    5%, 10% { transform: translateY(0); opacity: 1; }
                                    85% { transform: translateY(-40%); opacity: 1; }
                                    95%, 100% { transform: translateY(-40%); opacity: 0; }
                                  }
                                  .timeline-animate {
                                    animation: timelineScroll 15s ease-in-out infinite;
                                  }
                                  .timeline-animate:hover {
                                    animation-play-state: paused;
                                  }
                                  @media (prefers-reduced-motion: reduce) {
                                    .timeline-animate {
                                      animation: none;
                                    }
                                  }
                                `}} />
                                <Image
                                  src={card.image}
                                  alt={card.title}
                                  width={1200}
                                  height={2400}
                                  className="w-full h-auto timeline-animate"
                                  style={{ minHeight: '150%' }}
                                />
                              </div>
                            ) : card.image === "/book full.webp" ? (
                              <div className="w-full h-full bg-gradient-to-br from-[#faf8f5] to-white">
                                <Image
                                  src={card.image}
                                  alt={card.title}
                                  width={960}
                                  height={695}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#faf8f5] to-white p-8">
                                <Image
                                  src={card.image}
                                  alt={card.title}
                                  width={800}
                                  height={600}
                                  className="w-auto h-auto max-w-full max-h-full object-contain"
                                  style={
                                    card.title === "Just Press Record"
                                      ? { filter: "drop-shadow(0 10px 25px rgba(0, 0, 0, 0.15)) drop-shadow(0 4px 10px rgba(0, 0, 0, 0.1))" }
                                      : undefined
                                  }
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature Cards */}
              <div className="self-stretch border-t border-[#E0DEDB] border-b border-[#E0DEDB] flex justify-center items-start">
                <div className="w-4 sm:w-6 md:w-8 lg:w-12 self-stretch relative overflow-hidden">
                  {/* Left decorative pattern */}
                  <div className="w-[120px] sm:w-[140px] md:w-[162px] left-[-40px] sm:left-[-50px] md:left-[-58px] top-[-120px] absolute flex flex-col justify-start items-start">
                    {Array.from({ length: 50 }).map((_, i) => (
                      <div
                        key={i}
                        className="self-stretch h-3 sm:h-4 rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]"
                      ></div>
                    ))}
                  </div>
                </div>

                <div className="flex-1 px-0 sm:px-2 md:px-0 flex flex-col md:flex-row justify-center items-stretch gap-0">
                  {featureCards.map((card, index) => (
                    <FeatureCard
                      key={index}
                      title={card.title}
                      description={card.description}
                      isActive={activeCard === index}
                      progress={activeCard === index ? progress : 0}
                      onClick={() => handleCardClick(index)}
                    />
                  ))}
                </div>

                <div className="w-4 sm:w-6 md:w-8 lg:w-12 self-stretch relative overflow-hidden">
                  {/* Right decorative pattern */}
                  <div className="w-[120px] sm:w-[140px] md:w-[162px] right-[-40px] sm:right-[-50px] md:right-[-58px] top-[-120px] absolute flex flex-col justify-start items-start">
                    {Array.from({ length: 50 }).map((_, i) => (
                      <div
                        key={i}
                        className="self-stretch h-3 sm:h-4 rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]"
                      ></div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Trust Bar */}
              <div className="w-full py-12 flex justify-center">
                <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-[#5a4a3a]">
                  <span className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#8b6b7a]" />
                    <strong>Bank-Level Encryption</strong>
                  </span>
                  <span className="text-[#e8ddd5]">|</span>
                  <span className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#8b6b7a]" />
                    GDPR & CCPA Compliant
                  </span>
                  <span className="text-[#e8ddd5]">|</span>
                  <span className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#8b6b7a]" />
                    30-Day Money-Back Guarantee
                  </span>
                </div>
              </div>

              {/* Testimonials Section */}
              <div id="testimonials">
                <TestimonialsSection />
              </div>

              {/* Pricing Section */}
              <div id="pricing">
                <PricingSection />
              </div>

              {/* FAQ Section */}
              <div id="faq">
                <FAQSection />
              </div>

              {/* CTA Section */}
              <CTASection />

              {/* Footer */}
              <footer className="w-full py-16 border-t border-[rgba(55,50,47,0.12)] mt-20">
                <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                  <div>
                    <Image
                      src="/final logo/chat-bubble-logo.svg"
                      alt="Heritage Whisper"
                      width={120}
                      height={120}
                      className="h-20 w-auto opacity-60"
                    />
                  </div>
                  <div className="flex gap-8 text-sm text-[#37322F]">
                    <button onClick={() => router.push("/privacy")} className="hover:text-[#2563EB] transition-colors">
                      Privacy
                    </button>
                    <button onClick={() => router.push("/terms")} className="hover:text-[#2563EB] transition-colors">
                      Terms
                    </button>
                    <button onClick={() => router.push("/help")} className="hover:text-[#2563EB] transition-colors">
                      Help
                    </button>
                  </div>
                </div>
                <div className="text-center text-sm text-[rgba(55,50,47,0.60)] mt-8">
                  © 2025 Heritage Whisper. Living Stories, Lasting Legacy.
                </div>
              </footer>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// FeatureCard component
function FeatureCard({
  title,
  description,
  isActive,
  progress,
  onClick,
}: {
  title: string
  description: string
  isActive: boolean
  progress: number
  onClick: () => void
}) {
  return (
    <div
      className={`w-full md:flex-1 self-stretch px-6 py-5 overflow-hidden flex flex-col justify-start items-start gap-2 cursor-pointer relative border-b md:border-b-0 last:border-b-0 min-h-[48px] ${
        isActive
          ? "bg-white shadow-[0px_0px_0px_0.75px_#E0DEDB_inset]"
          : "border-l-0 border-r-0 md:border border-[#E0DEDB]/80"
      }`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-pressed={isActive}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick()
        }
      }}
    >
      {isActive && (
        <div className="absolute top-0 left-0 w-full h-0.5 bg-[rgba(50,45,43,0.08)]">
          <div
            className="h-full bg-[#2563EB] transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="self-stretch flex justify-center flex-col text-[#111827] text-lg font-semibold leading-6 font-sans">
        {title}
      </div>
      <div className="self-stretch text-[#6B7280] text-base font-normal leading-[22px] font-sans">
        {description}
      </div>
    </div>
  )
}
