import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { NewStoryNotificationEmail } from '@/lib/emails/new-story-notification';
import { logger } from '@/lib/logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Daily Story Notifications Cron Job
 *
 * Purpose: Send batched email notifications to family members about new stories
 * Schedule: Runs daily at 9 AM UTC (configured in vercel.json)
 *
 * Logic:
 * 1. Find all active family members who haven't been notified in 24+ hours
 * 2. For each family member, find their storyteller's stories created since last notification
 * 3. Batch multiple stories into a single email per storyteller
 * 4. Send email using NewStoryNotificationEmail template
 * 5. Update last_story_notification_sent_at timestamp
 * 6. Respect user email notification preferences
 *
 * Performance: Uses JOIN query to fetch all data in one request (was N+3 queries per member)
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // ============================================================================
  // STEP 1: Verify Authorization (CRON_SECRET)
  // ============================================================================
  const authHeader = request.headers.get('authorization');
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

  if (authHeader !== expectedAuth) {
    logger.error('[DailyNotifications] Unauthorized cron request');
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // ============================================================================
  // STEP 2: Pre-flight Checks
  // ============================================================================
  if (!process.env.RESEND_API_KEY) {
    logger.warn('[DailyNotifications] Skipping - no Resend API key configured');
    return NextResponse.json({
      success: true,
      message: 'Skipped - no Resend API key',
      emailsSent: 0,
    });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dev.heritagewhisper.com';

  // ============================================================================
  // STEP 3: Fetch All Data in One Query (Optimized)
  // ============================================================================
  // Single query with JOIN to get:
  // - Family members who need notifications
  // - Their storyteller info
  // - Story counts since last notification
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  logger.info('[DailyNotifications] Fetching family members with storyteller data...');

  // Get family members with their storyteller info in one query
  const { data: membersWithStorytellers, error: membersError } = await supabaseAdmin
    .from('family_members')
    .select(`
      id,
      user_id,
      email,
      name,
      relationship,
      last_story_notification_sent_at,
      email_notifications,
      users!family_members_user_id_fkey (
        id,
        name,
        email_notifications
      )
    `)
    .eq('status', 'active')
    .eq('email_notifications', true)
    .or(`last_story_notification_sent_at.is.null,last_story_notification_sent_at.lt.${twentyFourHoursAgo}`);

  if (membersError) {
    logger.error('[DailyNotifications] Error fetching family members:', membersError);
    return NextResponse.json(
      { error: 'Database query failed', details: membersError.message },
      { status: 500 }
    );
  }

  if (!membersWithStorytellers || membersWithStorytellers.length === 0) {
    logger.info('[DailyNotifications] No family members need notifications');
    return NextResponse.json({
      success: true,
      message: 'No notifications needed',
      totalFamilyMembers: 0,
      emailsSent: 0,
    });
  }

  // Filter out members whose storytellers have email notifications disabled
  // Note: Supabase returns users as array type but it's actually a single object due to FK
  type Storyteller = { id: string; name: string; email_notifications: boolean };
  const eligibleMembers = membersWithStorytellers.filter(
    (m) => {
      const storyteller = m.users as unknown as Storyteller | null;
      return storyteller && storyteller.email_notifications !== false;
    }
  );

  if (eligibleMembers.length === 0) {
    logger.info('[DailyNotifications] All storytellers have notifications disabled');
    return NextResponse.json({
      success: true,
      message: 'No notifications needed - storytellers have notifications disabled',
      totalFamilyMembers: membersWithStorytellers.length,
      emailsSent: 0,
    });
  }

  logger.info(`[DailyNotifications] Found ${eligibleMembers.length} eligible family members`);

  // Get unique storyteller IDs to batch fetch stories
  const storytellerIds = [...new Set(eligibleMembers.map((m) => m.user_id))];

  // Batch fetch all recent stories for all storytellers at once
  const { data: allStories, error: storiesError } = await supabaseAdmin
    .from('stories')
    .select('id, user_id, title, year, photo_url, created_at')
    .in('user_id', storytellerIds)
    .gte('created_at', sevenDaysAgo) // Get stories from last 7 days (we'll filter per-member later)
    .order('created_at', { ascending: false });

  if (storiesError) {
    logger.error('[DailyNotifications] Error fetching stories:', storiesError);
    return NextResponse.json(
      { error: 'Failed to fetch stories', details: storiesError.message },
      { status: 500 }
    );
  }

  // Index stories by user_id for fast lookup
  const storiesByUser = new Map<string, typeof allStories>();
  for (const story of allStories || []) {
    if (!storiesByUser.has(story.user_id)) {
      storiesByUser.set(story.user_id, []);
    }
    storiesByUser.get(story.user_id)!.push(story);
  }

  logger.info(`[DailyNotifications] Fetched ${allStories?.length || 0} stories for ${storytellerIds.length} storytellers`);

  // ============================================================================
  // STEP 4: Process Each Family Member and Send Emails
  // ============================================================================
  const results = {
    totalFamilyMembers: eligibleMembers.length,
    emailsSent: 0,
    skipped: 0,
    errors: [] as string[],
  };

  // Track member IDs that need timestamp updates (batch at end)
  const membersToUpdate: string[] = [];

  for (const member of eligibleMembers) {
    try {
      const storyteller = member.users as unknown as Storyteller | null;
      if (!storyteller) {
        results.skipped++;
        continue;
      }

      // Get the timestamp to filter stories
      const sinceDate = member.last_story_notification_sent_at
        ? new Date(member.last_story_notification_sent_at)
        : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // Filter stories for this member's storyteller that are newer than their last notification
      const memberStories = (storiesByUser.get(member.user_id) || []).filter(
        (story) => new Date(story.created_at) > sinceDate
      );

      // Skip if no new stories
      if (memberStories.length === 0) {
        results.skipped++;
        continue;
      }

      logger.info(`[DailyNotifications] Found ${memberStories.length} new stories for member ${member.id}`);

      // Use the FIRST story for the email (most recent)
      const firstStory = memberStories[0];

      // Generate signed URL for hero photo if it exists
      let heroPhotoUrl: string | undefined;
      if (firstStory.photo_url) {
        const { data: signedData } = await supabaseAdmin.storage
          .from('heritage-whisper-files')
          .createSignedUrl(firstStory.photo_url, 604800); // 7 days

        if (signedData?.signedUrl) {
          heroPhotoUrl = signedData.signedUrl;
        }
      }

      // Generate view story link (direct to family timeline)
      const viewStoryLink = `${appUrl}/family/timeline/${member.user_id}`;

      // Generate email content using existing template
      const emailContent = NewStoryNotificationEmail({
        storytellerName: storyteller.name || 'Your family member',
        familyMemberName: member.name || undefined,
        familyMemberId: member.id,
        storyTitle: firstStory.title || 'Untitled Story',
        storyYear: firstStory.year || undefined,
        heroPhotoUrl,
        firstSentence: undefined,
        viewStoryLink,
      });

      // Customize subject for batch notifications
      const customSubject = memberStories.length === 1
        ? `${storyteller.name} just shared a new story`
        : `${storyteller.name} shared ${memberStories.length} new stories`;

      // Send email via Resend
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'HeritageWhisper <noreply@send.heritagewhisper.com>',
        to: member.email,
        subject: customSubject,
        html: emailContent.html,
        text: emailContent.text,
      });

      if (emailError) {
        logger.error(`[DailyNotifications] Failed to send email to ${member.email}:`, emailError);
        results.errors.push(`Failed to send to ${member.email}: ${emailError.message}`);
        continue;
      }

      logger.info(`[DailyNotifications] ✅ Email sent to ${member.email} (Resend ID: ${emailData?.id})`);
      membersToUpdate.push(member.id);
      results.emailsSent++;

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`[DailyNotifications] Unexpected error processing member ${member.id}:`, error);
      results.errors.push(`Unexpected error for ${member.email}: ${errorMessage}`);
    }
  }

  // ============================================================================
  // STEP 5: Batch Update Timestamps (Single Query)
  // ============================================================================
  if (membersToUpdate.length > 0) {
    const now = new Date().toISOString();
    const { error: updateError } = await supabaseAdmin
      .from('family_members')
      .update({ last_story_notification_sent_at: now })
      .in('id', membersToUpdate);

    if (updateError) {
      logger.error('[DailyNotifications] Failed to batch update timestamps:', updateError);
      results.errors.push(`Failed to update timestamps: ${updateError.message}`);
    } else {
      logger.info(`[DailyNotifications] Updated timestamps for ${membersToUpdate.length} members`);
    }
  }

  // ============================================================================
  // STEP 6: Log Final Results
  // ============================================================================
  const duration = Date.now() - startTime;

  logger.info('[DailyNotifications] Completed:', {
    duration: `${duration}ms`,
    totalFamilyMembers: results.totalFamilyMembers,
    emailsSent: results.emailsSent,
    skipped: results.skipped,
    errors: results.errors.length,
  });

  return NextResponse.json({
    success: true,
    duration,
    totalFamilyMembers: results.totalFamilyMembers,
    emailsSent: results.emailsSent,
    skipped: results.skipped,
    errorCount: results.errors.length,
    errors: results.errors.length > 0 ? results.errors : undefined,
  });
}
