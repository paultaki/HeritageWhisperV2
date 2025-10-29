import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import { checkAIConsentOrError } from "@/lib/aiConsent";
import {
  PathResult,
  calculateAssemblyAICost,
  calculateGPT4oMiniCost,
  estimateAudioDuration,
  countWords,
  withTimeout,
} from "@/lib/audioTestUtils";

export const maxDuration = 180; // Allow 3 minutes for parallel processing
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Path A: AssemblyAI transcription + GPT formatting/lessons
 * Expected: 7-9s total
 * Note: /api/transcribe handles AssemblyAI + GPT processing internally
 */
async function pathA_AssemblyAI(audioBuffer: Buffer, token: string): Promise<PathResult> {
  const startTime = Date.now();
  
  try {
    logger.api("[PathA] Starting AssemblyAI transcription + GPT processing");
    
    // Call transcribe endpoint (does AssemblyAI + GPT formatting + lessons)
    const formData = new FormData();
    const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' });
    formData.append('audio', audioBlob, 'test-audio.webm');
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/transcribe`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Transcription failed: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    const endTime = Date.now();
    
    logger.api("[PathA] ✅ Complete!", { totalMs: endTime - startTime });
    
    // Extract timing from response metadata
    const transcriptionMs = result._meta?.transcriptionLatencyMs || 0;
    const formattingMs = result._meta?.formattingLatencyMs || 0;
    const totalMs = endTime - startTime;
    
    // Calculate costs
    const durationMinutes = estimateAudioDuration(audioBuffer.length);
    const transcriptionCost = calculateAssemblyAICost(durationMinutes);
    const formattingCost = calculateGPT4oMiniCost(result.transcription?.length || 0);
    
    return {
      pathName: 'Path A: AssemblyAI + GPT',
      status: 'success',
      timing: {
        transcriptionMs,
        formattingMs,
        totalMs,
      },
      cost: {
        transcription: transcriptionCost,
        formatting: formattingCost,
        total: transcriptionCost + formattingCost,
      },
      quality: {
        transcription: result.text || result.transcription || '',
        formatted: result.text || result.transcription || '',
        lessons: result.lessonOptions || {
          practical: "Every experience teaches something if you're willing to learn from it",
          emotional: "The heart remembers what the mind forgets",
          character: "Who you become matters more than what you achieve",
        },
        wordCount: countWords(result.text || result.transcription || ''),
        confidence: result.confidence,
      },
    };
  } catch (error) {
    const endTime = Date.now();
    logger.error("[PathA] Error:", error);
    
    return {
      pathName: 'Path A: AssemblyAI (Current)',
      status: 'error',
      timing: {
        transcriptionMs: 0,
        formattingMs: 0,
        totalMs: endTime - startTime,
      },
      cost: {
        transcription: 0,
        formatting: 0,
        total: 0,
      },
      quality: {
        transcription: '',
        formatted: '',
        lessons: {
          practical: '',
          emotional: '',
          character: '',
        },
        wordCount: 0,
      },
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Path B: Auphonic Cleaner - Returns cleaned audio only (no transcription)
 * Expected: 30-40s total (Auphonic cleaning)
 */
async function pathB_AuphonicCleaner(audioBuffer: Buffer, token: string): Promise<PathResult> {
  const startTime = Date.now();
  
  try {
    logger.api("[PathB] Starting Auphonic Cleaner (leveler, loudness, noise)");
    
    // Clean audio with Auphonic (cleaner preset or mode)
    const auphonicFormData = new FormData();
    const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' });
    auphonicFormData.append('audio', audioBlob, 'test-audio.webm');
    
    // Use preset if available, otherwise use cleaner mode with built-in algorithms
    const auphonicCleanerPreset = process.env.AUPHONIC_CLEANER_PRESET_ID;
    const auphonicUrl = auphonicCleanerPreset
      ? `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auphonic-clean?preset=${auphonicCleanerPreset}`
      : `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auphonic-clean?mode=cleaner`;
    
    const auphonicResponse = await fetch(auphonicUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: auphonicFormData,
    });
    
    if (!auphonicResponse.ok) {
      const errorText = await auphonicResponse.text();
      throw new Error(`Auphonic cleaning failed: ${auphonicResponse.status} - ${errorText}`);
    }
    
    const auphonicResult = await auphonicResponse.json();
    const audioCleanMs = auphonicResult._meta?.totalLatencyMs || 0;
    const endTime = Date.now();
    
    logger.api("[PathB] ✅ Complete!", { totalMs: endTime - startTime });
    
    // Return cleaned audio (as base64 for storage/download)
    const cleanedAudioBuffer = Buffer.from(auphonicResult.cleanedAudioBase64, 'base64');
    const auphonicCost = 0; // Using free tier for testing
    
    return {
      pathName: 'Path B: Auphonic Cleaner (Audio Only)',
      status: 'success',
      timing: {
        audioCleanMs,
        totalMs: endTime - startTime,
      },
      cost: {
        audioCleaning: auphonicCost,
        total: auphonicCost,
      },
      quality: {
        cleanedAudioBase64: auphonicResult.cleanedAudioBase64,
        cleanedAudioSizeBytes: cleanedAudioBuffer.length,
      },
    };
  } catch (error) {
    const endTime = Date.now();
    logger.error("[PathB] Error:", error);
    
    return {
      pathName: 'Path B: Auphonic Cleaner (Audio Only)',
      status: 'error',
      timing: {
        audioCleanMs: 0,
        totalMs: endTime - startTime,
      },
      cost: {
        audioCleaning: 0,
        total: 0,
      },
      quality: {},
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Path C: Auphonic Cutter (silence, fillers, coughs)
 * Expected: 37-42s total (30s cutting + 7-9s transcription)
 */
async function pathC_AuphonicCutter(audioBuffer: Buffer, token: string): Promise<PathResult> {
  const startTime = Date.now();
  
  try {
    logger.api("[PathC] Starting Auphonic Cutter (silence, fillers, coughs)");
    
    // Step 1: Cut audio with Auphonic (cutter mode or preset)
    const auphonicFormData = new FormData();
    const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' });
    auphonicFormData.append('audio', audioBlob, 'test-audio.webm');
    
    // Use preset if available, otherwise use cutter mode
    const auphonicCutterPreset = process.env.AUPHONIC_CUTTER_PRESET_ID;
    const auphonicUrl = auphonicCutterPreset
      ? `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auphonic-clean?preset=${auphonicCutterPreset}`
      : `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auphonic-clean?mode=cutter`;
    
    const auphonicResponse = await fetch(auphonicUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: auphonicFormData,
    });
    
    if (!auphonicResponse.ok) {
      const errorText = await auphonicResponse.text();
      throw new Error(`Auphonic cutting failed: ${auphonicResponse.status} - ${errorText}`);
    }
    
    const auphonicResult = await auphonicResponse.json();
    const audioCleanMs = auphonicResult._meta?.totalLatencyMs || 0;
    logger.api("[PathC] ✅ Auphonic complete, starting transcription...");
    
    // Step 2: Transcribe cut audio with AssemblyAI
    const cleanedAudioBuffer = Buffer.from(auphonicResult.cleanedAudioBase64, 'base64');
    logger.api("[PathC] 📝 Sending to AssemblyAI...", { sizeBytes: cleanedAudioBuffer.length });
    
    const transcribeFormData = new FormData();
    const cleanedBlob = new Blob([cleanedAudioBuffer], { type: 'audio/mp3' });
    transcribeFormData.append('audio', cleanedBlob, 'cut-audio.mp3');
    
    const transcribeResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/transcribe`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: transcribeFormData,
    });
    
    if (!transcribeResponse.ok) {
      const errorText = await transcribeResponse.text();
      throw new Error(`AssemblyAI transcription failed: ${transcribeResponse.status} - ${errorText}`);
    }
    
    const transcribeResult = await transcribeResponse.json();
    const endTime = Date.now();
    logger.api("[PathC] ✅ Complete!", { totalMs: endTime - startTime });
    
    // Extract timing from response metadata
    const transcriptionMs = transcribeResult._meta?.transcriptionLatencyMs || 0;
    const formattingMs = transcribeResult._meta?.formattingLatencyMs || 0;
    const totalMs = endTime - startTime;
    
    // Calculate costs
    const durationMinutes = estimateAudioDuration(audioBuffer.length);
    const transcriptionCost = calculateAssemblyAICost(durationMinutes);
    const formattingCost = calculateGPT4oMiniCost(transcribeResult.transcription?.length || 0);
    const auphonicCost = 0; // Using free tier for testing
    
    return {
      pathName: 'Path C: Auphonic Cutter + AssemblyAI',
      status: 'success',
      timing: {
        transcriptionMs,
        formattingMs,
        audioCleanMs,
        totalMs,
      },
      cost: {
        transcription: transcriptionCost,
        formatting: formattingCost,
        audioCleaning: auphonicCost,
        total: transcriptionCost + formattingCost + auphonicCost,
      },
      quality: {
        transcription: transcribeResult.text || transcribeResult.transcription || '',
        formatted: transcribeResult.text || transcribeResult.transcription || '',
        lessons: transcribeResult.lessonOptions || {
          practical: "Every experience teaches something if you're willing to learn from it",
          emotional: "The heart remembers what the mind forgets",
          character: "Who you become matters more than what you achieve",
        },
        wordCount: countWords(transcribeResult.text || transcribeResult.transcription || ''),
        confidence: transcribeResult.confidence,
        cleanedAudioSizeBytes: auphonicResult.cleanedAudioSize,
      },
    };
  } catch (error) {
    const endTime = Date.now();
    logger.error("[PathC] Error:", error);
    
    return {
      pathName: 'Path C: Auphonic Cutter + AssemblyAI',
      status: 'error',
      timing: {
        transcriptionMs: 0,
        formattingMs: 0,
        totalMs: endTime - startTime,
      },
      cost: {
        transcription: 0,
        formatting: 0,
        total: 0,
      },
      quality: {
        transcription: '',
        formatted: '',
        lessons: {
          practical: '',
          emotional: '',
          character: '',
        },
        wordCount: 0,
      },
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Audio Processing Testing API
 * 
 * Orchestrates parallel testing of three transcription paths:
 * - Path A: AssemblyAI (current production)
 * - Path B: Auphonic Cleaner + AssemblyAI (leveler, loudness, noise)
 * - Path C: Auphonic Cutter + AssemblyAI (silence, fillers, coughs)
 * 
 * Returns timing, cost, and quality metrics for comparison.
 */
export async function POST(request: NextRequest) {
  logger.debug("[TestAudioProcessing] POST request received");
  
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
      logger.warn("[TestAudioProcessing] AI consent denied for user:", user.id);
      return NextResponse.json(consentError, { status: 403 });
    }
    
    // Extract audio from FormData
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;
    
    if (!audioFile) {
      logger.error("[TestAudioProcessing] No audio file in FormData");
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }
    
    const arrayBuffer = await audioFile.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);
    
    // Validate file size
    const MAX_SIZE = 25 * 1024 * 1024; // 25MB (Whisper limit)
    if (audioBuffer.length > MAX_SIZE) {
      return NextResponse.json(
        {
          error: `Audio file too large. Maximum size is 25MB, got ${(audioBuffer.length / 1024 / 1024).toFixed(1)}MB`,
        },
        { status: 400 }
      );
    }
    
    logger.api("[TestAudioProcessing] Starting parallel test", {
      userId: user.id,
      fileSize: audioBuffer.length,
      estimatedDuration: estimateAudioDuration(audioBuffer.length),
    });
    
    // Execute both paths in parallel with timeout
    const testStartTime = Date.now();
    
    const results = await Promise.allSettled([
      withTimeout(
        pathA_AssemblyAI(audioBuffer, token),
        60000, // 60s timeout
        'PathA'
      ),
      withTimeout(
        pathB_AuphonicCleaner(audioBuffer, token),
        150000, // 150s timeout (Auphonic can take 2-3 minutes)
        'PathB'
      ),
    ]);
    
    const testTotalTime = Date.now() - testStartTime;
    
    // Process results
    const pathAResult = results[0];
    const pathBResult = results[1];
    
    const pathA: PathResult = pathAResult.status === 'fulfilled'
      ? pathAResult.value
      : {
          pathName: 'Path A: AssemblyAI (Current)',
          status: pathAResult.status === 'rejected' && pathAResult.reason?.message?.includes('timeout')
            ? 'timeout'
            : 'error',
          timing: { transcriptionMs: 0, formattingMs: 0, totalMs: 60000 },
          cost: { transcription: 0, formatting: 0, total: 0 },
          quality: {
            transcription: '',
            formatted: '',
            lessons: { practical: '', emotional: '', character: '' },
            wordCount: 0,
          },
          error: pathAResult.status === 'rejected'
            ? (pathAResult.reason?.message || 'Unknown error')
            : undefined,
        };
    
    const pathB: PathResult = pathBResult.status === 'fulfilled'
      ? pathBResult.value
      : {
          pathName: 'Path B: Auphonic Cleaner + AssemblyAI',
          status: pathBResult.status === 'rejected' && pathBResult.reason?.message?.includes('timeout')
            ? 'timeout'
            : 'error',
          timing: { transcriptionMs: 0, formattingMs: 0, totalMs: 150000 },
          cost: { transcription: 0, formatting: 0, total: 0 },
          quality: {
            transcription: '',
            formatted: '',
            lessons: { practical: '', emotional: '', character: '' },
            wordCount: 0,
          },
          error: pathBResult.status === 'rejected'
            ? (pathBResult.reason?.message || 'Unknown error')
            : undefined,
        };
    
    logger.api("[TestAudioProcessing] Test completed", {
      userId: user.id,
      testTotalTimeMs: testTotalTime,
      pathAStatus: pathA.status,
      pathBStatus: pathB.status,
      pathATime: pathA.timing.totalMs,
      pathBTime: pathB.timing.totalMs,
    });
    
    return NextResponse.json({
      success: true,
      testTotalTimeMs: testTotalTime,
      audioMetadata: {
        fileSizeBytes: audioBuffer.length,
        estimatedDurationMinutes: estimateAudioDuration(audioBuffer.length),
      },
      results: {
        pathA,
        pathB,
      },
    });
  } catch (error) {
    logger.error("[TestAudioProcessing] ERROR:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to process audio test",
      },
      { status: 500 }
    );
  }
}
