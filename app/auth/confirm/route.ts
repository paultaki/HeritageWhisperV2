import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// This route handles email confirmations and password reset token verification
// It exchanges the token_hash for a session and redirects the user
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/timeline";

  // Build the redirect URL
  const redirectTo = request.nextUrl.clone();
  redirectTo.pathname = next;
  redirectTo.searchParams.delete("token_hash");
  redirectTo.searchParams.delete("type");
  redirectTo.searchParams.delete("next");

  if (token_hash && type) {
    // Create a Supabase client for verification
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error && data.session) {
      // For recovery type, we need to pass the session to the client
      // The reset-password page will pick up the session from the URL hash
      if (type === "recovery") {
        // Redirect with the access token in the hash so the client can use it
        redirectTo.hash = `access_token=${data.session.access_token}&refresh_token=${data.session.refresh_token}&type=recovery`;
      }
      return NextResponse.redirect(redirectTo);
    }

    // If verification failed, log the error for debugging
    console.error("Token verification failed:", error?.message);
  }

  // Return the user to an error page with instructions
  redirectTo.pathname = "/auth/forgot-password";
  redirectTo.searchParams.set("error", "invalid_token");
  return NextResponse.redirect(redirectTo);
}
