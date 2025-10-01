import { createClient } from "@supabase/supabase-js";
import { logger } from "./logger";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function testStorageBucket() {
  try {
    logger.info("Testing Supabase storage bucket configuration...");

    // Test listing files in the bucket
    const { data: files, error: listError } = await supabase.storage
      .from('heritage-whisper-files')
      .list('', {
        limit: 5,
        offset: 0,
      });

    if (listError) {
      logger.error("Storage bucket list error:", listError);
      return { success: false, error: listError.message };
    }

    logger.info("Storage bucket accessible. Files found:", files?.length || 0);

    // Test creating a signed URL (for an imaginary file)
    const testPath = 'test/test-file.txt';
    const { data: urlData, error: urlError } = await supabase.storage
      .from('heritage-whisper-files')
      .createSignedUrl(testPath, 60); // 60 seconds expiry

    if (urlError && !urlError.message.includes('not found')) {
      logger.error("Signed URL creation error:", urlError);
      return { success: false, error: urlError.message };
    }

    logger.info("Signed URL creation test completed");

    return {
      success: true,
      bucketAccessible: true,
      filesCount: files?.length || 0,
      canCreateSignedUrls: !urlError || urlError.message.includes('not found'),
    };
  } catch (error) {
    logger.error("Storage test error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export default testStorageBucket;