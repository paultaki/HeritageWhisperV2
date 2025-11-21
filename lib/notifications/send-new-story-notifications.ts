import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { NewStoryNotificationEmail } from '@/lib/emails/new-story-notification';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export interface SendStoryNotificationsParams {
  storytellerUserId: string;
  storyId: string;
  storyTitle: string;
  storyYear?: number;
  heroPhotoPath?: string; // File path in Supabase Storage
  transcript: string;
}

/**
 * Get or create a valid invite token for a family member
 * This ensures the notification link will work even if their session expired
 */
async function getOrCreateInviteToken(familyMemberId: string): Promise<string | null> {
  try {
    // First, check if they have a valid unused invite token
    const { data: existingInvite } = await supabaseAdmin
      .from('family_invites')
      .select('token, expires_at, used_at')
      .eq('family_member_id', familyMemberId)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existingInvite) {
      return existingInvite.token;
    }

    // No valid token exists - create a new one for this notification
    // Use 7-day expiry for notification links (similar to resend invites)
    const newToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { error } = await supabaseAdmin
      .from('family_invites')
      .insert({
        family_member_id: familyMemberId,
        token: newToken,
        expires_at: expiresAt.toISOString(),
      });

    if (error) {
      console.error('[StoryNotification] Failed to create invite token:', error);
      return null;
    }

    return newToken;
  } catch (error) {
    console.error('[StoryNotification] Error getting/creating invite token:', error);
    return null;
  }
}

/**
 * Extract the first sentence from a transcript.
 * Returns up to 150 characters to avoid overly long previews.
 */
function extractFirstSentence(text: string): string {
  if (!text) return '';

  // Clean up the text
  const cleaned = text.trim();

  // Find first sentence ending with . ! or ?
  const match = cleaned.match(/^[^.!?]+[.!?]/);
  if (match) {
    const sentence = match[0].trim();
    // Truncate if too long
    return sentence.length > 150 ? sentence.substring(0, 147) + '...' : sentence;
  }

  // No sentence ending found, take first 150 chars
  return cleaned.substring(0, 147) + (cleaned.length > 147 ? '...' : '');
}

/**
 * Generate a signed URL for a photo with 1-week expiry.
 * Returns null if no path provided or if generation fails.
 */
async function generateSignedPhotoUrl(photoPath: string | null | undefined): Promise<string | null> {
  if (!photoPath) return null;

  try {
    const { data, error } = await supabaseAdmin.storage
      .from('heritage-whisper-files')
      .createSignedUrl(photoPath, 604800); // 7 days in seconds

    if (error || !data) {
      console.error('[StoryNotification] Failed to generate signed URL:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('[StoryNotification] Error generating signed URL:', error);
    return null;
  }
}

/**
 * Send email notifications to all family members when storyteller adds a new story.
 * This runs asynchronously after story creation - failures are logged but don't block the request.
 */
export async function sendNewStoryNotifications({
  storytellerUserId,
  storyId,
  storyTitle,
  storyYear,
  heroPhotoPath,
  transcript,
}: SendStoryNotificationsParams): Promise<void> {
  try {
    // Skip if Resend API key not configured
    if (!process.env.RESEND_API_KEY) {
      console.log('[StoryNotification] Skipping story emails - no Resend API key configured');
      return;
    }

    // Fetch storyteller's name
    const { data: storyteller, error: storytellerError } = await supabaseAdmin
      .from('users')
      .select('name')
      .eq('id', storytellerUserId)
      .single();

    if (storytellerError || !storyteller) {
      console.error('[StoryNotification] Failed to fetch storyteller:', storytellerError);
      return;
    }

    const storytellerName = storyteller.name || 'Your family member';

    // Fetch all family members with access to this storyteller
    // This includes both magic-link-based (V2) and account-based (V3) family sharing
    // Only notify users who haven't unsubscribed
    const { data: familyMembers, error: familyError } = await supabaseAdmin
      .from('family_members')
      .select('id, name, email, auth_user_id, email_notifications')
      .eq('user_id', storytellerUserId)
      .eq('status', 'active')
      .eq('email_notifications', true);

    if (familyError || !familyMembers || familyMembers.length === 0) {
      console.log('[StoryNotification] No active family members to notify');
      return;
    }

    // Generate signed URL for hero photo (if exists)
    const heroPhotoUrl = await generateSignedPhotoUrl(heroPhotoPath);

    // Extract first sentence from transcript
    const firstSentence = extractFirstSentence(transcript);

    // Prepare email content
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';

    const resend = new Resend(process.env.RESEND_API_KEY);

    // Send email to each family member
    let successCount = 0;
    let failureCount = 0;

    for (const member of familyMembers) {
      try {
        const familyMemberName = member.name || member.email.split('@')[0];

        // Get or create a valid invite token for this family member
        // This ensures the link works even if their session expired
        const inviteToken = await getOrCreateInviteToken(member.id);

        if (!inviteToken) {
          console.error(`[StoryNotification] Failed to get invite token for ${member.email}`);
          failureCount++;
          continue;
        }

        // Generate magic link with their invite token
        const viewStoryLink = `${appUrl}/family/access?token=${inviteToken}`;

        const emailContent = NewStoryNotificationEmail({
          storytellerName,
          familyMemberName,
          familyMemberId: member.id, // Required for unsubscribe link
          storyTitle,
          storyYear,
          heroPhotoUrl: heroPhotoUrl || undefined,
          firstSentence,
          viewStoryLink,
        });

        const { data: emailData, error: emailError } = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'HeritageWhisper <no-reply@updates.heritagewhisper.com>',
          to: member.email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        });

        if (emailError) {
          console.error(`[StoryNotification] Failed to send to ${member.email}:`, emailError);
          failureCount++;
        } else {
          console.log(`[StoryNotification] ✅ Email sent to ${member.email}:`, emailData?.id);
          successCount++;

          // Update timestamp to prevent duplicate notifications from daily digest
          const { error: updateError } = await supabaseAdmin
            .from('family_members')
            .update({ last_story_notification_sent_at: new Date().toISOString() })
            .eq('id', member.id);

          if (updateError) {
            console.error(`[StoryNotification] Failed to update timestamp for ${member.email}:`, updateError);
            // Don't fail the entire operation, just log the error
          }
        }
      } catch (error) {
        console.error(`[StoryNotification] Error sending to ${member.email}:`, error);
        failureCount++;
      }
    }

    console.log(`[StoryNotification] Story notifications complete: ${successCount} sent, ${failureCount} failed`);
  } catch (error) {
    // Catch-all for unexpected errors - log but don't throw
    console.error('[StoryNotification] Unexpected error sending story notifications:', error);
  }
}
