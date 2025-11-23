import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import { uploadAudioToSupabase } from "@/lib/supabase-storage";

import { getPasskeySession } from "@/lib/iron-session";
export const maxDuration = 180; // 3 minutes for parallel processing
export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Process audio with Auphonic cleaning
 */
async function processWithAuphonic(
  audioBuffer: Buffer,
  token: string
): Promise<Buffer> {
  const formData = new FormData();
  const audioBlob = new Blob([new Uint8Array(audioBuffer)], {
    type: "audio/webm",
  });
  formData.append("audio", audioBlob, "recording.webm");

  const auphonicPreset = process.env.AUPHONIC_CLEANER_PRESET_ID;
  const auphonicUrl = auphonicPreset
    ? `${
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
      }/api/auphonic-clean?preset=${auphonicPreset}`
    : `${
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
      }/api/auphonic-clean?mode=cleaner`;

  const response = await fetch(auphonicUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Auphonic failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json();

  if (!result.cleanedAudioBase64) {
    throw new Error("Auphonic response missing cleanedAudioBase64");
  }

  return Buffer.from(result.cleanedAudioBase64, "base64");
}

/**
 * Process audio with AssemblyAI transcription
 */
async function processWithAssemblyAI(
  audioBuffer: Buffer,
  token: string
): Promise<{
  text: string;
  transcription: string;
  lessonOptions?: {
    practical?: string;
    emotional?: string;
    character?: string;
  };
}> {
  const formData = new FormData();
  const audioBlob = new Blob([new Uint8Array(audioBuffer)], {
    type: "audio/webm",
  });
  formData.append("audio", audioBlob, "recording.webm");

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/transcribe`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AssemblyAI failed: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

export async function POST(request: NextRequest) {
  logger.debug("[ProcessRecording] POST request received");

  try {
    // Authenticate
    const authHeader = request.headers.get("authorization");
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      logger.error("[ProcessRecording] Auth error:", authError);
      return NextResponse.json(
        { error: "Invalid authentication" },
        { status: 401 }
      );
    }

    // Extract audio and memoryId from FormData
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;
    const memoryId = formData.get("memoryId") as string;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    if (!memoryId) {
      return NextResponse.json({ error: "Memory ID required" }, { status: 400 });
    }

    const arrayBuffer = await audioFile.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    logger.api("[ProcessRecording] Starting parallel processing", {
      userId: userId,
      memoryId,
      fileSize: audioBuffer.length,
    });

    // Process in parallel with fallback
    const [auphonicResult, transcriptionResult] = await Promise.allSettled([
      processWithAuphonic(audioBuffer, token),
      processWithAssemblyAI(audioBuffer, token),
    ]);

    // Determine which audio to use
    let audioToStore: Buffer;
    let audioSource: "auphonic" | "original";

    if (auphonicResult.status === "fulfilled") {
      logger.api("[ProcessRecording] Using Auphonic cleaned audio");
      audioToStore = auphonicResult.value;
      audioSource = "auphonic";
    } else {
      logger.warn(
        "[ProcessRecording] Auphonic failed, using original audio",
        {
          error:
            auphonicResult.reason instanceof Error
              ? auphonicResult.reason.message
              : String(auphonicResult.reason),
        }
      );
      audioToStore = audioBuffer;
      audioSource = "original";
    }

    // Check transcription
    if (transcriptionResult.status === "rejected") {
      logger.error("[ProcessRecording] Transcription failed", {
        error:
          transcriptionResult.reason instanceof Error
            ? transcriptionResult.reason.message
            : String(transcriptionResult.reason),
      });
      return NextResponse.json(
        { error: "Transcription failed. Please try again." },
        { status: 500 }
      );
    }

    // Upload to Supabase Storage (use admin client with service role to bypass RLS)
    const uploadResult = await uploadAudioToSupabase(
      audioToStore,
      userId,
      memoryId,
      supabaseAdmin
    );

    logger.api("[ProcessRecording] Processing complete", {
      audioUrl: uploadResult.publicUrl,
      audioSource,
      audioSize: uploadResult.size,
    });

    // Return results
    return NextResponse.json({
      success: true,
      audio: {
        url: uploadResult.publicUrl,
        source: audioSource,
        sizeBytes: uploadResult.size,
      },
      transcription: {
        text:
          transcriptionResult.value.text ||
          transcriptionResult.value.transcription,
        formatted:
          transcriptionResult.value.text ||
          transcriptionResult.value.transcription,
        lessons: transcriptionResult.value.lessonOptions || {
          practical:
            "Every experience teaches something if you're willing to learn from it",
          emotional: "The heart remembers what the mind forgets",
          character: "Who you become matters more than what you achieve",
        },
      },
    });
  } catch (error) {
    logger.error("[ProcessRecording] ERROR:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to process recording",
      },
      { status: 500 }
    );
  }
}
