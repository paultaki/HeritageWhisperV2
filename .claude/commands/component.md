# Create New Component

Generate a new React component following HeritageWhisper conventions.

**Usage:** `/component <name> <location>` (e.g., `/component StoryCard components/stories`)

## Steps:

1. **Parse arguments:**
   - Component name: PascalCase (e.g., `StoryCard`)
   - Location: `components/` subdirectory (default: `components/`)

2. **Create file:** `{location}/{ComponentName}.tsx`

3. **Use this template:**

```typescript
"use client";

import { type ReactNode } from "react";
import { Button } from "@/components/ui/button";
// Add other shadcn/ui imports as needed

type ComponentNameProps = {
  // Define props here
  children?: ReactNode;
  className?: string;
};

export function ComponentName({ 
  children,
  className = "",
}: ComponentNameProps) {
  // Add state and handlers
  
  return (
    <div className={`${className}`}>
      {/* Component content */}
      {children}
    </div>
  );
}
```

4. **Apply HeritageWhisper patterns:**

   **If data-fetching component:**
   ```typescript
   import { useQuery } from "@tanstack/react-query";
   import { apiRequest } from "@/lib/queryClient";
   
   const { data, isLoading, error } = useQuery({
     queryKey: ["/api/endpoint"],
     queryFn: async () => {
       const res = await apiRequest("GET", "/api/endpoint");
       return res.json();
     },
   });
   ```

   **If form component:**
   ```typescript
   import { useForm } from "react-hook-form";
   import { zodResolver } from "@hookform/resolvers/zod";
   import { z } from "zod";
   
   const schema = z.object({
     field: z.string().min(1, "Required"),
   });
   
   const form = useForm({
     resolver: zodResolver(schema),
   });
   ```

   **If mobile-responsive:**
   ```typescript
   import { useMediaQuery } from "@/hooks/use-media-query";
   
   const isDesktop = useMediaQuery("(min-width: 1024px)");
   ```

5. **Styling guidelines:**
   - Use Tailwind utility classes only
   - Minimum 44x44px tap targets for buttons
   - Test at 375px width (mobile-first)
   - Use design tokens (don't hardcode colors)
   - Example: `bg-primary` not `bg-blue-500`

6. **Add to parent component:**
   - Import and use the new component
   - Pass required props

7. **Test:**
   - Desktop viewport (1024px+)
   - Mobile viewport (375px)
   - Dark mode if applicable

## Component Checklist:
- ✅ Functional component (not class)
- ✅ TypeScript with explicit props type
- ✅ "use client" directive if using hooks/interactivity
- ✅ shadcn/ui components for UI primitives
- ✅ TanStack Query for data fetching
- ✅ Mobile-responsive design
- ✅ Accessible (ARIA labels, keyboard navigation)
