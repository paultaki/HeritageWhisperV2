-- Migration: Create admin analytics RPC functions
-- Purpose: Move analytics aggregations to database for performance
-- Before: Fetching ALL users + ALL stories into memory (~100k+ rows)
-- After: Single SQL query with aggregations

-- Function 1: Overall Stats
-- Returns user counts, growth metrics, story stats
CREATE OR REPLACE FUNCTION get_admin_overall_stats()
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH user_stats AS (
    SELECT
      COUNT(*) as total_users,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as new_users_7d,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as new_users_30d,
      COUNT(*) FILTER (WHERE is_paid = true) as paid_users
    FROM users
  ),
  story_counts AS (
    SELECT
      user_id,
      COUNT(*) as story_count
    FROM stories
    GROUP BY user_id
  ),
  story_stats AS (
    SELECT
      COUNT(DISTINCT user_id) as users_with_stories,
      COUNT(*) FILTER (WHERE story_count >= 3) as users_past_paywall
    FROM story_counts
  )
  SELECT json_build_object(
    'totalUsers', (SELECT total_users FROM user_stats),
    'newUsersLast7Days', (SELECT new_users_7d FROM user_stats),
    'newUsersLast30Days', (SELECT new_users_30d FROM user_stats),
    'paidUsers', (SELECT paid_users FROM user_stats),
    'usersWithStories', (SELECT users_with_stories FROM story_stats),
    'usersPastPaywall', (SELECT users_past_paywall FROM story_stats)
  );
$$;

-- Function 2: Growth Trends (last 30 days)
-- Returns array of {date, newUsers} objects
CREATE OR REPLACE FUNCTION get_admin_growth_trends()
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    json_agg(
      json_build_object(
        'date', signup_date::text,
        'newUsers', user_count
      )
      ORDER BY signup_date
    ),
    '[]'::json
  )
  FROM (
    SELECT
      DATE(created_at) as signup_date,
      COUNT(*) as user_count
    FROM users
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(created_at)
  ) daily_signups;
$$;

-- Function 3: User Lifecycle Breakdown
-- Categorizes users by story count
CREATE OR REPLACE FUNCTION get_admin_lifecycle_breakdown()
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH story_counts AS (
    SELECT
      u.id as user_id,
      u.created_at,
      COALESCE(s.story_count, 0) as story_count
    FROM users u
    LEFT JOIN (
      SELECT user_id, COUNT(*) as story_count
      FROM stories
      GROUP BY user_id
    ) s ON u.id = s.user_id
  ),
  categorized AS (
    SELECT
      user_id,
      story_count,
      EXTRACT(DAY FROM NOW() - created_at) as days_since_signup,
      CASE
        WHEN story_count = 0 THEN 'New (0 stories)'
        WHEN story_count BETWEEN 1 AND 2 THEN 'Activated (1-2 stories)'
        WHEN story_count BETWEEN 3 AND 9 THEN 'Engaged (3-9 stories)'
        WHEN story_count BETWEEN 10 AND 29 THEN 'Power User (10-29 stories)'
        ELSE 'Super User (30+ stories)'
      END as stage
    FROM story_counts
  ),
  stage_stats AS (
    SELECT
      stage,
      COUNT(*) as count,
      ROUND(AVG(days_since_signup)::numeric, 1) as avg_days
    FROM categorized
    GROUP BY stage
  ),
  total AS (
    SELECT COUNT(*) as total_users FROM users
  )
  SELECT json_agg(
    json_build_object(
      'stage', s.stage,
      'count', s.count,
      'percentage', ROUND((s.count::numeric / GREATEST(t.total_users, 1) * 100), 1)::text,
      'avgDaysSinceSignup', COALESCE(s.avg_days::text, '0')
    )
    ORDER BY
      CASE s.stage
        WHEN 'New (0 stories)' THEN 1
        WHEN 'Activated (1-2 stories)' THEN 2
        WHEN 'Engaged (3-9 stories)' THEN 3
        WHEN 'Power User (10-29 stories)' THEN 4
        WHEN 'Super User (30+ stories)' THEN 5
      END
  )
  FROM stage_stats s, total t;
$$;

-- Function 4: Top 10 Power Users
-- Returns top users by story count with metrics
CREATE OR REPLACE FUNCTION get_admin_top_users()
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH user_stories AS (
    SELECT
      user_id,
      COUNT(*) as story_count,
      MAX(created_at) as last_story_at
    FROM stories
    GROUP BY user_id
    HAVING COUNT(*) > 0
    ORDER BY COUNT(*) DESC
    LIMIT 10
  ),
  family_counts AS (
    SELECT
      user_id,
      COUNT(*) as family_count
    FROM family_members
    WHERE status = 'active'
    GROUP BY user_id
  )
  SELECT COALESCE(
    json_agg(
      json_build_object(
        'name', u.name,
        'email', u.email,
        'storyCount', us.story_count,
        'daysSinceSignup', EXTRACT(DAY FROM NOW() - u.created_at)::int,
        'avgStoriesPerWeek', ROUND(
          (us.story_count::numeric / GREATEST(EXTRACT(DAY FROM NOW() - u.created_at) / 7, 1)),
          1
        )::text,
        'lastActive', CASE
          WHEN us.last_story_at >= NOW() - INTERVAL '1 hour' THEN 'Just now'
          WHEN us.last_story_at >= NOW() - INTERVAL '24 hours' THEN
            EXTRACT(HOUR FROM NOW() - us.last_story_at)::int || 'h ago'
          ELSE
            EXTRACT(DAY FROM NOW() - us.last_story_at)::int || 'd ago'
        END,
        'isPaid', u.is_paid,
        'familyCount', COALESCE(fc.family_count, 0)
      )
      ORDER BY us.story_count DESC
    ),
    '[]'::json
  )
  FROM user_stories us
  JOIN users u ON us.user_id = u.id
  LEFT JOIN family_counts fc ON u.id = fc.user_id;
$$;

-- Function 5: Engagement Metrics
-- Returns story stats without fetching full content
CREATE OR REPLACE FUNCTION get_admin_engagement_metrics()
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH story_stats AS (
    SELECT
      COUNT(*) as total_stories,
      COUNT(*) FILTER (WHERE audio_url IS NOT NULL) as with_audio,
      COUNT(*) FILTER (WHERE photos IS NOT NULL AND jsonb_array_length(photos) > 0) as with_photos,
      COUNT(*) FILTER (WHERE wisdom_clip_text IS NOT NULL AND wisdom_clip_text != '') as with_lessons,
      -- Approximate word count from transcription length (avg 5 chars per word)
      ROUND(AVG(COALESCE(LENGTH(transcription), 0) / 5.0)) as avg_words,
      ROUND(AVG(COALESCE(duration_seconds, 0))) as avg_duration,
      COUNT(*) FILTER (WHERE include_in_book IS NOT FALSE) as in_book,
      COUNT(*) FILTER (WHERE include_in_timeline IS NOT FALSE) as in_timeline,
      COUNT(*) FILTER (WHERE is_favorite = true) as favorites
    FROM stories
  )
  SELECT json_build_object(
    'totalStories', total_stories,
    'storiesWithAudio', with_audio,
    'storiesWithPhotos', with_photos,
    'storiesWithLessons', with_lessons,
    'avgStoryLength', avg_words,
    'avgDuration', avg_duration,
    'storiesInBook', in_book,
    'storiesInTimeline', in_timeline,
    'favoriteStories', favorites,
    'percentWithAudio', CASE WHEN total_stories > 0
      THEN ROUND((with_audio::numeric / total_stories * 100), 1)::text
      ELSE '0' END,
    'percentWithPhotos', CASE WHEN total_stories > 0
      THEN ROUND((with_photos::numeric / total_stories * 100), 1)::text
      ELSE '0' END,
    'percentWithLessons', CASE WHEN total_stories > 0
      THEN ROUND((with_lessons::numeric / total_stories * 100), 1)::text
      ELSE '0' END
  )
  FROM story_stats;
$$;

-- Grant execute permissions to authenticated users
-- Note: These are admin functions, add proper role checks in application layer
GRANT EXECUTE ON FUNCTION get_admin_overall_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_growth_trends() TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_lifecycle_breakdown() TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_top_users() TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_engagement_metrics() TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION get_admin_overall_stats() IS 'Returns overall user and story statistics for admin dashboard';
COMMENT ON FUNCTION get_admin_growth_trends() IS 'Returns daily signup counts for last 30 days';
COMMENT ON FUNCTION get_admin_lifecycle_breakdown() IS 'Returns user counts by engagement stage';
COMMENT ON FUNCTION get_admin_top_users() IS 'Returns top 10 users by story count with metrics';
COMMENT ON FUNCTION get_admin_engagement_metrics() IS 'Returns aggregate story engagement metrics';
