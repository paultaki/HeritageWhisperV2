// Email template for family invite
export interface FamilyInviteEmailProps {
  storytellerName: string;
  familyMemberName?: string;
  relationship?: string;
  magicLink: string;
  expiresAt: string;
  personalMessage?: string;
}

export function FamilyInviteEmail({
  storytellerName,
  familyMemberName,
  relationship,
  magicLink,
  expiresAt,
  personalMessage,
}: FamilyInviteEmailProps) {
  const expiryDate = new Date(expiresAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return {
    subject: `${storytellerName} has invited you to view their life stories`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're invited to Heritage Whisper</title>
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
                👋 You're Invited!
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
                <strong>${storytellerName}</strong> has invited you to view their life stories on Heritage Whisper.
              </p>

              ${personalMessage ? `
              <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 16px; margin: 24px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 16px; color: #92400E; font-style: italic; line-height: 1.6;">
                  "${personalMessage}"
                </p>
              </div>
              ` : ''}

              <div style="background-color: #F3F4F6; border-radius: 12px; padding: 24px; margin: 28px 0;">
                <h2 style="margin: 0 0 16px; font-size: 18px; color: #1F2937; font-weight: 600;">
                  What you can explore:
                </h2>
                <ul style="margin: 0; padding-left: 24px; color: #4B5563; font-size: 16px; line-height: 1.8;">
                  <li>View their timeline of memories and milestones</li>
                  <li>Read their stories with photos and context</li>
                  <li>Listen to audio recordings in their own voice</li>
                  <li>Browse their memory book organized by decade</li>
                </ul>
              </div>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${magicLink}" style="display: inline-block; background: linear-gradient(135deg, #F59E0B 0%, #FB923C 50%, #FB7185 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 18px; font-weight: 600; box-shadow: 0 4px 6px rgba(245, 158, 11, 0.3);">
                      View Stories
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0; font-size: 14px; color: #6B7280; line-height: 1.6; text-align: center;">
                This link will expire on <strong>${expiryDate}</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F9FAFB; padding: 32px 40px; border-top: 1px solid #E5E7EB;">
              <p style="margin: 0 0 12px; font-size: 14px; color: #6B7280; line-height: 1.6;">
                <strong>What is Heritage Whisper?</strong>
              </p>
              <p style="margin: 0 0 20px; font-size: 14px; color: #6B7280; line-height: 1.6;">
                Heritage Whisper is a platform that helps people preserve and share their life stories with family members. It's a beautiful way to keep family history alive for generations to come.
              </p>
              
              <p style="margin: 0; font-size: 13px; color: #9CA3AF; line-height: 1.5;">
                You're receiving this email because ${storytellerName} invited you to view their stories on Heritage Whisper. Your access is view-only and will remain active for 30 days after your first visit.
              </p>
              
              <p style="margin: 16px 0 0; font-size: 13px; color: #9CA3AF; text-align: center;">
                © ${new Date().getFullYear()} Heritage Whisper. All rights reserved.
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
Hi${familyMemberName ? ` ${familyMemberName}` : ''},

${storytellerName} has invited you to view their life stories on Heritage Whisper.

${personalMessage ? `Personal message: "${personalMessage}"\n\n` : ''}

What you can explore:
• View their timeline of memories and milestones
• Read their stories with photos and context
• Listen to audio recordings in their own voice
• Browse their memory book organized by decade

Click here to view their stories:
${magicLink}

This link will expire on ${expiryDate}.

---

What is Heritage Whisper?
Heritage Whisper is a platform that helps people preserve and share their life stories with family members. It's a beautiful way to keep family history alive for generations to come.

You're receiving this email because ${storytellerName} invited you to view their stories. Your access is view-only and will remain active for 30 days after your first visit.

© ${new Date().getFullYear()} Heritage Whisper. All rights reserved.
    `,
  };
}
