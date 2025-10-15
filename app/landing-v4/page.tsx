"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Check, X } from "lucide-react";

const logoUrl = "/HW_logo_mic_clean.png";
const textLogoUrl = "/HW_text-compress.png";

export default function LandingV4Page() {
  const router = useRouter();
  const [showRipple, setShowRipple] = useState(false);
  const [showTypewriter, setShowTypewriter] = useState(false);

  useEffect(() => {
    // Trigger typewriter effect
    setTimeout(() => setShowTypewriter(true), 200);

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
      observer.disconnect();
    };
  }, []);

  const handleStartRecording = () => {
    setShowRipple(true);
    router.push("/auth/register");
  };

  const testimonials = [
    {
      quote:
        "After my third story, my grandson called and said, 'Now I get you.'",
      author: "Margaret, 74",
      gradient: "from-purple-50 to-pink-50",
    },
    {
      quote: "Dad just talks. I get chapters I can share with my kids.",
      author: "Angela, 42",
      gradient: "from-amber-50 to-rose-50",
    },
    {
      quote: "I thought I had nothing to say. Six stories later, I proved myself wrong.",
      author: "Robert, 68",
      gradient: "from-blue-50 to-indigo-50",
    },
  ];

  const processSteps = [
    {
      icon: "📱",
      title: "Tap record",
      description: "Tell a short story. No apps to install.",
    },
    {
      icon: "⚙️",
      title: "We do the heavy lifting",
      description:
        "Automatic transcription, clean formatting, and gentle follow-up questions based on what you said.",
    },
    {
      icon: "❤️",
      title: "Save and share",
      description:
        "Your stories land on a beautiful timeline and book view. Share instantly. Print when you're ready.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-white overflow-x-hidden">
      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes shine {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .fade-up {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.6s ease-out, transform 0.6s ease-out;
        }

        .fade-up.in-view {
          opacity: 1;
          transform: translateY(0);
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }
      `}</style>

      {/* Header - Fixed Position Top Right */}
      <div className="fixed top-4 right-4 z-50 flex gap-3">
        <button
          onClick={() => router.push("/gift-plans")}
          className="relative overflow-hidden bg-gradient-to-r from-amber-500 via-orange-400 to-rose-400 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 group"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          <span className="relative z-10">Gift Plans</span>
          <span className="absolute inset-0 bg-gradient-to-r from-amber-600 via-orange-500 to-rose-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
        </button>
        <button
          onClick={() => router.push("/auth/login")}
          className="bg-white/90 backdrop-blur-sm text-gray-700 px-6 py-3 rounded-lg font-semibold shadow-sm hover:shadow-md transition-all duration-300 hover:bg-white border border-gray-200"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          Continue Stories
        </button>
      </div>

      {/* Hero Section with Gradient Background */}
      <section
        className="min-h-screen relative flex items-center justify-center overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #FEF3C7 0%, #FFEDD5 30%, #FED7AA 60%, #FECDD3 100%)",
        }}
      >
        {/* Animated gradient overlay */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: "radial-gradient(circle at 50% 0%, rgba(251,191,36,0.2), transparent 60%)",
          }}
        ></div>

        <div className="relative z-10 flex flex-col items-center justify-center px-6 py-20">
          {/* Hero Header */}
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
              className={`bg-gradient-to-r from-amber-500 via-orange-400 to-rose-400 bg-clip-text text-transparent inline-block transition-all duration-1500 ease-out break-words ${
                showTypewriter
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 translate-x-4"
              }`}
            >
              Finally, someone who truly listens.
            </span>
          </h2>

          {/* Subhead */}
          <p
            className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-gray-700 text-center mb-8 px-4 max-w-5xl"
            style={{
              fontFamily: "Poppins, sans-serif",
              fontWeight: 500,
              animation: "fade-in-up 0.6s ease-out 300ms forwards",
            }}
          >
            You talk for two minutes. Our story system transcribes, tidies, and
            asks the next best question.
          </p>

          {/* Three Bullets */}
          <div
            className="flex flex-col md:flex-row gap-6 md:gap-12 mb-12 text-center md:text-left px-4"
            style={{
              fontFamily: "Poppins, sans-serif",
              animation: "fade-in-up 0.6s ease-out 400ms forwards",
            }}
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">🎤</span>
              <span className="text-xl md:text-2xl text-gray-700 font-medium">
                In your voice
              </span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">📖</span>
              <span className="text-xl md:text-2xl text-gray-700 font-medium">
                Saved to timeline & book
              </span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">📱</span>
              <span className="text-xl md:text-2xl text-gray-700 font-medium">
                Share in one tap
              </span>
            </div>
          </div>

          {/* Primary CTA with Gradient */}
          <button
            onClick={handleStartRecording}
            className="group relative mb-6"
            style={{ animation: "fade-in-up 0.6s ease-out 600ms forwards" }}
          >
            {/* Ripple Effects */}
            {showRipple && (
              <>
                <div
                  className="absolute inset-0 bg-amber-400 rounded-full opacity-30"
                  style={{
                    animation: "ping 1s cubic-bezier(0, 0, 0.2, 1) infinite",
                  }}
                />
                <div
                  className="absolute inset-0 bg-rose-400 rounded-full opacity-30"
                  style={{
                    animation:
                      "ping 1s cubic-bezier(0, 0, 0.2, 1) 300ms infinite",
                  }}
                />
              </>
            )}

            {/* Button Content with Gradient */}
            <div className="relative overflow-hidden bg-gradient-to-r from-amber-500 via-orange-400 to-rose-400 text-white px-10 sm:px-14 py-8 sm:py-10 md:px-20 md:py-12 rounded-full shadow-2xl group-hover:shadow-[0_20px_60px_-10px_rgba(251,191,36,0.6)] transform transition-all duration-300 group-hover:scale-105 border-4 border-white">
              <span
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl block relative z-10"
                style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
              >
                Start your first story
              </span>
              {/* Shine effect on hover */}
              <span
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-30 transition-opacity duration-500"
                style={{ animation: "shine 2s infinite" }}
              ></span>
            </div>
          </button>

          {/* Secondary CTA */}
          <button
            onClick={() => {
              console.log("Demo story placeholder");
            }}
            className="mb-6 px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-full text-xl md:text-2xl font-semibold hover:border-gray-400 hover:bg-white/50 transition-all duration-300"
            style={{
              fontFamily: "Poppins, sans-serif",
              animation: "fade-in-up 0.6s ease-out 700ms forwards",
            }}
          >
            See a sample story
          </button>

          {/* Gift Plans Link */}
          <a
            href="/gift-plans"
            className="text-lg md:text-xl text-gray-600 hover:text-gray-800 underline"
            style={{
              fontFamily: "Poppins, sans-serif",
              fontWeight: 500,
              animation: "fade-in-up 0.6s ease-out 800ms forwards",
            }}
          >
            Adult children: Buy this for your parents → Gift Plans
          </a>

          {/* Scroll Indicator */}
          <button
            onClick={() =>
              document
                .querySelector("#social-proof")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="absolute bottom-8 animate-bounce p-2 hover:text-gray-600 transition-colors"
            aria-label="Scroll to next section"
          >
            <ChevronDown className="w-8 h-8 text-gray-400" />
          </button>
        </div>
      </section>

      {/* Social Proof Strip */}
      <section
        id="social-proof"
        className="py-24 px-6 relative z-10 bg-gradient-to-br from-purple-50 via-pink-50 to-white"
      >
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-center text-gray-800 mb-16 fade-up"
            style={{ fontFamily: "Poppins, sans-serif", fontWeight: 800 }}
          >
            Real stories, real connections
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className={`bg-gradient-to-br ${testimonial.gradient} rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 fade-up`}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                <blockquote
                  className="text-2xl md:text-3xl italic text-gray-800 leading-relaxed mb-6"
                  style={{ fontFamily: "Playfair Display, serif" }}
                >
                  "{testimonial.quote}"
                </blockquote>
                <p
                  className="text-xl text-gray-600 font-semibold"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  — {testimonial.author}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl text-center text-gray-800 mb-2 fade-up"
            style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
          >
            Easier than FaceTime
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
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-amber-100 to-rose-100 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                    <span className="text-6xl">{step.icon}</span>
                  </div>
                </div>
                <h3
                  className="text-2xl sm:text-3xl md:text-4xl text-gray-800 mb-3 text-center"
                  style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
                >
                  {step.title}
                </h3>
                <p
                  className="text-lg sm:text-xl md:text-2xl text-gray-600 text-center max-w-xs"
                  style={{ fontFamily: "Poppins, sans-serif", fontWeight: 400 }}
                >
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Not Another Book - Contrast Section */}
      <section
        id="contrast"
        className="py-24 px-6 relative z-10 bg-gradient-to-br from-indigo-50 via-purple-50 to-white"
      >
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-center text-gray-800 mb-16 fade-up"
            style={{ fontFamily: "Poppins, sans-serif", fontWeight: 800 }}
          >
            Not Another Dusty Book
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Left Column - What Others Do */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-10 shadow-lg fade-up">
              <h3
                className="text-3xl md:text-4xl text-gray-700 mb-8 text-center"
                style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
              >
                Other Memory Books
              </h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <X className="w-8 h-8 text-red-500 flex-shrink-0 mt-1" />
                  <p
                    className="text-xl md:text-2xl text-gray-600"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    52 generic prompts
                  </p>
                </div>
                <div className="flex items-start gap-4">
                  <X className="w-8 h-8 text-red-500 flex-shrink-0 mt-1" />
                  <p
                    className="text-xl md:text-2xl text-gray-600"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    Printed once, shelved forever
                  </p>
                </div>
                <div className="flex items-start gap-4">
                  <X className="w-8 h-8 text-red-500 flex-shrink-0 mt-1" />
                  <p
                    className="text-xl md:text-2xl text-gray-600"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    Same questions everyone gets
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column - Your Living Story */}
            <div
              className="bg-gradient-to-br from-amber-100 to-rose-100 rounded-3xl p-10 shadow-xl fade-up"
              style={{ transitionDelay: "200ms" }}
            >
              <h3
                className="text-3xl md:text-4xl text-gray-800 mb-8 text-center"
                style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
              >
                Your Living Story
              </h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <Check className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
                  <p
                    className="text-xl md:text-2xl text-gray-800"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    Questions from your own memories
                  </p>
                </div>
                <div className="flex items-start gap-4">
                  <Check className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
                  <p
                    className="text-xl md:text-2xl text-gray-800"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    A timeline and book view that grow over time
                  </p>
                </div>
                <div className="flex items-start gap-4">
                  <Check className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
                  <p
                    className="text-xl md:text-2xl text-gray-800"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    In everyone's pocket instantly
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why It's Different - Personalized Questions */}
      <section id="personalized" className="py-24 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-center text-gray-800 mb-6 fade-up"
            style={{ fontFamily: "Poppins, sans-serif", fontWeight: 800 }}
          >
            Personalized questions, not a script
          </h2>
          <p
            className="text-2xl sm:text-3xl md:text-4xl text-gray-600 text-center mb-16 fade-up"
            style={{
              fontFamily: "Poppins, sans-serif",
              fontWeight: 500,
              transitionDelay: "200ms",
            }}
          >
            We reference names, places, and moments you already mentioned
          </p>

          {/* Example Prompts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div
              className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl p-8 shadow-lg fade-up"
              style={{ transitionDelay: "400ms" }}
            >
              <p
                className="text-2xl md:text-3xl text-gray-800 italic leading-relaxed"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                "You said your father's silence shaped you. When did you stop
                trying to win his approval?"
              </p>
            </div>
            <div
              className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl p-8 shadow-lg fade-up"
              style={{ transitionDelay: "600ms" }}
            >
              <p
                className="text-2xl md:text-3xl text-gray-800 italic leading-relaxed"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                "You called Chewy 'love that made you behave.' What freedom did
                you trade for that love?"
              </p>
            </div>
          </div>

          {/* Feature Pills with Gradient */}
          <div
            className="flex flex-wrap justify-center gap-4 fade-up"
            style={{ transitionDelay: "800ms" }}
          >
            <div className="relative overflow-hidden bg-gradient-to-r from-amber-500 via-orange-400 to-rose-400 text-white px-8 py-4 rounded-full text-xl md:text-2xl font-semibold shadow-lg group">
              <span className="relative z-10" style={{ fontFamily: "Poppins, sans-serif" }}>
                Wisdom highlights
              </span>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-8 py-4 rounded-full text-xl md:text-2xl font-semibold shadow-lg">
              <span style={{ fontFamily: "Poppins, sans-serif" }}>
                Traits and threads
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Reassurance for Seniors */}
      <section
        id="reassurance"
        className="py-24 px-6 relative z-10 bg-gradient-to-br from-amber-50 via-orange-50 to-white"
      >
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-center text-gray-800 mb-16 fade-up"
            style={{ fontFamily: "Poppins, sans-serif", fontWeight: 800 }}
          >
            Simple and safe
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-md fade-up"
              style={{ transitionDelay: "200ms" }}
            >
              <p
                className="text-2xl md:text-3xl text-gray-800"
                style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600 }}
              >
                ✓ No typing required. Just talk.
              </p>
            </div>
            <div
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-md fade-up"
              style={{ transitionDelay: "300ms" }}
            >
              <p
                className="text-2xl md:text-3xl text-gray-800"
                style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600 }}
              >
                ✓ You approve every word before it's saved.
              </p>
            </div>
            <div
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-md fade-up"
              style={{ transitionDelay: "400ms" }}
            >
              <p
                className="text-2xl md:text-3xl text-gray-800"
                style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600 }}
              >
                ✓ You control who sees your stories.
              </p>
            </div>
            <div
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-md fade-up"
              style={{ transitionDelay: "500ms" }}
            >
              <p
                className="text-2xl md:text-3xl text-gray-800"
                style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600 }}
              >
                ✓ Download everything or delete anytime.
              </p>
            </div>
          </div>

          {/* Plain Language Promise */}
          <div
            className="bg-gradient-to-r from-amber-100 to-orange-100 border-2 border-amber-200 rounded-3xl p-10 fade-up"
            style={{ transitionDelay: "600ms" }}
          >
            <h3
              className="text-2xl md:text-3xl text-gray-800 mb-4 text-center"
              style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
            >
              Plain language promise
            </h3>
            <p
              className="text-xl md:text-2xl text-gray-700 leading-relaxed text-center"
              style={{ fontFamily: "Poppins, sans-serif", fontWeight: 400 }}
            >
              We use automated software to transcribe your voice and suggest
              follow-ups. You're always in charge of the final story.
            </p>
          </div>
        </div>
      </section>

      {/* Gift Plans Section */}
      <section
        id="gift-plans-cta"
        className="py-24 px-6 relative z-10 bg-gradient-to-br from-rose-50 via-pink-50 to-white"
      >
        <div className="max-w-4xl mx-auto text-center">
          <div
            className="bg-gradient-to-br from-amber-100 to-rose-100 rounded-3xl p-12 md:p-16 shadow-2xl fade-up"
          >
            <h2
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-gray-800 mb-6"
              style={{ fontFamily: "Poppins, sans-serif", fontWeight: 800 }}
            >
              Give this to your parents
            </h2>
            <p
              className="text-2xl sm:text-3xl md:text-4xl text-gray-700 mb-10"
              style={{ fontFamily: "Poppins, sans-serif", fontWeight: 500 }}
            >
              Make it easy for them to be remembered.
            </p>
            <button
              onClick={() => router.push("/gift-plans")}
              className="relative overflow-hidden bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-12 py-6 md:px-16 md:py-8 rounded-full text-2xl md:text-3xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 border-4 border-white group"
              style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
            >
              <span className="relative z-10">See Gift Plans</span>
            </button>
          </div>
        </div>
      </section>

      {/* Bottom Close with Gradient Background */}
      <section
        className="py-20 px-6 relative z-10 overflow-hidden"
        style={{
          background: "linear-gradient(320deg, #FEF3C7 0%, #FFEDD5 30%, #FED7AA 60%, #FECDD3 100%)",
        }}
      >
        {/* Decorative overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: "radial-gradient(circle at 50% 100%, rgba(251,191,36,0.3), transparent 70%)",
          }}
        ></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl text-gray-800 mb-6 fade-up"
            style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
          >
            Your stories don't save themselves.
          </h2>
          <p
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-gray-600 mb-12 text-center fade-up"
            style={{
              fontFamily: "Poppins, sans-serif",
              fontWeight: 600,
              transitionDelay: "200ms",
            }}
          >
            Tell one today. Your family will thank you for decades.
          </p>

          <button
            onClick={handleStartRecording}
            className="fade-up relative overflow-hidden bg-gradient-to-r from-amber-500 via-orange-400 to-rose-400 text-white px-16 py-8 md:px-20 md:py-10 rounded-full text-3xl sm:text-4xl md:text-5xl shadow-2xl hover:shadow-[0_20px_60px_-10px_rgba(251,191,36,0.6)] transform hover:scale-105 transition-all duration-300 border-4 border-white group"
            style={{
              transitionDelay: "400ms",
              fontFamily: "Poppins, sans-serif",
              fontWeight: 700,
            }}
          >
            <span className="relative z-10">Start your first story</span>
            {/* Shine effect */}
            <span
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-30 transition-opacity duration-500"
              style={{ animation: "shine 2s infinite" }}
            ></span>
          </button>

          <p
            className="mt-8 text-gray-500 text-xl sm:text-2xl md:text-3xl text-center fade-up"
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

      {/* Footer with Text Logo */}
      <footer className="relative z-10 py-16 px-6 bg-gradient-to-t from-amber-50 to-transparent">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <img
            src={textLogoUrl}
            alt="HeritageWhisper - Voice-first storytelling for families"
            className="w-80 sm:w-96 md:w-[28rem] max-w-full mb-6 fade-up opacity-90"
            style={{
              height: "auto",
              maxHeight: "120px",
              objectFit: "scale-down",
            }}
          />
          <div
            className="flex gap-6 mb-4 text-lg fade-up"
            style={{
              fontFamily: "Poppins, sans-serif",
              fontWeight: 400,
              transitionDelay: "100ms",
            }}
          >
            <a
              href="/terms"
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              Terms
            </a>
            <span className="text-gray-400">•</span>
            <a
              href="/privacy"
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              Privacy
            </a>
            <span className="text-gray-400">•</span>
            <a
              href="/gift-plans"
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              Gift Plans
            </a>
          </div>
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
    </div>
  );
}
