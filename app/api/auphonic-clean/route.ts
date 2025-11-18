import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import { checkAIConsentOrError } from "@/lib/aiConsent";

export const maxDuration = 180; // Allow 3 minutes for Auphonic processing
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const AUPHONIC_API_KEY = process.env.AUPHONIC_API_KEY;
const AUPHONIC_CLEANER_PRESET_ID = process.env.AUPHONIC_CLEANER_PRESET_ID;
const AUPHONIC_CUTTER_PRESET_ID = process.env.AUPHONIC_CUTTER_PRESET_ID;

if (!AUPHONIC_API_KEY) {
  logger.warn("[AuphonicClean] AUPHONIC_API_KEY not set - Auphonic features disabled");
}

interface AuphonicProduction {
  uuid: string;
  status: string; // 'waiting', 'processing', 'done', 'error'
  status_string: string;
  output_files?: Array<{
    format: string;
    download_url: string;
    size: number;
  }>;
  error_message?: string;
  error_status?: string;
}

/**
 * Create Auphonic production with optimal settings for storytelling
 * @param audioBuffer - Audio file buffer
 * @param presetId - Optional preset ID to use instead of manual algorithms
 * @param mode - 'cleaner' or 'cutter' (determines which algorithms to use if no preset)
 */
async function createAuphonicProduction(
  audioBuffer: Buffer, 
  presetId?: string,
  mode: 'cleaner' | 'cutter' = 'cleaner'
): Promise<string> {
  let productionConfig: any = {
    output_files: [
      { format: 'mp3', bitrate: '128' }
    ],
    metadata: {
      title: `Heritage Whisper Audio Test - ${mode}`,
    },
  };

  // If preset ID is provided, use that instead of manual algorithms
  if (presetId) {
    productionConfig.preset = presetId;
    logger.api("[AuphonicClean] Using preset:", presetId);
  } else {
    // Configure algorithms based on mode
    if (mode === 'cleaner') {
      // Cleaner mode: Focus on audio quality enhancement
      productionConfig.algorithms = {
        // Volume normalization
        leveler: true,
        normloudness: true,
        loudnesstarget: -19, // Good for podcast/storytelling
        
        // Noise reduction
        denoise: true,
        denoisemethod: "speech_isolation", // Best for voice
        denoiseamount: 6, // Moderate noise reduction (dB)
        dehum: 60, // Remove 60Hz hum (US power standard)
        
        // Basic filtering
        filtering: true,
      };
    } else {
      // Cutter mode: Focus on removing unwanted content
      productionConfig.algorithms = {
        // Filler word removal
        filler_cutter: true,
        cough_cutter: true,
        silence_cutter: true,
        cut_mode: "apply_cuts", // Apply cuts to audio (vs just marking)
        
        // Basic normalization
        leveler: true,
        normloudness: true,
        loudnesstarget: -19,
      };
    }
  }

  // Create production with settings
  const createResponse = await fetch('https://auphonic.com/api/productions.json', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AUPHONIC_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(productionConfig),
  });

  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    throw new Error(`Failed to create Auphonic production: ${createResponse.status} - ${errorText}`);
  }

  const createData = await createResponse.json() as { data: { uuid: string } };
  const productionUuid = createData.data.uuid;

  logger.api("[AuphonicClean] ✅ Step 1/4: Created production:", productionUuid);

  // Upload the audio file to the production using native FormData
  const uploadFormData = new FormData();
  const audioBlob = new Blob([new Uint8Array(audioBuffer)], { type: 'audio/webm' });
  uploadFormData.append('input_file', audioBlob, 'audio.webm');

  const uploadResponse = await fetch(`https://auphonic.com/api/production/${productionUuid}/upload.json`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AUPHONIC_API_KEY}`,
    },
    body: uploadFormData,
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    throw new Error(`Failed to upload audio to Auphonic: ${uploadResponse.status} - ${errorText}`);
  }

  logger.api("[AuphonicClean] ✅ Step 2/4: Uploaded audio to production:", productionUuid);

  // Start the production
  const startResponse = await fetch(`https://auphonic.com/api/production/${productionUuid}/start.json`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AUPHONIC_API_KEY}`,
    },
  });

  if (!startResponse.ok) {
    const errorText = await startResponse.text();
    throw new Error(`Failed to start Auphonic production: ${startResponse.status} - ${errorText}`);
  }

  logger.api("[AuphonicClean] ✅ Step 3/4: Started production:", productionUuid);

  return productionUuid;
}

/**
 * Poll Auphonic production status until complete
 */
async function pollProductionStatus(productionUuid: string, maxAttempts = 36): Promise<AuphonicProduction> {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const statusResponse = await fetch(`https://auphonic.com/api/production/${productionUuid}.json`, {
      headers: {
        'Authorization': `Bearer ${AUPHONIC_API_KEY}`,
      },
    });

    if (!statusResponse.ok) {
      throw new Error(`Failed to check Auphonic status: ${statusResponse.status}`);
    }

    const statusData = await statusResponse.json() as { data: AuphonicProduction };
    const production = statusData.data;

    logger.api("[AuphonicClean] Poll attempt", attempts + 1, "/", maxAttempts, "- status:", production.status, "- status_string:", production.status_string);

    // Check status_string for completion (most reliable)
    if (production.status_string === 'Done') {
      logger.api("[AuphonicClean] ✅ Production completed!", {
        uuid: productionUuid,
        status: production.status,
        outputFiles: production.output_files?.length || 0,
      });
      return production;
    }

    // Check for ACTUAL errors (only if error_message or error_status exist)
    // Don't check status numbers - they're unreliable
    if (production.error_message || production.error_status) {
      logger.error("[AuphonicClean] ❌ Auphonic error:", {
        status: production.status,
        status_string: production.status_string,
        error_message: production.error_message,
        error_status: production.error_status,
      });
      throw new Error(`Auphonic processing failed: ${production.error_message || production.error_status}`);
    }
    
    // Otherwise, still processing (Waiting, Audio Processing, Encoding, etc.)
    logger.api("[AuphonicClean] ⏳ Still processing, waiting 5s...");

    // Wait 5 seconds before next poll
    await new Promise(resolve => setTimeout(resolve, 5000));
    attempts++;
  }

  throw new Error('Auphonic processing timeout - took longer than 3 minutes');
}

/**
 * Download cleaned audio from Auphonic
 */
async function downloadCleanedAudio(downloadUrl: string): Promise<Buffer> {
  logger.api("[AuphonicClean] 📥 Fetching cleaned audio from:", downloadUrl.substring(0, 80) + "...");
  
  // Add authentication to download request
  const response = await fetch(downloadUrl, {
    headers: {
      'Authorization': `Bearer ${AUPHONIC_API_KEY}`,
    },
  });
  
  if (!response.ok) {
    logger.error("[AuphonicClean] ❌ Download failed:", response.status, response.statusText);
    throw new Error(`Failed to download cleaned audio: ${response.status}`);
  }

  logger.api("[AuphonicClean] 📦 Converting to buffer...");
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  logger.api("[AuphonicClean] ✅ Downloaded:", buffer.length, "bytes");
  
  return buffer;
}

/**
 * Auphonic Audio Cleaning API
 * 
 * Supports two modes via query parameter ?mode=cleaner|cutter:
 * 
 * CLEANER MODE (default):
 * - Adaptive leveler
 * - Loudness normalization
 * - Noise reduction (speech isolation)
 * - Hum removal
 * 
 * CUTTER MODE:
 * - Filler word removal ("um", "uh", "like")
 * - Cough removal
 * - Silence cutting
 * - Basic normalization
 * 
 * Or use ?preset=<uuid> to use an existing Auphonic preset.
 * 
 * PERFORMANCE: ~30s-2min for 5min audio (depends on queue and complexity)
 * COST: Free tier (2hr/month), then $11/9hr
 * 
 * NOTE: Processing time varies based on:
 * - Audio length
 * - Auphonic server queue
 * - Complexity of algorithms enabled
 */
export async function POST(request: NextRequest) {
  logger.debug("[AuphonicClean] POST request received");
  
  // Get mode or preset from query parameters
  const url = new URL(request.url);
  const mode = (url.searchParams.get('mode') as 'cleaner' | 'cutter') || 'cleaner';
  const presetId = url.searchParams.get('preset') || undefined;

  if (!AUPHONIC_API_KEY) {
    return NextResponse.json(
      { error: "Auphonic integration not configured. Please set AUPHONIC_API_KEY." },
      { status: 503 }
    );
  }

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
      return NextResponse.json(
        { error: "Invalid authentication" },
        { status: 401 }
      );
    }

    // Check AI consent
    const consentError = await checkAIConsentOrError(user.id);
    if (consentError) {
      logger.warn("[AuphonicClean] AI consent denied for user:", user.id);
      return NextResponse.json(consentError, { status: 403 });
    }

    // Extract audio from FormData
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      logger.error("[AuphonicClean] No audio file in FormData");
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    const arrayBuffer = await audioFile.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    // Validate file size (Auphonic limit is larger, but be reasonable)
    const MAX_SIZE = 100 * 1024 * 1024; // 100MB
    if (audioBuffer.length > MAX_SIZE) {
      return NextResponse.json(
        {
          error: `Audio file too large. Maximum size is 100MB, got ${(audioBuffer.length / 1024 / 1024).toFixed(1)}MB`,
        },
        { status: 400 }
      );
    }

    logger.api("[AuphonicClean] Starting audio cleaning", {
      userId: user.id,
      fileSize: audioBuffer.length,
      mode,
      presetId,
    });

    const startTime = Date.now();

    // Step 1: Create and start Auphonic production
    const createStart = Date.now();
    const productionUuid = await createAuphonicProduction(audioBuffer, presetId, mode);
    const createLatency = Date.now() - createStart;

    // Step 2: Poll until processing is complete
    logger.api("[AuphonicClean] 🔄 Step 4/4: Starting polling...");
    const pollStart = Date.now();
    const production = await pollProductionStatus(productionUuid);
    const pollLatency = Date.now() - pollStart;
    logger.api("[AuphonicClean] ✅ Polling complete in", pollLatency + "ms");

    // Step 3: Download cleaned audio
    logger.api("[AuphonicClean] 📥 Step 5/4: Downloading cleaned audio...");
    const downloadStart = Date.now();
    const mp3Output = production.output_files?.find(f => f.format === 'mp3');
    
    if (!mp3Output?.download_url) {
      logger.error("[AuphonicClean] ❌ No MP3 output file!", { production });
      throw new Error('No MP3 output file found in Auphonic production');
    }
    
    logger.api("[AuphonicClean] Download URL:", mp3Output.download_url);

    const cleanedAudioBuffer = await downloadCleanedAudio(mp3Output.download_url);
    const downloadLatency = Date.now() - downloadStart;
    logger.api("[AuphonicClean] ✅ Download complete!", { 
      downloadLatencyMs: downloadLatency,
      sizeBytes: cleanedAudioBuffer.length 
    });

    const totalLatency = Date.now() - startTime;

    // Convert cleaned audio to base64 for response
    const cleanedAudioBase64 = cleanedAudioBuffer.toString('base64');

    logger.api("[AuphonicClean] Success", {
      userId: user.id,
      productionUuid,
      createLatencyMs: createLatency,
      pollLatencyMs: pollLatency,
      downloadLatencyMs: downloadLatency,
      totalLatencyMs: totalLatency,
      originalSizeBytes: audioBuffer.length,
      cleanedSizeBytes: cleanedAudioBuffer.length,
    });

    return NextResponse.json({
      success: true,
      productionUuid,
      cleanedAudioBase64,
      cleanedAudioSize: cleanedAudioBuffer.length,
      originalAudioSize: audioBuffer.length,
      _meta: {
        createLatencyMs: createLatency,
        pollLatencyMs: pollLatency,
        downloadLatencyMs: downloadLatency,
        totalLatencyMs: totalLatency,
        auphonicStatus: production.status_string,
      },
    });
  } catch (error) {
    logger.error("[AuphonicClean] ERROR:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to clean audio",
      },
      { status: 500 }
    );
  }
}
