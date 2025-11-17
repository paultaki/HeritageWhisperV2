import HeroSection from '@/components/landing-v3/hero-section'
import ProblemStatement from '@/components/landing-v3/problem-statement'
import ThreePillars from '@/components/landing-v3/three-pillars'
import SocialProofSnapshot from '@/components/landing-v3/social-proof-snapshot'
import ValuePropsShowcase from '@/components/landing-v3/value-props-showcase'
import HowItWorks from '@/components/landing-v3/how-it-works'
import ComparisonTable from '@/components/landing-v3/comparison-table'
import TestimonialStories from '@/components/landing-v3/testimonial-stories'
import PricingSection from '@/components/landing-v3/pricing-section'
import GiftSection from '@/components/landing-v3/gift-section'
import FAQSection from '@/components/landing-v3/faq-section'
import FooterCTA from '@/components/landing-v3/footer-cta'

export default function LandingV3() {
  return (
    <main className="relative bg-[#faf8f5] overflow-hidden">
      {/* Subtle vertical line accents */}
      <div className="hidden lg:block fixed left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-stone-300/20 to-transparent" />
      <div className="hidden lg:block fixed right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-stone-300/20 to-transparent" />

      <div className="relative">
        <HeroSection />
        <ProblemStatement />
        <ThreePillars />
        <SocialProofSnapshot />
        <ValuePropsShowcase />
        <HowItWorks />
        <ComparisonTable />
        <TestimonialStories />
        <PricingSection />
        <GiftSection />
        <FAQSection />
        <FooterCTA />
      </div>
    </main>
  )
}
