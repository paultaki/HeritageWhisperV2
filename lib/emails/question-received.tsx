// Email template for when a family member submits a question
export interface QuestionReceivedEmailProps {
  storytellerName: string;
  submitterName: string;
  submitterRelationship?: string;
  questionText: string;
  context?: string;
  answersPageLink: string;
}

export function QuestionReceivedEmail({
  storytellerName,
  submitterName,
  submitterRelationship,
  questionText,
  context,
  answersPageLink,
}: QuestionReceivedEmailProps) {
  const relationshipText = submitterRelationship ? ` (${submitterRelationship})` : '';

  return {
    subject: `${submitterName} has a question for you`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Question from ${submitterName}</title>
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
                💬 New Question
              </h1>
            </td>
          </tr>

          <!-- Main content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 18px; color: #1F2937; line-height: 1.6;">
                Hi ${storytellerName},
              </p>

              <p style="margin: 0 0 20px; font-size: 18px; color: #1F2937; line-height: 1.6;">
                <strong>${submitterName}${relationshipText}</strong> has submitted a question for you on Heritage Whisper.
              </p>

              <!-- Question box -->
              <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; margin: 28px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 17px; color: #92400E; line-height: 1.6;">
                  "${questionText}"
                </p>
                ${context ? `
                <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #FDE68A;">
                  <p style="margin: 0; font-size: 14px; color: #78350F; font-style: italic;">
                    <strong>Context:</strong> ${context}
                  </p>
                </div>
                ` : ''}
              </div>

              <p style="margin: 20px 0; font-size: 16px; color: #4B5563; line-height: 1.6;">
                Your family is curious to hear your story! Take a moment to share your memories and wisdom.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${answersPageLink}" style="display: inline-block; background: linear-gradient(135deg, #F59E0B 0%, #FB923C 50%, #FB7185 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 18px; font-weight: 600; box-shadow: 0 4px 6px rgba(245, 158, 11, 0.3);">
                      Answer Question
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0; font-size: 14px; color: #6B7280; line-height: 1.6; text-align: center;">
                Questions like these help you capture meaningful stories for your family to treasure.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F9FAFB; padding: 32px 40px; border-top: 1px solid #E5E7EB;">
              <p style="margin: 0 0 12px; font-size: 14px; color: #6B7280; line-height: 1.6;">
                <strong>About Family Questions</strong>
              </p>
              <p style="margin: 0 0 20px; font-size: 14px; color: #6B7280; line-height: 1.6;">
                Family members with access to your Heritage Whisper account can submit questions they'd like you to answer. These prompts appear alongside AI-generated questions to help you capture the stories that matter most to your family.
              </p>

              <p style="margin: 0; font-size: 13px; color: #9CA3AF; line-height: 1.5;">
                You're receiving this email because a family member submitted a question for you on Heritage Whisper. You can manage your notification preferences in your profile settings.
              </p>

              <p style="margin: 16px 0; font-size: 12px; color: #9CA3AF; text-align: center; line-height: 1.5;">
                Not interested? You can <a href="mailto:support@heritagewhisper.com?subject=Disable%20Question%20Notifications" style="color: #6B7280; text-decoration: underline;">disable question notifications</a>.
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
Hi ${storytellerName},

${submitterName}${relationshipText} has submitted a question for you on Heritage Whisper.

Question:
"${questionText}"
${context ? `\nContext: ${context}` : ''}

Your family is curious to hear your story! Take a moment to share your memories and wisdom.

Click here to answer:
${answersPageLink}

---

About Family Questions:
Family members with access to your Heritage Whisper account can submit questions they'd like you to answer. These prompts appear alongside AI-generated questions to help you capture the stories that matter most to your family.

You're receiving this email because a family member submitted a question for you. You can manage your notification preferences in your profile settings.

Not interested? Email support@heritagewhisper.com to disable question notifications.

© ${new Date().getFullYear()} Heritage Whisper. All rights reserved.
HeritageWhisper, 522 W Riverside Ave Ste N, Spokane, WA 99201
    `,
  };
}
