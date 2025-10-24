// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Users,
  TrendingUp,
  Award,
  BookOpen,
  Heart,
  Mic,
  Image as ImageIcon,
  Lightbulb,
  ArrowUp,
  ArrowDown,
  Trophy,
  Crown,
  Medal,
} from "lucide-react";
import Link from "next/link";

interface AnalyticsData {
  overallStats: {
    totalUsers: number;
    newUsersLast7Days: number;
    newUsersLast30Days: number;
    paidUsers: number;
    usersWithStories: number;
    usersPastPaywall: number;
  };
  growthTrends: Array<{
    date: string;
    newUsers: number;
  }>;
  lifecycleBreakdown: Array<{
    stage: string;
    count: number;
    percentage: string;
    avgDaysSinceSignup: string;
  }>;
  topUsers: Array<{
    name: string;
    email: string;
    storyCount: number;
    daysSinceSignup: number;
    avgStoriesPerWeek: string;
    lastActive: string;
    isPaid: boolean;
    familyCount: number;
  }>;
  engagementMetrics: {
    totalStories: number;
    storiesWithAudio: number;
    storiesWithPhotos: number;
    storiesWithLessons: number;
    avgStoryLength: number;
    avgDuration: number;
    storiesInBook: number;
    storiesInTimeline: number;
    favoriteStories: number;
    percentWithAudio: string;
    percentWithPhotos: string;
    percentWithLessons: string;
  };
  generatedAt: string;
}

export default function AdminAnalyticsPage() {
  const { user, session } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        if (!session?.access_token) {
          throw new Error('No authentication token available');
        }

        const response = await fetch('/api/admin/analytics', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch analytics');
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('[Admin Analytics] Error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    if (user && session) {
      fetchAnalytics();
    }
  }, [user, session]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#FFF8F3]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Please sign in to access analytics</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#FFF8F3]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-heritage-brown mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#FFF8F3]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{error || 'Failed to load analytics'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { overallStats, lifecycleBreakdown, topUsers, engagementMetrics } = data;

  return (
    <div className="min-h-screen bg-[#FFF8F3] py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-serif font-bold text-heritage-brown">
              Analytics Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Executive overview and key performance metrics
            </p>
          </div>
          <Link
            href="/admin"
            className="text-heritage-brown hover:underline flex items-center gap-2"
          >
            ← Back to Admin
          </Link>
        </div>

        {/* Key Metrics - Top Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Users"
            value={overallStats.totalUsers}
            icon={<Users className="w-6 h-6" />}
            color="bg-blue-100 text-blue-600"
            subtitle={`${overallStats.newUsersLast7Days} new (7d)`}
          />
          <MetricCard
            title="Users with Stories"
            value={overallStats.usersWithStories}
            icon={<BookOpen className="w-6 h-6" />}
            color="bg-purple-100 text-purple-600"
            subtitle={`${((overallStats.usersWithStories / overallStats.totalUsers) * 100).toFixed(0)}% activated`}
          />
          <MetricCard
            title="Past Paywall"
            value={overallStats.usersPastPaywall}
            icon={<Award className="w-6 h-6" />}
            color="bg-amber-100 text-amber-600"
            subtitle={`Story 3+ conversion`}
          />
          <MetricCard
            title="Paid Users"
            value={overallStats.paidUsers}
            icon={<TrendingUp className="w-6 h-6" />}
            color="bg-green-100 text-green-600"
            subtitle={`${((overallStats.paidUsers / overallStats.totalUsers) * 100).toFixed(1)}% conversion`}
          />
        </div>

        {/* User Lifecycle Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              User Lifecycle Breakdown
            </CardTitle>
            <CardDescription>
              Users categorized by story count and engagement level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lifecycleBreakdown.map((stage, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{stage.stage}</span>
                    <span className="text-sm text-gray-600">
                      {stage.count} users ({stage.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-heritage-brown h-2.5 rounded-full transition-all"
                      style={{ width: `${stage.percentage}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Avg {stage.avgDaysSinceSignup} days since signup
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top 10 Power Users Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Top 10 Power Users
            </CardTitle>
            <CardDescription>
              Most engaged users ranked by story count
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    <th className="pb-3 pr-4 font-semibold text-gray-900">Rank</th>
                    <th className="pb-3 pr-4 font-semibold text-gray-900">User</th>
                    <th className="pb-3 pr-4 font-semibold text-gray-900 text-right">Stories</th>
                    <th className="pb-3 pr-4 font-semibold text-gray-900 text-right">Stories/Week</th>
                    <th className="pb-3 pr-4 font-semibold text-gray-900 text-right">Days Active</th>
                    <th className="pb-3 pr-4 font-semibold text-gray-900">Last Active</th>
                    <th className="pb-3 pr-4 font-semibold text-gray-900 text-center">Family</th>
                    <th className="pb-3 font-semibold text-gray-900 text-center">Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {topUsers.map((user, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          {index === 0 && <Crown className="w-5 h-5 text-amber-500" />}
                          {index === 1 && <Medal className="w-5 h-5 text-gray-400" />}
                          {index === 2 && <Medal className="w-5 h-5 text-amber-700" />}
                          <span className="font-medium text-gray-900">{index + 1}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <div>
                          <div className="font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{maskEmail(user.email)}</div>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-right">
                        <span className="font-semibold text-heritage-brown">
                          {user.storyCount}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-right">
                        <span className="text-gray-900">{user.avgStoriesPerWeek}</span>
                      </td>
                      <td className="py-3 pr-4 text-right">
                        <span className="text-gray-600">{user.daysSinceSignup}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-sm text-gray-600">{user.lastActive}</span>
                      </td>
                      <td className="py-3 pr-4 text-center">
                        <span className="text-gray-900">{user.familyCount}</span>
                      </td>
                      <td className="py-3 text-center">
                        {user.isPaid ? (
                          <span className="text-green-600 font-semibold">✓</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Engagement Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Content Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <MetricRow
                label="Total Stories"
                value={engagementMetrics.totalStories}
              />
              <MetricRow
                label="Stories with Audio"
                value={`${engagementMetrics.storiesWithAudio} (${engagementMetrics.percentWithAudio}%)`}
                icon={<Mic className="w-4 h-4 text-blue-600" />}
              />
              <MetricRow
                label="Stories with Photos"
                value={`${engagementMetrics.storiesWithPhotos} (${engagementMetrics.percentWithPhotos}%)`}
                icon={<ImageIcon className="w-4 h-4 text-purple-600" />}
              />
              <MetricRow
                label="Stories with Lessons"
                value={`${engagementMetrics.storiesWithLessons} (${engagementMetrics.percentWithLessons}%)`}
                icon={<Lightbulb className="w-4 h-4 text-amber-600" />}
              />
              <MetricRow
                label="Favorited Stories"
                value={`${engagementMetrics.favoriteStories}`}
                icon={<Heart className="w-4 h-4 text-red-600" />}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Quality Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <MetricRow
                label="Avg Story Length"
                value={`${engagementMetrics.avgStoryLength} words`}
              />
              <MetricRow
                label="Avg Recording Duration"
                value={`${Math.floor(engagementMetrics.avgDuration / 60)}:${String(engagementMetrics.avgDuration % 60).padStart(2, '0')}`}
              />
              <MetricRow
                label="Included in Book"
                value={`${engagementMetrics.storiesInBook} (${((engagementMetrics.storiesInBook / engagementMetrics.totalStories) * 100).toFixed(0)}%)`}
              />
              <MetricRow
                label="Included in Timeline"
                value={`${engagementMetrics.storiesInTimeline} (${((engagementMetrics.storiesInTimeline / engagementMetrics.totalStories) * 100).toFixed(0)}%)`}
              />
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          Last updated: {new Date(data.generatedAt).toLocaleString()}
        </div>
      </div>
    </div>
  );
}

// Helper Components
function MetricCard({
  title,
  value,
  icon,
  color,
  subtitle,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg ${color}`}>
            {icon}
          </div>
          <div className="flex-1">
            <div className="text-2xl font-bold text-gray-900">
              {value.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">{title}</div>
            {subtitle && (
              <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-gray-700">{label}</span>
      </div>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
}

// Helper function to mask email addresses for privacy
function maskEmail(email: string): string {
  const [username, domain] = email.split('@');
  if (username.length <= 2) {
    return `${username[0]}***@${domain}`;
  }
  return `${username[0]}***${username[username.length - 1]}@${domain}`;
}
