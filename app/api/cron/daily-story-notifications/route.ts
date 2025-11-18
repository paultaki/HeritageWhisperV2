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
 * Note: This complements immediate notifications (sent when story is created).
 * If immediate notification succeeded, this cron skips those stories via timestamp check.
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
  // STEP 3: Find Family Members Who Need Notifications
  // ============================================================================
  // Query logic:
  // - Status must be 'active' (not pending or suspended)
  // - Either never been notified (last_story_notification_sent_at IS NULL)
  // - OR last notified more than 24 hours ago
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  logger.info('[DailyNotifications] Querying family members who need notifications...');

  const { data: familyMembers, error: membersError } = await supabaseAdmin
    .from('family_members')
    .select(`
      id,
      user_id,
      email,
      name,
      relationship,
      last_story_notification_sent_at
    `)
    .eq('status', 'active')
    .or(`last_story_notification_sent_at.is.null,last_story_notification_sent_at.lt.${twentyFourHoursAgo}`);

  if (membersError) {
    logger.error('[DailyNotifications] Error fetching family members:', membersError);
    return NextResponse.json(
      { error: 'Database query failed', details: membersError.message },
      { status: 500 }
    );
  }

  if (!familyMembers || familyMembers.length === 0) {
    logger.info('[DailyNotifications] No family members need notifications');
    return NextResponse.json({
      success: true,
      message: 'No notifications needed',
      totalFamilyMembers: 0,
      emailsSent: 0,
    });
  }

  logger.info(`[DailyNotifications] Found ${familyMembers.length} family members to check`);

  // ============================================================================
  // STEP 4: For Each Family Member, Find New Stories
  // ============================================================================
  const results = {
    totalFamilyMembers: familyMembers.length,
    emailsSent: 0,
    skipped: 0,
    errors: [] as string[],
  };

  for (const member of familyMembers) {
    try {
      // Get the timestamp to query stories from
      // If never notified, get all stories from the last 7 days (safety window)
      // If previously notified, get stories since that timestamp
      const sinceDate = member.last_story_notification_sent_at
        ? new Date(member.last_story_notification_sent_at)
        : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

      // ========================================================================
      // STEP 4A: Check Storyteller's Email Notification Preference
      // ========================================================================
      const { data: storyteller, error: storytellerError } = await supabaseAdmin
        .from('users')
        .select('id, name, email_notifications')
        .eq('id', member.user_id)
        .single();

      if (storytellerError || !storyteller) {
        logger.error(`[DailyNotifications] Failed to fetch storyteller for member ${member.id}:`, storytellerError);
        results.skipped++;
        continue;
      }

      // Respect storyteller's email notification preferences
      if (storyteller.email_notifications === false) {
        logger.info(`[DailyNotifications] Skipping member ${member.id} - storyteller has email notifications disabled`);
        results.skipped++;
        continue;
      }

      // ========================================================================
      // STEP 4B: Query New Stories Since Last Notification
      // ========================================================================
      const { data: newStories, error: storiesError } = await supabaseAdmin
        .from('stories')
        .select('id, title, year, photo_url, created_at')
        .eq('user_id', member.user_id)
        .gt('created_at', sinceDate.toISOString())
        .order('created_at', { ascending: false });

      if (storiesError) {
        logger.error(`[DailyNotifications] Error fetching stories for member ${member.id}:`, storiesError);
        results.errors.push(`Failed to fetch stories for ${member.email}: ${storiesError.message}`);
        continue;
      }

      // Skip if no new stories
      if (!newStories || newStories.length === 0) {
        logger.info(`[DailyNotifications] No new stories for member ${member.id}`);
        results.skipped++;
        continue;
      }

      logger.info(`[DailyNotifications] Found ${newStories.length} new stories for member ${member.id}`);

      // ========================================================================
      // STEP 5: Send Email Notification
      // ========================================================================
      // Use the FIRST story for the email (most recent)
      const firstStory = newStories[0];

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
        storyTitle: firstStory.title || 'Untitled Story',
        storyYear: firstStory.year || undefined,
        heroPhotoUrl,
        firstSentence: undefined, // We don't have transcript in this query
        viewStoryLink,
      });

      // Customize subject for batch notifications
      let customSubject: string;
      if (newStories.length === 1) {
        customSubject = `${storyteller.name} just shared a new story`;
      } else {
        customSubject = `${storyteller.name} shared ${newStories.length} new stories`;
      }

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

      // ========================================================================
      // STEP 6: Update Last Notification Timestamp
      // ========================================================================
      const now = new Date().toISOString();
      const { error: updateError } = await supabaseAdmin
        .from('family_members')
        .update({ last_story_notification_sent_at: now })
        .eq('id', member.id);

      if (updateError) {
        logger.error(`[DailyNotifications] Failed to update timestamp for member ${member.id}:`, updateError);
        // Don't fail the entire operation, just log the error
        results.errors.push(`Failed to update timestamp for ${member.email}: ${updateError.message}`);
      }

      results.emailsSent++;

    } catch (error: any) {
      logger.error(`[DailyNotifications] Unexpected error processing member ${member.id}:`, error);
      results.errors.push(`Unexpected error for ${member.email}: ${error.message}`);
    }
  }

  // ============================================================================
  // STEP 7: Log Final Results
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
