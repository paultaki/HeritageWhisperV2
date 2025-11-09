// Email template for when storyteller adds a new story
export interface NewStoryNotificationEmailProps {
  storytellerName: string;
  familyMemberName?: string;
  storyTitle: string;
  storyYear?: number;
  heroPhotoUrl?: string;
  firstSentence?: string;
  viewStoryLink: string;
}

export function NewStoryNotificationEmail({
  storytellerName,
  familyMemberName,
  storyTitle,
  storyYear,
  heroPhotoUrl,
  firstSentence,
  viewStoryLink,
}: NewStoryNotificationEmailProps) {
  const yearText = storyYear ? ` (${storyYear})` : '';

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
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #FFF8F0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FFF8F0; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header with gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #F59E0B 0%, #FB923C 50%, #FB7185 100%); padding: 40px 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                📖 New Story Added
              </h1>
            </td>
          </tr>

          <!-- Main content -->
          <tr>
            <td style="padding: 40px;">
              ${familyMemberName ? `
              <p style="margin: 0 0 20px; font-size: 18px; color: #1F2937; line-height: 1.6;">
                Hi ${familyMemberName},
              </p>
              ` : ''}

              <p style="margin: 0 0 20px; font-size: 18px; color: #1F2937; line-height: 1.6;">
                <strong>${storytellerName}</strong> has added a new story to their Heritage Whisper collection!
              </p>

              <!-- Story card -->
              <div style="background-color: #F9FAFB; border-radius: 12px; padding: 24px; margin: 28px 0; border: 1px solid #E5E7EB;">
                <h2 style="margin: 0 0 8px; font-size: 22px; color: #1F2937; font-weight: 600; font-family: 'Crimson Text', Georgia, serif;">
                  ${storyTitle}${yearText}
                </h2>

                ${heroPhotoUrl ? `
                <div style="margin: 20px 0;">
                  <img src="${heroPhotoUrl}" alt="${storyTitle}" style="width: 100%; max-width: 552px; border-radius: 8px; display: block;" />
                </div>
                ` : ''}

                ${firstSentence ? `
                <p style="margin: 16px 0 0; font-size: 16px; color: #4B5563; line-height: 1.8; font-style: italic;">
                  "${firstSentence}${firstSentence.endsWith('.') ? '' : '...'}"
                </p>
                ` : ''}
              </div>

              <p style="margin: 20px 0; font-size: 16px; color: #4B5563; line-height: 1.6;">
                A new memory has been captured! Explore the full story with photos and audio.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${viewStoryLink}" style="display: inline-block; background: linear-gradient(135deg, #F59E0B 0%, #FB923C 50%, #FB7185 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 18px; font-weight: 600; box-shadow: 0 4px 6px rgba(245, 158, 11, 0.3);">
                      View Story
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0; font-size: 14px; color: #6B7280; line-height: 1.6; text-align: center;">
                You can view all stories in the Timeline or Memory Book.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F9FAFB; padding: 32px 40px; border-top: 1px solid #E5E7EB;">
              <p style="margin: 0 0 12px; font-size: 14px; color: #6B7280; line-height: 1.6;">
                <strong>About Story Notifications</strong>
              </p>
              <p style="margin: 0 0 20px; font-size: 14px; color: #6B7280; line-height: 1.6;">
                When ${storytellerName} adds a new story to their Heritage Whisper collection, we'll send you a notification so you can stay connected to their memories. These stories are precious family history being preserved for generations.
              </p>

              <p style="margin: 0; font-size: 13px; color: #9CA3AF; line-height: 1.5;">
                You're receiving this email because you have access to ${storytellerName}'s Heritage Whisper stories. You can manage your notification preferences in your profile settings.
              </p>

              <p style="margin: 16px 0; font-size: 12px; color: #9CA3AF; text-align: center; line-height: 1.5;">
                Want to pause these updates? You can <a href="mailto:support@heritagewhisper.com?subject=Disable%20Story%20Notifications" style="color: #6B7280; text-decoration: underline;">disable story notifications</a>.
              </p>

              <p style="margin: 16px 0 0; font-size: 13px; color: #9CA3AF; text-align: center;">
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

You're receiving this email because you have access to ${storytellerName}'s stories. You can manage your notification preferences in your profile settings.

Want to pause these updates? Email support@heritagewhisper.com to disable story notifications.

© ${new Date().getFullYear()} Heritage Whisper. All rights reserved.
HeritageWhisper, 522 W Riverside Ave Ste N, Spokane, WA 99201
    `,
  };
}
