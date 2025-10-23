"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  BarChart3,
  CheckCircle2,
  TestTube2,
  Trash2,
  Shield,
  Sparkles,
  Users,
  Database,
  Compass,
  ExternalLink,
  Cloud,
  Mail,
  FileText,
  Zap,
  Settings,
  MessageSquare
} from "lucide-react";

interface AdminTool {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  category: "quality" | "monitoring" | "testing" | "cleanup";
  color: string;
}

const ADMIN_TOOLS: AdminTool[] = [
  {
    title: "Analytics Dashboard",
    description: "Executive overview with user growth, engagement metrics, and top 10 power users leaderboard",
    href: "/admin/analytics",
    icon: <BarChart3 className="w-6 h-6" />,
    category: "monitoring",
    color: "text-green-600 bg-green-50",
  },
  {
    title: "North Star Dashboard",
    description: "Strategic positioning, messaging framework, competitive advantages, and product roadmap",
    href: "/admin/north-star",
    icon: <Compass className="w-6 h-6" />,
    category: "monitoring",
    color: "text-orange-600 bg-orange-50",
  },
  {
    title: "Prompt Quality Dashboard",
    description: "View all prompts with quality scores, validation details, and rejection reasons",
    href: "/admin/prompts",
    icon: <Sparkles className="w-6 h-6" />,
    category: "quality",
    color: "text-purple-600 bg-purple-50",
  },
  {
    title: "Prompt Feedback & Testing",
    description: "Review and rate AI prompts. Manual Tier 3 trigger for milestone testing.",
    href: "/admin/prompt-feedback",
    icon: <MessageSquare className="w-6 h-6" />,
    category: "quality",
    color: "text-amber-600 bg-amber-50",
  },
  {
    title: "Quality Gate Tester",
    description: "Test individual prompts through quality gates and see detailed validation results",
    href: "/admin/quality-tester",
    icon: <TestTube2 className="w-6 h-6" />,
    category: "testing",
    color: "text-blue-600 bg-blue-50",
  },
  {
    title: "Dev Prompts Tester",
    description: "Test Tier 3 prompt generation with existing stories (dry-run mode)",
    href: "/dev/prompts",
    icon: <TestTube2 className="w-6 h-6" />,
    category: "testing",
    color: "text-cyan-600 bg-cyan-50",
  },
  {
    title: "Test Accounts",
    description: "Clone accounts and test at different milestones (Story 1, 3, 10, etc.) without adding real stories",
    href: "/admin/test-accounts",
    icon: <Users className="w-6 h-6" />,
    category: "testing",
    color: "text-indigo-600 bg-indigo-50",
  },
  {
    title: "Prompt Cleanup",
    description: "Remove low-quality or broken prompts from the database",
    href: "/admin/cleanup",
    icon: <Trash2 className="w-6 h-6" />,
    category: "cleanup",
    color: "text-red-600 bg-red-50",
  },
];

const CATEGORIES = [
  { key: "quality", label: "Quality Assurance", icon: <Shield className="w-5 h-5" /> },
  { key: "testing", label: "Testing Tools", icon: <TestTube2 className="w-5 h-5" /> },
  { key: "monitoring", label: "Monitoring", icon: <BarChart3 className="w-5 h-5" /> },
  { key: "cleanup", label: "Cleanup Tools", icon: <Trash2 className="w-5 h-5" /> },
];

export default function AdminHomePage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#FFF8F3]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Please sign in to access admin tools</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8F3] py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-serif font-bold text-heritage-brown">
            Admin Tools
          </h1>
          <p className="text-lg text-gray-600">
            Monitor, debug, and improve the Heritage Whisper AI system
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    V2
                  </div>
                  <div className="text-sm text-gray-600">Intimacy Engine</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    4
                  </div>
                  <div className="text-sm text-gray-600">Intimacy Types</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    0%
                  </div>
                  <div className="text-sm text-gray-600">Generic Nouns</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-100 rounded-lg">
                  <Database className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    30w
                  </div>
                  <div className="text-sm text-gray-600">Max Length</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tools by Category */}
        {CATEGORIES.map((category) => {
          const tools = ADMIN_TOOLS.filter((tool) => tool.category === category.key);
          if (tools.length === 0) return null;

          return (
            <div key={category.key} className="space-y-4">
              <div className="flex items-center gap-2">
                {category.icon}
                <h2 className="text-xl font-semibold text-gray-900">
                  {category.label}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tools.map((tool) => (
                  <Link key={tool.href} href={tool.href}>
                    <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                      <CardHeader>
                        <div className="flex items-start gap-3">
                          <div className={`p-3 rounded-lg ${tool.color}`}>
                            {tool.icon}
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-lg mb-1">
                              {tool.title}
                            </CardTitle>
                            <CardDescription>
                              {tool.description}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}

        {/* System Info */}
        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Prompt Quality System</span>
              <span className="font-medium text-green-600">V2 Active</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Quality Gate Version</span>
              <span className="font-medium">2024-10-13</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Tier-1 Engine</span>
              <span className="font-medium">V2 Relationship-First</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Tier-3 Engine</span>
              <span className="font-medium">V2 Intimacy Types</span>
            </div>
          </CardContent>
        </Card>

        {/* External Services */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5" />
            <h2 className="text-xl font-semibold text-gray-900">
              External Services
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="https://supabase.com/dashboard/project/tjycibrhoammxohemyhq"
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="p-3 rounded-lg bg-green-100 text-green-600">
                      <Database className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 flex items-center gap-2">
                        Supabase
                        <ExternalLink className="w-4 h-4" />
                      </div>
                      <div className="text-sm text-gray-600">
                        Database, Auth & Storage
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </a>

            <a
              href="https://vercel.com/paul-heritagewhisper"
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="p-3 rounded-lg bg-gray-100 text-gray-900">
                      <Cloud className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 flex items-center gap-2">
                        Vercel
                        <ExternalLink className="w-4 h-4" />
                      </div>
                      <div className="text-sm text-gray-600">
                        Hosting & Deployments
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </a>

            <a
              href="https://vercel.com/dashboard/ai-gateway"
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 flex items-center gap-2">
                        AI Gateway
                        <ExternalLink className="w-4 h-4" />
                      </div>
                      <div className="text-sm text-gray-600">
                        AI Observability
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </a>

            <a
              href="https://pdfshift.io/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="p-3 rounded-lg bg-red-100 text-red-600">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 flex items-center gap-2">
                        PDFShift
                        <ExternalLink className="w-4 h-4" />
                      </div>
                      <div className="text-sm text-gray-600">
                        PDF Generation
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </a>

            <a
              href="https://resend.com/emails"
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 flex items-center gap-2">
                        Resend
                        <ExternalLink className="w-4 h-4" />
                      </div>
                      <div className="text-sm text-gray-600">
                        Email Delivery
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </a>

            <a
              href="https://www.assemblyai.com/app"
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="p-3 rounded-lg bg-violet-100 text-violet-600">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 flex items-center gap-2">
                        AssemblyAI
                        <ExternalLink className="w-4 h-4" />
                      </div>
                      <div className="text-sm text-gray-600">
                        Audio Transcription
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </a>

            <a
              href="https://platform.openai.com/usage"
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="p-3 rounded-lg bg-teal-100 text-teal-600">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 flex items-center gap-2">
                        OpenAI
                        <ExternalLink className="w-4 h-4" />
                      </div>
                      <div className="text-sm text-gray-600">
                        GPT Models & Whisper
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </a>

            <a
              href="https://console.upstash.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="p-3 rounded-lg bg-lime-100 text-lime-700">
                      <Settings className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 flex items-center gap-2">
                        Upstash Redis
                        <ExternalLink className="w-4 h-4" />
                      </div>
                      <div className="text-sm text-gray-600">
                        Rate Limiting
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </a>

            <a
              href="https://dashboard.stripe.com/test/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="p-3 rounded-lg bg-indigo-100 text-indigo-600">
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 flex items-center gap-2">
                        Stripe
                        <ExternalLink className="w-4 h-4" />
                      </div>
                      <div className="text-sm text-gray-600">
                        Payment Processing
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </a>
          </div>
        </div>

        {/* Documentation Links */}
        <Card>
          <CardHeader>
            <CardTitle>Documentation & Resources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <a
              href="file:///Users/paul/Development/HW%20Strategic%20Dashboard/HeritageWhisper-Strategic-Dashboard-Unified.html"
              target="_blank"
              className="block p-3 hover:bg-gray-50 rounded-lg transition-colors border-2 border-blue-200 bg-blue-50"
            >
              <div className="font-medium text-gray-900 flex items-center gap-2">
                <Compass className="w-5 h-5 text-blue-600" />
                Strategic Dashboard (Local)
              </div>
              <div className="text-sm text-gray-600">
                Business strategy, positioning & roadmap
              </div>
            </a>
            <a
              href="/PROMPT_INTIMACY_ENGINE.md"
              target="_blank"
              className="block p-3 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div className="font-medium text-gray-900">Prompt Intimacy Engine</div>
              <div className="text-sm text-gray-600">
                Complete technical documentation for the V2 system
              </div>
            </a>
            <a
              href="/READY_FOR_REVIEW.md"
              target="_blank"
              className="block p-3 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div className="font-medium text-gray-900">Implementation Summary</div>
              <div className="text-sm text-gray-600">
                Executive summary and quick test commands
              </div>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
