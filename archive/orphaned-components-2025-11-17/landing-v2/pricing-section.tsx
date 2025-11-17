"use client"

import { useRouter } from "next/navigation"
import { CheckCircle } from "lucide-react"

export default function PricingSection() {
  const router = useRouter()

  const features = [
    "Unlimited voice recordings",
    "AI-powered transcription",
    "Smart guided questions",
    "Beautiful digital timeline",
    "Premium printed book included",
    "Unlimited family members",
    "Real-time family notifications",
    "Wisdom highlights (Lessons Learned)",
    "Cloud storage forever",
    "Cancel anytime",
  ]

  return (
    <div className="w-full flex flex-col justify-center items-center gap-2 py-16">
      {/* Header Section */}
      <div className="self-stretch px-6 md:px-24 py-12 md:py-16 border-b border-[rgba(55,50,47,0.12)] flex justify-center items-center gap-6">
        <div className="w-full max-w-[586px] px-6 py-5 overflow-hidden rounded-lg flex flex-col justify-start items-center gap-4">
          {/* Pricing Badge */}
          <div className="px-[14px] py-[6px] bg-white shadow-[0px_0px_0px_4px_rgba(55,50,47,0.05)] overflow-hidden rounded-[90px] flex justify-start items-center gap-[8px] border border-[rgba(2,6,23,0.08)]">
            <div className="w-[14px] h-[14px] relative overflow-hidden flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M6 1V11M8.5 3H4.75C4.28587 3 3.84075 3.18437 3.51256 3.51256C3.18437 3.84075 3 4.28587 3 4.75C3 5.21413 3.18437 5.65925 3.51256 5.98744C3.84075 6.31563 4.28587 6.5 4.75 6.5H7.25C7.71413 6.5 8.15925 6.68437 8.48744 7.01256C8.81563 7.34075 9 7.78587 9 8.25C9 8.71413 8.81563 9.15925 8.48744 9.48744C8.15925 9.81563 7.71413 10 7.25 10H3.5"
                  stroke="#37322F"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="text-center flex justify-center flex-col text-[#37322F] text-xs font-medium leading-3 font-sans">
              Pricing
            </div>
          </div>

          {/* Title */}
          <h2 className="self-stretch text-center text-[#111827] text-3xl md:text-5xl font-semibold leading-tight md:leading-[60px] font-serif tracking-tight">
            Your Living Legacy Plan
          </h2>

          {/* Description */}
          <p className="self-stretch text-center text-[#6B7280] text-lg font-normal leading-7 font-sans max-w-[65ch]">
            Pay once, keep building your legacy forever.
            <br />
            Unlimited stories, photos, family questions, and notifications.
          </p>
        </div>
      </div>

      {/* Pricing Card Section */}
      <div className="self-stretch border-b border-t border-[rgba(55,50,47,0.12)] flex justify-center items-center py-16">
        <div className="flex justify-center items-center w-full max-w-[600px] px-4">
          {/* Single Featured Plan */}
          <div className="w-full bg-gradient-to-br from-[#faf8f5] to-white rounded-2xl p-10 md:p-12 border-4 border-[#8b6b7a] shadow-2xl relative">
            {/* "Most Popular" Badge */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="px-6 py-2 bg-gradient-to-r from-[#8b6b7a] to-[#9d6b7c] text-white text-sm font-bold rounded-full shadow-lg">
                MOST POPULAR
              </div>
            </div>

            {/* Plan Header */}
            <div className="flex flex-col items-center text-center gap-4 mt-4 mb-8">
              <h3 className="text-3xl md:text-4xl font-bold text-[#111827] font-serif">
                Complete Family Plan
              </h3>

              {/* Price */}
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-5xl md:text-6xl font-bold text-[#111827] font-serif">$129</span>
                <span className="text-2xl text-[#6B7280] font-sans">/year</span>
              </div>

              <p className="text-lg text-[#6B7280] font-sans">
                Just 35 cents a day to preserve a lifetime
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-4 mb-8">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-[#8b6b7a] flex-shrink-0" />
                  <span className="text-lg text-[#111827] font-sans">{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <button
              onClick={() => router.push("/auth/register")}
              className="w-full min-h-[60px] px-12 py-4 bg-blue-600 text-white text-xl font-bold rounded-xl shadow-xl hover:shadow-2xl hover:bg-blue-700 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all duration-200"
            >
              Start Building Your Living Legacy
            </button>

            {/* Trust Message */}
            <p className="text-center text-base text-[#6B7280] mt-6 font-sans">
              30-day money-back guarantee • Secure payment • Cancel anytime
            </p>
          </div>
        </div>
      </div>

      {/* Risk Reversal Section */}
      <div className="w-full max-w-[800px] px-6 py-12">
        <div className="bg-gradient-to-r from-[#8b6b7a] to-[#9d6b7c] rounded-3xl p-8 md:p-10 text-white text-center shadow-2xl">
          <h3 className="text-3xl font-bold mb-6 font-serif">Try HeritageWhisper Risk-Free</h3>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-3 justify-center">
              <CheckCircle className="w-6 h-6 flex-shrink-0" />
              <span className="text-lg font-sans">30-Day Money-Back Guarantee</span>
            </div>
            <div className="flex items-center gap-3 justify-center">
              <CheckCircle className="w-6 h-6 flex-shrink-0" />
              <span className="text-lg font-sans">Cancel anytime, keep your stories</span>
            </div>
            <div className="flex items-center gap-3 justify-center">
              <CheckCircle className="w-6 h-6 flex-shrink-0" />
              <span className="text-lg font-sans">Free onboarding support call</span>
            </div>
            <div className="flex items-center gap-3 justify-center">
              <CheckCircle className="w-6 h-6 flex-shrink-0" />
              <span className="text-lg font-sans">No credit card required for trial</span>
            </div>
          </div>
          <p className="text-2xl font-bold italic font-serif text-center">&quot;If you don&apos;t love it, you don&apos;t pay. Period.&quot;</p>
        </div>
      </div>
    </div>
  )
}
