import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

/**
 * Admin Analytics API
 *
 * Returns comprehensive metrics for Executive Overview dashboard.
 * Uses PostgreSQL RPC functions for aggregations (no client-side processing).
 *
 * Performance: ~5 queries vs previous ~100k+ row fetches
 */

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
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Add admin role check here when RBAC is implemented
    // For now, any authenticated user can access (remove in production)

    // Fetch all metrics in parallel using RPC functions
    // Each function does aggregations in PostgreSQL, not in JS
    const [
      overallStatsResult,
      growthTrendsResult,
      lifecycleBreakdownResult,
      topUsersResult,
      engagementMetricsResult,
    ] = await Promise.all([
      supabaseAdmin.rpc("get_admin_overall_stats"),
      supabaseAdmin.rpc("get_admin_growth_trends"),
      supabaseAdmin.rpc("get_admin_lifecycle_breakdown"),
      supabaseAdmin.rpc("get_admin_top_users"),
      supabaseAdmin.rpc("get_admin_engagement_metrics"),
    ]);

    // Check for errors
    if (overallStatsResult.error) {
      logger.error("[Admin Analytics] Overall stats error:", overallStatsResult.error);
      throw overallStatsResult.error;
    }
    if (growthTrendsResult.error) {
      logger.error("[Admin Analytics] Growth trends error:", growthTrendsResult.error);
      throw growthTrendsResult.error;
    }
    if (lifecycleBreakdownResult.error) {
      logger.error("[Admin Analytics] Lifecycle error:", lifecycleBreakdownResult.error);
      throw lifecycleBreakdownResult.error;
    }
    if (topUsersResult.error) {
      logger.error("[Admin Analytics] Top users error:", topUsersResult.error);
      throw topUsersResult.error;
    }
    if (engagementMetricsResult.error) {
      logger.error("[Admin Analytics] Engagement error:", engagementMetricsResult.error);
      throw engagementMetricsResult.error;
    }

    return NextResponse.json({
      overallStats: overallStatsResult.data,
      growthTrends: growthTrendsResult.data || [],
      lifecycleBreakdown: lifecycleBreakdownResult.data || [],
      topUsers: topUsersResult.data || [],
      engagementMetrics: engagementMetricsResult.data,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("[Admin Analytics] Error fetching metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
