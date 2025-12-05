// SECURITY: Use centralized admin client (enforces server-only via import)
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Checks if a user has consented to AI processing
 * @param userId - The user's ID
 * @returns true if AI processing is enabled, false otherwise
 */
export async function hasAIConsent(userId: string): Promise<boolean> {
  try {
    const supabase = supabaseAdmin;

    const { data, error } = await supabase
      .from("users")
      .select("ai_processing_enabled")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("[AI Consent Check] Error:", error);
      // Default to true on error to avoid breaking existing functionality
      // Better to process than block on DB errors
      return true;
    }

    // Default to true if column doesn't exist yet (backward compatibility)
    return data?.ai_processing_enabled ?? true;
  } catch (error) {
    console.error("[AI Consent Check] Unexpected error:", error);
    // Default to true on error to avoid breaking existing functionality
    return true;
  }
}

/**
 * Checks AI consent and returns an error response if disabled
 * Use this in API routes to guard AI operations
 *
 * @param userId - The user's ID
 * @returns null if consent given, or an error object to return
 *
 * @example
 * const consentError = await checkAIConsentOrError(user.id);
 * if (consentError) {
 *   return NextResponse.json(consentError, { status: 403 });
 * }
 */
export async function checkAIConsentOrError(
  userId: string
): Promise<{ error: string; code: string } | null> {
  const hasConsent = await hasAIConsent(userId);

  if (!hasConsent) {
    return {
      error:
        "AI processing is disabled for your account. Enable it in Settings to use this feature.",
      code: "AI_PROCESSING_DISABLED",
    };
  }

  return null;
}

/**
 * Client-side hook to check AI consent status
 * Returns the consent status and a loading state
 */
export async function getAIConsentStatus(
  token: string
): Promise<{ enabled: boolean; error?: string }> {
  try {
    const response = await fetch("/api/user/ai-settings", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return { enabled: true, error: "Failed to check AI settings" };
    }

    const data = await response.json();
    return { enabled: data.ai_processing_enabled ?? true };
  } catch (error) {
    console.error("[AI Consent Client] Error:", error);
    return { enabled: true, error: "Failed to check AI settings" };
  }
}

/**
 * Client-side function to update AI consent
 */
export async function updateAIConsent(
  token: string,
  enabled: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch("/api/user/ai-settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ai_processing_enabled: enabled }),
    });

    if (!response.ok) {
      const data = await response.json();
      return { success: false, error: data.error || "Failed to update settings" };
    }

    return { success: true };
  } catch (error) {
    console.error("[AI Consent Update] Error:", error);
    return { success: false, error: "Failed to update settings" };
  }
}
