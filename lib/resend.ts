import { Resend } from "resend";

// Lazy initialization to avoid build-time errors
let resend: Resend | null = null;

function getResendClient() {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

/**
 * Escapes HTML special characters to prevent XSS attacks
 * SECURITY: Always use this function for user-provided data in HTML emails
 */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Validates and sanitizes name input
 * SECURITY: Limits length and removes dangerous characters
 */
function sanitizeName(name: string): string {
  // Limit length to prevent abuse
  const trimmed = name.trim().slice(0, 100);

  // Basic validation - allow letters, spaces, hyphens, apostrophes
  if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) {
    throw new Error('Invalid name format. Only letters, spaces, hyphens, and apostrophes are allowed.');
  }

  return escapeHtml(trimmed);
}

export async function sendVerificationEmail(
  email: string,
  name: string,
  confirmationUrl: string,
) {
  try {
    // SECURITY: Sanitize all user inputs before using in HTML
    const safeName = sanitizeName(name);
    const safeEmail = escapeHtml(email);
    // Don't HTML-escape URLs, but validate they're from our domain
    if (!confirmationUrl.startsWith(process.env.NEXT_PUBLIC_APP_URL || 'https://dev.heritagewhisper.com')) {
      throw new Error('Invalid confirmation URL');
    }

    const resendClient = getResendClient();
    const { data, error } = await resendClient.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Heritage Whisper <noreply@send.heritagewhisper.com>",
      to: email,
      subject: "Confirm your Heritage Whisper account",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #F7F2EC;">
            <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#F7F2EC" style="background-color: #F7F2EC; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden;">
                    <!-- Header -->
                    <tr>
                      <td bgcolor="#203954" style="background-color: #203954; padding: 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Heritage Whisper</h1>
                        <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">Your voice. Their treasure. Forever.</p>
                      </td>
                    </tr>

                    <!-- Main content -->
                    <tr>
                      <td style="padding: 40px 30px;">
                        <h2 style="color: #203954; margin-top: 0;">Welcome, ${safeName}!</h2>

                        <p style="font-size: 16px; color: #4A4A4A; line-height: 1.6;">
                          Thank you for joining Heritage Whisper. We're excited to help you preserve your life stories for generations to come.
                        </p>

                        <p style="font-size: 16px; color: #4A4A4A; line-height: 1.6;">
                          To get started, please confirm your email address by clicking the button below:
                        </p>

                        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 35px 0;">
                          <tr>
                            <td align="center">
                              <!--[if mso]>
                              <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${confirmationUrl}" style="height:52px;v-text-anchor:middle;width:220px;" arcsize="12%" fillcolor="#203954">
                                <w:anchorlock/>
                                <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:600;">Confirm Your Account</center>
                              </v:roundrect>
                              <![endif]-->
                              <!--[if !mso]><!-->
                              <a href="${confirmationUrl}" style="display: inline-block; background-color: #203954; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 600;">
                                Confirm Your Account
                              </a>
                              <!--<![endif]-->
                            </td>
                          </tr>
                        </table>

                        <p style="font-size: 14px; color: #8A8378; margin-top: 30px;">
                          Or copy and paste this link into your browser:
                        </p>
                        <p style="font-size: 13px; color: #203954; word-break: break-all; background: #EFE6DA; padding: 12px; border-radius: 4px;">
                          ${confirmationUrl}
                        </p>

                        <hr style="border: none; border-top: 1px solid #D2C9BD; margin: 30px 0;">

                        <p style="font-size: 13px; color: #8A8378; margin: 0;">
                          If you didn't create an account with Heritage Whisper, you can safely ignore this email.
                        </p>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td bgcolor="#EFE6DA" style="background-color: #EFE6DA; padding: 20px 30px; text-align: center;">
                        <p style="margin: 0; font-size: 12px; color: #8A8378;">© ${new Date().getFullYear()} Heritage Whisper. All rights reserved.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("[Resend] Error sending verification email:", error);
      return { success: false, error };
    }

    console.log("[Resend] Verification email sent:", data?.id);
    return { success: true, data };
  } catch (error) {
    console.error("[Resend] Failed to send verification email:", error);
    return { success: false, error };
  }
}

export async function sendWelcomeEmail(email: string, name: string) {
  try {
    // SECURITY: Sanitize all user inputs before using in HTML
    const safeName = sanitizeName(name);
    const safeEmail = escapeHtml(email);

    const resendClient = getResendClient();
    const { data, error } = await resendClient.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Heritage Whisper <noreply@send.heritagewhisper.com>",
      to: email,
      subject: "Welcome to Heritage Whisper!",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #F7F2EC;">
            <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#F7F2EC" style="background-color: #F7F2EC; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden;">
                    <!-- Header -->
                    <tr>
                      <td bgcolor="#203954" style="background-color: #203954; padding: 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Heritage Whisper</h1>
                        <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">Your voice. Their treasure. Forever.</p>
                      </td>
                    </tr>

                    <!-- Main content -->
                    <tr>
                      <td style="padding: 40px 30px;">
                        <h2 style="color: #203954; margin-top: 0;">Welcome, ${safeName}!</h2>

                        <p style="font-size: 16px; color: #4A4A4A; line-height: 1.6;">
                          Your account is now active! You're ready to start preserving your precious memories.
                        </p>

                        <h3 style="color: #203954; margin-top: 30px;">Getting Started</h3>

                        <ol style="font-size: 15px; color: #4A4A4A; line-height: 1.8;">
                          <li><strong>Record your first story</strong> - Click the microphone button to start recording</li>
                          <li><strong>Add photos</strong> - Make your memories come alive with images</li>
                          <li><strong>Review your timeline</strong> - See your life story unfold chronologically</li>
                          <li><strong>Create your book</strong> - View your memories in a beautiful book format</li>
                        </ol>

                        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 35px 0;">
                          <tr>
                            <td align="center">
                              <!--[if mso]>
                              <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${process.env.NEXT_PUBLIC_APP_URL || "https://dev.heritagewhisper.com"}/timeline" style="height:52px;v-text-anchor:middle;width:200px;" arcsize="12%" fillcolor="#203954">
                                <w:anchorlock/>
                                <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:600;">Start Recording</center>
                              </v:roundrect>
                              <![endif]-->
                              <!--[if !mso]><!-->
                              <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://dev.heritagewhisper.com"}/timeline" style="display: inline-block; background-color: #203954; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 600;">
                                Start Recording
                              </a>
                              <!--<![endif]-->
                            </td>
                          </tr>
                        </table>

                        <hr style="border: none; border-top: 1px solid #D2C9BD; margin: 30px 0;">

                        <p style="font-size: 14px; color: #8A8378;">
                          Questions? Need help? Reply to this email or visit our <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://dev.heritagewhisper.com"}/help" style="color: #203954;">help center</a>.
                        </p>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td bgcolor="#EFE6DA" style="background-color: #EFE6DA; padding: 20px 30px; text-align: center;">
                        <p style="margin: 0; font-size: 12px; color: #8A8378;">© ${new Date().getFullYear()} Heritage Whisper. All rights reserved.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("[Resend] Error sending welcome email:", error);
      return { success: false, error };
    }

    console.log("[Resend] Welcome email sent:", data?.id);
    return { success: true, data };
  } catch (error) {
    console.error("[Resend] Failed to send welcome email:", error);
    return { success: false, error };
  }
}
