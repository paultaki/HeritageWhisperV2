# Create New API Route

Generate a new Next.js API route with proper HeritageWhisper patterns.

**Usage:** `/api-route <path> <method>` (e.g., `/api-route stories/archive GET,POST`)

## Steps:

1. **Parse arguments:**
   - Path: $ARGUMENTS (e.g., `stories/archive`)
   - Methods: Extract from path or default to GET,POST

2. **Create file:** `app/api/{path}/route.ts`

3. **Use this boilerplate:**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function GET(request: NextRequest) {
  try {
    // 1. Validate session
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

    // 2. Get storyteller_id (for family sharing support)
    const { searchParams } = new URL(request.url);
    const storytellerId = searchParams.get("storyteller_id") || user.id;

    // 3. Check family sharing access if needed
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

    // 4. Query database (RLS policies will apply)
    const { data, error } = await supabaseAdmin
      .from("YOUR_TABLE")
      .select("*")
      .eq("user_id", storytellerId);

    if (error) {
      logger.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch data" },
        { status: 500 }
      );
    }

    // 5. Map snake_case to camelCase for frontend
    const transformed = data.map((item) => ({
      id: item.id,
      // Add your field mappings here
      createdAt: item.created_at,
    }));

    return NextResponse.json({ data: transformed });

  } catch (err) {
    logger.error("Error in GET /api/YOUR_ROUTE:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

4. **Add POST handler if needed** (similar pattern)

5. **Update documentation:**
   - Add to @DATA_MODEL.md if new table
   - Update @SECURITY.md if security-sensitive

6. **Test:**
   - Manual test with curl or Postman
   - Verify session validation works
   - Test family sharing access control

## Critical Checks:
- ✅ Session validated before any database access
- ✅ RLS policies checked with `has_collaboration_access()`
- ✅ Database fields mapped snake_case → camelCase
- ✅ Proper error status codes (401, 403, 404, 500)
- ✅ Logging with @lib/logger (not console.log)
- ✅ No internal metadata exposed (tier, prompt_score, etc.)
