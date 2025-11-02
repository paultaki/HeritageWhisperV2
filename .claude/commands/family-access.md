# Add Family Sharing Access Control

Add family sharing (multi-tenant) support to a feature.

**Usage:** `/family-access <feature>` (e.g., `/family-access prompts-api`)

## Steps:

### 1. API Route Pattern

Update your API route to support `storyteller_id` parameter:

```typescript
export async function GET(request: NextRequest) {
  try {
    // Validate session
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

    // ✅ ADD THIS: Get storyteller_id from query params
    const { searchParams } = new URL(request.url);
    const storytellerId = searchParams.get("storyteller_id") || user.id;

    // ✅ ADD THIS: Check access if viewing another user's data
    if (storytellerId !== user.id) {
      const { data: hasAccess, error: accessError } = await supabaseAdmin.rpc(
        "has_collaboration_access",
        {
          p_user_id: user.id,
          p_storyteller_id: storytellerId,
        }
      );

      if (accessError || !hasAccess) {
        return NextResponse.json(
          { error: "You don't have permission to access this data" },
          { status: 403 }
        );
      }
    }

    // ✅ UPDATE THIS: Query with storytellerId instead of user.id
    const { data, error } = await supabaseAdmin
      .from("YOUR_TABLE")
      .select("*")
      .eq("user_id", storytellerId)  // Changed from user.id
      .order("created_at", { ascending: false });

    // ... rest of your handler
  }
}
```

### 2. React Query Hook Pattern

Update your TanStack Query hooks to accept and pass `storyteller_id`:

```typescript
import { useAccountContext } from "@/hooks/use-account-context";

export function useYourData() {
  const { user } = useAuth();
  const { activeContext } = useAccountContext();
  const storytellerId = activeContext?.storytellerId || user?.id;

  return useQuery({
    queryKey: ["/api/your-endpoint", storytellerId],  // ✅ Include in key
    queryFn: async () => {
      const url = storytellerId
        ? `/api/your-endpoint?storyteller_id=${storytellerId}`
        : "/api/your-endpoint";
      const res = await apiRequest("GET", url);
      return res.json();
    },
    enabled: !!user && !!storytellerId,
  });
}
```

### 3. Component Pattern

Update your component to use account context:

```typescript
"use client";

import { useAccountContext } from "@/hooks/use-account-context";
import { useAuth } from "@/lib/auth";

export function YourComponent() {
  const { user } = useAuth();
  const { activeContext, isOwnAccount, permissionLevel } = useAccountContext();
  const storytellerId = activeContext?.storytellerId || user?.id;

  // Use storytellerId in your queries
  const { data, isLoading } = useYourData();

  // Conditional rendering based on permissions
  if (!isOwnAccount && permissionLevel === "viewer") {
    return <div>You can only view this content</div>;
  }

  // Show account switcher in header
  return (
    <div>
      <PageHeader
        showAccountSwitcher={true}
        // ... other props
      />
      {/* Your content */}
    </div>
  );
}
```

### 4. Mutations with Family Sharing

For POST/PUT/DELETE operations:

```typescript
const updateMutation = useMutation({
  mutationFn: async ({ itemId, data }: any) => {
    const url = storytellerId
      ? `/api/your-endpoint/${itemId}?storyteller_id=${storytellerId}`
      : `/api/your-endpoint/${itemId}`;
    return apiRequest("PUT", url, { body: JSON.stringify(data) });
  },
  onSuccess: () => {
    queryClient.invalidateQueries({
      queryKey: ["/api/your-endpoint", storytellerId],
    });
  },
});
```

### 5. Permission Levels

HeritageWhisper has two permission levels:

- **`viewer`**: Can view content only (stories, timeline, book)
- **`contributor`**: Can view + submit questions, add photos

```typescript
// Example: Show "Submit Question" button only for contributors
{!isOwnAccount && permissionLevel === "contributor" && (
  <Button onClick={handleSubmitQuestion}>
    Submit Question
  </Button>
)}
```

### 6. Database RLS Policies

Verify the table has proper RLS policies that allow family members to access:

```sql
-- Example: Stories table RLS policy for family sharing
CREATE POLICY "Family members can view stories"
ON stories FOR SELECT
USING (
  user_id = auth.uid()
  OR
  user_id IN (
    SELECT storyteller_user_id 
    FROM family_members 
    WHERE family_member_user_id = auth.uid() 
    AND status = 'accepted'
  )
);
```

Check existing policies with Supabase MCP or in Supabase dashboard.

### 7. Testing Checklist

Test with account switcher:

- [ ] Log in as User A
- [ ] User A invites User B as family member
- [ ] User B accepts invite
- [ ] User B switches to User A's account (account switcher)
- [ ] Verify User B can see User A's data
- [ ] Verify User B cannot modify if viewer role
- [ ] Switch back to own account
- [ ] Verify isolation (can't see wrong data)

### 8. Account Switcher UI

Already implemented in PageHeader components:

```typescript
<DesktopPageHeader
  icon={YourIcon}
  title="Your Page"
  subtitle="Description"
  showAccountSwitcher={true}  // ✅ Enable this
/>
```

## Reference Files:
- **Hook:** @hooks/use-account-context.tsx
- **RPC Function:** `has_collaboration_access()` in database
- **Example API:** @app/api/prompts/queued/route.ts
- **Example Component:** @app/prompts/page.tsx
- **Documentation:** @FAMILY_SHARING_README.md

## Common Issues:

**Query returns empty for family members:**
- Check RLS policy allows SELECT for family members
- Verify `has_collaboration_access()` returns true
- Check storytellerId is passed correctly

**403 Access Denied:**
- Family member not accepted yet (status != 'accepted')
- RPC function `has_collaboration_access()` not working
- storytellerId parameter missing or wrong

**Data leaking between accounts:**
- Missing storytellerId in query key
- Not filtering by storytellerId in database query
- RLS policy too permissive
