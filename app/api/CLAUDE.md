# API Routes - HeritageWhisper

**Context:** This extends [../../CLAUDE.md](../../CLAUDE.md) with API route-specific patterns.

## Quick Reference

### Standard API Route Template

Every API route in this project follows this pattern:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

// SECURITY: Use centralized admin client (enforces server-only via import)
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request: NextRequest) {
  try {
    // 1. Validate session (ALWAYS FIRST)
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

    // 2. Get storyteller_id (for family sharing)
    const { searchParams } = new URL(request.url);
    const storytellerId = searchParams.get("storyteller_id") || user.id;

    // 3. Check family sharing access
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

    // 4. Query database
    const { data, error } = await supabaseAdmin
      .from("your_table")
      .select("*")
      .eq("user_id", storytellerId);

    if (error) {
      logger.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch data" },
        { status: 500 }
      );
    }

    // 5. Transform response (snake_case → camelCase)
    const transformed = data.map((item) => ({
      id: item.id,
      userId: item.user_id,
      createdAt: item.created_at,
      // Map all fields, DON'T expose internal metadata
    }));

    return NextResponse.json({ data: transformed });

  } catch (err) {
    logger.error("Error in GET /api/your-route:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

## HTTP Methods by Use Case

### GET - Fetch data
```typescript
export async function GET(request: NextRequest) {
  // Use pattern above
  // Always filter by user_id or storyteller_id
  // Support ?storyteller_id= for family sharing
}
```

### POST - Create new resource
```typescript
export async function POST(request: NextRequest) {
  const body = await request.json();
  
  // Validate with Zod if possible
  const validated = yourSchema.parse(body);
  
  const { data, error } = await supabaseAdmin
    .from("your_table")
    .insert({
      user_id: user.id,  // ALWAYS set user_id
      ...validated,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();
    
  return NextResponse.json({ data }, { status: 201 });
}
```

### PUT/PATCH - Update resource
```typescript
export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, ...updates } = body;
  
  // CRITICAL: Verify ownership before updating
  const { data, error } = await supabaseAdmin
    .from("your_table")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id)  // Security check!
    .select()
    .single();
    
  if (error?.code === "PGRST116") {
    return NextResponse.json(
      { error: "Not found or access denied" },
      { status: 404 }
    );
  }
  
  return NextResponse.json({ data });
}
```

### DELETE - Remove resource
```typescript
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  
  if (!id) {
    return NextResponse.json(
      { error: "ID required" },
      { status: 400 }
    );
  }
  
  // CRITICAL: Verify ownership before deleting
  const { error } = await supabaseAdmin
    .from("your_table")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);  // Security check!
    
  if (error) {
    return NextResponse.json(
      { error: "Failed to delete" },
      { status: 500 }
    );
  }
  
  return NextResponse.json({ success: true });
}
```

## Critical Security Patterns

### ✅ DO:

```typescript
// 1. Always validate session first
const { data: { user } } = await supabaseAdmin.auth.getUser(token);

// 2. Always filter by user_id
.eq("user_id", user.id)

// 3. Verify ownership before UPDATE/DELETE
.eq("user_id", user.id)

// 4. Check family sharing access
await supabaseAdmin.rpc("has_collaboration_access", {...})

// 5. Use logger, not console.log
logger.error("Error:", error);

// 6. Return proper status codes
return NextResponse.json({ error }, { status: 401 });
```

### ❌ DON'T:

```typescript
// 1. Never skip session validation
// BAD: Querying without auth check

// 2. Never query all users' data
// BAD: .select("*") without .eq("user_id", ...)

// 3. Never trust client-provided user_id
// BAD: const userId = body.user_id;
// GOOD: const userId = user.id; (from validated session)

// 4. Never expose internal metadata
// BAD: Returning tier, prompt_score, cost_usd, anchor_entity

// 5. Never use console.log in production
// BAD: console.log(user.email, token)

// 6. Never bypass RLS without justification
// If using service role key, add comment explaining why
```

## Database Field Mapping

**Database (snake_case) → API Response (camelCase):**

```typescript
const transformed = data.map((row) => ({
  // IDs and basic fields
  id: row.id,
  userId: row.user_id,
  
  // Timestamps
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  dismissedAt: row.dismissed_at,
  
  // Prompt fields
  promptText: row.prompt_text,
  contextNote: row.context_note,
  queuePosition: row.queue_position,
  
  // Story fields
  storyTitle: row.story_title,
  storyText: row.story_text,
  audioUrl: row.audio_url,
  
  // DON'T expose these:
  // tier, prompt_score, score_reason, cost_usd, anchor_entity
}));
```

## Common Patterns

### Pattern 1: Pagination
```typescript
const page = parseInt(searchParams.get("page") || "1");
const limit = parseInt(searchParams.get("limit") || "20");
const offset = (page - 1) * limit;

const { data, count } = await supabaseAdmin
  .from("your_table")
  .select("*", { count: "exact" })
  .range(offset, offset + limit - 1);

return NextResponse.json({
  data: transformed,
  pagination: {
    page,
    limit,
    total: count,
    pages: Math.ceil(count / limit),
  },
});
```

### Pattern 2: Search/Filter
```typescript
let query = supabaseAdmin
  .from("your_table")
  .select("*")
  .eq("user_id", storytellerId);

// Optional filters
const search = searchParams.get("search");
if (search) {
  query = query.ilike("title", `%${search}%`);
}

const category = searchParams.get("category");
if (category) {
  query = query.eq("category", category);
}

const { data } = await query;
```

### Pattern 3: File Upload (Supabase Storage)
```typescript
import { supabaseStorage } from "@/lib/supabase-storage";

export async function POST(request: NextRequest) {
  // ... validate session ...
  
  const formData = await request.formData();
  const file = formData.get("file") as File;
  
  if (!file) {
    return NextResponse.json(
      { error: "File required" },
      { status: 400 }
    );
  }
  
  // Generate unique filename
  const fileName = `${user.id}/${Date.now()}-${file.name}`;
  
  // Upload to Supabase Storage
  const { data, error } = await supabaseStorage
    .from("heritage-whisper-files")
    .upload(fileName, file, {
      contentType: file.type,
      upsert: false,
    });
    
  if (error) {
    logger.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
  
  // Get public URL
  const { data: urlData } = supabaseStorage
    .from("heritage-whisper-files")
    .getPublicUrl(fileName);
    
  return NextResponse.json({ url: urlData.publicUrl });
}
```

### Pattern 4: Rate Limiting
```typescript
import { rateLimit } from "@/lib/ratelimit";

export async function POST(request: NextRequest) {
  // ... validate session ...
  
  // Check rate limit
  const identifier = user.id;
  const { success, limit, remaining, reset } = await rateLimit.check(
    identifier,
    "export" // rate limit key
  );
  
  if (!success) {
    return NextResponse.json(
      { 
        error: "Rate limit exceeded",
        retryAfter: reset,
      },
      { status: 429 }
    );
  }
  
  // Continue with operation...
}
```

## Error Handling Checklist

Every API route should handle:

- ✅ **401** - Missing or invalid authentication
- ✅ **403** - Valid auth but insufficient permissions
- ✅ **404** - Resource not found
- ✅ **400** - Invalid request body/params
- ✅ **429** - Rate limit exceeded
- ✅ **500** - Unexpected server error

```typescript
try {
  // Route logic
} catch (err) {
  logger.error("Error in [METHOD] /api/[route]:", err);
  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 }
  );
}
```

## Testing API Routes

### Manual Testing with curl:
```bash
# GET request
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/your-route

# POST request
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field":"value"}' \
  http://localhost:3000/api/your-route

# With query params
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/your-route?storyteller_id=USER_ID"
```

### Testing Checklist:
- [ ] Returns 401 without token
- [ ] Returns 401 with invalid token
- [ ] Returns 403 when accessing other user's data (without family sharing)
- [ ] Returns correct data with valid token
- [ ] Family sharing works with ?storyteller_id=
- [ ] Fields are mapped to camelCase
- [ ] Internal metadata not exposed
- [ ] Rate limiting works (if applicable)

## File Organization

```
app/api/
├── stories/
│   ├── route.ts              # GET all, POST new story
│   ├── [id]/route.ts         # GET, PUT, DELETE specific story
│   └── archive/route.ts      # Story-specific operations
├── prompts/
│   ├── active/route.ts       # Active prompts
│   ├── queued/route.ts       # Queued prompts
│   └── family-submitted/route.ts  # Family questions
└── user/
    ├── profile/route.ts      # User profile
    ├── export/route.ts       # Data export
    └── delete/route.ts       # Account deletion
```

## Reference Files

**Examples to copy patterns from:**
- `/app/api/prompts/queued/route.ts` - Full pattern with family sharing
- `/app/api/user/export/route.ts` - Rate limiting example
- `/app/api/stories/route.ts` - File upload pattern

**Utilities:**
- `@lib/logger.ts` - Logging utility
- `@lib/supabase.ts` - Supabase client config
- `@lib/ratelimit.ts` - Rate limiting
- `@lib/queryClient.ts` - Frontend API wrapper

**Documentation:**
- `@DATA_MODEL.md` - Database schema
- `@SECURITY.md` - Security guidelines
- `@FAMILY_SHARING_README.md` - Multi-tenant patterns
