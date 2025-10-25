"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Mic, Clock, Users, Heart, BookOpen, Sparkles, Star, CheckCircle, Shield, Lock, Download, AlertCircle, ChevronDown } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState<Set<number>>(new Set());

  // Toggle FAQ item
  const toggleFAQ = (index: number) => {
    const newExpanded = new Set(expandedFAQ);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedFAQ(newExpanded);
  };

  // Check for prefers-reduced-motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Intersection Observer for scroll animations (respects reduced motion)
  useEffect(() => {
    // Skip animations if user prefers reduced motion
    if (prefersReducedMotion) {
      // Immediately show all elements without animation
      document.querySelectorAll("[data-animate]").forEach((el) => {
        el.classList.remove("opacity-0", "translate-y-8");
        el.classList.add("opacity-100", "translate-y-0");
      });
      return;
    }

    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.remove("opacity-0", "translate-y-8");
          entry.target.classList.add("opacity-100", "translate-y-0");
        }
      });
    }, observerOptions);

    document.querySelectorAll("[data-animate]").forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, [prefersReducedMotion]);

  const handleCTA = () => {
    router.push("/auth/register");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#faf8f5] via-[#f5f0eb] to-[#f0ebe6]">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#faf8f5] via-[#f8f5f2] to-[#f5f1ed] pt-20 pb-24 md:pt-32 md:pb-40">
        {/* Decorative gradient orbs - softer, more premium */}
        <div className="absolute top-0 w-96 h-96 bg-[#d4c5d8] rounded-full mix-blend-multiply filter blur-3xl opacity-12 animate-pulse" style={{ left: 'calc(50% - 12rem)' }}></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#e8d4d8] rounded-full mix-blend-multiply filter blur-3xl opacity-12 animate-pulse" style={{ animationDelay: "2s" }}></div>

        {/* Continue Stories Button - Upper Right */}
        <div className="absolute top-6 right-6 z-10">
          <button
            onClick={() => router.push("/auth/login")}
            className="px-5 py-2.5 text-[#5a4a3a] hover:text-[#8b6b7a] text-base font-medium transition-all hover:bg-white/70 rounded-lg border border-transparent hover:border-[#e8ddd5]"
          >
            Continue Stories
          </button>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          {/* Header with Logo */}
          <div className="flex flex-col justify-center items-center mb-10">
            <Image
              src="/Logo Updated.png?v=2"
              alt="Heritage Whisper"
              width={480}
              height={120}
              className="h-32 md:h-40 w-auto mb-3 drop-shadow-sm"
              priority
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Headline & CTA */}
            <div className="text-center lg:text-left space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-[#2d2520] leading-tight">
                  Your Family&apos;s Story,{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8b6b7a] via-[#9d6b7c] to-[#b88b94]">
                    Alive and Ever-Growing
                  </span>
                </h1>
              </div>

              <p className="text-xl md:text-2xl text-[#4b5563] leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Stop letting your loved one&apos;s legacy gather dust on a shelf. HeritageWhisper is the only memoir experience that grows and updates—capturing stories, lessons, and voices your family will actually listen to, anytime, anywhere.
              </p>

              <div className="space-y-4">
                <button
                  onClick={handleCTA}
                  className="premium-cta-button group relative w-full sm:w-auto px-12 py-6 text-white text-xl font-bold rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  <div className="points-wrapper">
                    <i className="point"></i>
                    <i className="point"></i>
                    <i className="point"></i>
                    <i className="point"></i>
                    <i className="point"></i>
                    <i className="point"></i>
                    <i className="point"></i>
                    <i className="point"></i>
                    <i className="point"></i>
                    <i className="point"></i>
                  </div>
                  <span className="button-inner flex items-center justify-center gap-3">
                    <Mic className="w-6 h-6" />
                    Start Building Your Living Legacy
                  </span>
                </button>
                <p className="text-base text-[#6b7280]">
                  No writing or tech skills needed. Talk—and watch the magic happen.
                </p>
              </div>

            </div>

            {/* Right: Hero Image */}
            <div className="relative" data-animate>
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <Image
                  src="/1a.png"
                  alt="Father and son sharing stories"
                  width={600}
                  height={600}
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-4 border-2 border-[#d4a574]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#c9a78a] to-[#b88b94] flex items-center justify-center shadow-lg">
                    <Mic className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#2d2520]">Just Press Record</p>
                    <p className="text-xs text-[#5a4a3a]">No apps to learn</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar Section */}
      <section className="py-6 bg-white border-y border-[#e8ddd5]">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-[#5a4a3a]">
            <span className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#c9a78a]" />
              <strong>Bank-Level Encryption</strong>
            </span>
            <span className="text-[#e8ddd5]">|</span>
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#c9a78a]" />
              GDPR & CCPA Compliant
            </span>
            <span className="text-[#e8ddd5]">|</span>
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#c9a78a]" />
              30-Day Money-Back Guarantee
            </span>
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="py-20 md:py-32 bg-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16" data-animate>
            <h2 className="text-4xl md:text-5xl font-bold text-[#1f2937] mb-6">
              Why Most Family Stories Disappear
            </h2>
            <p className="text-xl text-[#6b7280] max-w-3xl mx-auto leading-relaxed text-center">
              You&apos;re not alone. Most families want to preserve their stories but haven&apos;t started because...
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "📖",
                title: "Printed books get lost and forgotten",
                description: "Stories are never read by the people you want to reach.",
              },
              {
                icon: "⚙️",
                title: "Too many steps, too complicated",
                description: "Tech and cluttered processes stop families before they begin.",
              },
              {
                icon: "⏳",
                title: "Memories are lost when we wait",
                description: "We put it off, and it's gone forever.",
              },
            ].map((item, index) => (
              <div
                key={index}
                data-animate
                style={{ transitionDelay: `${index * 100}ms` }}
                className="opacity-0 translate-y-8 transition-all duration-700 ease-out bg-[#faf8f5] rounded-2xl p-8 border-2 border-[#e8ddd5] hover:border-[#c9a78a] hover:shadow-xl transition-all"
              >
                <div className="text-5xl mb-6">{item.icon}</div>
                <h3 className="text-xl font-bold text-[#2d2520] mb-3">{item.title}</h3>
                <p className="text-lg text-[#5a4a3a] leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>

          <p className="text-center text-xl font-semibold text-[#9d6b7c] mt-12">
            HeritageWhisper was built to fix all of this.
          </p>
        </div>
      </section>

      {/* How It Works Section - UPDATED WITH NORTHSTAR LANGUAGE */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-white to-[#faf8f5]">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16" data-animate>
            <h2 className="text-4xl md:text-5xl font-bold text-[#1f2937] mb-6">
              How HeritageWhisper Works
            </h2>
            <p className="text-center text-xl text-[#6b7280] max-w-2xl mx-auto leading-relaxed">
              From voice to beautiful living legacy in three effortless steps
            </p>
          </div>

          <div className="space-y-24">
            {/* Step 1 */}
            <div data-animate className="opacity-0 translate-y-8 transition-all duration-700 ease-out grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#8b6b7a] to-[#b88b94] flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    1
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold text-[#2d2520]">Speak naturally—just press record</h3>
                </div>
                <p className="text-xl text-[#5a4a3a] leading-relaxed mb-8">
                  No typing, no scripts. Your own voice, your own pace. Our story system transcribes everything beautifully.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-[#2d2520]">
                    <CheckCircle className="w-6 h-6 text-[#c9a78a] flex-shrink-0" />
                    <span className="text-lg">No writing required</span>
                  </div>
                  <div className="flex items-center gap-3 text-[#2d2520]">
                    <CheckCircle className="w-6 h-6 text-[#c9a78a] flex-shrink-0" />
                    <span className="text-lg">Questions personalized to your life</span>
                  </div>
                  <div className="flex items-center gap-3 text-[#2d2520]">
                    <CheckCircle className="w-6 h-6 text-[#c9a78a] flex-shrink-0" />
                    <span className="text-lg">Record anytime, anywhere</span>
                  </div>
                </div>
              </div>
              <div className="order-1 md:order-2 relative">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-white p-16 flex items-center justify-center">
                  <div className="w-40 h-40 rounded-full bg-gradient-to-br from-[#8b6b7a] to-[#b88b94] flex items-center justify-center animate-pulse">
                    <Image
                      src="/silver_mic_sm.png"
                      alt="Microphone"
                      width={80}
                      height={80}
                      className="w-20 h-20 object-contain"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div data-animate className="opacity-0 translate-y-8 transition-all duration-700 ease-out grid md:grid-cols-2 gap-12 items-center">
              <div className="relative">
                <div
                  className="relative overflow-hidden rounded-2xl shadow-[0_4px_6px_rgba(0,0,0,0.07)] min-h-[280px] md:min-h-[360px] flex"
                  style={{
                    backgroundImage:
                      "linear-gradient(to bottom right, #f8f9fa, #ffffff), radial-gradient(circle at top left, rgba(147,165,177,0.08) 0, rgba(147,165,177,0.08) 1px, transparent 1.5px)",
                    backgroundSize: "100% 100%, 22px 22px",
                    backgroundPosition: "0 0, 0 0",
                  }}
                >
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[#fde68a] to-[#fbcfe8]"
                  />
                  <div className="relative flex flex-col justify-between gap-8 md:gap-10 px-8 py-10 md:px-10 md:py-12 pl-12 w-full">
                    <span className="inline-flex items-center self-start rounded-full bg-white/70 border border-white/40 px-4 py-1 text-sm font-medium text-[#6b7280] backdrop-blur">
                      From Michael&apos;s 3rd story
                    </span>
                    <p className="text-2xl md:text-[28px] text-[#1f2937] leading-relaxed">
                      &ldquo;That promotion you turned down in &lsquo;92 to stay near family&mdash;do your kids know you chose them over becoming regional VP?&rdquo;
                    </p>
                    <div className="flex items-center gap-4 text-[#2d2520] text-base font-medium">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 border border-white/70 shadow-[0_12px_20px_rgba(201,167,138,0.18)] relative before:absolute before:inset-[4px] before:rounded-full before:bg-gradient-to-br before:from-white before:to-[#f5ede8] before:shadow-[inset_0_2px_6px_rgba(0,0,0,0.08)]">
                        <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#c9a78a] to-[#b88b94] shadow-[0_6px_12px_rgba(201,167,138,0.35)]">
                        <Mic className="h-6 w-6 text-white animate-pulse" />
                        </span>
                      </span>
                      <span className="text-[#5a4a3a]">Tap to record your response</span>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#8b6b7a] to-[#b88b94] flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    2
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold text-[#2d2520]">Smart questions keep you going</h3>
                </div>
                <p className="text-xl text-[#5a4a3a] leading-relaxed mb-8">
                  Get gentle, truly personal follow-up prompts—so you never run out of things to say. Our story system finds the gaps and asks what matters.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-[#2d2520]">
                    <CheckCircle className="w-6 h-6 text-[#c9a78a] flex-shrink-0" />
                    <span className="text-lg">Pattern recognition finds missing moments</span>
                  </div>
                  <div className="flex items-center gap-3 text-[#2d2520]">
                    <CheckCircle className="w-6 h-6 text-[#c9a78a] flex-shrink-0" />
                    <span className="text-lg">No generic prompts—questions built from YOUR stories</span>
                  </div>
                  <div className="flex items-center gap-3 text-[#2d2520]">
                    <CheckCircle className="w-6 h-6 text-[#c9a78a] flex-shrink-0" />
                    <span className="text-lg">Uncovers memories you didn&apos;t know you&apos;d share</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div data-animate className="opacity-0 translate-y-8 transition-all duration-700 ease-out grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#8b6b7a] to-[#b88b94] flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    3
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold text-[#2d2520]">Stories organize automatically</h3>
                </div>
                <p className="text-xl text-[#5a4a3a] leading-relaxed mb-8">
                  Each story joins your interactive timeline and living digital book. Family gets notified the moment a new memory&apos;s added.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-[#2d2520]">
                    <CheckCircle className="w-6 h-6 text-[#c9a78a] flex-shrink-0" />
                    <span className="text-lg">Beautiful visual timeline</span>
                  </div>
                  <div className="flex items-center gap-3 text-[#2d2520]">
                    <CheckCircle className="w-6 h-6 text-[#c9a78a] flex-shrink-0" />
                    <span className="text-lg">Wisdom highlights extracted automatically</span>
                  </div>
                  <div className="flex items-center gap-3 text-[#2d2520]">
                    <CheckCircle className="w-6 h-6 text-[#c9a78a] flex-shrink-0" />
                    <span className="text-lg">Whole family stays connected</span>
                  </div>
                </div>
              </div>
              <div className="order-1 md:order-2 relative">
                <Image
                  src="/book full.png"
                  alt="Beautiful living book"
                  width={600}
                  height={400}
                  className="w-full h-auto rounded-2xl shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table Section - NEW */}
      <section className="py-20 md:py-32 bg-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16" data-animate>
            <h2 className="text-4xl md:text-5xl font-bold text-[#1f2937] mb-6">
              See The Difference
            </h2>
            <p className="text-xl text-[#6b7280] max-w-2xl mx-auto text-center">
              Compare HeritageWhisper to traditional memory services
            </p>
          </div>

          <div data-animate className="opacity-0 translate-y-8 transition-all duration-700 ease-out overflow-x-auto">
            <table className="w-full bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-[#e8ddd5]">
              <thead>
                <tr className="bg-gradient-to-r from-[#8b6b7a] to-[#9d6b7c]">
                  <th className="px-6 py-4 text-left text-white font-bold text-lg">Feature</th>
                  <th className="px-6 py-4 text-center text-white font-bold text-lg">HeritageWhisper</th>
                  <th className="px-6 py-4 text-center text-white font-bold text-lg">StoryWorth</th>
                  <th className="px-6 py-4 text-center text-white font-bold text-lg">Traditional</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Format", hw: "Living digital timeline on every phone", sw: "Annual printed book", trad: "One-time book" },
                  { feature: "Method", hw: "Voice recording + smart follow-ups", sw: "Weekly email prompts (writing)", trad: "Professional interviewer" },
                  { feature: "Wisdom Extraction", hw: "✓ Lessons Learned auto-highlighted", sw: "✗ Just memories", trad: "✗ Just memories" },
                  { feature: "Family Engagement", hw: "✓ Real-time notifications, questions", sw: "Limited (annual reveal)", trad: "✗ One-way" },
                  { feature: "Setup Time", hw: "5 minutes", sw: "30 minutes", trad: "Hours" },
                  { feature: "Price/Year", hw: "$129", sw: "$149", trad: "$1000+" },
                ].map((row, index) => (
                  <tr key={index} className="border-t border-[#e8ddd5] hover:bg-[#faf8f5] transition-colors">
                    <td className="px-6 py-4 font-semibold text-[#2d2520]">{row.feature}</td>
                    <td className="px-6 py-4 text-center bg-[#c9a78a]/10 font-semibold text-[#2d2520]">{row.hw}</td>
                    <td className="px-6 py-4 text-center text-[#5a4a3a]">{row.sw}</td>
                    <td className="px-6 py-4 text-center text-[#5a4a3a]">{row.trad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* VALUE PROPS - LIVING LEGACY DIFFERENTIATORS */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-white to-[#faf8f5]">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16" data-animate>
            <h2 className="text-4xl md:text-5xl font-bold text-[#2d2520] mb-6">
              Not Just Another Memory Project
            </h2>
            <p className="text-xl text-[#5a4a3a] max-w-2xl mx-auto text-center">
              This is different from anything you&apos;ve tried before
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Featured Card 1 */}
            <div data-animate className="opacity-0 translate-y-8 transition-all duration-700 ease-out bg-gradient-to-br from-white to-[#faf8f5] rounded-3xl p-10 border-3 border-[#c9a78a] shadow-2xl">
              <div className="text-5xl mb-6">🌱</div>
              <h3 className="text-2xl font-bold text-[#2d2520] mb-4">Living Legacy—Not a Static Book</h3>
              <p className="text-lg text-[#5a4a3a] leading-relaxed mb-6">
                Your memoir isn&apos;t &quot;done&quot; until you are. Every new story updates your timeline and book, so your family always has something new to discover.
              </p>
              <div className="flex flex-col gap-3 pt-6 border-t border-[#e8ddd5]">
                <div className="flex items-center gap-3">
                  <span className="text-[#5a4a3a]">❌ Books that gather dust</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#8b6b7a] font-semibold text-lg">✓ Stories that grow forever</span>
                </div>
              </div>
            </div>

            {/* Featured Card 2 */}
            <div data-animate style={{ transitionDelay: "100ms" }} className="opacity-0 translate-y-8 transition-all duration-700 ease-out bg-gradient-to-br from-white to-[#faf8f5] rounded-3xl p-10 border-3 border-[#b88b94] shadow-2xl">
              <div className="text-5xl mb-6">🧠</div>
              <h3 className="text-2xl font-bold text-[#2d2520] mb-4">Wisdom, Not Just Memories</h3>
              <p className="text-lg text-[#5a4a3a] leading-relaxed mb-6">
                Each story ends with a &quot;Lesson Learned&quot;—the wisdom, not just the event—preserved in your own words for future generations.
              </p>
              <div className="flex flex-col gap-3 pt-6 border-t border-[#e8ddd5]">
                <div className="flex items-center gap-3">
                  <span className="text-[#5a4a3a]">❌ Just what happened</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#9d6b7c] font-semibold text-lg">✓ Who you became</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Card 3 */}
            <div data-animate style={{ transitionDelay: "200ms" }} className="opacity-0 translate-y-8 transition-all duration-700 ease-out bg-white rounded-2xl p-8 border-2 border-[#e8ddd5] hover:border-[#c9a78a] hover:shadow-xl transition-all">
              <div className="text-4xl mb-4">✨</div>
              <h3 className="text-xl font-bold text-[#2d2520] mb-3">Guided Experience—No More Blank Page</h3>
              <p className="text-lg text-[#5a4a3a] leading-relaxed mb-4">
                Our story system pays attention, surfaces patterns, and asks next-story questions you&apos;d never think of—making every session feel magical, not forced.
              </p>
              <div className="flex flex-col gap-2 pt-4 border-t border-[#e8ddd5] text-sm">
                <div className="text-[#5a4a3a]">❌ Generic weekly prompts</div>
                <div className="text-[#8b6b7a] font-semibold">✓ Questions built from YOUR life</div>
              </div>
            </div>

            {/* Card 4 */}
            <div data-animate style={{ transitionDelay: "300ms" }} className="opacity-0 translate-y-8 transition-all duration-700 ease-out bg-white rounded-2xl p-8 border-2 border-[#e8ddd5] hover:border-[#b88b94] hover:shadow-xl transition-all">
              <div className="text-4xl mb-4">👨‍👩‍👧‍👦</div>
              <h3 className="text-xl font-bold text-[#2d2520] mb-3">Family Connection Loop</h3>
              <p className="text-lg text-[#5a4a3a] leading-relaxed mb-4">
                Loved ones can submit questions, listen easily, and get instant notifications when you add new memories. Your stories get read and heard, not hidden in a book.
              </p>
              <div className="flex flex-col gap-2 pt-4 border-t border-[#e8ddd5] text-sm">
                <div className="text-[#5a4a3a]">❌ Solo project</div>
                <div className="text-[#9d6b7c] font-semibold">✓ Whole family engaged</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ENTERPRISE SECURITY SECTION - NEW */}
      <section className="py-20 md:py-32 bg-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16" data-animate>
            <h2 className="text-4xl md:text-5xl font-bold text-[#1f2937] mb-6">
              Enterprise-Grade Security for Your Family&apos;s Stories
            </h2>
            <p className="text-xl text-[#6b7280] max-w-2xl mx-auto text-center">
              Your loved one&apos;s memories deserve the highest protection
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {[
              {
                icon: Lock,
                badge: "🔐",
                title: "Military-Grade Encryption",
                description: "256-bit encryption (same as banks). Your stories are secured with the highest industry standards."
              },
              {
                icon: Shield,
                badge: "🛡️",
                title: "GDPR & CCPA Compliant",
                description: "We meet international privacy standards. Your data is protected by law."
              },
              {
                icon: AlertCircle,
                badge: "🚫",
                title: "Never Sold, Never Shared",
                description: "We will NEVER sell your data or use your stories to train AI. Ever. Period."
              },
              {
                icon: Download,
                badge: "📥",
                title: "You're Always in Control",
                description: "Export everything anytime. Delete with one click. No lock-in, no games."
              }
            ].map((item, index) => (
              <div
                key={index}
                data-animate
                style={{ transitionDelay: `${index * 100}ms` }}
                className="opacity-0 translate-y-8 transition-all duration-700 ease-out text-center bg-[#faf8f5] rounded-2xl p-8 border-2 border-[#e8ddd5] hover:border-[#c9a78a] hover:shadow-xl transition-all"
              >
                <div className="text-4xl mb-4">{item.badge}</div>
                <h3 className="text-lg font-bold text-[#2d2520] mb-3">{item.title}</h3>
                <p className="text-base text-[#5a4a3a] leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>

          <div data-animate className="opacity-0 translate-y-8 transition-all duration-700 ease-out flex flex-wrap justify-center items-center gap-8">
            <div className="px-6 py-3 bg-white rounded-lg shadow-md border border-[#e8ddd5] flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#c9a78a]" />
              <span className="font-semibold text-[#2d2520]">SSL Secured</span>
            </div>
            <div className="px-6 py-3 bg-white rounded-lg shadow-md border border-[#e8ddd5] flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-[#c9a78a]" />
              <span className="font-semibold text-[#2d2520]">GDPR Compliant</span>
            </div>
            <div className="px-6 py-3 bg-white rounded-lg shadow-md border border-[#e8ddd5] flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#c9a78a]" />
              <span className="font-semibold text-[#2d2520]">SOC 2 Type II</span>
            </div>
          </div>
        </div>
      </section>

      {/* Product Showcase */}
      <section className="py-20 md:py-32 bg-[#faf8f5]">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16" data-animate>
            <h2 className="text-4xl md:text-5xl font-bold text-[#1f2937] mb-6">
              Your Life, Mapped Out and Growing
            </h2>
            <p className="text-xl text-[#6b7280] max-w-2xl mx-auto">
              Stories, photos, voices—easy to browse by year, chapter, or family member
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div data-animate className="opacity-0 translate-y-8 transition-all duration-700 ease-out w-full max-w-4xl">
              <Image
                src="/book full.png"
                alt="Living Digital Book"
                width={780}
                height={520}
                className="w-full h-auto rounded-2xl shadow-2xl"
              />
              <div className="mt-8 text-center bg-white rounded-2xl p-10 border-2 border-[#e8ddd5] shadow-lg">
                <h4 className="text-2xl font-bold text-[#1f2937] mb-4">Your Living Digital Book</h4>
                <p className="text-lg text-[#6b7280] leading-relaxed">Written and audio stories beautifully combined. Always up to date as you add more memories. This isn&apos;t a project that ends—it&apos;s a legacy that grows.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Memory Timeline Section */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-[#faf8f5] to-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16" data-animate>
            <h2 className="text-4xl md:text-5xl font-bold text-[#2d2520] mb-6">
              The Interactive Timeline
            </h2>
            <p className="text-xl text-[#5a4a3a] max-w-2xl mx-auto text-center">
              Every moment organized and accessible. Tap any memory to hear their voice telling the story.
            </p>
          </div>

          {/* Timeline Cards */}
          <div className="relative">
            {/* Center line */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-[#c9a78a] via-[#b88b94] to-[#c9a78a] transform -translate-x-1/2"></div>

            <div className="space-y-12">
              {[
                { img: "/demo2-lifelong-friend-62.png", title: "First bonds take root", year: "1962", lesson: "Choose friends who make you better" },
                { img: "/demo2-myhero-68.png", title: "Lessons that shaped me", year: "1968", lesson: "Follow examples worth imitating" },
                { img: "/demo2-moving-away-76.png", title: "Courage to begin again", year: "1976", lesson: "Change grows courage and skill" },
                { img: "/demo2-volunteering-88.png", title: "Purpose in action", year: "1988", lesson: "Service builds meaning and joy" },
              ].map((memory, index) => (
                <div
                  key={index}
                  data-animate
                  style={{ transitionDelay: `${index * 150}ms` }}
                  className={`opacity-0 translate-y-8 transition-all duration-700 ease-out grid md:grid-cols-2 gap-8 items-center relative ${
                    index % 2 === 0 ? "" : "md:flex-row-reverse"
                  }`}
                >
                  {/* Year badge on timeline - desktop only */}
                  <div className="hidden md:block absolute left-1/2 top-[128px] -translate-x-1/2 z-10">
                    <div className="px-4 py-2 bg-gradient-to-r from-[#8b6b7a] to-[#9d6b7c] text-white text-sm font-bold rounded-full whitespace-nowrap shadow-lg">
                      {memory.year}
                    </div>
                  </div>

                  <div className={`${index % 2 === 0 ? "md:text-right md:pr-12" : "md:text-left md:pl-12 md:col-start-2"}`}>
                    {/* Year badge - mobile only */}
                    <div className="md:hidden inline-block px-4 py-2 bg-gradient-to-r from-[#8b6b7a] to-[#9d6b7c] text-white text-sm font-bold rounded-full mb-4 shadow-lg">
                      {memory.year}
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-[#2d2520] mb-4">{memory.title}</h3>
                    <p className={`text-xl text-[#5a4a3a] ${index % 2 === 0 ? "md:text-right" : "md:text-left"}`}>
                      <span className="font-semibold">Lesson:</span> <span className="italic">&quot;{memory.lesson}&quot;</span>
                    </p>
                  </div>
                  <div className={`${index % 2 === 0 ? "md:pl-12" : "md:pr-12 md:col-start-1 md:row-start-1"}`}>
                    <div className="w-[80%] mx-auto">
                      <div className="relative rounded-[2rem] overflow-hidden shadow-2xl group aspect-[4/3] bg-white">
                        <Image
                          src={memory.img}
                          alt={memory.title}
                          width={500}
                          height={375}
                          className="w-full h-full object-contain ken-burns"
                          style={{ display: 'block' }}
                        />
                        {/* Timeline dot */}
                        <div className="hidden md:block absolute top-1/2 -translate-y-1/2 w-8 h-8 bg-gradient-to-br from-[#c9a78a] to-[#b88b94] rounded-full border-4 border-white shadow-xl" style={{
                          [index % 2 === 0 ? "right" : "left"]: "-3.5rem"
                        }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section - UPGRADED */}
      <section className="py-20 md:py-32 bg-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16" data-animate>
            <h2 className="text-4xl md:text-5xl font-bold text-[#1f2937] mb-6">
              Families Are Hooked—and Keep Coming Back
            </h2>
            <p className="text-xl text-[#6b7280] max-w-2xl mx-auto">
              Real stories from adult children who started preserving their parents&apos; stories
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {[
              {
                quote: "I learned stories about my dad I never knew. He opened up about his childhood in a way he never had before. Now my kids will know their grandfather's voice forever. We've preserved 47 stories in 3 months.",
                name: "Sarah Mitchell",
                location: "Austin, TX",
                relation: "Daughter",
                stories: "47 stories saved",
                avatar: "S",
              },
              {
                quote: "Mom was hesitant at first, but after the first question, she couldn't stop talking. We laughed, we cried. The smart questions really brought out memories she'd forgotten. I wish I'd started this years ago.",
                name: "David Chen",
                location: "Seattle, WA",
                relation: "Son",
                stories: "62 stories saved",
                avatar: "D",
              },
              {
                quote: "The questions were so thoughtful—things I would never have thought to ask. Now we have 50 stories and counting. It's brought our whole family closer. Everyone gets excited when Grandma adds a new one.",
                name: "Jennifer Torres",
                location: "Miami, FL",
                relation: "Daughter",
                stories: "50 stories saved",
                avatar: "J",
              },
            ].map((testimonial, index) => (
              <div
                key={index}
                data-animate
                style={{ transitionDelay: `${index * 150}ms` }}
                className="opacity-0 translate-y-8 transition-all duration-700 ease-out bg-white rounded-2xl p-8 shadow-xl border-2 border-[#e8ddd5] hover:border-[#c9a78a] hover:shadow-2xl transition-all"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-5 h-5 fill-[#c9a78a] text-[#c9a78a]" />
                  ))}
                </div>
                <p className="text-lg text-[#2d2520] mb-6 leading-relaxed italic">&quot;{testimonial.quote}&quot;</p>
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#8b6b7a] to-[#b88b94] flex items-center justify-center text-white text-xl font-bold shadow-lg">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-[#2d2520]">{testimonial.name}</p>
                    <p className="text-sm text-[#5a4a3a]">{testimonial.location}</p>
                  </div>
                </div>
                <div className="pt-3 border-t border-[#e8ddd5]">
                  <p className="text-sm font-semibold text-[#8b6b7a]">{testimonial.stories}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* FAQ SECTION - NEW */}
      <section className="py-20 md:py-32 bg-[#faf8f5]">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16" data-animate>
            <h2 className="text-4xl md:text-5xl font-bold text-[#1f2937] mb-6">
              Common Questions
            </h2>
            <p className="text-xl text-[#6b7280] text-center">
              Everything you need to know before you start
            </p>
          </div>

          <div className="space-y-6">
            {[
              {
                question: "What if my parent isn't tech-savvy?",
                answer: "If they can use FaceTime, they can use HeritageWhisper. Just press the big red button and talk. We handle everything else. Plus, you get a free onboarding call with our team to walk them through it."
              },
              {
                question: "How is this different from recording on my phone?",
                answer: "Our story system transcribes, organizes by date, extracts Lessons Learned, asks personalized follow-up questions, notifies family, and creates a beautiful timeline. It's like having a professional biographer in your pocket."
              },
              {
                question: "Can I cancel and keep my stories?",
                answer: "Absolutely. You can download everything (audio, transcripts, photos) at any time. No lock-in. Your stories are yours forever, even if you cancel."
              },
              {
                question: "Do you use my stories to train AI?",
                answer: "NEVER. Your stories are private and sacred. We will never use them for AI training, sell them, or share them. Ever. This is legally binding in our Terms of Service."
              },
              {
                question: "What's the 'story system'?",
                answer: "Our smart technology that listens to your stories, finds gaps in your timeline, identifies people you've mentioned, and asks personalized questions to help you tell the full story. It's like having a thoughtful interviewer who actually pays attention."
              },
              {
                question: "How many family members can access the stories?",
                answer: "Unlimited! Invite your kids, grandkids, siblings—everyone gets access and real-time notifications when new stories are added. No extra charge for family members."
              },
              {
                question: "What if I want a printed book?",
                answer: "You can order a premium printed book anytime with all your stories, photos, and timeline. Your first book is included in your annual plan. Additional copies available at cost."
              },
              {
                question: "Is there a free trial?",
                answer: "We offer a 30-day money-back guarantee, which is even better than a trial. Start building your legacy, and if you're not completely satisfied, get a full refund—no questions asked."
              },
            ].map((faq, index) => (
              <div
                key={index}
                data-animate
                style={{ transitionDelay: `${index * 50}ms` }}
                className="opacity-0 translate-y-8 transition-all duration-700 ease-out bg-white rounded-2xl border-2 border-[#e8ddd5] hover:border-[#c9a78a] hover:shadow-xl transition-all overflow-hidden"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full p-8 text-left flex items-start justify-between gap-4 focus:outline-none focus:ring-2 focus:ring-[#c9a78a] focus:ring-offset-2 rounded-t-2xl"
                  aria-expanded={expandedFAQ.has(index)}
                  aria-controls={`faq-answer-${index}`}
                >
                  <h3 className="text-xl font-bold text-[#2d2520] flex-1">{faq.question}</h3>
                  <ChevronDown
                    className={`w-6 h-6 text-[#6b7280] flex-shrink-0 transition-transform duration-300 ${
                      expandedFAQ.has(index) ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>
                <div
                  id={`faq-answer-${index}`}
                  className={`transition-all duration-300 ease-in-out ${
                    expandedFAQ.has(index)
                      ? 'max-h-96 opacity-100'
                      : 'max-h-0 opacity-0'
                  }`}
                  aria-hidden={!expandedFAQ.has(index)}
                >
                  <div className="px-8 pb-8 -mt-3">
                    <p className="text-lg text-[#6b7280] leading-relaxed">{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section - UPDATED WITH RISK REVERSAL */}
      <section className="py-20 md:py-32 bg-white">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          {/* Risk Reversal Banner */}
          <div data-animate className="opacity-0 translate-y-8 transition-all duration-700 ease-out mb-12 bg-gradient-to-r from-[#8b6b7a] to-[#9d6b7c] rounded-3xl p-8 md:p-10 text-white text-center shadow-2xl">
            <h3 className="text-3xl font-bold mb-6">Try HeritageWhisper Risk-Free</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-3 justify-center md:justify-start">
                <CheckCircle className="w-6 h-6 flex-shrink-0" />
                <span className="text-lg">30-Day Money-Back Guarantee</span>
              </div>
              <div className="flex items-center gap-3 justify-center md:justify-start">
                <CheckCircle className="w-6 h-6 flex-shrink-0" />
                <span className="text-lg">Cancel anytime, keep your stories</span>
              </div>
              <div className="flex items-center gap-3 justify-center md:justify-start">
                <CheckCircle className="w-6 h-6 flex-shrink-0" />
                <span className="text-lg">Free onboarding support call</span>
              </div>
              <div className="flex items-center gap-3 justify-center md:justify-start">
                <CheckCircle className="w-6 h-6 flex-shrink-0" />
                <span className="text-lg">No credit card required for trial</span>
              </div>
            </div>
            <p className="text-2xl font-bold italic">&quot;If you don&apos;t love it, you don&apos;t pay. Period.&quot;</p>
          </div>

          <div className="text-center mb-12" data-animate>
            <h2 className="text-4xl md:text-5xl font-bold text-[#1f2937] mb-6">
              Your Living Legacy Plan
            </h2>
            <p className="text-xl text-[#6b7280] text-center">
              Pay once, keep building your legacy forever. Unlimited stories, photos, family questions, and notifications—no more &quot;just a book.&quot;
            </p>
          </div>

          <div data-animate className="opacity-0 translate-y-8 transition-all duration-700 ease-out bg-gradient-to-br from-[#faf8f5] to-white rounded-3xl p-10 md:p-12 border-4 border-[#c9a78a] shadow-2xl">
            <div className="text-center mb-8">
              <div className="inline-block px-6 py-2 bg-gradient-to-r from-[#8b6b7a] to-[#9d6b7c] text-white text-sm font-bold rounded-full mb-4 shadow-lg">
                MOST POPULAR
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-[#1f2937] mb-2">Complete Family Plan</h3>
              <div className="flex items-baseline justify-center gap-2 mb-4">
                <span className="text-5xl md:text-6xl font-bold text-[#1f2937]">$129</span>
                <span className="text-2xl text-[#6b7280]">/year</span>
              </div>
              <p className="text-lg text-[#6b7280]">Just 35 cents a day to preserve a lifetime</p>
            </div>

            <div className="space-y-4 mb-8">
              {[
                "Unlimited voice recordings",
                "Smart guided questions (story system)",
                "Beautiful digital timeline",
                "Premium printed book included",
                "Unlimited family members",
                "Real-time family notifications",
                "Wisdom highlights (Lessons Learned)",
                "Cloud storage forever",
                "Cancel anytime",
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-[#c9a78a] flex-shrink-0" />
                  <span className="text-lg text-[#1f2937]">{feature}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleCTA}
              className="premium-cta-button w-full py-6 text-white text-xl font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
            >
              <div className="points-wrapper">
                <i className="point"></i>
                <i className="point"></i>
                <i className="point"></i>
                <i className="point"></i>
                <i className="point"></i>
                <i className="point"></i>
                <i className="point"></i>
                <i className="point"></i>
                <i className="point"></i>
                <i className="point"></i>
              </div>
              <span className="button-inner">Start Building Your Living Legacy</span>
            </button>

            <p className="text-center text-base text-[#6b7280] mt-6">
              30-day money-back guarantee • Secure payment • Cancel anytime
            </p>
          </div>

          {/* Alternative Pricing Options */}
          <div data-animate className="opacity-0 translate-y-8 transition-all duration-700 ease-out mt-8 grid md:grid-cols-3 gap-4 text-center">
            <div className="p-6 bg-white rounded-xl border-2 border-[#e8ddd5] shadow-md">
              <div className="text-sm text-[#6b7280] mb-2">Monthly Plan</div>
              <div className="text-2xl font-bold text-[#1f2937]">$14.99<span className="text-base font-normal text-[#6b7280]">/mo</span></div>
            </div>
            <div className="p-6 bg-gradient-to-br from-[#8b6b7a]/10 to-[#b88b94]/10 rounded-xl border-3 border-[#c9a78a] shadow-lg">
              <div className="text-sm text-[#6b7280] mb-2 font-semibold">Yearly Plan (SAVE $51!)</div>
              <div className="text-2xl font-bold text-[#1f2937]">$129<span className="text-base font-normal text-[#6b7280]">/year</span></div>
            </div>
            <div className="p-6 bg-white rounded-xl border-2 border-[#e8ddd5] shadow-md">
              <div className="text-sm text-[#6b7280] mb-2">Gift Option</div>
              <div className="text-lg font-semibold text-[#9d6b7c]">Give a subscription →</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section - UPDATED */}
      <section className="py-24 md:py-32 bg-gradient-to-br from-[#faf8f5] via-[#f5ede8] to-[#f0e8e3] relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/demo-campfire.png')] opacity-10 bg-cover bg-center"></div>
        <div className="relative max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <div data-animate className="opacity-0 translate-y-8 transition-all duration-700 ease-out">
            <h2 className="text-4xl md:text-6xl font-bold text-[#1f2937] mb-8 leading-tight">
              Start Your Living Legacy—<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8b6b7a] to-[#b88b94]">
                Don&apos;t Let Another Story Slip Away
              </span>
            </h2>
            <p className="text-xl md:text-2xl text-[#6b7280] mb-10 leading-relaxed max-w-3xl mx-auto text-center">
              Future generations won&apos;t thumb through books—they&apos;ll discover you here, voice and all.
            </p>

            <button
              onClick={handleCTA}
              className="premium-cta-button group relative px-16 py-7 text-white text-2xl font-bold rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 active:scale-95"
            >
              <div className="points-wrapper">
                <i className="point"></i>
                <i className="point"></i>
                <i className="point"></i>
                <i className="point"></i>
                <i className="point"></i>
                <i className="point"></i>
                <i className="point"></i>
                <i className="point"></i>
                <i className="point"></i>
                <i className="point"></i>
              </div>
              <span className="button-inner flex items-center justify-center gap-3">
                <Mic className="w-8 h-8" />
                Preserve Your Memories Today
              </span>
            </button>

            <div className="flex flex-wrap justify-center items-center gap-6 mt-8 text-[#6b7280]">
              <span className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#c9a78a]" />
                30-Day Guarantee
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#c9a78a]" />
                No Credit Card for Trial
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#c9a78a]" />
                Cancel Anytime
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1f2937] text-white py-16">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
            <div className="flex items-center gap-3">
              <Image
                src="/HW_logo_circle_new_trans.webp"
                alt="Heritage Whisper"
                width={48}
                height={48}
                className="w-12 h-12"
              />
              <span className="text-2xl font-bold">Heritage Whisper</span>
            </div>
            <div className="flex gap-8 text-base">
              <button onClick={() => router.push("/privacy")} className="hover:text-[#c9a78a] transition-colors">
                Privacy
              </button>
              <button onClick={() => router.push("/terms")} className="hover:text-[#c9a78a] transition-colors">
                Terms
              </button>
              <button onClick={() => router.push("/help")} className="hover:text-[#c9a78a] transition-colors">
                Help
              </button>
              <button onClick={() => router.push("/security")} className="hover:text-[#c9a78a] transition-colors">
                Security
              </button>
            </div>
          </div>
          
          <div className="text-center space-y-4 border-t border-white/20 pt-8">
            <div className="text-sm text-white/70 flex flex-wrap items-center justify-center gap-4">
              <span className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Bank-Level Secure
              </span>
              <span className="text-white/40">|</span>
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                GDPR & CCPA Compliant
              </span>
              <span className="text-white/40">|</span>
              <span>Your Stories, Your Control</span>
            </div>
            <div className="text-sm text-white/70">
              © 2025 Heritage Whisper. Living Stories, Lasting Legacy.
            </div>
          </div>
        </div>
      </footer>

      {/* Premium CTA Button Styles - UPDATED COLORS */}
      <style jsx global>{`
        .premium-cta-button {
          cursor: pointer;
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: radial-gradient(65.28% 65.28% at 50% 100%, rgba(139, 107, 122, 0.8) 0%, rgba(139, 107, 122, 0) 100%),
                      linear-gradient(135deg, #8b6b7a 0%, #9d6b7c 100%);
          border: none;
          outline: none;
        }

        .premium-cta-button::before,
        .premium-cta-button::after {
          content: "";
          position: absolute;
          transition: all 0.5s ease-in-out;
          z-index: 0;
        }

        .premium-cta-button::before {
          inset: 1px;
          background: linear-gradient(177.95deg, rgba(255, 255, 255, 0.19) 0%, rgba(255, 255, 255, 0) 100%);
          border-radius: calc(1rem - 1px);
        }

        .premium-cta-button::after {
          inset: 2px;
          background: radial-gradient(65.28% 65.28% at 50% 100%, rgba(139, 107, 122, 0.8) 0%, rgba(139, 107, 122, 0) 100%),
                      linear-gradient(135deg, #8b6b7a 0%, #9d6b7c 100%);
          border-radius: calc(1rem - 2px);
        }

        .premium-cta-button:active {
          transform: scale(0.95);
        }

        .points-wrapper {
          overflow: hidden;
          width: 100%;
          height: 100%;
          pointer-events: none;
          position: absolute;
          z-index: 1;
          inset: 0;
        }

        .points-wrapper .point {
          bottom: -10px;
          position: absolute;
          animation: floating-points infinite ease-in-out;
          pointer-events: none;
          width: 2px;
          height: 2px;
          background-color: #fff;
          border-radius: 9999px;
        }

        @keyframes floating-points {
          0% {
            transform: translateY(0);
          }
          85% {
            opacity: 0;
          }
          100% {
            transform: translateY(-55px);
            opacity: 0;
          }
        }

        .points-wrapper .point:nth-child(1) {
          left: 10%;
          opacity: 1;
          animation-duration: 2.35s;
          animation-delay: 0.2s;
        }

        .points-wrapper .point:nth-child(2) {
          left: 30%;
          opacity: 0.7;
          animation-duration: 2.5s;
          animation-delay: 0.5s;
        }

        .points-wrapper .point:nth-child(3) {
          left: 25%;
          opacity: 0.8;
          animation-duration: 2.2s;
          animation-delay: 0.1s;
        }

        .points-wrapper .point:nth-child(4) {
          left: 44%;
          opacity: 0.6;
          animation-duration: 2.05s;
        }

        .points-wrapper .point:nth-child(5) {
          left: 50%;
          opacity: 1;
          animation-duration: 1.9s;
        }

        .points-wrapper .point:nth-child(6) {
          left: 75%;
          opacity: 0.5;
          animation-duration: 1.5s;
          animation-delay: 1.5s;
        }

        .points-wrapper .point:nth-child(7) {
          left: 88%;
          opacity: 0.9;
          animation-duration: 2.2s;
          animation-delay: 0.2s;
        }

        .points-wrapper .point:nth-child(8) {
          left: 58%;
          opacity: 0.8;
          animation-duration: 2.25s;
          animation-delay: 0.2s;
        }

        .points-wrapper .point:nth-child(9) {
          left: 98%;
          opacity: 0.6;
          animation-duration: 2.6s;
          animation-delay: 0.1s;
        }

        .points-wrapper .point:nth-child(10) {
          left: 65%;
          opacity: 1;
          animation-duration: 2.5s;
          animation-delay: 0.2s;
        }

        .button-inner {
          z-index: 2;
          position: relative;
          width: 100%;
          color: white;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          line-height: 1.5;
          transition: color 0.2s ease-in-out;
        }

        /* Ken Burns effect */
        @keyframes kenBurns {
          0% {
            transform: scale(1);
          }
          100% {
            transform: scale(1.08);
          }
        }

        .ken-burns {
          animation: kenBurns 20s ease-out infinite alternate;
        }

        @media (prefers-reduced-motion: reduce) {
          .ken-burns {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
