# Add Database Query with RLS

Add a database query with proper Row Level Security checks.

**Usage:** `/db-query <table> <operation>` (e.g., `/db-query stories select`)

## Steps:

1. **Check schema first:**
   - Read @shared/schema.ts for table definition
   - Or use Supabase MCP: "Show me the schema for {table}"
   - Verify RLS policies exist

2. **Import types:**
   ```typescript
   import { type Story, type InsertStory } from "@/shared/schema";
   ```

3. **For SELECT queries:**
   ```typescript
   // In API route (server-side)
   const { data, error } = await supabaseAdmin
     .from("TABLE_NAME")
     .select("field1, field2, field3")
     .eq("user_id", storytellerId)  // Always filter by user!
     .order("created_at", { ascending: false });
   
   if (error) {
     logger.error("Database error:", error);
     return NextResponse.json(
       { error: "Failed to fetch data" },
       { status: 500 }
     );
   }
   ```

4. **For INSERT queries:**
   ```typescript
   const { data, error } = await supabaseAdmin
     .from("TABLE_NAME")
     .insert({
       user_id: user.id,  // Always set user_id!
       field1: value1,
       field2: value2,
     })
     .select()
     .single();
   ```

5. **For UPDATE queries:**
   ```typescript
   const { data, error } = await supabaseAdmin
     .from("TABLE_NAME")
     .update({
       field1: newValue,
       updated_at: new Date().toISOString(),
     })
     .eq("id", itemId)
     .eq("user_id", user.id)  // Security: verify ownership!
     .select()
     .single();
   ```

6. **For DELETE queries:**
   ```typescript
   const { error } = await supabaseAdmin
     .from("TABLE_NAME")
     .delete()
     .eq("id", itemId)
     .eq("user_id", user.id);  // Security: verify ownership!
   ```

7. **Multi-tenant (family sharing) queries:**
   ```typescript
   // Always check access first
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

   // Then query with storyteller_id
   const { data } = await supabaseAdmin
     .from("TABLE_NAME")
     .select("*")
     .eq("user_id", storytellerId);
   ```

8. **Map database response:**
   ```typescript
   // Database uses snake_case, frontend expects camelCase
   const transformed = data.map((row) => ({
     id: row.id,
     userId: row.user_id,
     createdAt: row.created_at,
     promptText: row.prompt_text,
     // DON'T expose: tier, prompt_score, cost_usd, anchor_entity
   }));
   ```

## RLS Security Checklist:
- ✅ RLS policy exists for this table (check Supabase dashboard)
- ✅ Query filters by user_id or storyteller_id
- ✅ UPDATE/DELETE verify ownership before modifying
- ✅ Multi-tenant queries check `has_collaboration_access()`
- ✅ Service role key justified in comments if bypassing RLS
- ✅ Internal metadata not exposed to frontend

## Performance Tips:
- Use `.select("specific, fields")` not `.select("*")`
- Add indexes for frequently queried fields
- Use RLS with `(SELECT auth.uid())` pattern for performance
- Limit results with `.limit(100)` for large tables

## Reference:
- Full schema: @DATA_MODEL.md
- RLS patterns: @SECURITY.md
- Example queries: Look at existing API routes in app/api/
