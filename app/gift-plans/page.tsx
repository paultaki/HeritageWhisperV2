"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Gift, Mail, Mic, Heart, ChevronDown } from "lucide-react";

const logoUrl = "/HW_logo_mic_clean.png";

export default function GiftPlansPage() {
  const router = useRouter();

  useEffect(() => {
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

  const pricingTiers = [
    {
      name: "Starter",
      price: "$49",
      description: "Perfect for getting started",
      features: [
        "10 stories included",
        "Timeline & book view",
        "Share with family",
        "Guided questions",
        "Wisdom highlights",
      ],
      gradient: "from-amber-400 to-orange-500",
      bgGradient: "from-amber-50 to-orange-50",
    },
    {
      name: "Family",
      price: "$99",
      description: "Most popular choice",
      features: [
        "25 stories included",
        "Timeline & book view",
        "Share with family",
        "Guided questions",
        "Wisdom highlights",
        "Traits and threads",
        "Print-ready book",
      ],
      gradient: "from-rose-400 to-pink-500",
      bgGradient: "from-rose-50 to-pink-50",
      popular: true,
    },
    {
      name: "Legacy",
      price: "$199",
      description: "For the complete story",
      features: [
        "Unlimited stories",
        "Timeline & book view",
        "Share with family",
        "Guided questions",
        "Wisdom highlights",
        "Traits and threads",
        "Print-ready book",
        "Priority support",
      ],
      gradient: "from-purple-400 to-indigo-500",
      bgGradient: "from-purple-50 to-indigo-50",
    },
  ];

  const howItWorksSteps = [
    {
      icon: Gift,
      title: "Purchase a gift plan",
      description: "Choose the perfect package for your loved one",
    },
    {
      icon: Mail,
      title: "Send an email invite",
      description:
        "We'll send a beautiful invitation with simple instructions",
    },
    {
      icon: Mic,
      title: "They start recording",
      description: "No apps, no hassle. Just tap and talk on any phone",
    },
    {
      icon: Heart,
      title: "Everyone shares the stories",
      description:
        "Family members get instant access to the growing collection",
    },
  ];

  const faqs = [
    {
      question: "How does the gift plan work?",
      answer:
        "After purchase, you'll receive an email invitation link to send to your loved one. They simply click the link and can start recording immediately—no app download or account setup required.",
    },
    {
      question: "What if they're not tech-savvy?",
      answer:
        "HeritageWhisper is designed for everyone. They just tap one button to record, talk for 2 minutes, and we handle everything else. It's easier than making a phone call.",
    },
    {
      question: "Can I add more stories later?",
      answer:
        "Absolutely! You can upgrade to a larger plan at any time, and they'll only pay the difference. Or they can continue on their own subscription.",
    },
    {
      question: "How long does the gift plan last?",
      answer:
        "Gift plans are valid for one year from purchase. Your recipient has plenty of time to record all their stories at their own pace.",
    },
    {
      question: "Can multiple family members access the stories?",
      answer:
        "Yes! The person recording can share their timeline and book with as many family members as they'd like. Everyone gets instant access.",
    },
    {
      question: "What if they don't use all the stories?",
      answer:
        "No problem. Unused stories never expire. They can always come back and add more memories whenever they're ready.",
    },
  ];

  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  return (
    <div className="hw-page bg-gradient-to-br from-amber-50 via-rose-50 to-white overflow-x-hidden">
      {/* Header */}
      <div className="fixed top-4 right-4 z-50 flex gap-3">
        <button
          onClick={() => router.push("/")}
          className="bg-white/90 backdrop-blur-sm text-gray-700 px-6 py-3 rounded-lg font-semibold shadow-sm hover:shadow-md transition-all duration-300 hover:bg-white border border-gray-200"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          Home
        </button>
        <button
          onClick={() => router.push("/auth/login")}
          className="bg-gradient-to-r from-amber-500 to-rose-500 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          Continue Stories
        </button>
      </div>

      {/* Hero Section */}
      <section className="hw-page relative flex items-center justify-center">
        <div className="relative z-10 flex flex-col items-center justify-center px-6 py-20">
          <div className="text-7xl mb-8 animate-fade-in-up">🎁</div>
          <h1
            className="text-5xl xs:text-6xl sm:text-7xl md:text-8xl lg:text-[6rem] xl:text-[10rem] text-center text-gray-800 mb-8 leading-tight px-4 animate-fade-in-up"
            style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
          >
            Give the gift of memory
          </h1>

          <p
            className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-gray-700 text-center mb-12 px-4 max-w-4xl"
            style={{
              fontFamily: "Poppins, sans-serif",
              fontWeight: 500,
              animation: "fade-in-up 0.6s ease-out 300ms forwards",
            }}
          >
            Help someone you love preserve their wisdom and stories for
            generations to come
          </p>

          {/* Scroll Indicator */}
          <button
            onClick={() =>
              document
                .querySelector("#pricing")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="absolute bottom-8 animate-bounce p-2 hover:text-gray-600 transition-colors"
            aria-label="Scroll to pricing"
          >
            <ChevronDown className="w-8 h-8 text-gray-400" />
          </button>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <h2
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-center text-gray-800 mb-4 fade-up"
            style={{ fontFamily: "Poppins, sans-serif", fontWeight: 800 }}
          >
            Choose the perfect plan
          </h2>
          <p
            className="text-2xl sm:text-3xl md:text-4xl text-gray-600 text-center mb-16 fade-up"
            style={{
              fontFamily: "Poppins, sans-serif",
              fontWeight: 500,
              transitionDelay: "200ms",
            }}
          >
            All plans include our full story system
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingTiers.map((tier, index) => (
              <div
                key={index}
                className={`relative bg-gradient-to-br ${tier.bgGradient} rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 fade-up ${
                  tier.popular ? "ring-4 ring-rose-400 md:scale-105" : ""
                }`}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                {tier.popular && (
                  <div
                    className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-rose-500 to-pink-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    MOST POPULAR
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3
                    className="text-3xl md:text-4xl text-gray-800 mb-2"
                    style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
                  >
                    {tier.name}
                  </h3>
                  <p
                    className="text-lg text-gray-600 mb-4"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    {tier.description}
                  </p>
                  <div
                    className={`text-5xl md:text-6xl font-bold bg-gradient-to-r ${tier.gradient} bg-clip-text text-transparent mb-2`}
                    style={{
                      fontFamily: "Poppins, sans-serif",
                      backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))`,
                      backgroundClip: "text",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    {tier.price}
                  </div>
                  <p
                    className="text-sm text-gray-600"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    one-time payment
                  </p>
                </div>

                <ul className="space-y-4 mb-8">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                      <span
                        className="text-lg text-gray-700"
                        style={{ fontFamily: "Poppins, sans-serif" }}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => {
                    // Placeholder for purchase flow
                    console.log(`Selected plan: ${tier.name}`);
                  }}
                  className={`w-full bg-gradient-to-r ${tier.gradient} text-white py-4 rounded-full text-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300`}
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  Buy {tier.name}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="py-24 px-6 relative z-10 bg-gradient-to-br from-purple-50 via-pink-50 to-white"
      >
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-center text-gray-800 mb-16 fade-up"
            style={{ fontFamily: "Poppins, sans-serif", fontWeight: 800 }}
          >
            How it works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorksSteps.map((step, index) => (
              <div
                key={index}
                className="flex flex-col items-center text-center fade-up"
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-100 to-rose-100 flex items-center justify-center shadow-lg mb-6">
                  <step.icon className="w-12 h-12 text-rose-600" />
                </div>
                <h3
                  className="text-2xl md:text-3xl text-gray-800 mb-3"
                  style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
                >
                  {step.title}
                </h3>
                <p
                  className="text-lg md:text-xl text-gray-600"
                  style={{ fontFamily: "Poppins, sans-serif", fontWeight: 400 }}
                >
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          <h2
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-center text-gray-800 mb-16 fade-up"
            style={{ fontFamily: "Poppins, sans-serif", fontWeight: 800 }}
          >
            Frequently asked questions
          </h2>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md overflow-hidden fade-up"
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <button
                  onClick={() =>
                    setOpenFaqIndex(openFaqIndex === index ? null : index)
                  }
                  className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <h3
                    className="text-xl md:text-2xl text-gray-800 pr-4"
                    style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600 }}
                  >
                    {faq.question}
                  </h3>
                  <ChevronDown
                    className={`w-6 h-6 text-gray-600 flex-shrink-0 transition-transform ${
                      openFaqIndex === index ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaqIndex === index && (
                  <div className="px-8 pb-6">
                    <p
                      className="text-lg md:text-xl text-gray-600 leading-relaxed"
                      style={{ fontFamily: "Poppins, sans-serif", fontWeight: 400 }}
                    >
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section
        id="cta"
        className="py-24 px-6 relative z-10 bg-gradient-to-br from-amber-50 via-rose-50 to-white"
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-gray-800 mb-8 fade-up"
            style={{ fontFamily: "Poppins, sans-serif", fontWeight: 800 }}
          >
            Give a gift that lasts forever
          </h2>
          <p
            className="text-2xl sm:text-3xl md:text-4xl text-gray-600 mb-12 fade-up"
            style={{
              fontFamily: "Poppins, sans-serif",
              fontWeight: 500,
              transitionDelay: "200ms",
            }}
          >
            Help preserve the wisdom of someone you love
          </p>

          <button
            onClick={() =>
              document
                .querySelector("#pricing")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="fade-up bg-gradient-to-r from-amber-500 to-rose-500 text-white px-12 py-6 md:px-16 md:py-8 rounded-full text-2xl md:text-3xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 border-4 border-white"
            style={{
              transitionDelay: "400ms",
              fontFamily: "Poppins, sans-serif",
              fontWeight: 700,
            }}
          >
            Buy a Gift Plan
          </button>

          <p
            className="mt-8 text-gray-500 text-lg md:text-xl fade-up"
            style={{
              fontFamily: "Poppins, sans-serif",
              fontWeight: 500,
              transitionDelay: "600ms",
            }}
          >
            Questions? Email us at support@heritagewhisper.com
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-16 px-6 bg-gradient-to-t from-amber-50 to-transparent">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <img
            src={logoUrl}
            alt="HeritageWhisper"
            className="w-80 sm:w-96 md:w-[28rem] max-w-full mb-6 fade-up"
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
              href="/"
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              Home
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

