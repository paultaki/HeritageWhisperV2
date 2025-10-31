# Cache Invalidation Guide

## The Problem

When using **TanStack Query (React Query)** for data fetching, the library caches API responses to improve performance. However, when you mutate data (add, edit, or delete), the cache doesn't automatically know the data has changed. This causes the UI to show stale data until the page is manually refreshed.

### Symptoms
- Adding a memory to timeline doesn't show until page refresh
- Editing a memory doesn't reflect changes until page refresh
- Deleting a memory doesn't remove it from view until page refresh

## The Solution

After any mutation, you must **invalidate the query cache** to tell React Query to refetch fresh data.

### Basic Pattern

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";

const queryClient = useQueryClient();

const saveMutation = useMutation({
  mutationFn: async (data) => {
    // Your API call here
    const response = await fetch("/api/stories", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.json();
  },
  onSuccess: () => {
    // ✅ CRITICAL: Invalidate cache after successful mutation
    queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
    queryClient.invalidateQueries({ queryKey: ["stories"] });
    
    // Then navigate or show success message
    router.push("/timeline");
  },
});
```

## Fixed Files

### 1. `/app/review/book-style/page.tsx`
**What it does:** Saves and edits memories from the review page

**Fix applied:**
```typescript
onSuccess: (data) => {
  // ... toast notifications ...
  
  // Invalidate queries to fetch fresh data
  queryClient.invalidateQueries({ queryKey: ["/api/prompts/next"] });
  queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
  queryClient.invalidateQueries({ queryKey: ["stories"] });
  
  // Navigate back
  router.push("/timeline");
}
```

### 2. `/hooks/use-recording-wizard.tsx`
**What it does:** Handles the 4-step post-recording wizard for saving stories

**Fix applied:**
```typescript
// Added import
import { useQueryClient } from "@tanstack/react-query";

// Added in hook
const queryClient = useQueryClient();

// In submitStory function after successful save:
queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
queryClient.invalidateQueries({ queryKey: ["stories"] });
```

### 3. `/app/memory-box/page.tsx`
**What it does:** Manages update and delete operations in the Memory Box

**Fix applied:**
```typescript
// Update mutation
onSuccess: (data) => {
  // Invalidate all story queries to refresh timeline, memory box, etc.
  queryClient.invalidateQueries({
    queryKey: ["/api/stories", storytellerId, session?.access_token],
  });
  queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
  queryClient.invalidateQueries({ queryKey: ["stories"] });
  toast({ title: "Memory updated successfully" });
}

// Delete mutation
onSuccess: () => {
  // Invalidate all story queries to refresh timeline, memory box, etc.
  queryClient.invalidateQueries({
    queryKey: ["/api/stories", storytellerId, session?.access_token],
  });
  queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
  queryClient.invalidateQueries({ queryKey: ["stories"] });
  toast({ title: "Memory deleted successfully" });
}
```

### 4. `/app/family/page.tsx`
**What it does:** Manages family member invitations, permissions, and access

**Fix applied:**
```typescript
// Invite mutation - Changed from refetchQueries to invalidateQueries
onSuccess: async (data) => {
  celebrateInvite();
  toast({ title: "Invitation sent! 🎉" });
  
  // Invalidate cache to fetch fresh data
  queryClient.invalidateQueries({ queryKey: ["/api/family/members"] });
  
  // Close dialog after confetti animation
  await new Promise(resolve => setTimeout(resolve, 500));
  setInviteDialogOpen(false);
}

// Resend mutation - Changed from refetchQueries to invalidateQueries
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["/api/family/members"] });
  toast({ title: "Invitation resent! 📧" });
}

// Update permission mutation - Changed from refetchQueries to invalidateQueries
onSuccess: (data, variables) => {
  queryClient.invalidateQueries({ queryKey: ["/api/family/members"] });
  toast({ title: "Permissions updated" });
}

// Remove mutation - Already had invalidateQueries (kept as-is) ✅
onSuccess: async () => {
  await queryClient.invalidateQueries({ queryKey: ["/api/family/members"] });
}
```

## Best Practices

### 1. **Always Invalidate After Mutations**
```typescript
// ❌ BAD - navigates without invalidating cache
onSuccess: () => {
  router.push("/timeline");
}

// ✅ GOOD - invalidates cache before navigating
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
  queryClient.invalidateQueries({ queryKey: ["stories"] });
  router.push("/timeline");
}
```

### 2. **Invalidate All Related Query Keys**
Different components may use different query keys for the same data:
- `["/api/stories"]` - used by some components
- `["stories", storytellerId]` - used by timeline with storyteller context
- `["/api/stories", storytellerId, session?.access_token]` - used by memory box
- `["/api/family/members"]` - used by family sharing page

To ensure all components refresh, invalidate all relevant keys:
```typescript
// For stories
queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
queryClient.invalidateQueries({ queryKey: ["stories"] });

// For family members
queryClient.invalidateQueries({ queryKey: ["/api/family/members"] });
```

### 3. **Consider Optimistic Updates** (Advanced)
For instant UI feedback, update the cache immediately before the server responds:

```typescript
const updateStory = useMutation({
  mutationFn: async ({ id, updates }) => {
    // API call
  },
  onMutate: async ({ id, updates }) => {
    // Cancel any outgoing refetches
    await queryClient.cancelQueries({ queryKey: ["stories"] });
    
    // Snapshot previous value
    const previousStories = queryClient.getQueryData(["stories"]);
    
    // Optimistically update cache
    queryClient.setQueryData(["stories"], (old) => {
      return old.map((story) =>
        story.id === id ? { ...story, ...updates } : story
      );
    });
    
    // Return snapshot for potential rollback
    return { previousStories };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    if (context?.previousStories) {
      queryClient.setQueryData(["stories"], context.previousStories);
    }
  },
  onSuccess: () => {
    // Refetch to sync with server
    queryClient.invalidateQueries({ queryKey: ["stories"] });
  },
});
```

### 4. **Use `invalidateQueries` Instead of `refetchQueries`**
Both work, but `invalidateQueries` is the recommended approach:

```typescript
// ❌ AVOID - refetchQueries forces immediate refetch
onSuccess: async () => {
  await queryClient.refetchQueries({ queryKey: ["/api/family/members"] });
}

// ✅ BETTER - invalidateQueries marks as stale and refetches when needed
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["/api/family/members"] });
}
```

**Why invalidateQueries is better:**
- More efficient - only refetches when data is actually used
- No need for async/await in most cases
- Better performance with multiple simultaneous invalidations
- Standard React Query pattern

### 5. **Use Mutation Hooks Consistently**
```typescript
// ✅ GOOD - using useMutation properly
const saveMutation = useMutation({
  mutationFn: async (data) => { /* ... */ },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["stories"] });
  },
});

// Later in your component
<button onClick={() => saveMutation.mutate(storyData)}>
  Save Story
</button>
```

## Query Keys Reference

Here are all the query keys used for stories in the app:

| Query Key | Used By | Purpose |
|-----------|---------|---------|
| `["/api/stories"]` | `use-timeline-data.tsx` | Basic story fetching |
| `["stories", storytellerId]` | `TimelineDesktop.tsx` | Timeline with storyteller context |
| `["/api/stories", storytellerId, token]` | `memory-box/page.tsx` | Memory box with auth |
| `["/api/family/stories", userId]` | Family timeline pages | Family member stories |
| `["/api/family/members"]` | `family/page.tsx` | Family member list and invitations |

## Testing Your Fix

After implementing cache invalidation:

1. **Add a memory:**
   - Record a new story
   - Complete the review process
   - Click "Save"
   - ✅ Should immediately appear on timeline without refresh

2. **Edit a memory:**
   - Edit an existing story
   - Save changes
   - Return to timeline
   - ✅ Changes should be visible immediately

3. **Delete a memory:**
   - Delete a story from memory box
   - ✅ Should disappear immediately without refresh

4. **Invite a family member:**
   - Send an invitation from Family Circle page
   - ✅ Should appear in pending list immediately

5. **Revoke an invitation:**
   - Revoke a pending invitation
   - ✅ Should disappear from pending list immediately

6. **Update permissions:**
   - Change a family member from Viewer to Contributor
   - ✅ Permission badge should update immediately

## Additional Resources

- [TanStack Query Docs - Invalidation](https://tanstack.com/query/latest/docs/react/guides/query-invalidation)
- [TanStack Query Docs - Optimistic Updates](https://tanstack.com/query/latest/docs/react/guides/optimistic-updates)
- [TanStack Query Docs - Mutations](https://tanstack.com/query/latest/docs/react/guides/mutations)

## Summary

The fix is simple but critical: **Always invalidate query cache after mutations**. This ensures your UI stays in sync with your database without requiring manual page refreshes, providing a smooth, modern user experience.

