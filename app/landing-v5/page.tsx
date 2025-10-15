"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Mic, Clock, Users, Heart, BookOpen, Sparkles, Star, CheckCircle } from "lucide-react";

export default function LandingV5() {
  const router = useRouter();

  // Intersection Observer for scroll animations
  useEffect(() => {
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
  }, []);

  const handleCTA = () => {
    router.push("/auth/signup");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-rose-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-100 via-orange-100 to-rose-100 pt-20 pb-24 md:pt-32 md:pb-40">
        {/* Decorative gradient orbs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-rose-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: "2s" }}></div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          {/* Logo */}
          <div className="flex justify-center mb-12">
            <Image
              src="/HW_text-compress.png"
              alt="Heritage Whisper"
              width={280}
              height={70}
              className="h-14 w-auto"
              priority
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Headline & CTA */}
            <div className="text-center lg:text-left space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  These Stories Will Be{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-rose-600">
                    Gone Forever.
                  </span>
                </h1>
                <p className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Unless You Start Today.
                </p>
              </div>

              <p className="text-xl md:text-2xl text-gray-700 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Preserve your parent's precious memories before it's too late. No writing. No complicated setup. Just talk—we handle everything else.
              </p>

              <div className="space-y-4">
                <button
                  onClick={handleCTA}
                  className="group relative w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white text-xl font-bold rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  <span className="flex items-center justify-center gap-3">
                    <Mic className="w-6 h-6" />
                    Start Preserving Stories
                  </span>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 opacity-0 group-hover:opacity-100 transition-opacity -z-10 blur"></div>
                </button>
                <p className="text-base text-gray-600">
                  ✓ No writing required ✓ Just talk ✓ Whole family included
                </p>
              </div>

              {/* Trust signals */}
              <div className="flex items-center justify-center lg:justify-start gap-6 pt-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-200 to-orange-300 border-2 border-white flex items-center justify-center text-sm font-semibold text-gray-700">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 font-medium">10,000+ families preserving memories</p>
                </div>
              </div>
            </div>

            {/* Right: Hero Image */}
            <div className="relative" data-animate>
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <Image
                  src="/demo-dad-boy.png"
                  alt="Father and son sharing stories"
                  width={600}
                  height={600}
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-4 border-2 border-orange-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                    <Mic className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Just Press Record</p>
                    <p className="text-xs text-gray-600">No apps to learn</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16" data-animate>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Haven't You Done This Yet?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              You're not alone. Most families want to preserve their stories but haven't started because...
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Clock,
                title: "It Always Felt Too Big",
                description: "Writing a whole life story? Overwhelming. We break it into bite-sized conversations.",
              },
              {
                icon: BookOpen,
                title: "Didn't Know Where to Start",
                description: "We guide every conversation with personalized questions. No blank page to stare at.",
              },
              {
                icon: Users,
                title: "Seemed Too Complicated",
                description: "Traditional methods need cameras, editors, writers. We need just a voice and a phone.",
              },
            ].map((item, index) => (
              <div
                key={index}
                data-animate
                style={{ transitionDelay: `${index * 100}ms` }}
                className="opacity-0 translate-y-8 transition-all duration-700 ease-out bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 border border-orange-100 hover:shadow-xl hover:scale-105 transition-all"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-4">
                  <item.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-lg text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gradient-to-b from-white to-amber-50">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16" data-animate>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple as 1-2-3
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From voice to beautiful keepsake in three effortless steps
            </p>
          </div>

          <div className="space-y-16">
            {/* Step 1 */}
            <div data-animate className="opacity-0 translate-y-8 transition-all duration-700 ease-out grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-xl font-bold">
                    1
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900">Talk Naturally</h3>
                </div>
                <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-6">
                  We guide with personalized questions tailored to their unique story. Just press record and talk—like chatting with a friend over coffee.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-700">
                    <CheckCircle className="w-5 h-5 text-orange-500" />
                    <span className="text-lg">No writing required</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <CheckCircle className="w-5 h-5 text-orange-500" />
                    <span className="text-lg">Questions personalized to their life</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <CheckCircle className="w-5 h-5 text-orange-500" />
                    <span className="text-lg">Record anytime, anywhere</span>
                  </div>
                </div>
              </div>
              <div className="order-1 md:order-2 relative">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <div className="bg-gradient-to-br from-amber-100 to-orange-100 p-12 flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-amber-500 to-rose-500 flex items-center justify-center animate-pulse">
                      <Mic className="w-16 h-16 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div data-animate className="opacity-0 translate-y-8 transition-all duration-700 ease-out grid md:grid-cols-2 gap-12 items-center">
              <div className="relative">
                <Image
                  src="/timeline 1.png"
                  alt="Stories organize into timeline"
                  width={600}
                  height={400}
                  className="w-full h-auto rounded-2xl shadow-2xl"
                />
              </div>
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-xl font-bold">
                    2
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900">Stories Organize Automatically</h3>
                </div>
                <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-6">
                  Watch as memories transform into a beautiful, chronological timeline. Every story finds its place. Every moment preserved forever.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-700">
                    <CheckCircle className="w-5 h-5 text-orange-500" />
                    <span className="text-lg">AI organizes by date and theme</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <CheckCircle className="w-5 h-5 text-orange-500" />
                    <span className="text-lg">Beautiful visual timeline</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <CheckCircle className="w-5 h-5 text-orange-500" />
                    <span className="text-lg">Easy to browse and relive</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div data-animate className="opacity-0 translate-y-8 transition-all duration-700 ease-out grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-xl font-bold">
                    3
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900">Family Stays Connected</h3>
                </div>
                <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-6">
                  Every new memory shared notifies the whole family. Everyone gets access to the growing collection—and a beautiful printed book to treasure.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-700">
                    <CheckCircle className="w-5 h-5 text-orange-500" />
                    <span className="text-lg">Unlimited family members included</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <CheckCircle className="w-5 h-5 text-orange-500" />
                    <span className="text-lg">Beautiful printed book</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <CheckCircle className="w-5 h-5 text-orange-500" />
                    <span className="text-lg">Ever-growing digital archive</span>
                  </div>
                </div>
              </div>
              <div className="order-1 md:order-2 relative">
                <Image
                  src="/book small.png"
                  alt="Beautiful family book"
                  width={600}
                  height={400}
                  className="w-full h-auto rounded-2xl shadow-2xl"
                />
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-16" data-animate>
            <button
              onClick={handleCTA}
              className="px-10 py-5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white text-xl font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
            >
              Start Preserving Stories Today
            </button>
          </div>
        </div>
      </section>

      {/* Product Showcase */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16" data-animate>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              From Voice to Treasure
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See how your loved one's voice transforms into a beautiful, lasting legacy
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div data-animate className="opacity-0 translate-y-8 transition-all duration-700 ease-out space-y-8">
              <Image
                src="/timeline 2.png"
                alt="Digital timeline"
                width={600}
                height={400}
                className="w-full h-auto rounded-2xl shadow-2xl"
              />
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-orange-100">
                <h4 className="text-xl font-bold text-gray-900 mb-2">Interactive Digital Timeline</h4>
                <p className="text-lg text-gray-600">Every memory, organized and accessible. Tap any moment to hear their voice telling the story.</p>
              </div>
            </div>

            <div data-animate className="opacity-0 translate-y-8 transition-all duration-700 ease-out space-y-8" style={{ transitionDelay: "200ms" }}>
              <Image
                src="/book full.png"
                alt="Printed memory book"
                width={600}
                height={400}
                className="w-full h-auto rounded-2xl shadow-2xl"
              />
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-orange-100">
                <h4 className="text-xl font-bold text-gray-900 mb-2">Premium Printed Book</h4>
                <p className="text-lg text-gray-600">Hold their story in your hands. Beautifully designed, professionally printed, yours to keep forever.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Memory Timeline Section */}
      <section className="py-20 bg-gradient-to-b from-amber-50 to-orange-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16" data-animate>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              A Lifetime of Precious Moments
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Capture every chapter of their incredible journey
            </p>
          </div>

          {/* Timeline Cards */}
          <div className="relative">
            {/* Center line */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-300 via-orange-400 to-rose-400 transform -translate-x-1/2"></div>

            <div className="space-y-12">
              {[
                { img: "/demo-earliest-memory.webp", title: "Earliest Memories", subtitle: "Childhood wonder", year: "1950s" },
                { img: "/demo-first-home.webp", title: "First Home", subtitle: "Building a life", year: "1970s" },
                { img: "/demo-dad-ww2.png", title: "Life's Challenges", subtitle: "Strength & perseverance", year: "1980s" },
                { img: "/demo-campfire.png", title: "Family Traditions", subtitle: "Passing the torch", year: "2000s" },
              ].map((memory, index) => (
                <div
                  key={index}
                  data-animate
                  style={{ transitionDelay: `${index * 150}ms` }}
                  className={`opacity-0 translate-y-8 transition-all duration-700 ease-out grid md:grid-cols-2 gap-8 items-center ${
                    index % 2 === 0 ? "" : "md:flex-row-reverse"
                  }`}
                >
                  <div className={`${index % 2 === 0 ? "md:text-right md:pr-12" : "md:pl-12 md:col-start-2"}`}>
                    <div className="inline-block px-4 py-1 bg-orange-500 text-white text-sm font-semibold rounded-full mb-3">
                      {memory.year}
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{memory.title}</h3>
                    <p className="text-lg text-gray-600">{memory.subtitle}</p>
                  </div>
                  <div className={`${index % 2 === 0 ? "md:pl-12" : "md:pr-12 md:col-start-1 md:row-start-1"}`}>
                    <div className="relative rounded-2xl overflow-hidden shadow-2xl group">
                      <Image
                        src={memory.img}
                        alt={memory.title}
                        width={500}
                        height={350}
                        className="w-full h-auto transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                      {/* Timeline dot */}
                      <div className="hidden md:block absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-orange-500 rounded-full border-4 border-white shadow-lg" style={{
                        [index % 2 === 0 ? "right" : "left"]: "-3rem"
                      }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* What Makes This Different */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16" data-animate>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Not Just Another Memory Project
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              This is different from anything you've tried before
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Heart,
                title: "Living Family Archive",
                description: "Not a one-time project. Keep adding memories as they happen. Your family story never stops growing.",
              },
              {
                icon: Mic,
                title: "Voice-First",
                description: "No writing, no typing. Just talk. We capture the warmth, laughter, and emotion in their voice.",
              },
              {
                icon: Sparkles,
                title: "AI Asks Follow-Ups",
                description: "Our AI listens and asks personalized questions based on their unique story. Every conversation goes deeper.",
              },
              {
                icon: Users,
                title: "Whole Family Included",
                description: "Everyone gets access. Everyone gets notified. Everyone stays connected to new memories.",
              },
            ].map((item, index) => (
              <div
                key={index}
                data-animate
                style={{ transitionDelay: `${index * 100}ms` }}
                className="opacity-0 translate-y-8 transition-all duration-700 ease-out text-center bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 border border-orange-100 hover:shadow-xl hover:scale-105 transition-all"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-lg text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gradient-to-b from-white to-amber-50">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16" data-animate>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Stories From Families Like Yours
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Hear from adult children who started preserving their parents' stories
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "I learned stories about my dad I never knew. He opened up about his childhood in a way he never had before. Now my kids will know their grandfather's voice forever.",
                name: "Sarah Mitchell",
                relation: "Daughter",
                avatar: "S",
              },
              {
                quote: "Mom was hesitant at first, but after the first question, she couldn't stop talking. We laughed, we cried. I wish I'd started this years ago.",
                name: "David Chen",
                relation: "Son",
                avatar: "D",
              },
              {
                quote: "The questions were so thoughtful—things I would never have thought to ask. Now we have 50 stories and counting. It's brought our whole family closer.",
                name: "Jennifer Torres",
                relation: "Daughter",
                avatar: "J",
              },
            ].map((testimonial, index) => (
              <div
                key={index}
                data-animate
                style={{ transitionDelay: `${index * 150}ms` }}
                className="opacity-0 translate-y-8 transition-all duration-700 ease-out bg-white rounded-2xl p-8 shadow-xl border-2 border-orange-100"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-500 text-amber-500" />
                  ))}
                </div>
                <p className="text-lg text-gray-700 mb-6 leading-relaxed italic">"{testimonial.quote}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-xl font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{testimonial.relation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12" data-animate>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Preserving Priceless Memories
            </h2>
            <p className="text-xl text-gray-600">
              Simple pricing for unlimited stories
            </p>
          </div>

          <div data-animate className="opacity-0 translate-y-8 transition-all duration-700 ease-out bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-10 md:p-12 border-4 border-orange-300 shadow-2xl">
            <div className="text-center mb-8">
              <div className="inline-block px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold rounded-full mb-4">
                MOST POPULAR
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Complete Family Plan</h3>
              <div className="flex items-baseline justify-center gap-2 mb-4">
                <span className="text-5xl md:text-6xl font-bold text-gray-900">$29</span>
                <span className="text-xl text-gray-600">/month</span>
              </div>
              <p className="text-lg text-gray-600">Less than a dollar a day to preserve a lifetime</p>
            </div>

            <div className="space-y-4 mb-8">
              {[
                "Unlimited voice recordings",
                "AI-guided personalized questions",
                "Beautiful digital timeline",
                "Premium printed book included",
                "Unlimited family members",
                "Everyone gets real-time updates",
                "Cloud storage forever",
                "Cancel anytime",
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-orange-500 flex-shrink-0" />
                  <span className="text-lg text-gray-700">{feature}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleCTA}
              className="w-full py-6 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white text-xl font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
            >
              Start Preserving Stories Today
            </button>

            <p className="text-center text-sm text-gray-600 mt-4">
              14-day money-back guarantee • Secure payment • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 bg-gradient-to-br from-amber-100 via-orange-100 to-rose-100 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/demo-campfire.png')] opacity-10 bg-cover bg-center"></div>
        <div className="relative max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <div data-animate className="opacity-0 translate-y-8 transition-all duration-700 ease-out">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Every Day That Passes,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-rose-600">
                Stories Fade
              </span>
            </h2>
            <p className="text-xl md:text-2xl text-gray-700 mb-8 leading-relaxed max-w-2xl mx-auto">
              Don't let their precious memories disappear. Start preserving them today—it's easier than you think.
            </p>

            <button
              onClick={handleCTA}
              className="group relative px-12 py-6 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white text-2xl font-bold rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 active:scale-95"
            >
              <span className="flex items-center justify-center gap-3">
                <Mic className="w-7 h-7" />
                Start Preserving Stories Now
              </span>
            </button>

            <p className="text-lg text-gray-600 mt-6">
              Join 10,000+ families who started today
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <Image
                src="/HW_logo_circle_new_trans.webp"
                alt="Heritage Whisper"
                width={40}
                height={40}
                className="w-10 h-10"
              />
              <span className="text-xl font-bold">Heritage Whisper</span>
            </div>
            <div className="flex gap-8 text-sm">
              <button onClick={() => router.push("/privacy")} className="hover:text-orange-400 transition-colors">
                Privacy
              </button>
              <button onClick={() => router.push("/terms")} className="hover:text-orange-400 transition-colors">
                Terms
              </button>
              <button onClick={() => router.push("/help")} className="hover:text-orange-400 transition-colors">
                Help
              </button>
            </div>
          </div>
          <div className="text-center mt-8 text-sm text-gray-400">
            © 2025 Heritage Whisper. Preserving memories, one story at a time.
          </div>
        </div>
      </footer>
    </div>
  );
}

