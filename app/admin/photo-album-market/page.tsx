"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PhotoAlbumMarketPage() {
  // Smooth scroll handler
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="hw-page bg-[#FCFCF9]">
      {/* Back Link */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin Dashboard
          </Link>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sticky top-[57px] bg-[#FFFFFE] border-b border-[rgba(94,82,64,0.2)] z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-wrap gap-4 justify-center text-sm font-medium">
            {[
              { id: "executive-summary", label: "Executive Summary" },
              { id: "quick-stats", label: "Quick Stats" },
              { id: "market-size", label: "Market Size" },
              { id: "demographics", label: "Demographics" },
              { id: "urgency", label: "Market Urgency" },
              { id: "opportunity", label: "TAM/SAM/SOM" },
              { id: "insights", label: "Strategic Insights" },
              { id: "competitive", label: "Competitive Landscape" },
            ].map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className="text-gray-600 hover:text-[#21808D] transition-colors"
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-800 via-cyan-600 to-green-600 text-white py-16 px-6 text-center">
        <h1 className="text-5xl font-bold mb-4 tracking-tight">
          Physical Photo Album Market Analysis
        </h1>
        <p className="text-2xl mb-3 opacity-95">
          Senior Market Opportunity for Legacy Preservation & Digitization Services
        </p>
        <p className="text-lg opacity-80">November 2025</p>
      </section>

      {/* Executive Summary */}
      <section id="executive-summary" className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8 text-[#13343B]">
            Executive Summary
          </h2>
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-8 text-lg leading-relaxed text-[#13343B]">
              <p>
                The physical photo album digitization market represents a massive opportunity, with{" "}
                <strong>29.2 million senior households</strong> owning an estimated{" "}
                <strong>234 million photo albums</strong> containing{" "}
                <strong>35.1 billion photos</strong>. With 11,000 Americans turning 65 daily through
                2027 and 85% of physical photos remaining undigitized, the urgency to preserve these
                irreplaceable memories has never been greater. The serviceable available market (SAM)
                represents <strong>$8.77 billion in revenue potential</strong>, with AI-powered
                solutions positioned to capture premium pricing while delivering scalable efficiency in
                a market currently dominated by either low-cost commodity scanning or expensive manual
                services.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Quick Stats */}
      <section id="quick-stats" className="py-16 px-6 bg-[#FFFFFE]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8 text-[#13343B]">
            Quick Hit Data Points
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: "🏠", number: "114M", label: "US households with photo albums" },
              { icon: "📚", number: "629M", label: "Total photo albums in USA" },
              { icon: "👥", number: "29.2M", label: "Senior households with albums" },
              { icon: "👴", number: "61.2M", label: "Americans age 65+" },
              { icon: "📅", number: "11,000", label: "Turn 65 daily through 2027" },
              {
                icon: "⏰",
                number: "86%",
                label: "Haven't looked at albums in 19+ months",
              },
              { icon: "💰", number: "$8.77B", label: "SAM revenue potential" },
              { icon: "📸", number: "35.1B", label: "Photos in senior households" },
            ].map((stat, i) => (
              <Card
                key={i}
                className="text-center shadow-sm hover:shadow-md hover:-translate-y-1 transition-all"
              >
                <CardContent className="pt-8 pb-6">
                  <div className="text-4xl mb-4">{stat.icon}</div>
                  <div className="text-3xl font-bold text-[#21808D] mb-2">{stat.number}</div>
                  <div className="text-sm text-gray-600 leading-snug">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Market Size */}
      <section id="market-size" className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8 text-[#13343B]">
            Market Size & Penetration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DataCard
              title="Total US Market"
              items={[
                { label: "Total Households", value: "133M" },
                { label: "Households with Albums", value: "114.4M" },
                { label: "Market Penetration", value: "86%" },
              ]}
            />
            <DataCard
              title="Album Distribution"
              items={[
                { label: "Total Photo Albums", value: "629M" },
                { label: "Avg Albums/Household", value: "5.5" },
                { label: "Senior Albums", value: "234M" },
              ]}
            />
            <DataCard
              title="Market Characteristics"
              items={[
                { label: "Physical Photos Undigitized", value: "85%" },
                { label: "Photos in Print Today", value: "3%" },
                { label: "Not Viewed (19+ months)", value: "86%" },
              ]}
            />
          </div>
        </div>
      </section>

      {/* Demographics */}
      <section id="demographics" className="py-16 px-6 bg-[#FFFFFE]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8 text-[#13343B]">
            Target Market: Senior Demographics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DataCard
              title="Population"
              items={[
                { label: "Americans 65+", value: "61.2M" },
                { label: "% of US Population", value: "18%" },
                { label: "Baby Boomers", value: "73M" },
              ]}
            />
            <DataCard
              title="Households"
              items={[
                { label: "Total Senior Households", value: "34M" },
                { label: "With Photo Albums", value: "29.2M" },
                { label: "Avg Albums/Household", value: "8" },
              ]}
            />
            <DataCard
              title="Photo Inventory"
              items={[
                { label: "Total Photos (Senior HH)", value: "35.1B" },
                { label: "Undigitized Photos", value: "29.8B" },
                { label: "Albums to Digitize", value: "234M" },
              ]}
            />
          </div>
        </div>
      </section>

      {/* Market Urgency */}
      <section id="urgency" className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8 text-[#13343B]">
            Why Now? Market Urgency Factors
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5">
            {[
              { number: "11,000", label: "Americans turn 65 EVERY DAY through 2027" },
              { number: "86%", label: "Have albums not viewed in 19+ months" },
              { number: "47%", label: "Permanently lost photos due to device failure" },
              { number: "85%", label: "Of physical photos remain undigitized" },
              { number: "3%", label: "Of photos today are in printed form" },
            ].map((item, i) => (
              <Card
                key={i}
                className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 text-center shadow-sm"
              >
                <CardContent className="pt-6 pb-5">
                  <div className="text-3xl font-bold text-red-600 mb-2">{item.number}</div>
                  <div className="text-xs text-gray-800 leading-snug">{item.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* TAM/SAM/SOM */}
      <section id="opportunity" className="py-16 px-6 bg-[#FFFFFE]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8 text-[#13343B]">
            Market Opportunity Analysis
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <OpportunityCard
              title="TAM"
              subtitle="Total Addressable Market"
              metrics={[
                { value: "29.2M", label: "Senior households with albums" },
                { value: "234M", label: "Photo albums to digitize" },
              ]}
              description="All senior households (65+) with photo albums"
            />
            <OpportunityCard
              title="SAM"
              subtitle="Serviceable Available Market"
              metrics={[
                { value: "7.3M", label: "Households (25% penetration)" },
                { value: "$8.77B", label: "Revenue potential at $1,200/HH" },
              ]}
              description="Households likely to consider premium digitization service"
            />
            <OpportunityCard
              title="SOM"
              subtitle="Serviceable Obtainable Market"
              metrics={[
                { value: "292K HH", label: "1% capture: $351M revenue" },
                { value: "585K HH", label: "2% capture: $702M revenue" },
              ]}
              description="Realistic market capture in 3-5 years"
            />
          </div>
        </div>
      </section>

      {/* Market Growth */}
      <section id="market-growth" className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8 text-[#13343B]">
            Photo Digitization Market Size
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DataCard
              title="Global Market (2024)"
              items={[
                { label: "Total Market Size", value: "$2.6B" },
                { label: "Projected 2032", value: "$5.3B" },
                { label: "CAGR (2026-2032)", value: "9.3%" },
              ]}
            />
            <DataCard
              title="US Market (2025)"
              items={[
                { label: "Total Market Size", value: "$910M" },
                { label: "% of Global Market", value: "35%" },
                { label: "Growth Trend", value: "Strong" },
              ]}
            />
            <DataCard
              title="Market Dynamics"
              items={[
                { label: "Primary Driver", value: "Senior demand" },
                { label: "Technology Trend", value: "AI adoption" },
                { label: "Market Maturity", value: "Growth phase" },
              ]}
            />
          </div>
        </div>
      </section>

      {/* Strategic Insights */}
      <section id="insights" className="py-16 px-6 bg-[#FFFFFE]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8 text-[#13343B]">
            Strategic Insights & Buying Triggers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <InsightCard
              title="Generational Divide"
              items={[
                "Seniors 55+: 8 albums average",
                "Adults 24-34: 4 albums average",
                "Older generations have 2x the photo volume",
                "Greater attachment to physical memories",
              ]}
            />
            <InsightCard
              title="Baby Boomer Wealth"
              items={[
                "$80+ trillion in total assets",
                "50% of US household wealth",
                "High discretionary spending power",
                "Willing to pay premium for quality",
              ]}
            />
            <InsightCard
              title="Primary Buying Triggers"
              items={[
                "50%: Downsizing or moving",
                "45%: Grandchildren asking about history",
                "35%: Death of parent/family member",
                "30%: Major milestone birthdays",
              ]}
            />
            <InsightCard
              title="Decision Influencers"
              items={[
                "Adult children (40-55) often initiate",
                "Multi-generational decision process",
                "Children frequently fund the service",
                "Gift potential for holidays & occasions",
              ]}
            />
            <InsightCard
              title="Service Demand"
              items={[
                "45 hours estimated time needed",
                "47% of families behind on organizing",
                "Overwhelming task for most families",
                "High willingness to outsource",
              ]}
            />
            <InsightCard
              title="Physical Degradation"
              items={[
                "Photos fade and degrade over time",
                "Environmental factors accelerate decay",
                "Irreplaceable memories at risk",
                "Creates emotional urgency to act",
              ]}
            />
          </div>
        </div>
      </section>

      {/* Competitive Landscape */}
      <section id="competitive" className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8 text-[#13343B]">
            Market Positioning & White Space
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TierCard
              title="Low-End Commodity"
              price="$0.25-0.50 per photo"
              examples="ScanMyPhotos, ScanCafe, Costco/CVS"
              description="Basic scanning services with no organization or storytelling. High volume, low touch, commodity pricing model."
              highlight={false}
            />
            <TierCard
              title="Premium Full-Service"
              price="$1,500-5,000+ per project"
              examples="Legacy Republic, EverPresent, local organizers"
              description="Professional scanning with manual organization and photo book creation. Labor-intensive, premium pricing, limited scalability."
              highlight={false}
            />
            <TierCard
              title="AI-Powered Premium (White Space)"
              price="$1,200-2,000 per household"
              examples="HeritageWhisper/StoriedLife AI"
              description="AI storytelling with automated organization and multiple output formats. Premium experience with tech efficiency. Scalable model capturing underserved middle market."
              highlight={true}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#FFFFFE] border-t border-[rgba(94,82,64,0.2)] py-8 px-6 text-center text-sm text-gray-600">
        <div className="max-w-7xl mx-auto">
          <p className="font-semibold text-gray-900 mb-2">Market Research Analysis</p>
          <p>Generated November 2025</p>
          <p className="mt-2">
            Estimates based on US Census data, industry reports, and market research. Actual market
            performance may vary.
          </p>
        </div>
      </footer>
    </div>
  );
}

// Helper Components

function DataCard({ title, items }: { title: string; items: { label: string; value: string }[] }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl text-[#13343B]">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex justify-between items-center py-3 border-b last:border-b-0"
          >
            <span className="text-gray-600 text-sm">{item.label}</span>
            <span className="font-semibold text-[#13343B]">{item.value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function OpportunityCard({
  title,
  subtitle,
  metrics,
  description,
}: {
  title: string;
  subtitle: string;
  metrics: { value: string; label: string }[];
  description: string;
}) {
  return (
    <Card className="border-2 border-[#21808D] shadow-md">
      <CardContent className="pt-8">
        <h3 className="text-2xl font-bold text-[#21808D] mb-2">{title}</h3>
        <p className="text-xs text-gray-600 mb-6">{subtitle}</p>
        {metrics.map((metric, i) => (
          <div key={i} className="mb-4">
            <div className="text-3xl font-bold text-[#13343B]">{metric.value}</div>
            <div className="text-xs text-gray-600">{metric.label}</div>
          </div>
        ))}
        <p className="text-sm text-gray-600 mt-4">{description}</p>
      </CardContent>
    </Card>
  );
}

function InsightCard({ title, items }: { title: string; items: string[] }) {
  return (
    <Card className="bg-blue-50/50 shadow-sm">
      <CardContent className="pt-6">
        <h3 className="text-xl font-semibold mb-4 text-[#13343B]">{title}</h3>
        <ul className="space-y-2">
          {items.map((item, i) => {
            // Split on first colon to bold the prefix
            const colonIndex = item.indexOf(":");
            const hasBoldPrefix = colonIndex !== -1 && colonIndex < 20;

            return (
              <li key={i} className="text-sm text-gray-800">
                {hasBoldPrefix ? (
                  <>
                    <strong className="text-[#21808D]">{item.slice(0, colonIndex + 1)}</strong>
                    {item.slice(colonIndex + 1)}
                  </>
                ) : (
                  item
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

function TierCard({
  title,
  price,
  examples,
  description,
  highlight,
}: {
  title: string;
  price: string;
  examples: string;
  description: string;
  highlight: boolean;
}) {
  return (
    <Card className={highlight ? "bg-green-50/50 border-2 border-[#21808D] shadow-md" : "shadow-sm"}>
      <CardContent className="pt-6">
        <h3 className="text-xl font-semibold mb-2 text-[#13343B]">{title}</h3>
        <p className="text-xl font-bold text-[#21808D] mb-4">{price}</p>
        <p className="text-xs text-gray-600 mb-3 italic">{examples}</p>
        <p className="text-sm text-gray-800 leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}
