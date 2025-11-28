import { Metadata } from 'next'
import {
  Header,
  Hero,
  StakesSection,
  ComparisonSection,
  ThreeSteps,
  VoiceSection,
  TechObjection,
  ProductShowcase,
  Testimonials,
  FounderStory,
  PricingSection,
  FAQ,
  FinalCTA,
  Footer,
} from '@/components/landing'

export const metadata: Metadata = {
  title: 'HeritageWhisper | Preserve Family Stories in Their Own Voice',
  description:
    "Voice-first family storytelling. Record memories, hear their voice forever. No typing required—just conversation.",
  openGraph: {
    title: 'HeritageWhisper | Preserve Family Stories in Their Own Voice',
    description:
      "Voice-first family storytelling. Record memories, hear their voice forever. No typing required—just conversation.",
    type: 'website',
  },
}

export default function LandingPage() {
  return (
    <>
      <Header />
      <main className="relative bg-[var(--hw-page-bg)] overflow-hidden">
        <Hero />
        <StakesSection />
        <ComparisonSection />
        <div id="how-it-works">
          <ThreeSteps />
        </div>
        <VoiceSection />
        <TechObjection />
        <ProductShowcase />
        <Testimonials />
        <div id="founder-story">
          <FounderStory />
        </div>
        <div id="pricing">
          <PricingSection />
        </div>
        <div id="faq">
          <FAQ />
        </div>
        <FinalCTA />
      </main>
      <Footer />
    </>
  )
}
