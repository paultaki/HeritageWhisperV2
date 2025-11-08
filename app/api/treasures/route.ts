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

    // Get storyteller_id (for family sharing)
    const { searchParams } = new URL(request.url);
    const storytellerId = searchParams.get("storyteller_id") || user.id;

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

    // Map snake_case to camelCase
    const mapped = (treasures || []).map((treasure) => ({
      id: treasure.id,
      userId: treasure.user_id,
      title: treasure.title,
      description: treasure.description,
      category: treasure.category,
      year: treasure.year,
      imageUrl: treasure.image_url,
      thumbnailUrl: treasure.thumbnail_url,
      isFavorite: treasure.is_favorite,
      linkedStoryId: treasure.linked_story_id,
      createdAt: treasure.created_at,
      updatedAt: treasure.updated_at,
    }));

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

    if (!imageFile || !title || !category) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Upload image to Supabase Storage
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("heritage-whisper-files")
      .upload(fileName, imageFile, {
        contentType: imageFile.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Error uploading image:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload image" },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from("heritage-whisper-files")
      .getPublicUrl(fileName);

    // Create treasure record
    const { data: treasure, error: dbError } = await supabaseAdmin
      .from("treasures")
      .insert({
        user_id: user.id,
        title,
        description,
        category,
        year,
        image_url: urlData.publicUrl,
        is_favorite: false,
      })
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
      imageUrl: treasure.image_url,
      thumbnailUrl: treasure.thumbnail_url,
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
