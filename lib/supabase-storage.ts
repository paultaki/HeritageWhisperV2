import { supabase } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase Storage Utilities for Audio Files
 *
 * Handles upload, download, and deletion of cleaned audio files
 * from Auphonic processing.
 */

const AUDIO_BUCKET = "heritage-whisper-files";

export interface AudioUploadResult {
  publicUrl: string;
  path: string;
  size: number;
}

/**
 * Upload audio file to Supabase Storage
 * @param audioBuffer - Audio file as Buffer
 * @param userId - User ID for folder structure
 * @param memoryId - Memory ID for file naming
 * @param client - Optional Supabase client (defaults to standard client)
 * @returns Public URL and file metadata
 */
export async function uploadAudioToSupabase(
  audioBuffer: Buffer,
  userId: string,
  memoryId: string,
  client?: SupabaseClient
): Promise<AudioUploadResult> {
  const supabaseClient = client || supabase;
  const timestamp = Date.now();
  const filePath = `audio/${userId}/${timestamp}-${memoryId}-cleaned.mp3`;

  console.log("[SupabaseStorage] Upload attempt:", {
    bucket: AUDIO_BUCKET,
    filePath,
    bufferSize: audioBuffer.length,
    usingCustomClient: !!client,
  });

  const { data, error } = await supabaseClient.storage
    .from(AUDIO_BUCKET)
    .upload(filePath, audioBuffer, {
      contentType: "audio/mpeg",
      upsert: true, // Allow re-recording to overwrite
    });

  if (error) {
    console.error("[SupabaseStorage] Upload error:", error);
    console.error("[SupabaseStorage] Error details:", {
      message: error.message,
      status: error.status,
      statusCode: error.statusCode,
    });
    throw new Error(`Failed to upload audio: ${error.message}`);
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabaseClient.storage.from(AUDIO_BUCKET).getPublicUrl(filePath);

  return {
    publicUrl,
    path: filePath,
    size: audioBuffer.length,
  };
}

/**
 * Delete audio file from Supabase Storage
 * @param userId - User ID
 * @param memoryId - Memory ID
 */
export async function deleteAudioFromSupabase(
  userId: string,
  memoryId: string
): Promise<void> {
  // List files in user's audio folder to find the file with this memoryId
  const folderPath = `audio/${userId}`;

  const { data: files, error: listError } = await supabase.storage
    .from(AUDIO_BUCKET)
    .list(folderPath);

  if (listError) {
    console.error("[SupabaseStorage] List error:", listError);
    throw new Error(`Failed to list audio files: ${listError.message}`);
  }

  // Find file matching the memoryId pattern
  const matchingFile = files?.find((file) => file.name.includes(memoryId));

  if (!matchingFile) {
    console.warn("[SupabaseStorage] No audio file found for memoryId:", memoryId);
    return; // Not an error - file may not exist
  }

  const filePath = `${folderPath}/${matchingFile.name}`;
  const { error } = await supabase.storage.from(AUDIO_BUCKET).remove([filePath]);

  if (error) {
    console.error("[SupabaseStorage] Delete error:", error);
    throw new Error(`Failed to delete audio: ${error.message}`);
  }
}

/**
 * Get public URL for existing audio file
 * @param userId - User ID
 * @param memoryId - Memory ID
 * @returns Public URL or empty string if not found
 */
export async function getAudioPublicUrl(
  userId: string,
  memoryId: string
): Promise<string> {
  // List files in user's audio folder to find the file with this memoryId
  const folderPath = `audio/${userId}`;

  const { data: files, error: listError } = await supabase.storage
    .from(AUDIO_BUCKET)
    .list(folderPath);

  if (listError) {
    console.error("[SupabaseStorage] List error:", listError);
    return "";
  }

  // Find file matching the memoryId pattern
  const matchingFile = files?.find((file) => file.name.includes(memoryId));

  if (!matchingFile) {
    console.warn("[SupabaseStorage] No audio file found for memoryId:", memoryId);
    return "";
  }

  const filePath = `${folderPath}/${matchingFile.name}`;
  const {
    data: { publicUrl },
  } = supabase.storage.from(AUDIO_BUCKET).getPublicUrl(filePath);

  return publicUrl;
}

/**
 * Check if audio file exists
 * @param userId - User ID
 * @param memoryId - Memory ID
 * @returns True if file exists
 */
export async function audioFileExists(
  userId: string,
  memoryId: string
): Promise<boolean> {
  const folderPath = `audio/${userId}`;

  const { data, error } = await supabase.storage
    .from(AUDIO_BUCKET)
    .list(folderPath);

  if (error) {
    console.error("[SupabaseStorage] Check existence error:", error);
    return false;
  }

  // Check if any file contains the memoryId
  return data?.some((file) => file.name.includes(memoryId)) || false;
}
