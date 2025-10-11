import sharp from "sharp";

/**
 * Process and sanitize uploaded images
 * - Strips EXIF metadata (including GPS location data)
 * - Converts to standard format (JPEG or PNG)
 * - Optionally resizes to reasonable dimensions
 * - Optimizes file size
 */
export async function processImage(
  buffer: Buffer,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: "jpeg" | "png" | "webp";
  } = {},
): Promise<{ buffer: Buffer; contentType: string }> {
  const {
    maxWidth = 2400, // Max width for photos
    maxHeight = 2400, // Max height for photos
    quality = 85, // JPEG quality (1-100)
    format = "jpeg", // Default to JPEG for photos
  } = options;

  try {
    let pipeline = sharp(buffer);

    // Get image metadata to check dimensions
    const metadata = await pipeline.metadata();

    // Resize if image exceeds max dimensions (maintains aspect ratio)
    if (
      metadata.width &&
      metadata.height &&
      (metadata.width > maxWidth || metadata.height > maxHeight)
    ) {
      pipeline = pipeline.resize(maxWidth, maxHeight, {
        fit: "inside", // Maintain aspect ratio
        withoutEnlargement: true, // Don't upscale smaller images
      });
    }

    // Convert to specified format and strip all metadata
    let outputPipeline;
    let contentType: string;

    switch (format) {
      case "png":
        outputPipeline = pipeline.png({
          compressionLevel: 9, // Maximum compression
          palette: true, // Use palette if possible for smaller file size
        });
        contentType = "image/png";
        break;

      case "webp":
        outputPipeline = pipeline.webp({
          quality,
          effort: 6, // Compression effort (0-6, higher = smaller file)
        });
        contentType = "image/webp";
        break;

      case "jpeg":
      default:
        outputPipeline = pipeline.jpeg({
          quality,
          progressive: true, // Progressive JPEG for better loading
          mozjpeg: true, // Use mozjpeg for better compression
        });
        contentType = "image/jpeg";
        break;
    }

    // Strip ALL metadata including EXIF, GPS, ICC profile, etc.
    // This is critical for privacy - removes location data, camera info, timestamps
    const processedBuffer = await outputPipeline
      .withMetadata({
        // Remove all metadata by providing empty metadata object
        exif: {}, // Remove EXIF data (camera settings, timestamps)
        icc: undefined, // Remove color profile
        // orientation: undefined, // Sharp auto-rotates based on EXIF, then strips
      })
      .toBuffer();

    return {
      buffer: processedBuffer,
      contentType,
    };
  } catch (error) {
    console.error("Image processing error:", error);
    throw new Error(
      `Failed to process image: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Validate that the uploaded file is actually an image
 * Prevents malicious files disguised as images
 */
export async function validateImage(buffer: Buffer): Promise<boolean> {
  try {
    const metadata = await sharp(buffer).metadata();

    // Check if Sharp can read the image and it has valid dimensions
    if (!metadata.width || !metadata.height) {
      return false;
    }

    // Check for supported formats
    const supportedFormats = ["jpeg", "png", "webp", "gif", "tiff", "svg"];
    if (!metadata.format || !supportedFormats.includes(metadata.format)) {
      return false;
    }

    // Check for reasonable dimensions (not too small, not absurdly large)
    if (
      metadata.width < 10 ||
      metadata.height < 10 ||
      metadata.width > 20000 ||
      metadata.height > 20000
    ) {
      return false;
    }

    return true;
  } catch (error) {
    // If Sharp can't process it, it's not a valid image
    return false;
  }
}

/**
 * Get image information without processing
 */
export async function getImageInfo(buffer: Buffer) {
  try {
    const metadata = await sharp(buffer).metadata();
    return {
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      size: buffer.length,
      hasEXIF: !!metadata.exif,
      hasGPS: metadata.exif && (metadata.exif as any).GPSLatitude !== undefined,
    };
  } catch (error) {
    throw new Error("Failed to read image metadata");
  }
}
