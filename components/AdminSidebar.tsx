"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  Compass,
  Sparkles,
  MessageSquare,
  Code,
  TestTube2,
  Users,
  Trash2,
  Cloud,
  Zap,
  FileText,
  Mail,
  Database,
  Settings,
  ChevronDown,
  ChevronRight,
  Target,
  Palette,
  Menu,
  X,
  UserPlus,
  ClipboardCheck,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

type UserWithMetadata = {
  email?: string;
  user_metadata?: {
    avatar_url?: string;
    full_name?: string;
  };
};

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Dashboard",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { label: "Beta Codes", href: "/admin/beta", icon: UserPlus },
      { label: "Design Guidelines", href: "/admin/design-guidelines", icon: Palette },
    ],
  },
  {
    title: "Quality Assurance",
    items: [
      { label: "Prompt Quality", href: "/admin/prompts", icon: Sparkles },
      { label: "Prompt Feedback", href: "/admin/prompt-feedback", icon: MessageSquare },
    ],
  },
  {
    title: "Monitoring",
    items: [
      { label: "Pre-Launch Audit", href: "/admin/audit-dashboard", icon: ClipboardCheck },
      { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
      { label: "Market Assessment", href: "/admin/market-assessment", icon: Target },
      { label: "Photo Album Market", href: "/admin/photo-album-market", icon: Target },
      { label: "AI Prompts Inspector", href: "/admin/ai-prompts", icon: Code },
    ],
  },
  {
    title: "Testing",
    items: [
      { label: "Quality Gate Tester", href: "/admin/quality-tester", icon: TestTube2 },
      { label: "Dev Prompts Tester", href: "/dev/prompts", icon: TestTube2 },
      { label: "Test Accounts", href: "/admin/test-accounts", icon: Users },
    ],
  },
  {
    title: "Cleanup",
    items: [
      { label: "Prompt Cleanup", href: "/admin/cleanup", icon: Trash2 },
      { label: "Fix Audio Durations", href: "/admin/fix-durations", icon: Database },
    ],
  },
  {
    title: "Competitors",
    items: [
      { label: "StoryWorth", href: "https://www.storyworth.com", icon: Target },
      { label: "Remento", href: "https://www.remento.co", icon: Target },
      { label: "Tell Mel", href: "https://www.tellmel.com", icon: Target },
      { label: "Autobiographer", href: "https://www.autobiographer.com", icon: Target },
      { label: "Life Story AI", href: "https://www.lifestory.ai", icon: Target },
      { label: "StoryCorps", href: "https://storycorps.org", icon: Target },
    ],
  },
  {
    title: "External Services",
    items: [
      { label: "Supabase", href: "https://supabase.com/dashboard/project/tjycibrhoammxohemyhq", icon: Database },
      { label: "Vercel", href: "https://vercel.com/pauls-projects-667765b0/heritage-whisper-v2", icon: Cloud },
      { label: "AI Gateway", href: "https://vercel.com/pauls-projects-667765b0/heritage-whisper-v2/observability/ai", icon: Zap },
      { label: "PDFShift", href: "https://app.pdfshift.io/env/", icon: FileText },
      { label: "Resend", href: "https://resend.com/emails", icon: Mail },
      { label: "AssemblyAI", href: "https://www.assemblyai.com/app", icon: BarChart3 },
      { label: "OpenAI", href: "https://platform.openai.com/usage", icon: Zap },
      { label: "Upstash Redis", href: "https://console.upstash.com/", icon: Settings },
      { label: "Stripe", href: "https://dashboard.stripe.com/test/dashboard", icon: Settings },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [externalServicesOpen, setExternalServicesOpen] = useState(false);
  const [competitorsOpen, setCompetitorsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname?.startsWith(href);
  };

  const getInitials = (email?: string) => {
    if (!email) return "U";
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg border border-gray-200"
        aria-label="Toggle menu"
      >
        {mobileMenuOpen ? (
          <X className="w-6 h-6 text-gray-700" />
        ) : (
          <Menu className="w-6 h-6 text-gray-700" />
        )}
      </button>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col overflow-y-auto z-40
        transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:flex
      `}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-2">
          <Avatar className="h-12 w-12">
            <AvatarImage src={(user as Partial<UserWithMetadata>)?.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-heritage-coral text-white">
              {getInitials(user?.email)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {(user as Partial<UserWithMetadata>)?.user_metadata?.full_name || user?.email?.split("@")[0]}
            </p>
            <p className="text-xs text-gray-500">Admin</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-6">
        {NAV_SECTIONS.map((section) => {
          const isExternalServices = section.title === "External Services";
          const isCompetitors = section.title === "Competitors";
          const isCollapsible = isExternalServices || isCompetitors;

          return (
            <div key={section.title}>
              {isCollapsible ? (
                <button
                  onClick={() => {
                    if (isExternalServices) {
                      setExternalServicesOpen(!externalServicesOpen);
                    } else if (isCompetitors) {
                      setCompetitorsOpen(!competitorsOpen);
                    }
                  }}
                  className="w-full flex items-center justify-between px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
                >
                  <span>{section.title}</span>
                  {(isExternalServices && externalServicesOpen) || (isCompetitors && competitorsOpen) ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              ) : (
                <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {section.title}
                </h3>
              )}

              {((!isExternalServices && !isCompetitors) ||
                (isExternalServices && externalServicesOpen) ||
                (isCompetitors && competitorsOpen)) && (
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    const isExternal = item.href.startsWith("http") || item.href.startsWith("file://");

                    const linkClasses = `
                      flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      ${
                        active
                          ? "bg-heritage-coral/10 text-heritage-coral"
                          : "text-gray-700 hover:bg-gray-100"
                      }
                    `;

                    if (isExternal) {
                      return (
                        <a
                          key={item.href}
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={linkClasses}
                        >
                          <Icon className="w-5 h-5 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </a>
                      );
                    }

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={linkClasses}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Icon className="w-5 h-5 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          onClick={() => setMobileMenuOpen(false)}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to App
        </Link>
      </div>
    </div>
    </>
  );
}
