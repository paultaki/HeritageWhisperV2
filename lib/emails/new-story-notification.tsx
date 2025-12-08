import { generateUnsubscribeToken } from '@/lib/unsubscribe-token';

// Email template for when storyteller adds a new story
export interface NewStoryNotificationEmailProps {
  storytellerName: string;
  familyMemberName?: string;
  familyMemberId: string; // Required for unsubscribe link
  storyTitle: string;
  storyYear?: number;
  heroPhotoUrl?: string;
  firstSentence?: string;
  viewStoryLink: string;
}

export function NewStoryNotificationEmail({
  storytellerName,
  familyMemberName,
  familyMemberId,
  storyTitle,
  storyYear,
  heroPhotoUrl,
  firstSentence,
  viewStoryLink,
}: NewStoryNotificationEmailProps) {
  const yearText = storyYear ? ` (${storyYear})` : '';

  // Generate unsubscribe token and link
  const unsubscribeToken = generateUnsubscribeToken(familyMemberId);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dev.heritagewhisper.com';
  const unsubscribeLink = `${appUrl}/api/family/unsubscribe?token=${unsubscribeToken}`;

  return {
    subject: `${storytellerName} added a new story: "${storyTitle}"`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Story from ${storytellerName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #F7F2EC;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#F7F2EC" style="background-color: #F7F2EC; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden;">

          <!-- Header -->
          <tr>
            <td bgcolor="#203954" style="background-color: #203954; padding: 40px 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                New Story Added
              </h1>
            </td>
          </tr>

          <!-- Main content -->
          <tr>
            <td style="padding: 40px;">
              ${familyMemberName ? `
              <p style="margin: 0 0 20px; font-size: 18px; color: #1F1F1F; line-height: 1.6;">
                Hi ${familyMemberName},
              </p>
              ` : ''}

              <p style="margin: 0 0 20px; font-size: 18px; color: #1F1F1F; line-height: 1.6;">
                <strong>${storytellerName}</strong> has added a new story to their Heritage Whisper collection!
              </p>

              <!-- Story card -->
              <div style="background-color: #EFE6DA; border-radius: 12px; padding: 24px; margin: 28px 0; border: 1px solid #D2C9BD;">
                <h2 style="margin: 0 0 8px; font-size: 22px; color: #1F1F1F; font-weight: 600; font-family: 'Crimson Text', Georgia, serif;">
                  ${storyTitle}${yearText}
                </h2>

                ${heroPhotoUrl ? `
                <div style="margin: 20px 0;">
                  <img src="${heroPhotoUrl}" alt="${storyTitle}" style="width: 100%; max-width: 552px; border-radius: 8px; display: block;" />
                </div>
                ` : ''}

                ${firstSentence ? `
                <p style="margin: 16px 0 0; font-size: 16px; color: #4A4A4A; line-height: 1.8; font-style: italic;">
                  "${firstSentence}${firstSentence.endsWith('.') ? '' : '...'}"
                </p>
                ` : ''}
              </div>

              <p style="margin: 20px 0; font-size: 16px; color: #4A4A4A; line-height: 1.6;">
                A new memory has been captured! Explore the full story with photos and audio.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${viewStoryLink}" style="height:52px;v-text-anchor:middle;width:200px;" arcsize="15%" fillcolor="#203954">
                      <w:anchorlock/>
                      <center style="color:#ffffff;font-family:sans-serif;font-size:18px;font-weight:600;">View Story</center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-->
                    <a href="${viewStoryLink}" style="display: inline-block; background-color: #203954; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 18px; font-weight: 600;">
                      View Story
                    </a>
                    <!--<![endif]-->
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0; font-size: 14px; color: #4A4A4A; line-height: 1.6; text-align: center;">
                You can view all stories in the Timeline or Memory Book.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td bgcolor="#EFE6DA" style="background-color: #EFE6DA; padding: 32px 40px; border-top: 1px solid #D2C9BD;">
              <p style="margin: 0 0 12px; font-size: 14px; color: #4A4A4A; line-height: 1.6;">
                <strong>About Story Notifications</strong>
              </p>
              <p style="margin: 0 0 20px; font-size: 14px; color: #4A4A4A; line-height: 1.6;">
                When ${storytellerName} adds a new story to their Heritage Whisper collection, we'll send you a notification so you can stay connected to their memories. These stories are precious family history being preserved for generations.
              </p>

              <p style="margin: 0; font-size: 13px; color: #8A8378; line-height: 1.5;">
                You're receiving this email because you have access to ${storytellerName}'s Heritage Whisper stories.
              </p>

              <p style="margin: 16px 0; font-size: 12px; color: #8A8378; text-align: center; line-height: 1.5;">
                Want to pause these updates? <a href="${unsubscribeLink}" style="color: #203954; text-decoration: underline;">Unsubscribe from story notifications</a>.
              </p>

              <p style="margin: 16px 0 0; font-size: 13px; color: #8A8378; text-align: center;">
                © ${new Date().getFullYear()} Heritage Whisper. All rights reserved.<br>
                <span style="font-size: 11px;">HeritageWhisper, 522 W Riverside Ave Ste N, Spokane, WA 99201</span>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    text: `
${familyMemberName ? `Hi ${familyMemberName},\n\n` : ''}${storytellerName} has added a new story to their Heritage Whisper collection!

Story Title:
${storyTitle}${yearText}
${firstSentence ? `\n"${firstSentence}${firstSentence.endsWith('.') ? '' : '...'}"\n` : ''}
A new memory has been captured! Explore the full story with photos and audio.

Click here to view the story:
${viewStoryLink}

You can view all stories in the Timeline or Memory Book.

---

About Story Notifications:
When ${storytellerName} adds a new story to their Heritage Whisper collection, we'll send you a notification so you can stay connected to their memories. These stories are precious family history being preserved for generations.

You're receiving this email because you have access to ${storytellerName}'s stories.

Want to pause these updates? Unsubscribe here:
${unsubscribeLink}

© ${new Date().getFullYear()} Heritage Whisper. All rights reserved.
HeritageWhisper, 522 W Riverside Ave Ste N, Spokane, WA 99201
    `,
  };
}
