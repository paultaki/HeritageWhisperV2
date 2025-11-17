import LandingHeader from '@/components/landing-v3/landing-header'
import HeroSection from '@/components/landing-v3/hero-section'
import ProblemStatement from '@/components/landing-v3/problem-statement'
import ThreePillars from '@/components/landing-v3/three-pillars'
import SocialProofSnapshot from '@/components/landing-v3/social-proof-snapshot'
import ValuePropsShowcase from '@/components/landing-v3/value-props-showcase'
import HowItWorks from '@/components/landing-v3/how-it-works'
import ComparisonTable from '@/components/landing-v3/comparison-table'
import TestimonialStories from '@/components/landing-v3/testimonial-stories'
import FounderStory from '@/components/landing-v3/founder-story'
import PricingSection from '@/components/landing-v3/pricing-section'
import FAQSection from '@/components/landing-v3/faq-section'
import GiftSection from '@/components/landing-v3/gift-section'
import FooterCTA from '@/components/landing-v3/footer-cta'
import LandingFooter from '@/components/landing-v3/landing-footer'

export default function LandingV3() {
  return (
    <>
      <LandingHeader />
      <main className="relative bg-heritage-warm-paper overflow-hidden">
        {/* Subtle vertical line accents */}
        <div className="hidden lg:block fixed left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-stone-300/20 to-transparent" />
        <div className="hidden lg:block fixed right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-stone-300/20 to-transparent" />

        <div className="relative">
          <HeroSection />
          {/* Three Ways section moved up - key differentiator */}
          <ValuePropsShowcase />
          <ProblemStatement />
          <div id="features">
            <ThreePillars />
          </div>
          <SocialProofSnapshot />
          <div id="how-it-works">
            <HowItWorks />
          </div>
          <ComparisonTable />
          <TestimonialStories />
          <FounderStory />
          <div id="pricing">
            <PricingSection />
          </div>
          <div id="faq">
            <FAQSection />
          </div>
          <GiftSection />
          <FooterCTA />
        </div>
      </main>
      <LandingFooter />
    </>
  )
}
