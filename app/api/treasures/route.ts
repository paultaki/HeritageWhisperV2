import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * GET /api/treasures - Fetch user's treasures
 *
 * Query params:
 * - storyteller_id (optional): For family sharing
 *
 * Supports dual authentication:
 * - JWT token (authenticated users)
 * - Session token (family viewers)
 */
export async function GET(request: NextRequest) {
  try {
    // Validate session - get token from Authorization header
    const authHeader = request.headers.get("authorization");
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get storyteller_id (for family sharing)
    const { searchParams } = new URL(request.url);
    const requestedStorytellerUserGuess = searchParams.get("storyteller_id");

    // Try JWT authentication first (for account owners)
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    let storytellerId: string;
    let isAuthenticated = false;

    if (user && !authError) {
      // JWT authentication successful (account owner)
      storytellerId = requestedStorytellerUserGuess || user.id;
      isAuthenticated = true;

      // Check family sharing access if viewing someone else's treasures
      if (storytellerId !== user.id) {
        const { data: hasAccess } = await supabaseAdmin.rpc(
          "has_collaboration_access",
          {
            p_user_id: user.id,
            p_storyteller_id: storytellerId,
          }
        );

        if (!hasAccess) {
          return NextResponse.json(
            { error: "Access denied" },
            { status: 403 }
          );
        }
      }
    } else {
      // JWT failed - try family session token
      const { data: familySession, error: sessionError } = await supabaseAdmin
        .from("family_sessions")
        .select(`
          id,
          family_member_id,
          expires_at,
          family_members!inner (
            id,
            user_id,
            email,
            name,
            relationship,
            permission_level
          )
        `)
        .eq("token", token)
        .single();

      if (sessionError || !familySession) {
        return NextResponse.json(
          { error: "Invalid authentication" },
          { status: 401 }
        );
      }

      // Check if session expired
      if (new Date(familySession.expires_at) < new Date()) {
        return NextResponse.json(
          { error: "Session expired" },
          { status: 401 }
        );
      }

      // Family session authentication successful
      // Extract storyteller ID from family_members.user_id
      storytellerId = (familySession as any).family_members.user_id;
      isAuthenticated = true;
    }

    // Fetch treasures
    const { data: treasures, error } = await supabaseAdmin
      .from("treasures")
      .select("*")
      .eq("user_id", storytellerId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching treasures:", error);
      return NextResponse.json(
        { error: "Failed to fetch treasures" },
        { status: 500 }
      );
    }

    // Map snake_case to camelCase and generate signed URLs for new dual-path treasures
    const mapped = await Promise.all(
      (treasures || []).map(async (treasure) => {
        let masterUrl = treasure.master_path;
        let displayUrl = treasure.display_path;

        // Generate signed URLs for new dual-path treasures
        if (treasure.master_path && !treasure.master_path.startsWith("http")) {
          const { data: masterSignedData, error: masterError } = await supabaseAdmin.storage
            .from("heritage-whisper-files")
            .createSignedUrl(treasure.master_path, 3600); // 1 hour expiry

          if (masterError) {
            console.error(`[Treasures API] Failed to generate master signed URL:`, masterError);
          }
          masterUrl = masterSignedData?.signedUrl || treasure.master_path;
        }

        if (treasure.display_path && !treasure.display_path.startsWith("http")) {
          const { data: displaySignedData, error: displayError } = await supabaseAdmin.storage
            .from("heritage-whisper-files")
            .createSignedUrl(treasure.display_path, 3600);

          if (displayError) {
            console.error(`[Treasures API] Failed to generate display signed URL:`, displayError);
          }
          displayUrl = displaySignedData?.signedUrl || treasure.display_path;
        }

        // Backward compatibility: Generate signed URL for old image_url field
        let legacyImageUrl = treasure.image_url;
        if (!displayUrl && treasure.image_url && !treasure.image_url.startsWith("http")) {
          const { data: legacySignedData, error: signError } = await supabaseAdmin.storage
            .from("heritage-whisper-files")
            .createSignedUrl(treasure.image_url, 3600);

          if (signError) {
            console.error(`[Treasures API] Failed to generate signed URL:`, signError);
          }
          legacyImageUrl = legacySignedData?.signedUrl || treasure.image_url;
          // Use legacy URL as displayUrl for old treasures
          displayUrl = legacyImageUrl;
        }

        return {
          id: treasure.id,
          userId: treasure.user_id,
          title: treasure.title,
          description: treasure.description,
          category: treasure.category,
          year: treasure.year,
          // NEW: Dual WebP URLs
          masterPath: treasure.master_path,
          displayPath: treasure.display_path,
          masterUrl,
          displayUrl,
          imageWidth: treasure.image_width,
          imageHeight: treasure.image_height,
          transform: treasure.transform,
          // DEPRECATED (backward compatibility):
          imageUrl: displayUrl || legacyImageUrl,
          thumbnailUrl: displayUrl || legacyImageUrl,
          isFavorite: treasure.is_favorite,
          linkedStoryId: treasure.linked_story_id,
          createdAt: treasure.created_at,
          updatedAt: treasure.updated_at,
        };
      })
    );

    return NextResponse.json({ treasures: mapped });
  } catch (err) {
    console.error("Error in GET /api/treasures:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/treasures - Create new treasure
 *
 * Body: FormData with:
 * - image: File
 * - title: string
 * - category: string
 * - year?: number
 * - description?: string
 */
export async function POST(request: NextRequest) {
  try {
    // Validate session - get token from Authorization header
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

    const formData = await request.formData();
    const imageFile = formData.get("image") as File;
    const title = formData.get("title") as string;
    const category = formData.get("category") as string;
    const year = formData.get("year") ? parseInt(formData.get("year") as string) : null;
    const description = formData.get("description") as string | null;
    const transformStr = formData.get("transform") as string | null;
    const transform = transformStr ? JSON.parse(transformStr) : null;

    if (!imageFile || !title || !category) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Convert image to Buffer and process to dual WebP versions
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate and process image
    const { validateImage, processImageToWebP } = await import(
      "@/lib/imageProcessor"
    );
    const isValidImage = await validateImage(buffer);

    if (!isValidImage) {
      return NextResponse.json(
        {
          error: "Invalid image file",
          details:
            "The uploaded file is not a valid image or has invalid dimensions",
        },
        { status: 400 }
      );
    }

    // Process image to dual WebP versions (Master + Display)
    const { master, display } = await processImageToWebP(buffer);

    // Extract dimensions from master WebP for database storage
    const imageWidth = master.width;
    const imageHeight = master.height;

    // Generate unique filenames with suffix naming
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const baseFilename = `treasure/${user.id}/${timestamp}-${randomId}`;
    const masterFilename = `${baseFilename}-master.webp`;
    const displayFilename = `${baseFilename}-display.webp`;

    // Upload Master WebP (2400px @ 85% quality)
    const { error: masterError } = await supabaseAdmin.storage
      .from("heritage-whisper-files")
      .upload(masterFilename, master.buffer, {
        contentType: "image/webp",
        upsert: false,
      });

    if (masterError) {
      console.error("Master WebP upload error:", masterError);
      return NextResponse.json(
        {
          error: "Failed to upload master image",
          details: masterError.message,
        },
        { status: 500 }
      );
    }

    // Upload Display WebP (550px @ 80% quality)
    const { error: displayError } = await supabaseAdmin.storage
      .from("heritage-whisper-files")
      .upload(displayFilename, display.buffer, {
        contentType: "image/webp",
        upsert: false,
      });

    if (displayError) {
      console.error("Display WebP upload error:", displayError);
      // Clean up master file if display upload fails
      await supabaseAdmin.storage
        .from("heritage-whisper-files")
        .remove([masterFilename]);
      return NextResponse.json(
        {
          error: "Failed to upload display image",
          details: displayError.message,
        },
        { status: 500 }
      );
    }

    // Generate signed URLs for immediate display (1 week expiry)
    const { data: masterSignedUrl } = await supabaseAdmin.storage
      .from("heritage-whisper-files")
      .createSignedUrl(masterFilename, 604800);

    const { data: displaySignedUrl } = await supabaseAdmin.storage
      .from("heritage-whisper-files")
      .createSignedUrl(displayFilename, 604800);

    // Create treasure record with new dual-path fields
    const insertData: any = {
      user_id: user.id,
      title,
      description,
      category,
      year,
      master_path: masterFilename,
      display_path: displayFilename,
      image_width: imageWidth,
      image_height: imageHeight,
      // DEPRECATED (backward compatibility):
      image_url: displaySignedUrl?.signedUrl || displayFilename,
      is_favorite: false,
    };

    // Only add transform if it exists (for backward compatibility)
    if (transform) {
      insertData.transform = transform;
    }

    const { data: treasure, error: dbError } = await supabaseAdmin
      .from("treasures")
      .insert(insertData)
      .select()
      .single();

    if (dbError) {
      console.error("Error creating treasure:", dbError);
      return NextResponse.json(
        { error: "Failed to create treasure" },
        { status: 500 }
      );
    }

    // Map to camelCase
    const mapped = {
      id: treasure.id,
      userId: treasure.user_id,
      title: treasure.title,
      description: treasure.description,
      category: treasure.category,
      year: treasure.year,
      // NEW: Dual WebP paths and URLs
      masterPath: treasure.master_path,
      displayPath: treasure.display_path,
      masterUrl: masterSignedUrl?.signedUrl || masterFilename,
      displayUrl: displaySignedUrl?.signedUrl || displayFilename,
      imageWidth: treasure.image_width,
      imageHeight: treasure.image_height,
      transform: treasure.transform,
      // DEPRECATED (backward compatibility):
      imageUrl: displaySignedUrl?.signedUrl || displayFilename,
      thumbnailUrl: displaySignedUrl?.signedUrl || displayFilename,
      isFavorite: treasure.is_favorite,
      linkedStoryId: treasure.linked_story_id,
      createdAt: treasure.created_at,
      updatedAt: treasure.updated_at,
    };

    return NextResponse.json({ treasure: mapped }, { status: 201 });
  } catch (err) {
    console.error("Error in POST /api/treasures:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
