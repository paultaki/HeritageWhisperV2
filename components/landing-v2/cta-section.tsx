"use client"

import { useRouter } from "next/navigation"
import { Mic, CheckCircle } from "lucide-react"

export default function CTASection() {
  const router = useRouter()

  return (
    <div className="w-full relative overflow-hidden flex flex-col justify-center items-center gap-2">
      {/* Content */}
      <div className="self-stretch px-6 md:px-24 py-16 md:py-20 border-t border-b border-[rgba(55,50,47,0.12)] flex justify-center items-center gap-6 relative z-10">
        {/* Diagonal Pattern Background */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <div className="w-full h-full relative">
            {Array.from({ length: 300 }).map((_, i) => (
              <div
                key={i}
                className="absolute h-4 w-full rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]"
                style={{
                  top: `${i * 16 - 120}px`,
                  left: "-100%",
                  width: "300%",
                }}
              ></div>
            ))}
          </div>
        </div>

        {/* CTA Content */}
        <div className="w-full max-w-[700px] px-6 py-5 md:py-8 overflow-hidden rounded-lg flex flex-col justify-start items-center gap-8 relative z-20">
          <div className="self-stretch flex flex-col justify-start items-start gap-4">
            <h2 className="self-stretch text-center text-[#111827] text-4xl md:text-5xl font-bold leading-tight md:leading-[56px] font-serif tracking-tight">
              Don&apos;t Let Another Story Slip Away
            </h2>
            <p className="self-stretch text-center text-[#6B7280] text-xl leading-8 font-sans font-medium max-w-[65ch] mx-auto">
              Future generations won&apos;t thumb through books—
              <br className="hidden sm:block" />
              they&apos;ll discover you here, voice and all.
            </p>
          </div>

          {/* CTA Button */}
          <div className="w-full max-w-[497px] flex flex-col justify-center items-center gap-6">
            <button
              onClick={() => router.push("/auth/register")}
              className="min-h-[60px] px-16 py-4 bg-blue-600 text-white text-xl font-bold rounded-xl shadow-xl hover:shadow-2xl hover:bg-blue-700 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all duration-200 flex items-center gap-3"
            >
              <Mic className="w-8 h-8" />
              Preserve Your Memories Today
            </button>

            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center items-center gap-6 text-[#6B7280] font-sans">
              <span className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#8b6b7a]" />
                30-Day Guarantee
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#8b6b7a]" />
                No Credit Card for Trial
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#8b6b7a]" />
                Cancel Anytime
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
