// app/api/realtime-session/route.ts
import { NextRequest, NextResponse } from "next/server";
// import { getServerSession } from "@/lib/auth";
// import { rateLimit } from "@/lib/ratelimit";
// import { logger } from "@/lib/logger";

export async function POST(_req: NextRequest) {
  try {
    // 1) Auth and rate limit (uncomment when ready)
    // const session = await getServerSession();
    // if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // const { success } = await rateLimit.sessions.limit(session.user.id);
    // if (!success) return NextResponse.json({ error: "Rate limit" }, { status: 429 });

    // 2) Mint ephemeral client secret
    // Correct endpoint per GA docs: POST /v1/realtime/client_secrets
    // Returns client_secret.value and expires_at (~60s)
    const r = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // GA model names
        model: "gpt-realtime", // or "gpt-realtime-mini" to reduce cost
        modalities: ["text", "audio"],
        voice: "alloy",
      }),
    });

    if (!r.ok) {
      const text = await r.text();
      // logger?.error("[realtime-session] create failed", { status: r.status, text });
      return NextResponse.json({ error: "Failed to create client secret" }, { status: 500 });
    }

    const data = await r.json();
    const clientSecret = data?.client_secret?.value;
    const expiresAt = data?.client_secret?.expires_at;

    if (!clientSecret) {
      return NextResponse.json({ error: "No client secret in response" }, { status: 500 });
    }

    // 3) Return only the ephemeral token
    return NextResponse.json({ client_secret: clientSecret, expires_at: expiresAt }, { status: 200 });
  } catch (e) {
    // logger?.error("[realtime-session] exception", { e });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
