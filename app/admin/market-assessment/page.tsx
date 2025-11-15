"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Target,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  DollarSign,
  Lightbulb,
  ArrowRight,
  Shield,
  Zap,
  Video
} from "lucide-react";
import { useState } from "react";

export default function MarketAssessmentPage() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="hw-page bg-[#FFF8F3] py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Target className="w-10 h-10 text-heritage-brown" />
            <h1 className="text-4xl font-serif font-bold text-heritage-brown">
              Market Assessment
            </h1>
          </div>
          <p className="text-xl text-gray-700 max-w-4xl">
            Comprehensive competitive analysis and strategic recommendations for HeritageWhisper's position in the digital legacy preservation market.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
              <Clock className="w-3 h-3 mr-1" />
              12-18 Month Window
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <DollarSign className="w-3 h-3 mr-1" />
              $13-26B Market
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <TrendingUp className="w-3 h-3 mr-1" />
              15% CAGR
            </Badge>
            <a
              href="https://www.youtube.com/shorts/0v5GYsbwVKM"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full border bg-red-50 text-red-700 border-red-200 hover:bg-red-100 transition-colors text-xs font-medium"
            >
              <Video className="w-3 h-3" />
              Watch Overview
            </a>
          </div>
        </div>

        {/* Executive Summary */}
        <Card className="border-2 border-heritage-brown/20 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-heritage-brown/5 to-heritage-brown/10">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Zap className="w-6 h-6 text-heritage-brown" />
              Executive Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r">
              <h3 className="text-lg font-bold text-amber-900 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Critical Window
              </h3>
              <p className="text-base text-amber-900 leading-relaxed">
                HeritageWhisper faces a narrow 12-18 month window before AI-powered competitors flood the market.
                Core differentiators—AI-powered follow-up questions and voice preservation—represent genuine advantages
                over market leaders StoryWorth and Remento, but three well-funded AI-native startups launched in 2024-2025
                offer nearly identical capabilities.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <h4 className="text-base font-bold text-green-900 mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Competitive Advantages
                </h4>
                <ul className="text-base text-green-900 space-y-1">
                  <li>• AI conversational intelligence (vs StoryWorth/Remento)</li>
                  <li>• Living legacy (continuous updates vs fixed projects)</li>
                  <li>• Voice preservation with actual audio</li>
                  <li>• Smartphone-native UX optimized for seniors</li>
                </ul>
              </div>

              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <h4 className="text-base font-bold text-red-900 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Key Threats
                </h4>
                <ul className="text-base text-red-900 space-y-1">
                  <li>• Tell Mel (phone-based AI, $19-229)</li>
                  <li>• Autobiographer ($4M raised, $199/year)</li>
                  <li>• Life Story AI (€199, 7 languages)</li>
                  <li>• Technology rapidly commoditizing</li>
                </ul>
              </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r">
              <h3 className="text-lg font-bold text-blue-900 mb-2">Bottom Line</h3>
              <p className="text-base text-blue-900 leading-relaxed">
                Success depends entirely on execution speed, curation quality, and brand building—not technological
                superiority. The platform that wins won't have the best AI—it will have the best customer experience,
                the strongest emotional resonance, and the fastest path from stranger to trusted family memory keeper.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Sections */}
        <div className="grid gap-6">
          {/* Market Leaders */}
          <DetailSection
            title="Market Leaders Analysis"
            icon={<Users className="w-6 h-6" />}
            expanded={expandedSection === "leaders"}
            onToggle={() => toggleSection("leaders")}
            badge="Vulnerable but Dominant"
            badgeColor="orange"
          >
            <div className="space-y-6">
              {/* StoryWorth */}
              <div className="border-l-4 border-gray-400 pl-4">
                <h3 className="text-xl font-bold mb-2">StoryWorth</h3>
                <div className="grid md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-base font-semibold text-gray-600">Market Position</p>
                    <ul className="text-base space-y-1 mt-1">
                      <li>• 1M+ books printed since 2011</li>
                      <li>• 60,000+ Trustpilot reviews</li>
                      <li>• $1.5M revenue (2024, 10 employees)</li>
                      <li>• Bootstrapped, family-owned</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-base font-semibold text-gray-600">Critical Vulnerabilities</p>
                    <ul className="text-base space-y-1 mt-1">
                      <li>• Zero AI capabilities</li>
                      <li>• "Dated technology" (customer reviews)</li>
                      <li>• iOS-only app (no Android)</li>
                      <li>• Text-first (barriers for elderly)</li>
                    </ul>
                  </div>
                </div>
                <p className="text-base text-gray-700 leading-relaxed">
                  <strong>Pricing:</strong> $99/year for 52 weekly prompts + hardcover book.
                  <strong className="ml-2">Opportunity:</strong> Users frustrated with weekly typing burden,
                  lost stories, limited formatting. Prime target for "StoryWorth alternatives" search.
                </p>
              </div>

              {/* Remento */}
              <div className="border-l-4 border-blue-400 pl-4">
                <h3 className="text-xl font-bold mb-2">Remento</h3>
                <div className="grid md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-base font-semibold text-gray-600">Competitive Threat</p>
                    <ul className="text-base space-y-1 mt-1">
                      <li>• $300K from Mark Cuban (Shark Tank)</li>
                      <li>• $4.6M projected 2025 revenue</li>
                      <li>• 86% profit margins</li>
                      <li>• Voice recording via SMS links</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-base font-semibold text-gray-600">Key Limitation</p>
                    <ul className="text-base space-y-1 mt-1">
                      <li>• AI is post-production polish only</li>
                      <li>• No intelligent follow-up questions</li>
                      <li>• Static prompts (no adaptive AI)</li>
                      <li>• One-year fixed projects</li>
                    </ul>
                  </div>
                </div>
                <p className="text-base text-gray-700 leading-relaxed">
                  <strong>Pricing:</strong> $99/year.
                  <strong className="ml-2">Differentiation:</strong> HeritageWhisper conducts intelligent interviews
                  that extract wisdom through real-time adaptive questioning vs Remento's "record → polish text" approach.
                </p>
              </div>
            </div>
          </DetailSection>

          {/* AI-Native Competitors */}
          <DetailSection
            title="AI-Native Startups"
            icon={<Zap className="w-6 h-6" />}
            expanded={expandedSection === "ai-competitors"}
            onToggle={() => toggleSection("ai-competitors")}
            badge="Direct Threats"
            badgeColor="red"
          >
            <div className="space-y-4">
              <CompetitorCard
                name="Tell Mel"
                pricing="$19-$229"
                features={[
                  "Phone-based AI interviews (no tech barriers)",
                  "Adaptive follow-up questions during calls",
                  "10 languages supported",
                  "Eliminates smartphone requirement"
                ]}
                threat="Broader demographic reach, zero tech barriers"
              />
              <CompetitorCard
                name="Autobiographer"
                pricing="$199/year"
                features={[
                  "$4M pre-seed funding (TechCrunch May 2024)",
                  "Katie Couric partnership",
                  "Anthropic-powered conversational AI",
                  "Biometric vault with end-to-end encryption"
                ]}
                threat="Well-funded, strong positioning, same tech capabilities"
              />
              <CompetitorCard
                name="Life Story AI"
                pricing="€199 (~$215)"
                features={[
                  "Product Hunt launch Jan 2024",
                  "AI biographer 'Lisa' with adaptive questions",
                  "7 language transcription",
                  "Up to 5 co-authors, 30 interviewers per book"
                ]}
                threat="Multi-contributor features, aggressive StoryWorth positioning"
              />
            </div>
            <div className="mt-4 bg-red-50 border border-red-200 p-4 rounded-lg">
              <p className="text-base text-red-900 font-semibold">
                ⚠️ Critical Insight: AI follow-up questioning is NOT unique—it's an emerging category standard
                among new entrants. Differentiation exists primarily against StoryWorth/Remento, not other AI-native platforms.
              </p>
            </div>
          </DetailSection>

          {/* Market Opportunity */}
          <DetailSection
            title="Market Opportunity"
            icon={<TrendingUp className="w-6 h-6" />}
            expanded={expandedSection === "market"}
            onToggle={() => toggleSection("market")}
            badge="$13-26B Market"
            badgeColor="green"
          >
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-bold mb-2">Market Size</h4>
                <ul className="text-base space-y-2">
                  <li>• <strong>Global:</strong> $13-26B (2024-2025)</li>
                  <li>• <strong>U.S.:</strong> $3.72B → $16.21B by 2034</li>
                  <li>• <strong>CAGR:</strong> 12-16% consensus</li>
                  <li>• <strong>Growth Driver:</strong> Post-COVID digital acceleration</li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-bold mb-2">Senior Tech Adoption</h4>
                <ul className="text-base space-y-2">
                  <li>• 82% rely on tech for family connection</li>
                  <li>• 95% use smartphones for messaging</li>
                  <li>• 18% used generative AI in 2024 (doubled from 9%)</li>
                  <li>• 30% excited about AI's potential benefits</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r">
              <h4 className="text-lg font-bold text-blue-900 mb-2">Pricing Tiers in Market</h4>
              <div className="grid md:grid-cols-3 gap-4 text-base">
                <div>
                  <p className="font-semibold">Free Alternatives</p>
                  <p className="text-gray-700">StoryCorps, ChatGPT DIY</p>
                </div>
                <div>
                  <p className="font-semibold">$99-$199 Subscriptions</p>
                  <p className="text-gray-700">StoryWorth, Remento, HeritageWhisper</p>
                </div>
                <div>
                  <p className="font-semibold">$5K-$50K Professional</p>
                  <p className="text-gray-700">Video biographies, ghostwriting</p>
                </div>
              </div>
            </div>
          </DetailSection>

          {/* Strategic Recommendations */}
          <DetailSection
            title="Strategic Recommendations"
            icon={<Lightbulb className="w-6 h-6" />}
            expanded={expandedSection === "recommendations"}
            onToggle={() => toggleSection("recommendations")}
            badge="Immediate Actions"
            badgeColor="purple"
          >
            <div className="space-y-4">
              <RecommendationCard
                priority="Critical"
                title="Move with Urgency"
                description="Launch within 3-6 months. The 12-18 month window before market consolidation demands establishing market presence before copycats arrive."
                color="red"
              />
              <RecommendationCard
                priority="High"
                title="Exploit StoryWorth's Vulnerability"
                description="Target frustrated users searching for 'StoryWorth alternatives' with messaging emphasizing AI intelligence, voice preservation, and modern technology. 60,000 reviews provide massive customer pool."
                color="orange"
              />
              <RecommendationCard
                priority="High"
                title="Differentiate Against Remento"
                description="Position as conducting intelligent interviews that extract wisdom through real-time adaptive questioning vs Remento's 'record static responses then polish text' approach."
                color="orange"
              />
              <RecommendationCard
                priority="Medium"
                title="Monitor AI-Native Competitors"
                description="Track Tell Mel, Autobiographer, Life Story AI obsessively. Understand their customer acquisition strategies, messaging, and feature roadmaps."
                color="yellow"
              />
              <RecommendationCard
                priority="Medium"
                title="Consider Video Feature"
                description="Professional video biographies command $5K-$50K, suggesting video is gold standard. Even basic smartphone video with AI highlights could capture higher-value customers."
                color="yellow"
              />
              <RecommendationCard
                priority="High"
                title="Ensure Physical Book Output"
                description="Digital-only archives miss gift-giving moment and tangible heirloom desire. Partner with print-on-demand if needed, but deliver physical products."
                color="orange"
              />
              <RecommendationCard
                priority="Critical"
                title="Build for Longevity"
                description="Architectural decisions ensuring data portability, redundant backups, transparent financial sustainability. Address 'what if you go out of business' concerns proactively."
                color="red"
              />
              <RecommendationCard
                priority="Medium"
                title="Price Confidently at $149"
                description="Market has absorbed $199 from Autobiographer and $5K-$50K from professionals. Value proposition justifies 50% premium over StoryWorth if execution delivers better outcomes."
                color="yellow"
              />
            </div>
          </DetailSection>

          {/* What Determines Success */}
          <DetailSection
            title="Success Factors"
            icon={<Shield className="w-6 h-6" />}
            expanded={expandedSection === "success"}
            onToggle={() => toggleSection("success")}
            badge="Not Technology"
            badgeColor="blue"
          >
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-lg mb-4">
              <p className="text-lg font-bold text-amber-900 mb-2">
                ⚠️ Technology provides NO defensive moat
              </p>
              <p className="text-base text-amber-900">
                AI transcription costs $0.02/minute with 95%+ accuracy. Conversational AI is free via ChatGPT.
                Follow-up question generation requires basic prompt engineering. No-code platforms enable competitor
                launches in weeks. Success depends entirely on:
              </p>
            </div>

            <div className="grid gap-4">
              <SuccessFactor
                title="Curation Excellence"
                description="Professionally designed question sequences that extract meaningful wisdom rather than generic life events. The difference between 'Where did you grow up?' and carefully crafted questions that reveal character, lessons learned, and values passed down."
              />
              <SuccessFactor
                title="Execution Quality"
                description="Reliability (no lost stories), beautiful book production, seamless family sharing, responsive human support. In a category where customers entrust precious family memories, even small failures cause disproportionate damage."
              />
              <SuccessFactor
                title="Brand and Trust"
                description="Families must believe HeritageWhisper will exist in 20 years when grandchildren want to access recordings. Building credibility through partnerships (libraries, senior organizations), media coverage, and demonstrable financial stability."
              />
              <SuccessFactor
                title="Speed to Market"
                description="Launching before no-code competitors flood the category and before Remento or others add conversational AI features. Every month of delay costs market share and mindshare."
              />
              <SuccessFactor
                title="Positioning Precision"
                description="Clearly articulating why HeritageWhisper differs from free ChatGPT workflows (curation, ease, emotional design), from StoryWorth/Remento (AI conversational intelligence), and from Tell Mel/Autobiographer (superior question design, living legacy)."
              />
            </div>
          </DetailSection>
        </div>

        {/* Footer Note */}
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="pt-6">
            <p className="text-base text-gray-600 text-center">
              <strong>Source:</strong> Market assessment compiled from competitive analysis, customer reviews (2024-2025),
              market research reports, and industry analysis. Last updated November 2025.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper Components
interface DetailSectionProps {
  title: string;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  badge: string;
  badgeColor: string;
  children: React.ReactNode;
}

function DetailSection({ title, icon, expanded, onToggle, badge, badgeColor, children }: DetailSectionProps) {
  const badgeColors = {
    orange: "bg-orange-50 text-orange-700 border-orange-200",
    red: "bg-red-50 text-red-700 border-red-200",
    green: "bg-green-50 text-green-700 border-green-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-200"
  };

  return (
    <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader
        className="cursor-pointer hover:bg-gray-50"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-heritage-brown">{icon}</div>
            <CardTitle className="text-xl">{title}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={badgeColors[badgeColor as keyof typeof badgeColors]}>
              {badge}
            </Badge>
            <ArrowRight className={`w-5 h-5 text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </div>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="pt-4 border-t">
          {children}
        </CardContent>
      )}
    </Card>
  );
}

interface CompetitorCardProps {
  name: string;
  pricing: string;
  features: string[];
  threat: string;
}

function CompetitorCard({ name, pricing, features, threat }: CompetitorCardProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <h4 className="text-lg font-bold">{name}</h4>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          {pricing}
        </Badge>
      </div>
      <ul className="text-base space-y-1 mb-3">
        {features.map((feature, idx) => (
          <li key={idx}>• {feature}</li>
        ))}
      </ul>
      <div className="bg-red-50 border-l-4 border-red-400 pl-3 py-2">
        <p className="text-base text-red-900">
          <strong>Threat:</strong> {threat}
        </p>
      </div>
    </div>
  );
}

interface RecommendationCardProps {
  priority: string;
  title: string;
  description: string;
  color: string;
}

function RecommendationCard({ priority, title, description, color }: RecommendationCardProps) {
  const colors = {
    red: {
      bg: "bg-red-50",
      border: "border-red-200",
      badge: "bg-red-100 text-red-800"
    },
    orange: {
      bg: "bg-orange-50",
      border: "border-orange-200",
      badge: "bg-orange-100 text-orange-800"
    },
    yellow: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      badge: "bg-yellow-100 text-yellow-800"
    }
  };

  const colorScheme = colors[color as keyof typeof colors];

  return (
    <div className={`border ${colorScheme.border} ${colorScheme.bg} rounded-lg p-4`}>
      <div className="flex items-start gap-3">
        <Badge className={colorScheme.badge}>
          {priority}
        </Badge>
        <div>
          <h4 className="text-base font-bold mb-1">{title}</h4>
          <p className="text-base text-gray-700 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}

interface SuccessFactorProps {
  title: string;
  description: string;
}

function SuccessFactor({ title, description }: SuccessFactorProps) {
  return (
    <div className="border-l-4 border-blue-400 pl-4 py-2">
      <h4 className="text-lg font-bold text-blue-900 mb-1">{title}</h4>
      <p className="text-base text-gray-700 leading-relaxed">{description}</p>
    </div>
  );
}
