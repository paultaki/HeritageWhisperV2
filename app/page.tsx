"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { HelpCircle, ChevronDown, Play, Pause } from "lucide-react";

const logoUrl = "/HW_logo_mic_clean.png";

export default function HomePage() {
  const router = useRouter();
  const [showRipple, setShowRipple] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [showTypewriter, setShowTypewriter] = useState(false);
  const [showNeedHelp, setShowNeedHelp] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Process steps with glassmorphism styles
  const processSteps = [
    {
      icon: "📱",
      title: "Open on any phone",
      description: "No downloads. Works everywhere.",
      gradient: "from-amber-400/70 to-orange-500/70",
    },
    {
      icon: "🎤",
      title: "Talk for 2 minutes",
      description: "Our questions guide your story.",
      gradient: "from-rose-400/70 to-pink-500/70",
    },
    {
      icon: "❤️",
      title: "Share forever",
      description: "Character insights + wisdom clips",
      gradient: "from-purple-400/70 to-indigo-500/70",
    },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);

    // Trigger typewriter effect faster
    setTimeout(() => setShowTypewriter(true), 200);

    // Show help button after delay
    setTimeout(() => setShowNeedHelp(true), 5000);

    // Set up Intersection Observer for fade-up animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
    );

    // Observe all fade-up elements
    setTimeout(() => {
      document.querySelectorAll(".fade-up").forEach((el) => {
        observer.observe(el);
      });
    }, 100);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, []);

  const handleStartRecording = () => {
    setShowRipple(true);
    // Navigate to register page instead of recording directly
    // User will be redirected to timeline after login/registration
    router.push("/auth/register");
  };

  const handleStartFree = () => {
    router.push("/auth/register");
  };

  const handleNeedHelp = () => {
    router.push("/demo-timeline");
  };

  const handleScrollToNextSection = () => {
    const nextSection = document.querySelector("#process-section");
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-white overflow-x-hidden">
      {/* Sign In Button - Fixed Position Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => router.push("/auth/login")}
          className="bg-white/90 backdrop-blur-sm text-gray-700 px-6 py-3 rounded-lg font-semibold shadow-sm hover:shadow-md transition-all duration-300 hover:bg-white border border-gray-200"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          Sign In
        </button>
      </div>

      {/* Hero Section */}
      <section className="min-h-screen relative flex items-center justify-center">
        <div className="relative z-10 flex flex-col items-center justify-center px-6 py-20">
          {/* Massive Hero Header */}
          <h1
            className="text-5xl xs:text-6xl sm:text-7xl md:text-8xl lg:text-[6rem] xl:text-[10rem] text-center text-gray-800 mb-4 sm:mb-8 leading-tight px-4 animate-fade-in-up"
            style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
          >
            <div className="block">Everyone has a story.</div>
          </h1>

          <h2
            className="text-xl xs:text-2xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[8rem] text-center mb-6 px-4"
            style={{ fontFamily: "Poppins, sans-serif", fontWeight: 800 }}
          >
            <span
              className={`bg-gradient-to-r from-amber-600 to-rose-600 bg-clip-text text-transparent inline-block transition-all duration-1500 ease-out break-words ${
                showTypewriter
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 translate-x-4"
              }`}
            >
              We find your true self within them.
            </span>
          </h2>

          {/* Subtitle */}
          <p
            className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-gray-700 text-center mb-8 px-4"
            style={{
              fontFamily: "Poppins, sans-serif",
              fontWeight: 500,
              animation: "fade-in-up 0.6s ease-out 300ms forwards",
            }}
          >
            Just talk. Our questions follow your memories and find the thread.
          </p>

          {/* Subtext - Simplified, no redundancy */}
          <div
            className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-gray-600 text-center mb-16 sm:mb-20 px-4"
            style={{
              fontFamily: "Poppins, sans-serif",
              fontWeight: 600,
              animation: "fade-in-up 0.6s ease-out 400ms forwards",
            }}
          >
            <div className="block">2 minutes. Your voice. Their legacy.</div>
          </div>

          {/* Hero CTA with Multiple Ripples */}
          <button
            onClick={handleStartRecording}
            className="group relative"
            style={{ animation: "fade-in-up 0.6s ease-out 600ms forwards" }}
            data-testid="button-start-recording"
          >
            {/* Multiple Ripple Effects */}
            {showRipple && (
              <>
                <div
                  className="absolute inset-0 bg-red-400 rounded-full opacity-30"
                  style={{
                    animation: "ping 1s cubic-bezier(0, 0, 0.2, 1) infinite",
                  }}
                />
                <div
                  className="absolute inset-0 bg-red-400 rounded-full opacity-30"
                  style={{
                    animation:
                      "ping 1s cubic-bezier(0, 0, 0.2, 1) 300ms infinite",
                  }}
                />
                <div
                  className="absolute inset-0 bg-red-400 rounded-full opacity-20"
                  style={{
                    animation:
                      "ping 1s cubic-bezier(0, 0, 0.2, 1) 600ms infinite",
                  }}
                />
              </>
            )}

            {/* Button Content */}
            <div className="relative bg-gradient-to-r from-red-500 to-rose-500 text-white px-10 sm:px-14 py-8 sm:py-10 md:px-20 md:py-12 rounded-full shadow-2xl group-hover:shadow-3xl transform transition-all duration-300 group-hover:scale-105 border-4 border-white">
              <span
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl block"
                style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
              >
                Start your first story
              </span>
              <span
                className="text-xl sm:text-2xl md:text-3xl lg:text-4xl mt-2 opacity-90 block"
                style={{ fontFamily: "Poppins, sans-serif", fontWeight: 500 }}
              >
                Just 2 minutes
              </span>
            </div>
          </button>

          {/* Scroll Indicator */}
          <button
            onClick={() =>
              document
                .querySelector("#wisdom-section")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="absolute bottom-8 animate-bounce p-2 hover:text-gray-600 transition-colors"
            aria-label="Scroll to next section"
            data-testid="button-scroll-down"
          >
            <ChevronDown className="w-8 h-8 text-gray-400" />
          </button>
        </div>
      </section>

      {/* PROMINENT WISDOM CLIP DEMO SECTION - EMOTIONAL PAYOFF */}
      <section
        id="wisdom-section"
        className="py-24 px-6 relative z-10 bg-gradient-to-br from-purple-50 via-pink-50 to-white"
      >
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl text-center text-gray-800 mb-6 fade-up"
            style={{ fontFamily: "Poppins, sans-serif", fontWeight: 800 }}
          >
            The Wisdom Within
          </h2>
          <p
            className="text-3xl sm:text-4xl md:text-5xl text-gray-600 text-center mb-16 fade-up"
            style={{
              fontFamily: "Poppins, sans-serif",
              fontWeight: 600,
              transitionDelay: "200ms",
            }}
          >
            Every life contains profound moments worth preserving
          </p>

          {/* Large, Prominent Audio Player with Waveform */}
          <div
            className="bg-white/98 backdrop-blur-lg rounded-3xl shadow-2xl p-10 md:p-12 max-w-4xl mx-auto border-2 border-purple-200/50 fade-up transform hover:scale-[1.02] transition-all duration-300"
            style={{ transitionDelay: "400ms" }}
          >
            {/* Label */}
            <div className="text-center mb-6">
              <span
                className="inline-block px-6 py-3 bg-purple-100 text-purple-700 rounded-full text-xl font-bold"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                🎧 10-Second Wisdom Clip
              </span>
            </div>

            <div className="flex items-center justify-between mb-8">
              {/* Large Play Button */}
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-2xl hover:shadow-3xl transform transition-all duration-300 hover:scale-110 pulse-shadow"
                data-testid="button-play-wisdom"
              >
                {isPlaying ? (
                  <Pause className="w-10 h-10 md:w-12 md:h-12 text-white" />
                ) : (
                  <Play className="w-10 h-10 md:w-12 md:h-12 text-white ml-2" />
                )}
              </button>

              {/* Large Animated Waveform */}
              <div className="flex items-center gap-1 md:gap-[3px] flex-1 mx-8 h-20 md:h-24">
                {Array.from({ length: 40 }).map((_, i) => {
                  const heights = [
                    20, 35, 45, 65, 80, 95, 85, 70, 90, 100, 95, 85, 70, 80, 90,
                    95, 100, 90, 80, 65, 70, 85, 95, 90, 80, 65, 45, 35, 50, 65,
                    80, 70, 55, 40, 30, 25, 20, 15, 10, 8,
                  ];
                  return (
                    <div
                      key={i}
                      className={`bg-gradient-to-t from-purple-400 to-pink-400 rounded-full transition-all duration-300 ${isPlaying ? "animate-pulse" : ""}`}
                      style={{
                        width: "4px",
                        height: `${heights[i] || 40}%`,
                        animation: isPlaying
                          ? `waveform ${0.8 + (i % 10) * 0.1}s ease-in-out infinite`
                          : "none",
                        animationDelay: `${i * 0.05}s`,
                        transform: isPlaying ? "scaleY(1.2)" : "scaleY(1)",
                      }}
                    />
                  );
                })}
              </div>

              <span
                className="text-gray-600 text-xl font-semibold"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                0:10
              </span>
            </div>

            {/* Powerful Quote Display - LARGE AND PROMINENT */}
            <div className="text-center bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-100">
              <blockquote
                className="text-3xl sm:text-4xl md:text-5xl italic text-gray-800 leading-relaxed font-medium mb-6"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                "The quiet moments taught me more than the loud ones ever
                could."
              </blockquote>
              <p
                className="text-2xl sm:text-3xl text-gray-600 font-semibold"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                — Margaret, 74
              </p>
            </div>
          </div>

          <p
            className="text-xl sm:text-2xl text-gray-600 text-center mt-8 fade-up"
            style={{
              fontFamily: "Poppins, sans-serif",
              fontWeight: 400,
              transitionDelay: "600ms",
            }}
          >
            These clips become treasures for your family to keep forever
          </p>
        </div>
      </section>

      {/* Three-Step Process Section - Simplified, No Redundancy */}
      <section id="process-section" className="py-20 px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl text-center text-gray-800 mb-2 fade-up"
            style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
          >
            How it works
          </h2>
          <p
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-gray-600 text-center mb-16 fade-up"
            style={{
              fontFamily: "Poppins, sans-serif",
              fontWeight: 500,
              transitionDelay: "200ms",
            }}
          >
            Technology that disappears so wisdom can appear
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 place-items-center">
            {processSteps.map((step, index) => (
              <div
                key={index}
                className="flex flex-col items-center text-center group fade-up"
                style={{ animationDelay: `${400 + index * 200}ms` }}
              >
                <div className="relative mb-6">
                  {/* Process chip with proper sizing */}
                  <div className="process-circle">
                    <span className="icon">{step.icon}</span>
                  </div>
                </div>
                <h3
                  className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-gray-800 mb-1 text-center"
                  style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
                >
                  {step.title}
                </h3>
                <p
                  className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-gray-600 text-center"
                  style={{ fontFamily: "Poppins, sans-serif", fontWeight: 400 }}
                >
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl text-gray-800 mb-6 fade-up"
            style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
          >
            Three generations will thank you.
          </h2>
          <p
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-gray-600 mb-12 text-center fade-up"
            style={{
              fontFamily: "Poppins, sans-serif",
              fontWeight: 600,
              transitionDelay: "200ms",
            }}
          >
            Record your wisdom today.
          </p>

          <button
            onClick={handleStartFree}
            className="fade-up bg-gradient-to-r from-amber-500 to-rose-500 text-white px-16 py-8 md:px-20 md:py-10 rounded-full text-3xl sm:text-4xl md:text-5xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 border-4 border-white"
            style={{
              transitionDelay: "400ms",
              fontFamily: "Poppins, sans-serif",
              fontWeight: 700,
            }}
            data-testid="button-start-free"
          >
            Start your first story
          </button>

          <p
            className="mt-8 mb-20 text-gray-500 text-xl sm:text-2xl md:text-3xl text-center fade-up"
            style={{
              fontFamily: "Poppins, sans-serif",
              fontWeight: 500,
              transitionDelay: "600ms",
            }}
          >
            No credit card required • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer with Logo */}
      <footer className="relative z-10 py-16 px-6 bg-gradient-to-t from-amber-50 to-transparent">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <img
            src={logoUrl}
            alt="HeritageWhisper - Voice-first storytelling for families"
            className="w-80 sm:w-96 md:w-[28rem] max-w-full mb-6 fade-up"
            style={{
              height: "auto",
              maxHeight: "120px",
              objectFit: "scale-down",
            }}
          />
          <p
            className="text-gray-600 text-center text-lg fade-up"
            style={{
              fontFamily: "Poppins, sans-serif",
              fontWeight: 400,
              transitionDelay: "200ms",
            }}
          >
            © 2025 HeritageWhisper. Preserving wisdom, one story at a time.
          </p>
        </div>
      </footer>

      {/* Add keyframe animation for waveform */}
      <style>{`
        @keyframes waveform {
          0%, 100% { transform: scaleY(0.5); }
          50% { transform: scaleY(1); }
        }
      `}</style>

      {/* Floating Help Button - Positioned on Right Side */}
      {showNeedHelp && (
        <div className="fixed bottom-8 right-6 z-50 animate-slide-in-right">
          <div className="relative">
            {/* Tooltip */}
            {tooltipVisible && (
              <div className="absolute bottom-full right-0 mb-2 px-4 py-3 bg-gray-800 text-white text-sm rounded-lg whitespace-nowrap shadow-xl">
                See a demo
                <div className="absolute bottom-0 right-6 transform translate-y-1/2 rotate-45 w-3 h-3 bg-gray-800" />
              </div>
            )}

            {/* Button */}
            <button
              onClick={handleNeedHelp}
              onMouseEnter={() => setTooltipVisible(true)}
              onMouseLeave={() => setTooltipVisible(false)}
              className="bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300"
              data-testid="button-help"
              aria-label="See a demo"
            >
              <HelpCircle className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
