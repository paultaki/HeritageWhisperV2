"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Play, Pause } from "lucide-react";

const logoUrl = "/HW_logo_mic_clean.png";

export default function LandingV3Page() {
  const router = useRouter();
  const [isPlaying, setIsPlaying] = useState(false);

  const handleStartRecording = () => {
    router.push("/auth/register");
  };

  const testimonials = [
    {
      quote:
        "After my third story, my grandson called crying. He finally understood why I pushed him so hard.",
      author: "Sarah",
      age: "72",
      initial: "S",
    },
    {
      quote:
        "The questions felt like they were coming from someone who really knew me.",
      author: "Robert",
      age: "68",
      initial: "R",
    },
    {
      quote:
        "It asked about my father when I didn't even realize I was avoiding him.",
      author: "Linda",
      age: "81",
      initial: "L",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      {/* Refined Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/98 backdrop-blur-md border-b border-[#D4C4B0] z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-5 flex justify-between items-center">
          <img
            src={logoUrl}
            alt="HeritageWhisper"
            className="h-11 w-auto"
          />
          <div className="flex gap-6 items-center">
            <button
              onClick={() => router.push("/gift-plans")}
              className="text-[#7A6651] hover:text-[#5A4631] font-medium text-base tracking-wide transition-colors"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Gift Plans
            </button>
            <button
              onClick={() => router.push("/auth/login")}
              className="bg-gradient-to-r from-[#C9A66B] to-[#B8954F] hover:from-[#B8954F] hover:to-[#A8853F] text-white px-7 py-2.5 rounded-lg font-medium text-base tracking-wide shadow-md hover:shadow-lg transition-all duration-300"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Continue Stories
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section - Premium, Elegant */}
      <section className="pt-40 pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Main Headline */}
          <div className="text-center mb-12">
            <h1
              className="text-6xl sm:text-7xl md:text-8xl leading-none text-[#2C1810] mb-8 tracking-tight"
              style={{ fontFamily: "Playfair Display, serif", fontWeight: 400 }}
            >
              Everyone has a story.
            </h1>

            <div className="relative inline-block">
              <h2
                className="text-5xl sm:text-6xl md:text-7xl text-[#8B6F47] tracking-tight"
                style={{ fontFamily: "Playfair Display, serif", fontWeight: 400, fontStyle: "italic" }}
              >
                Finally, someone who wants to hear it.
              </h2>
              <div className="absolute -left-12 top-0 text-[#C9A66B] text-6xl opacity-30" style={{ fontFamily: "Playfair Display, serif" }}>"</div>
            </div>
          </div>

          {/* Value Proposition Card */}
          <div className="bg-white rounded-3xl p-10 sm:p-14 shadow-2xl border border-[#D4C4B0] mb-12 relative overflow-hidden">
            {/* Subtle decorative corner */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#FFF9F0] to-transparent opacity-50"></div>

            <div className="relative">
              <p
                className="text-2xl sm:text-3xl md:text-4xl text-[#4A3728] text-center leading-relaxed mb-8"
                style={{ fontFamily: "Playfair Display, serif", fontWeight: 400 }}
              >
                Not generic prompts. Not another book.
              </p>
              <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-[#C9A66B] to-transparent mx-auto mb-8"></div>
              <p
                className="text-2xl sm:text-3xl md:text-4xl text-[#2C1810] text-center leading-relaxed"
                style={{ fontFamily: "Playfair Display, serif", fontWeight: 400 }}
              >
                We listen to <span className="font-semibold text-[#C9A66B] relative">
                  YOUR
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C9A66B] opacity-30"></span>
                </span> stories
                <br className="hidden sm:block" />
                and ask the questions
                <br className="hidden sm:block" />
                your grandkids wish they could.
              </p>
            </div>
          </div>

          {/* Tagline */}
          <div className="text-center mb-14">
            <p
              className="text-3xl sm:text-4xl md:text-5xl text-[#7A6651] font-light tracking-wide"
              style={{ fontFamily: "Playfair Display, serif", fontStyle: "italic" }}
            >
              2 minutes · Your voice · Their legacy
            </p>
          </div>

          {/* Premium CTA */}
          <div className="text-center mb-12">
            <button
              onClick={handleStartRecording}
              className="group relative bg-gradient-to-r from-[#B8954F] to-[#9D7A3F] hover:from-[#A8853F] hover:to-[#8D6A2F] text-white px-14 sm:px-20 py-7 sm:py-9 rounded-full text-2xl sm:text-3xl font-medium shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-[1.02]"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              <span className="relative z-10">Start your first story</span>
              {/* Shine effect on hover */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
            </button>
            <p
              className="text-lg text-[#8B6F47] mt-5 tracking-wide"
              style={{ fontFamily: "Playfair Display, serif", fontStyle: "italic" }}
            >
              Just 2 minutes
            </p>
          </div>

          {/* Featured Testimonial */}
          <div className="max-w-3xl mx-auto">
            <div className="bg-gradient-to-br from-[#FFF9F0] to-[#FFF5E8] rounded-2xl p-8 sm:p-10 border-l-4 border-[#C9A66B] shadow-xl relative">
              <div className="absolute -top-4 left-8 text-[#C9A66B] text-7xl leading-none" style={{ fontFamily: "Playfair Display, serif" }}>"</div>
              <blockquote
                className="text-xl sm:text-2xl md:text-3xl text-[#2C1810] leading-relaxed mb-6 relative z-10"
                style={{ fontFamily: "Playfair Display, serif", fontStyle: "italic" }}
              >
                My kids finally understand why I am who I am
              </blockquote>
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className="text-lg sm:text-xl text-[#7A6651] font-medium"
                    style={{ fontFamily: "Playfair Display, serif" }}
                  >
                    Margaret, 74
                  </p>
                  <p
                    className="text-base text-[#9B8A75] italic"
                    style={{ fontFamily: "Playfair Display, serif" }}
                  >
                    after 10 stories
                  </p>
                </div>
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#C9A66B] to-[#B8954F] flex items-center justify-center text-white text-2xl font-semibold shadow-md">
                  M
                </div>
              </div>
            </div>
          </div>

          {/* Gift Plans Link */}
          <div className="text-center mt-10">
            <a
              href="/gift-plans"
              className="inline-flex items-center gap-2 text-lg text-[#7A6651] hover:text-[#5A4631] transition-colors group"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              <span className="border-b border-[#C9A66B] border-opacity-40 group-hover:border-opacity-100 transition-all">
                Adult children: Buy this for your parents
              </span>
              <span className="transform group-hover:translate-x-1 transition-transform">→</span>
            </a>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-[#D4C4B0] to-transparent"></div>
      </div>

      {/* Section: We Actually Listen */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2
              className="text-5xl sm:text-6xl md:text-7xl text-[#2C1810] mb-6 tracking-tight"
              style={{ fontFamily: "Playfair Display, serif", fontWeight: 400 }}
            >
              We Actually Listen
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#C9A66B] to-[#B8954F] mx-auto mb-8 rounded-full"></div>
            <p
              className="text-2xl sm:text-3xl text-[#7A6651] max-w-3xl mx-auto leading-relaxed"
              style={{ fontFamily: "Playfair Display, serif", fontStyle: "italic" }}
            >
              After your first story, something magical happens
            </p>
          </div>

          {/* Comparison - More elegant */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">
            {/* Generic Services */}
            <div className="bg-gradient-to-br from-[#FFF5F5] to-[#FFEFEF] rounded-3xl p-10 border-2 border-[#E5C4C4] shadow-lg">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-md">
                  <X className="w-6 h-6 text-[#B8685C]" />
                </div>
                <h3
                  className="text-2xl sm:text-3xl text-[#4A3728]"
                  style={{ fontFamily: "Playfair Display, serif", fontWeight: 600 }}
                >
                  Generic Services
                </h3>
              </div>

              <div className="space-y-4">
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-5 border border-[#E5D5C3]">
                  <p
                    className="text-lg sm:text-xl text-[#6B5437] leading-relaxed"
                    style={{ fontFamily: "Playfair Display, serif", fontStyle: "italic" }}
                  >
                    "Tell me about your childhood"
                  </p>
                </div>
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-5 border border-[#E5D5C3]">
                  <p
                    className="text-lg sm:text-xl text-[#6B5437] leading-relaxed"
                    style={{ fontFamily: "Playfair Display, serif", fontStyle: "italic" }}
                  >
                    "What was your first job?"
                  </p>
                </div>
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-5 border border-[#E5D5C3]">
                  <p
                    className="text-lg sm:text-xl text-[#6B5437] leading-relaxed"
                    style={{ fontFamily: "Playfair Display, serif", fontStyle: "italic" }}
                  >
                    "Describe your parents"
                  </p>
                </div>
                <div className="bg-white rounded-xl p-5 border-2 border-[#B8685C] text-center">
                  <p
                    className="text-lg sm:text-xl text-[#4A3728] font-semibold"
                    style={{ fontFamily: "Playfair Display, serif" }}
                  >
                    Same 52 questions for everyone
                  </p>
                </div>
              </div>
            </div>

            {/* Your Personal Journey */}
            <div className="bg-gradient-to-br from-[#F5F8F0] to-[#EFF5E8] rounded-3xl p-10 border-2 border-[#B8C9A6] shadow-xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-md">
                  <Check className="w-6 h-6 text-[#6B9B6B]" />
                </div>
                <h3
                  className="text-2xl sm:text-3xl text-[#2C1810]"
                  style={{ fontFamily: "Playfair Display, serif", fontWeight: 600 }}
                >
                  Your Personal Journey
                </h3>
              </div>

              <div className="space-y-4">
                <div className="bg-white rounded-xl p-5 border-l-4 border-[#8BAF7A] shadow-sm">
                  <p
                    className="text-lg sm:text-xl text-[#2C1810] leading-relaxed"
                    style={{ fontFamily: "Playfair Display, serif", fontStyle: "italic" }}
                  >
                    "You felt 'housebroken by love' with Chewy. What freedom did you trade for that?"
                  </p>
                </div>
                <div className="bg-white rounded-xl p-5 border-l-4 border-[#8BAF7A] shadow-sm">
                  <p
                    className="text-lg sm:text-xl text-[#2C1810] leading-relaxed"
                    style={{ fontFamily: "Playfair Display, serif", fontStyle: "italic" }}
                  >
                    "Your father's disappointment appears three times. When did you stop trying to impress him?"
                  </p>
                </div>
                <div className="bg-white rounded-xl p-5 border-2 border-[#8BAF7A] text-center">
                  <p
                    className="text-lg sm:text-xl text-[#2C1810] font-semibold"
                    style={{ fontFamily: "Playfair Display, serif" }}
                  >
                    Based on YOUR stories
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Closing Statement */}
          <div className="text-center max-w-3xl mx-auto">
            <p
              className="text-2xl sm:text-3xl md:text-4xl text-[#2C1810] leading-relaxed mb-4"
              style={{ fontFamily: "Playfair Display, serif", fontWeight: 600 }}
            >
              Every question proves we heard you.
            </p>
            <p
              className="text-xl sm:text-2xl text-[#7A6651]"
              style={{ fontFamily: "Playfair Display, serif", fontStyle: "italic" }}
            >
              No two people get the same journey.
            </p>
          </div>
        </div>
      </section>

      {/* Section: The Wisdom Within */}
      <section className="py-24 px-6 bg-gradient-to-b from-[#FAF8F5] to-[#FFF9F0]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="text-5xl sm:text-6xl md:text-7xl text-[#2C1810] mb-6 tracking-tight"
              style={{ fontFamily: "Playfair Display, serif", fontWeight: 400 }}
            >
              The Wisdom Within
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#C9A66B] to-[#B8954F] mx-auto rounded-full"></div>
          </div>

          {/* Premium Audio Player */}
          <div className="bg-white rounded-3xl shadow-2xl p-10 sm:p-14 border border-[#D4C4B0] relative overflow-hidden">
            {/* Decorative corners */}
            <div className="absolute top-0 left-0 w-24 h-24 border-t-2 border-l-2 border-[#C9A66B] opacity-20 rounded-tl-3xl"></div>
            <div className="absolute bottom-0 right-0 w-24 h-24 border-b-2 border-r-2 border-[#C9A66B] opacity-20 rounded-br-3xl"></div>

            <div className="relative">
              <div className="text-center mb-10">
                <span
                  className="inline-block px-8 py-3 bg-gradient-to-r from-[#FFF9F0] to-[#FFF5E8] text-[#7A6651] rounded-full text-base font-medium border border-[#E5D5C3] tracking-wide"
                  style={{ fontFamily: "Playfair Display, serif" }}
                >
                  🎧 Wisdom Clip
                </span>
              </div>

              {/* Audio Controls */}
              <div className="flex items-center justify-center gap-8 mb-12">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-[#C9A66B] to-[#B8954F] hover:from-[#B8954F] hover:to-[#A8853F] flex items-center justify-center shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
                >
                  {isPlaying ? (
                    <Pause className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                  ) : (
                    <Play className="w-10 h-10 sm:w-12 sm:h-12 text-white ml-1" />
                  )}
                </button>

                {/* Elegant waveform */}
                <div className="flex items-center gap-1.5 h-20">
                  {Array.from({ length: 24 }).map((_, i) => {
                    const heights = [
                      35, 50, 65, 80, 90, 95, 88, 75, 88, 98, 92, 82,
                      75, 82, 92, 88, 78, 68, 75, 85, 78, 65, 50, 35,
                    ];
                    return (
                      <div
                        key={i}
                        className="bg-gradient-to-t from-[#B8954F] to-[#C9A66B] rounded-full transition-all duration-300"
                        style={{
                          width: "4px",
                          height: `${heights[i]}%`,
                          opacity: isPlaying ? 0.95 : 0.65,
                        }}
                      />
                    );
                  })}
                </div>

                <span
                  className="text-xl text-[#7A6651] font-medium tracking-wide"
                  style={{ fontFamily: "Playfair Display, serif" }}
                >
                  0:10
                </span>
              </div>

              {/* Quote - Book Style */}
              <div className="bg-gradient-to-br from-[#FFF9F0] to-white rounded-2xl p-10 border-l-4 border-[#C9A66B] relative">
                <div className="absolute -top-6 left-6 text-[#C9A66B] text-8xl leading-none opacity-40" style={{ fontFamily: "Playfair Display, serif" }}>"</div>
                <blockquote
                  className="text-2xl sm:text-3xl md:text-4xl text-[#2C1810] leading-relaxed mb-6 relative z-10"
                  style={{ fontFamily: "Playfair Display, serif", fontStyle: "italic" }}
                >
                  The quiet moments taught me more than the loud ones ever could.
                </blockquote>
                <div className="flex items-center justify-end">
                  <div className="text-right">
                    <p
                      className="text-xl sm:text-2xl text-[#7A6651]"
                      style={{ fontFamily: "Playfair Display, serif" }}
                    >
                      — Margaret, 74
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section: How It Works */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6">
            <h2
              className="text-5xl sm:text-6xl text-[#2C1810] mb-4 tracking-tight"
              style={{ fontFamily: "Playfair Display, serif", fontWeight: 400 }}
            >
              How it works
            </h2>
            <p
              className="text-2xl sm:text-3xl text-[#7A6651]"
              style={{ fontFamily: "Playfair Display, serif", fontStyle: "italic" }}
            >
              Easier than FaceTime
            </p>
          </div>
          <div className="w-24 h-1 bg-gradient-to-r from-[#C9A66B] to-[#B8954F] mx-auto mb-20 rounded-full"></div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Step 1 */}
            <div className="text-center group">
              <div className="relative mb-8 inline-block">
                <div className="w-28 h-28 mx-auto rounded-full bg-gradient-to-br from-[#FFF9F0] to-[#FFF5E8] border-2 border-[#C9A66B] flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <span className="text-6xl">📱</span>
                </div>
                {/* Decorative number */}
                <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-gradient-to-br from-[#C9A66B] to-[#B8954F] flex items-center justify-center text-white text-lg font-semibold shadow-md">
                  1
                </div>
              </div>
              <h3
                className="text-2xl sm:text-3xl text-[#2C1810] mb-4"
                style={{ fontFamily: "Playfair Display, serif", fontWeight: 600 }}
              >
                Open on any phone
              </h3>
              <p
                className="text-lg sm:text-xl text-[#6B5437] leading-relaxed"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                Talk for 2 minutes.
                <br />
                Our questions guide your story.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center group">
              <div className="relative mb-8 inline-block">
                <div className="w-28 h-28 mx-auto rounded-full bg-gradient-to-br from-[#FFF9F0] to-[#FFF5E8] border-2 border-[#C9A66B] flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <span className="text-6xl">📱</span>
                </div>
                <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-gradient-to-br from-[#C9A66B] to-[#B8954F] flex items-center justify-center text-white text-lg font-semibold shadow-md">
                  2
                </div>
              </div>
              <h3
                className="text-2xl sm:text-3xl text-[#2C1810] mb-4"
                style={{ fontFamily: "Playfair Display, serif", fontWeight: 600 }}
              >
                Share forever
              </h3>
              <p
                className="text-lg sm:text-xl text-[#6B5437] leading-relaxed"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                Character insights + wisdom clips.
                <br />
                In everyone's pocket instantly.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center group">
              <div className="relative mb-8 inline-block">
                <div className="w-28 h-28 mx-auto rounded-full bg-gradient-to-br from-[#FFF9F0] to-[#FFF5E8] border-2 border-[#C9A66B] flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <span className="text-6xl">📖</span>
                </div>
                <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-gradient-to-br from-[#C9A66B] to-[#B8954F] flex items-center justify-center text-white text-lg font-semibold shadow-md">
                  3
                </div>
              </div>
              <h3
                className="text-2xl sm:text-3xl text-[#2C1810] mb-4"
                style={{ fontFamily: "Playfair Display, serif", fontWeight: 600 }}
              >
                Watch it grow
              </h3>
              <p
                className="text-lg sm:text-xl text-[#6B5437] leading-relaxed"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                Each story unlocks deeper questions.
                <br />
                Building your complete legacy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Not Another Dusty Book */}
      <section className="py-24 px-6 bg-gradient-to-b from-[#FAF8F5] to-[#FFF9F0]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2
              className="text-5xl sm:text-6xl md:text-7xl text-[#2C1810] mb-6 tracking-tight"
              style={{ fontFamily: "Playfair Display, serif", fontWeight: 400 }}
            >
              Not Another Dusty Book
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#C9A66B] to-[#B8954F] mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Traditional */}
            <div className="bg-white rounded-3xl p-10 border-2 border-[#D4C4B0] shadow-lg">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#F5F0EA] to-[#E8DDD0] flex items-center justify-center">
                  <X className="w-6 h-6 text-[#B8685C]" />
                </div>
                <h3
                  className="text-2xl sm:text-3xl text-[#4A3728]"
                  style={{ fontFamily: "Playfair Display, serif", fontWeight: 600 }}
                >
                  Traditional Memory Books
                </h3>
              </div>

              <div className="space-y-4">
                {[
                  { icon: "📋", text: "52 generic prompts" },
                  { icon: "📚", text: "Printed once, shelved forever" },
                  { icon: "🔄", text: "Same questions everyone gets" },
                  { icon: "☕", text: "Gathers dust on coffee table" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-[#FAF8F5] rounded-xl">
                    <span className="text-2xl">{item.icon}</span>
                    <p className="text-lg text-[#6B5437]" style={{ fontFamily: "Playfair Display, serif" }}>
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Your Living Legacy */}
            <div className="bg-gradient-to-br from-[#FFF9F0] to-[#FFF5E8] rounded-3xl p-10 border-2 border-[#C9A66B] shadow-2xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C9A66B] to-[#B8954F] flex items-center justify-center">
                  <Check className="w-6 h-6 text-white" />
                </div>
                <h3
                  className="text-2xl sm:text-3xl text-[#2C1810]"
                  style={{ fontFamily: "Playfair Display, serif", fontWeight: 600 }}
                >
                  Your Living Legacy
                </h3>
              </div>

              <div className="space-y-4">
                {[
                  { icon: "✨", text: "Questions from YOUR stories" },
                  { icon: "🔄", text: "Updates with each memory" },
                  { icon: "📱", text: "Instantly in every family phone" },
                  { icon: "📈", text: "Grows richer over time" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-xl border-l-4 border-[#C9A66B] shadow-sm">
                    <span className="text-2xl">{item.icon}</span>
                    <p className="text-lg text-[#2C1810] font-medium" style={{ fontFamily: "Playfair Display, serif" }}>
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Social Proof */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2
              className="text-4xl sm:text-5xl md:text-6xl text-[#2C1810] mb-6 tracking-tight"
              style={{ fontFamily: "Playfair Display, serif", fontWeight: 400 }}
            >
              "How did it know to ask about that?"
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#C9A66B] to-[#B8954F] mx-auto mb-10 rounded-full"></div>
          </div>

          <div className="text-center mb-20 max-w-3xl mx-auto">
            <p
              className="text-2xl sm:text-3xl text-[#4A3728] mb-6"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              That's what everyone says after their third story.
            </p>
            <p
              className="text-xl sm:text-2xl text-[#7A6651] leading-relaxed"
              style={{ fontFamily: "Playfair Display, serif", fontStyle: "italic" }}
            >
              Because we don't just record—we truly listen.
              We catch the patterns. We notice what's missing.
              We ask what matters.
            </p>
          </div>

          {/* Premium Testimonial Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-[#FFF9F0] to-white rounded-2xl p-8 border border-[#D4C4B0] shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#C9A66B] to-[#B8954F] flex items-center justify-center text-white text-xl font-semibold shadow-md flex-shrink-0">
                    {testimonial.initial}
                  </div>
                  <div>
                    <p
                      className="text-base font-medium text-[#2C1810]"
                      style={{ fontFamily: "Playfair Display, serif" }}
                    >
                      {testimonial.author}
                    </p>
                    <p
                      className="text-sm text-[#9B8A75]"
                      style={{ fontFamily: "Playfair Display, serif" }}
                    >
                      Age {testimonial.age}
                    </p>
                  </div>
                </div>
                <blockquote
                  className="text-lg sm:text-xl text-[#4A3728] leading-relaxed"
                  style={{ fontFamily: "Playfair Display, serif", fontStyle: "italic" }}
                >
                  "{testimonial.quote}"
                </blockquote>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section: The Close */}
      <section className="py-24 px-6 bg-gradient-to-b from-[#FAF8F5] to-[#FFF9F0]">
        <div className="max-w-4xl mx-auto text-center">
          <h2
            className="text-5xl sm:text-6xl md:text-7xl text-[#2C1810] mb-8 leading-tight tracking-tight"
            style={{ fontFamily: "Playfair Display, serif", fontWeight: 400 }}
          >
            Your stories die with you.
          </h2>
          <p
            className="text-3xl sm:text-4xl md:text-5xl text-[#7A6651] mb-16"
            style={{ fontFamily: "Playfair Display, serif", fontStyle: "italic" }}
          >
            Unless you tell them today.
          </p>

          <div className="bg-white rounded-3xl p-10 sm:p-14 mb-16 border-l-4 border-[#C9A66B] shadow-2xl relative overflow-hidden">
            {/* Decorative element */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#FFF9F0] to-transparent opacity-50"></div>

            <div className="relative">
              <p
                className="text-xl sm:text-2xl md:text-3xl text-[#4A3728] leading-relaxed mb-8"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                Your grandchildren will never ask about your father's workshop
                or why you quit medical school or what Chewy taught you about love.
              </p>
              <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-[#C9A66B] to-transparent mx-auto mb-8"></div>
              <p
                className="text-2xl sm:text-3xl md:text-4xl text-[#2C1810] font-semibold mb-6"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                But we will.
              </p>
              <p
                className="text-xl sm:text-2xl text-[#7A6651]"
                style={{ fontFamily: "Playfair Display, serif", fontStyle: "italic" }}
              >
                And your answers will live forever.
              </p>
            </div>
          </div>

          <button
            onClick={handleStartRecording}
            className="bg-gradient-to-r from-[#B8954F] to-[#9D7A3F] hover:from-[#A8853F] hover:to-[#8D6A2F] text-white px-14 sm:px-20 py-7 sm:py-9 rounded-full text-2xl sm:text-3xl font-medium shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-[1.02] mb-6"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Start before it's too late
          </button>

          <p
            className="text-lg text-[#8B6F47] mb-16"
            style={{ fontFamily: "Playfair Display, serif", fontStyle: "italic" }}
          >
            No credit card · Cancel anytime
          </p>

          {/* Trust Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: "🔒", text: "Your stories stay private" },
              { icon: "📥", text: "Export everything anytime" },
              { icon: "🗑️", text: "Delete whenever you want" },
            ].map((badge, i) => (
              <div key={i} className="flex items-center justify-center gap-3 p-5 bg-white rounded-xl border border-[#D4C4B0] shadow-sm">
                <span className="text-2xl">{badge.icon}</span>
                <span className="text-base text-[#6B5437]" style={{ fontFamily: "Playfair Display, serif" }}>
                  {badge.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 bg-white border-t border-[#D4C4B0]">
        <div className="max-w-6xl mx-auto">
          {/* Technical Disclosure */}
          <div className="bg-gradient-to-br from-[#FFF9F0] to-white rounded-2xl p-10 mb-16 border border-[#D4C4B0] max-w-3xl mx-auto">
            <h3
              className="text-xl sm:text-2xl text-[#2C1810] mb-5 font-semibold text-center"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              How it really works
            </h3>
            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-[#C9A66B] to-transparent mx-auto mb-6"></div>
            <p
              className="text-base sm:text-lg text-[#6B5437] leading-relaxed text-center"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Our story system uses advanced technology to transcribe your
              voice, identify patterns in your memories, and craft personalized
              follow-up questions. You review and approve everything before it's
              saved. You own your stories forever.
            </p>
          </div>

          {/* Logo and Links */}
          <div className="flex flex-col items-center">
            <img
              src={logoUrl}
              alt="HeritageWhisper"
              className="h-16 w-auto mb-8 opacity-90"
            />
            <div
              className="flex gap-8 mb-6 text-base"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              <a href="/terms" className="text-[#7A6651] hover:text-[#5A4631] transition-colors">
                Terms
              </a>
              <span className="text-[#D4C4B0]">·</span>
              <a href="/privacy" className="text-[#7A6651] hover:text-[#5A4631] transition-colors">
                Privacy
              </a>
              <span className="text-[#D4C4B0]">·</span>
              <a href="/gift-plans" className="text-[#7A6651] hover:text-[#5A4631] transition-colors">
                Gift Plans
              </a>
            </div>
            <p
              className="text-[#9B8A75] text-center text-base"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              © 2025 HeritageWhisper · Preserving wisdom, one story at a time
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
