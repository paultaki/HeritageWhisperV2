import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import { checkAIConsentOrError } from "@/lib/aiConsent";
import {
  PathResult,
  calculateAssemblyAICost,
  calculateWhisperCost,
  calculateGPT4oMiniCost,
  estimateAudioDuration,
  countWords,
  withTimeout,
} from "@/lib/audioTestUtils";

export const maxDuration = 120; // Allow 2 minutes for parallel processing
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
 * Path A: Current Production (AssemblyAI + GPT-4o-mini)
 * Expected: 7-9s total
 */
async function pathA_AssemblyAI(audioBuffer: Buffer, token: string): Promise<PathResult> {
  const startTime = Date.now();
  
  try {
    logger.api("[PathA] Starting AssemblyAI transcription");
    
    // Call existing AssemblyAI endpoint
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
      throw new Error(`AssemblyAI failed: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    const endTime = Date.now();
    
    // Extract timing from response metadata
    const transcriptionMs = result._meta?.transcriptionLatencyMs || 0;
    const formattingMs = result._meta?.formattingLatencyMs || 0;
    const totalMs = endTime - startTime;
    
    // Calculate costs
    const durationMinutes = estimateAudioDuration(audioBuffer.length);
    const transcriptionCost = calculateAssemblyAICost(durationMinutes);
    const formattingCost = calculateGPT4oMiniCost(result.transcription?.length || 0);
    
    return {
      pathName: 'Path A: AssemblyAI (Current)',
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
 * Path C: Whisper Comparison
 * Expected: 13-16s total
 */
async function pathC_Whisper(audioBuffer: Buffer, token: string): Promise<PathResult> {
  const startTime = Date.now();
  
  try {
    logger.api("[PathC] Starting Whisper transcription");
    
    // Call new Whisper endpoint
    const formData = new FormData();
    const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' });
    formData.append('audio', audioBlob, 'test-audio.webm');
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/transcribe-whisper`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Whisper failed: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    const endTime = Date.now();
    
    // Extract timing from response metadata
    const transcriptionMs = result._meta?.transcriptionLatencyMs || 0;
    const formattingMs = result._meta?.formattingLatencyMs || 0;
    const totalMs = endTime - startTime;
    
    // Calculate costs
    const durationMinutes = estimateAudioDuration(audioBuffer.length);
    const transcriptionCost = calculateWhisperCost(durationMinutes);
    const formattingCost = calculateGPT4oMiniCost(result.transcription?.length || 0);
    
    return {
      pathName: 'Path C: Whisper',
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
      },
    };
  } catch (error) {
    const endTime = Date.now();
    logger.error("[PathC] Error:", error);
    
    return {
      pathName: 'Path C: Whisper',
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
 * Orchestrates parallel testing of two transcription paths:
 * - Path A: AssemblyAI (current production)
 * - Path C: OpenAI Whisper
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
        pathC_Whisper(audioBuffer, token),
        60000, // 60s timeout
        'PathC'
      ),
    ]);
    
    const testTotalTime = Date.now() - testStartTime;
    
    // Process results
    const pathAResult = results[0];
    const pathCResult = results[1];
    
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
    
    const pathC: PathResult = pathCResult.status === 'fulfilled'
      ? pathCResult.value
      : {
          pathName: 'Path C: Whisper',
          status: pathCResult.status === 'rejected' && pathCResult.reason?.message?.includes('timeout')
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
          error: pathCResult.status === 'rejected'
            ? (pathCResult.reason?.message || 'Unknown error')
            : undefined,
        };
    
    logger.api("[TestAudioProcessing] Test completed", {
      userId: user.id,
      testTotalTimeMs: testTotalTime,
      pathAStatus: pathA.status,
      pathCStatus: pathC.status,
      pathATime: pathA.timing.totalMs,
      pathCTime: pathC.timing.totalMs,
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
        pathC,
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
