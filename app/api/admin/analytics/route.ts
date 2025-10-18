import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Admin Analytics API
 *
 * Returns comprehensive metrics for Executive Overview dashboard:
 * - Overall user statistics
 * - Growth trends (last 30 days)
 * - User lifecycle breakdown
 * - Top 10 power users
 * - Engagement metrics
 */

// Initialize Supabase Admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function GET(request: NextRequest) {
  try {
    // Get the Authorization header
    const authHeader = request.headers.get("authorization");
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Verify the JWT token with Supabase
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // TODO: Add admin role check here when RBAC is implemented
    // For now, any authenticated user can access (remove in production)

    // Fetch all metrics in parallel for performance
    const [
      overallStats,
      growthTrends,
      lifecycleBreakdown,
      topUsers,
      engagementMetrics,
    ] = await Promise.all([
      getOverallStats(supabaseAdmin),
      getGrowthTrends(supabaseAdmin),
      getLifecycleBreakdown(supabaseAdmin),
      getTopUsers(supabaseAdmin),
      getEngagementMetrics(supabaseAdmin),
    ]);

    return NextResponse.json({
      overallStats,
      growthTrends,
      lifecycleBreakdown,
      topUsers,
      engagementMetrics,
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error("[Admin Analytics] Error fetching metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

/**
 * Overall Statistics
 * Total users, active users (7d, 30d), paid users
 */
async function getOverallStats(supabase: any) {
  // Query users directly (no RPC needed)
  const { data, error } = await supabase
    .from('users')
    .select('id, created_at, is_paid');

  if (error) {
    console.error("[Admin Analytics] Error fetching users:", error);
    throw error;
  }

  // Get story counts per user
  const { data: storyCounts, error: storyError } = await supabase
    .from('stories')
    .select('user_id');

  if (storyError) {
    console.error("[Admin Analytics] Error fetching story counts:", storyError);
    throw storyError;
  }

  // Count stories per user
  const storyCountByUser: { [key: string]: number } = {};
  storyCounts.forEach((story: any) => {
    storyCountByUser[story.user_id] = (storyCountByUser[story.user_id] || 0) + 1;
  });

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Calculate stats from raw data
  const totalUsers = data.length;
  const newUsersLast7Days = data.filter((u: any) => new Date(u.created_at) >= sevenDaysAgo).length;
  const newUsersLast30Days = data.filter((u: any) => new Date(u.created_at) >= thirtyDaysAgo).length;
  const paidUsers = data.filter((u: any) => u.is_paid).length;
  const usersWithStories = Object.keys(storyCountByUser).length;
  const usersPastPaywall = Object.values(storyCountByUser).filter(count => count >= 3).length;

  return {
    totalUsers,
    newUsersLast7Days,
    newUsersLast30Days,
    paidUsers,
    usersWithStories,
    usersPastPaywall,
  };
}

/**
 * Growth Trends
 * New user signups for last 30 days
 */
async function getGrowthTrends(supabase: any) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data, error } = await supabase
    .from('users')
    .select('created_at')
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    console.error("[Admin Analytics] Error fetching growth trends:", error);
    return [];
  }

  // Group by date
  const signupsByDate: { [key: string]: number } = {};
  data.forEach((user: any) => {
    const date = new Date(user.created_at).toISOString().split('T')[0];
    signupsByDate[date] = (signupsByDate[date] || 0) + 1;
  });

  // Convert to array format
  return Object.entries(signupsByDate).map(([date, count]) => ({
    date,
    newUsers: count,
  }));
}

/**
 * User Lifecycle Breakdown
 * Categorize users by story count: New, Activated, Engaged, Power, Super
 */
async function getLifecycleBreakdown(supabase: any) {
  const { data: users, error } = await supabase
    .from('users')
    .select('id, created_at');

  if (error) {
    console.error("[Admin Analytics] Error fetching users for lifecycle:", error);
    return [];
  }

  // Get story counts per user
  const { data: stories, error: storyError } = await supabase
    .from('stories')
    .select('user_id');

  if (storyError) {
    console.error("[Admin Analytics] Error fetching stories for lifecycle:", storyError);
    return [];
  }

  // Count stories per user
  const storyCountByUser: { [key: string]: number } = {};
  stories.forEach((story: any) => {
    storyCountByUser[story.user_id] = (storyCountByUser[story.user_id] || 0) + 1;
  });

  const stages = {
    'New (0 stories)': { count: 0, storyRange: [0, 0], totalDays: 0 },
    'Activated (1-2 stories)': { count: 0, storyRange: [1, 2], totalDays: 0 },
    'Engaged (3-9 stories)': { count: 0, storyRange: [3, 9], totalDays: 0 },
    'Power User (10-29 stories)': { count: 0, storyRange: [10, 29], totalDays: 0 },
    'Super User (30+ stories)': { count: 0, storyRange: [30, Infinity], totalDays: 0 },
  };

  const now = new Date();
  users.forEach((user: any) => {
    const storyCount = storyCountByUser[user.id] || 0;
    const daysSinceSignup = Math.floor((now.getTime() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24));

    for (const [stageName, stage] of Object.entries(stages)) {
      const [min, max] = stage.storyRange;
      if (storyCount >= min && storyCount <= max) {
        stage.count++;
        stage.totalDays += daysSinceSignup;
        break;
      }
    }
  });

  const totalUsers = users.length || 1; // Avoid division by zero

  return Object.entries(stages).map(([stage, data]) => ({
    stage,
    count: data.count,
    percentage: ((data.count / totalUsers) * 100).toFixed(1),
    avgDaysSinceSignup: data.count > 0 ? (data.totalDays / data.count).toFixed(1) : '0',
  }));
}

/**
 * Top 10 Power Users
 * Ranked by story count with engagement metrics
 */
async function getTopUsers(supabase: any) {
  // Get all users
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, name, email, created_at, is_paid');

  if (usersError) {
    console.error("[Admin Analytics] Error fetching users:", usersError);
    return [];
  }

  // Get all stories to count per user
  const { data: allStories, error: storiesError } = await supabase
    .from('stories')
    .select('user_id, created_at');

  if (storiesError) {
    console.error("[Admin Analytics] Error fetching stories:", storiesError);
    return [];
  }

  // Count stories per user and track last story
  const userStoryData: { [key: string]: { count: number; lastStory: string | null } } = {};
  allStories.forEach((story: any) => {
    if (!userStoryData[story.user_id]) {
      userStoryData[story.user_id] = { count: 0, lastStory: null };
    }
    userStoryData[story.user_id].count++;
    // Track most recent story
    if (!userStoryData[story.user_id].lastStory ||
        new Date(story.created_at) > new Date(userStoryData[story.user_id].lastStory!)) {
      userStoryData[story.user_id].lastStory = story.created_at;
    }
  });

  // Filter users with stories and sort by count
  const usersWithStories = users
    .filter((user: any) => userStoryData[user.id]?.count > 0)
    .map((user: any) => ({
      ...user,
      storyCount: userStoryData[user.id].count,
      lastStoryCreated: userStoryData[user.id].lastStory,
    }))
    .sort((a: any, b: any) => b.storyCount - a.storyCount)
    .slice(0, 10);

  // Enrich with family counts
  const enrichedUsers = await Promise.all(
    usersWithStories.map(async (user: any) => {
      // Get family count
      const { count: familyCount } = await supabase
        .from('family_members')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'active');

      const now = new Date();
      const createdAt = new Date(user.created_at);
      const daysSinceSignup = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      const weeksSinceSignup = daysSinceSignup / 7;
      const avgStoriesPerWeek = weeksSinceSignup > 0 ? (user.storyCount / weeksSinceSignup).toFixed(1) : '0';

      let lastActive = 'Never';
      if (user.lastStoryCreated) {
        const lastStoryDate = new Date(user.lastStoryCreated);
        const hoursSince = Math.floor((now.getTime() - lastStoryDate.getTime()) / (1000 * 60 * 60));

        if (hoursSince < 1) {
          lastActive = 'Just now';
        } else if (hoursSince < 24) {
          lastActive = `${hoursSince}h ago`;
        } else {
          const daysSince = Math.floor(hoursSince / 24);
          lastActive = `${daysSince}d ago`;
        }
      }

      return {
        name: user.name,
        email: user.email,
        storyCount: user.storyCount,
        daysSinceSignup,
        avgStoriesPerWeek,
        lastActive,
        isPaid: user.is_paid,
        familyCount: familyCount || 0,
      };
    })
  );

  return enrichedUsers;
}

/**
 * Overall Engagement Metrics
 * Stories, audio, photos, lessons, etc.
 */
async function getEngagementMetrics(supabase: any) {
  const { data: stories, error } = await supabase
    .from('stories')
    .select('audio_url, metadata, wisdom_text, transcript, duration_seconds');

  if (error) {
    console.error("[Admin Analytics] Error fetching engagement metrics:", error);
    return null;
  }

  const totalStories = stories.length;
  const storiesWithAudio = stories.filter((s: any) => s.audio_url).length;
  const storiesWithPhotos = stories.filter((s: any) => s.metadata?.photos && s.metadata.photos.length > 0).length;
  const storiesWithLessons = stories.filter((s: any) => s.wisdom_text).length;
  const totalWords = stories.reduce((sum: number, s: any) => {
    return sum + (s.transcript ? s.transcript.split(/\s+/).length : 0);
  }, 0);
  const totalDuration = stories.reduce((sum: number, s: any) => sum + (s.duration_seconds || 0), 0);
  const storiesInBook = stories.filter((s: any) => s.metadata?.include_in_book !== false).length;
  const storiesInTimeline = stories.filter((s: any) => s.metadata?.include_in_timeline !== false).length;
  const favoriteStories = stories.filter((s: any) => s.metadata?.is_favorite === true).length;

  return {
    totalStories,
    storiesWithAudio,
    storiesWithPhotos,
    storiesWithLessons,
    avgStoryLength: totalStories > 0 ? Math.round(totalWords / totalStories) : 0,
    avgDuration: totalStories > 0 ? Math.round(totalDuration / totalStories) : 0,
    storiesInBook,
    storiesInTimeline,
    favoriteStories,
    percentWithAudio: totalStories > 0 ? ((storiesWithAudio / totalStories) * 100).toFixed(1) : '0',
    percentWithPhotos: totalStories > 0 ? ((storiesWithPhotos / totalStories) * 100).toFixed(1) : '0',
    percentWithLessons: totalStories > 0 ? ((storiesWithLessons / totalStories) * 100).toFixed(1) : '0',
  };
}
