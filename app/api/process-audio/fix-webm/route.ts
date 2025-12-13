import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import { existsSync } from 'fs';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getPasskeySession } from '@/lib/iron-session';
import { logger } from '@/lib/logger';

const execAsync = promisify(exec);

/**
 * Fix WebM files with broken duration metadata.
 * 
 * MediaRecorder creates WebM files with incorrect duration in the header
 * (often showing as 0.059s). This endpoint uses FFmpeg to remux the file,
 * which fixes the duration metadata.
 * 
 * POST /api/process-audio/fix-webm
 * Body: { audioUrl: string } - URL of the WebM file to fix
 * Returns: { url: string, durationSeconds: number } - URL of the fixed file
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    let userId: string | undefined;

    const passkeySession = await getPasskeySession();
    if (passkeySession) {
      userId = passkeySession.userId;
    } else {
      const authHeader = request.headers.get('authorization');
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }

      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
      if (authError || !user) {
        return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
      }
      userId = user.id;
    }

    const body = await request.json();
    const { audioUrl } = body;

    if (!audioUrl) {
      return NextResponse.json({ error: 'audioUrl is required' }, { status: 400 });
    }

    logger.info('[fix-webm] Processing:', audioUrl);

    // Setup temp directory
    const tempDir = join(process.cwd(), 'tmp', 'audio-processing');
    if (!existsSync(tempDir)) {
      await mkdir(tempDir, { recursive: true });
    }

    // Download the audio file
    const response = await fetch(audioUrl);
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch audio file' }, { status: 400 });
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const inputId = uuidv4();
    const inputFilePath = join(tempDir, `${inputId}-input.webm`);
    const outputFilePath = join(tempDir, `${inputId}-fixed.webm`);

    await writeFile(inputFilePath, buffer);

    // Use FFmpeg to remux the file - this fixes the duration metadata
    // The -fflags +genpts ensures proper timestamps are generated
    // -c copy does a fast remux without re-encoding
    const command = `ffmpeg -y -fflags +genpts -i "${inputFilePath}" -c copy -f webm "${outputFilePath}" 2>&1`;
    
    logger.info('[fix-webm] Running FFmpeg:', command);
    
    try {
      const { stdout, stderr } = await execAsync(command, { timeout: 60000 });
      logger.debug('[fix-webm] FFmpeg output:', stdout || stderr);
    } catch (ffmpegError: unknown) {
      // FFmpeg outputs to stderr even on success, so check if output file exists
      if (!existsSync(outputFilePath)) {
        logger.error('[fix-webm] FFmpeg failed:', ffmpegError);
        
        // Try alternative approach: re-encode the audio
        const reencodeCommand = `ffmpeg -y -i "${inputFilePath}" -c:a libopus -b:a 128k -f webm "${outputFilePath}" 2>&1`;
        logger.info('[fix-webm] Trying re-encode:', reencodeCommand);
        
        try {
          await execAsync(reencodeCommand, { timeout: 120000 });
        } catch (reencodeError) {
          logger.error('[fix-webm] Re-encode also failed:', reencodeError);
          await unlink(inputFilePath).catch(() => {});
          return NextResponse.json({ error: 'FFmpeg processing failed' }, { status: 500 });
        }
      }
    }

    // Read the fixed file
    const fixedBuffer = await readFile(outputFilePath);
    
    // Get duration from FFmpeg probe
    let durationSeconds = 0;
    try {
      const probeCommand = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${outputFilePath}"`;
      const { stdout } = await execAsync(probeCommand);
      durationSeconds = parseFloat(stdout.trim()) || 0;
      logger.info('[fix-webm] Detected duration:', durationSeconds, 'seconds');
    } catch (probeError) {
      logger.warn('[fix-webm] Could not probe duration:', probeError);
    }

    // Upload to Supabase with a new filename
    const timestamp = Date.now();
    const filename = `audio/${userId}/${timestamp}-fixed.webm`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('heritage-whisper-files')
      .upload(filename, fixedBuffer, {
        contentType: 'audio/webm',
        upsert: false,
      });

    if (uploadError) {
      logger.error('[fix-webm] Upload error:', uploadError);
      await unlink(inputFilePath).catch(() => {});
      await unlink(outputFilePath).catch(() => {});
      return NextResponse.json({ error: 'Failed to upload fixed audio' }, { status: 500 });
    }

    // Get public URL
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('heritage-whisper-files')
      .getPublicUrl(filename);

    // Cleanup temp files
    await unlink(inputFilePath).catch(() => {});
    await unlink(outputFilePath).catch(() => {});

    logger.info('[fix-webm] Success! New URL:', publicUrlData.publicUrl);

    return NextResponse.json({
      url: publicUrlData.publicUrl,
      durationSeconds,
      originalUrl: audioUrl,
    });

  } catch (error) {
    logger.error('[fix-webm] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process audio' },
      { status: 500 }
    );
  }
}
