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
      from: "Heritage Whisper <noreply@heritagewhisper.com>",
      to: email,
      subject: "Confirm your Heritage Whisper account",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #8B4513 0%, #D2691E 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Heritage Whisper</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">Your voice. Their treasure. Forever.</p>
            </div>

            <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
              <h2 style="color: #8B4513; margin-top: 0;">Welcome, ${safeName}!</h2>

              <p style="font-size: 16px; color: #555;">
                Thank you for joining Heritage Whisper. We're excited to help you preserve your life stories for generations to come.
              </p>

              <p style="font-size: 16px; color: #555;">
                To get started, please confirm your email address by clicking the button below:
              </p>

              <div style="text-align: center; margin: 35px 0;">
                <a href="${confirmationUrl}"
                   style="background: #8B4513; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; display: inline-block;">
                  Confirm Your Account
                </a>
              </div>

              <p style="font-size: 14px; color: #777; margin-top: 30px;">
                Or copy and paste this link into your browser:
              </p>
              <p style="font-size: 13px; color: #8B4513; word-break: break-all; background: #f5f5f5; padding: 12px; border-radius: 4px;">
                ${confirmationUrl}
              </p>

              <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

              <p style="font-size: 13px; color: #999; margin: 0;">
                If you didn't create an account with Heritage Whisper, you can safely ignore this email.
              </p>
            </div>

            <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
              <p>© ${new Date().getFullYear()} Heritage Whisper. All rights reserved.</p>
            </div>
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
      from: "Heritage Whisper <noreply@heritagewhisper.com>",
      to: email,
      subject: "Welcome to Heritage Whisper!",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #8B4513 0%, #D2691E 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Heritage Whisper</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">Your voice. Their treasure. Forever.</p>
            </div>

            <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
              <h2 style="color: #8B4513; margin-top: 0;">Welcome, ${safeName}! 🎉</h2>

              <p style="font-size: 16px; color: #555;">
                Your account is now active! You're ready to start preserving your precious memories.
              </p>

              <h3 style="color: #8B4513; margin-top: 30px;">Getting Started</h3>

              <ol style="font-size: 15px; color: #555; line-height: 1.8;">
                <li><strong>Record your first story</strong> - Click the microphone button to start recording</li>
                <li><strong>Add photos</strong> - Make your memories come alive with images</li>
                <li><strong>Review your timeline</strong> - See your life story unfold chronologically</li>
                <li><strong>Create your book</strong> - View your memories in a beautiful book format</li>
              </ol>

              <div style="text-align: center; margin: 35px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://dev.heritagewhisper.com"}/timeline"
                   style="background: #8B4513; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; display: inline-block;">
                  Start Recording
                </a>
              </div>

              <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

              <p style="font-size: 14px; color: #777;">
                Questions? Need help? Reply to this email or visit our <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://dev.heritagewhisper.com"}/help" style="color: #8B4513;">help center</a>.
              </p>
            </div>

            <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
              <p>© ${new Date().getFullYear()} Heritage Whisper. All rights reserved.</p>
            </div>
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
