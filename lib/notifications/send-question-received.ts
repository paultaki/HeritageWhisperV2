import { Resend } from 'resend';
import { QuestionReceivedEmail } from '@/lib/emails/question-received';

// SECURITY: Use centralized admin client (enforces server-only via import)
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export interface SendQuestionNotificationParams {
  storytellerUserId: string;
  submitterFamilyMemberId: string;
  promptText: string;
  context?: string;
}

/**
 * Send email notification to storyteller when family member submits a question.
 * This runs asynchronously after prompt submission - failures are logged but don't block the request.
 */
export async function sendQuestionReceivedNotification({
  storytellerUserId,
  submitterFamilyMemberId,
  promptText,
  context,
}: SendQuestionNotificationParams): Promise<void> {
  try {
    // Skip if Resend API key not configured
    if (!process.env.RESEND_API_KEY) {
      console.log('[Notification] Skipping question email - no Resend API key configured');
      return;
    }

    // Fetch storyteller's email and name
    const { data: storyteller, error: storytellerError } = await supabaseAdmin
      .from('users')
      .select('email, name')
      .eq('id', storytellerUserId)
      .single();

    if (storytellerError || !storyteller) {
      console.error('[Notification] Failed to fetch storyteller:', storytellerError);
      return;
    }

    // Fetch submitter's name and relationship
    const { data: submitter, error: submitterError } = await supabaseAdmin
      .from('family_members')
      .select('name, email, relationship')
      .eq('id', submitterFamilyMemberId)
      .single();

    if (submitterError || !submitter) {
      console.error('[Notification] Failed to fetch submitter:', submitterError);
      return;
    }

    // Build storyteller's name
    const storytellerName = storyteller.name || 'there';

    // Build submitter's name (prefer name field, fallback to email)
    const submitterName = submitter.name || submitter.email.split('@')[0];

    // Generate email content
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';
    const answersPageLink = `${appUrl}/prompts`;

    const emailContent = QuestionReceivedEmail({
      storytellerName,
      submitterName,
      submitterRelationship: submitter.relationship,
      questionText: promptText,
      context,
      answersPageLink,
    });

    // Send email via Resend
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'HeritageWhisper <no-reply@updates.heritagewhisper.com>',
      to: storyteller.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    if (emailError) {
      console.error('[Notification] Failed to send question email:', emailError);
      return;
    }

    console.log('[Notification] ✅ Question email sent:', emailData?.id);
  } catch (error) {
    // Catch-all for unexpected errors - log but don't throw
    console.error('[Notification] Unexpected error sending question email:', error);
  }
}
