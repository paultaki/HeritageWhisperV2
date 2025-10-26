
Component Refactoring Methodology

  Proven Step-by-Step Process for Breaking Down Large Components

  This methodology successfully reduced RecordModal (1,705 → 310 lines) and TimelineMobile
  (1,678 → 377 lines) with 0 build errors.

  ---
  Phase 1: Research & Discovery

  Step 1.1: Research Best Practices

  Goal: Ground your approach in industry standards

  Tools: Use MCPs to research current best practices
  # Example searches:
  - "React component size best practices 2025"
  - "React custom hooks patterns"
  - "React.memo performance optimization"
  - "Component composition patterns"

  Key Questions:
  - What's the recommended component size limit? (Answer: ~200 lines)
  - What are the standard patterns for extracting logic? (Answer: Custom hooks)
  - How should we optimize performance? (Answer: React.memo, useCallback, useMemo)

  Step 1.2: Analyze Existing Code

  Goal: Understand what you're refactoring

  Actions:
  1. Read the entire component file
  2. Identify distinct responsibilities:
    - Data fetching/processing
    - Navigation/routing logic
    - UI state management
    - Event handlers
    - Render logic
  3. Count lines in each section
  4. Note dependencies between sections
  5. Identify performance bottlenecks (large lists, expensive renders)

  Output: List of logical sections with line counts

  ---
  Phase 2: Planning

  Step 2.1: Design Architecture

  Goal: Create extraction plan before touching code

  Template:
  Target Structure:
  ├── types/[feature].ts - TypeScript definitions
  ├── lib/[utility].ts - Singleton/utility functions (if needed)
  ├── hooks/
  │   ├── use-[feature]-data.tsx - Data fetching/processing
  │   ├── use-[feature]-navigation.tsx - Routing/scroll logic
  │   └── use-[feature]-ui.tsx - UI state management
  └── components/[feature]/
      ├── [MainComponent].tsx - Orchestrator (main component)
      ├── [SubComponent1].tsx - Focused UI component
      ├── [SubComponent2].tsx - Focused UI component
      └── [SubComponent3].tsx - Focused UI component

  Expected Outcome:
  - Original: X lines → New: ~Y lines (Z% reduction)
  - All files < 200 lines
  - 100% TypeScript coverage
  - 0 build errors

  Extraction Guidelines:
  - Types first: Create all interfaces before implementation
  - Lib files: Extract singletons, shared utilities
  - Hooks: Extract logic by responsibility (data, navigation, UI)
  - Components: Extract complex UI sections that render multiple times
  - Orchestrator last: Refactor main component to use all extracted pieces

  Step 2.2: Present Plan to User

  Goal: Get approval before execution

  Format:
  1. Show current state (line count, issues)
  2. Show proposed architecture
  3. Explain benefits (maintainability, reusability, performance)
  4. List files to be created
  5. Provide expected line counts
  6. Confirm 0 breaking changes

  Wait for explicit approval before proceeding.

  ---
  Phase 3: Execution

  Step 3.1: Create Git Branch

  git checkout -b refactor/[component-name]-extraction

  Step 3.2: Create Types File

  File: types/[feature].ts

  Actions:
  1. Define all TypeScript interfaces
  2. Export hook return types
  3. Export component props interfaces
  4. Define type unions (e.g., ColorScheme)

  Why First: Types guide implementation and catch errors early

  Template:
  // types/timeline.ts
  export interface UseTimelineDataReturn {
    stories: Story[];
    isLoading: boolean;
    refetchStories: () => void;
    // ... all return values
  }

  export interface TimelineHeaderProps {
    isDark: boolean;
    currentColorScheme: ColorScheme;
  }

  export type ColorScheme = "original" | "white" | "dark";

  Step 3.3: Extract Lib/Utility Files (if needed)

  File: lib/[utility].ts

  Actions:
  1. Extract singleton patterns (e.g., AudioManager)
  2. Extract shared utility functions
  3. Ensure no React dependencies in lib files

  Example:
  // lib/audioManager.ts
  export class AudioManager {
    private static instance: AudioManager;
    static getInstance(): AudioManager { /* ... */ }
    // ... methods
  }
  export const audioManager = AudioManager.getInstance();

  Step 3.4: Create Custom Hooks

  Files: hooks/use-[feature]-[responsibility].tsx

  Order: Create in dependency order
  1. use-[feature]-data.tsx (no dependencies)
  2. use-[feature]-navigation.tsx (may depend on data)
  3. use-[feature]-ui.tsx (usually independent)

  Pattern:
  // hooks/use-timeline-data.tsx
  export function useTimelineData({ user, session }: Options): Return {
    // TanStack Query hooks
    const { data, isLoading } = useQuery({ /* ... */ });

    // All useMemo hooks for processing
    const processed = useMemo(() => { /* ... */ }, [deps]);

    // Return all values
    return { data, processed, isLoading };
  }

  Key Rules:
  - Extract logic EXACTLY as-is (don't rewrite)
  - Preserve all useMemo/useCallback optimizations
  - Keep hooks under 200 lines
  - Return object with all values needed by components

  Step 3.5: Extract UI Components

  Files: components/[feature]/[ComponentName].tsx

  Order: Extract from most reused to least reused

  Patterns:

  Simple Components (modals, headers):
  // components/timeline/PaywallModal.tsx
  export function PaywallModal({ isOpen, onClose, onSubscribe }: Props) {
    if (!isOpen) return null;
    return <div>{/* UI */}</div>;
  }

  Complex List Items (use React.memo):
  // components/timeline/MemoryCard.tsx
  export const MemoryCard = React.memo(
    function MemoryCard({ story, isHighlighted, onOpenOverlay }: Props) {
      // Component logic
      return <div>{/* UI */}</div>;
    },
    // Custom comparison to prevent unnecessary re-renders
    (prevProps, nextProps) => {
      return (
        prevProps.story.id === nextProps.story.id &&
        prevProps.isHighlighted === nextProps.isHighlighted &&
        prevProps.isDarkTheme === nextProps.isDarkTheme
      );
    }
  );

  Performance Checklist:
  - Use React.memo for components rendered in lists
  - Use custom comparison for complex props
  - Ensure parent passes memoized callbacks (useCallback)

  Step 3.6: Refactor Main Component (Orchestrator)

  File: components/[feature]/[MainComponent].tsx

  Pattern:
  "use client";

  import { useCallback, useEffect } from "react";
  // Import all hooks
  import { useFeatureData } from "@/hooks/use-feature-data";
  import { useFeatureUI } from "@/hooks/use-feature-ui";
  // Import all components
  import { SubComponent1 } from "./SubComponent1";
  import { SubComponent2 } from "./SubComponent2";

  /**
   * MainComponent - Orchestrator
   *
   * Refactored: [Date]
   * Original: X lines → New: Y lines (Z% reduction)
   *
   * Architecture:
   * - Hooks: use-feature-data, use-feature-ui
   * - Components: SubComponent1, SubComponent2
   * - Principle: <200 lines, delegated logic
   */
  export function MainComponent() {
    // ==================================================================================
    // Custom Hooks
    // ==================================================================================

    const data = useFeatureData({ /* ... */ });
    const ui = useFeatureUI();

    // ==================================================================================
    // Event Handlers (Memoized)
    // ==================================================================================

    const handleAction = useCallback((param) => {
      // Handler logic
    }, [dependencies]);

    // ==================================================================================
    // Render
    // ==================================================================================

    return (
      <div>
        <SubComponent1 {...data} onAction={handleAction} />
        <SubComponent2 {...ui} />
      </div>
    );
  }

  Key Rules:
  - All event handlers use useCallback
  - No complex logic in render
  - Clear section comments
  - Props passed explicitly (not spread unless necessary)

  Step 3.7: Build Verification

  npm run build

  Success Criteria:
  - 0 TypeScript errors
  - 0 build errors
  - All routes compile successfully

  If errors occur:
  1. Fix TypeScript errors first
  2. Check import paths
  3. Verify all exports/imports match
  4. Ensure no circular dependencies

  ---
  Phase 4: Verification & Documentation

  Step 4.1: Test All Functionality

  Manual Testing Checklist:
  - Page loads without errors
  - All UI elements render correctly
  - All interactions work (clicks, navigation, etc.)
  - Data fetches correctly
  - Performance is same or better
  - No console errors/warnings

  Step 4.2: Commit Changes

  git add .
  git commit -m "refactor: Extract [Component] into hooks + components

  Architecture Changes:
  - [Component].tsx: X → Y lines (Z% reduction)
  - Extracted N reusable hooks (~ABC lines total)
  - Created M focused components (~DEF lines total)
  - All files under 200-line best practice limit

  New Files:
  - types/[feature].ts - Complete TypeScript definitions
  - lib/[utility].ts - [Description]
  - hooks/use-[feature]-data.tsx - Data fetching layer
  - hooks/use-[feature]-ui.tsx - UI state management
  - components/[feature]/[SubComponent1].tsx
  - components/[feature]/[SubComponent2].tsx

  Performance:
  - React.memo optimization on [Components]
  - useCallback for all handlers
  - Custom comparison to prevent unnecessary re-renders

  Benefits:
  ✅ Maintainability: Single responsibility per file
  ✅ Reusability: Hooks usable across app
  ✅ Performance: Optimized rendering
  ✅ Type Safety: 100% TypeScript coverage
  ✅ Zero Breaking Changes: All functionality preserved

  🤖 Generated with Claude Code"

  Step 4.3: Update Documentation (Optional)

  Add to CLAUDE.md or similar:
  ### [Date] - [Component] Architecture Refactoring

  **Status:** ✅ Complete

  Refactored [Component].tsx from monolithic X-line component into Y focused files.

  **Architecture Changes:**
  - [Component].tsx: X → Y lines (Z% reduction)
  - Extracted N hooks, M components
  - All files under 200-line best practice limit

  **New Files:**
  - types/[feature].ts
  - lib/[utility].ts
  - hooks/...
  - components/[feature]/...

  **Benefits:**
  - ✅ Maintainability
  - ✅ Reusability
  - ✅ Performance
  - ✅ Type Safety

  ---
  Key Principles

  1. Extract, Don't Rewrite

  - Copy existing logic exactly
  - Preserve all optimizations (useMemo, useCallback)
  - Don't "improve" logic during extraction

  2. Type Safety First

  - Create types before implementation
  - 100% TypeScript coverage
  - No any types

  3. Single Responsibility

  - Each file has one clear purpose
  - ~200 lines maximum per file
  - Clear separation: data, navigation, UI state, rendering

  4. Performance by Default

  - React.memo for list items
  - useCallback for handlers passed to children
  - Preserve existing useMemo hooks

  5. Zero Breaking Changes

  - All functionality must work identically
  - No feature additions during refactoring
  - Build must pass with 0 errors

  ---
  Common Patterns

  Hook Composition

  // Main hook composes specialized hooks
  function useFeature() {
    const data = useFeatureData();
    const navigation = useFeatureNavigation({ data });
    const ui = useFeatureUI();

    return { data, navigation, ui };
  }

  Orchestrator Pattern

  // Main component delegates to hooks + components
  function MainComponent() {
    const data = useFeatureData();
    const ui = useFeatureUI();

    return (
      <>
        <Header {...ui} />
        <Content {...data} />
        <Footer {...ui} />
      </>
    );
  }

  React.memo with Custom Comparison

  export const ListItem = React.memo(
    function ListItem({ item, isHighlighted }: Props) {
      return <div>{item.title}</div>;
    },
    (prev, next) => {
      return (
        prev.item.id === next.item.id &&
        prev.isHighlighted === next.isHighlighted
      );
    }
  );

  ---
  Troubleshooting

  Build Errors

  - Import not found: Check file paths, ensure exports match
  - Type errors: Verify interface definitions in types file
  - Circular dependencies: Check import order, may need to restructure

  Runtime Errors

  - Infinite re-renders: Check useEffect dependencies
  - Missing data: Verify hook return values match component expectations
  - Performance regression: Add React.memo, useCallback, useMemo

  ---
  Success Metrics

  - ✅ Main component reduced by 60-80%
  - ✅ All files under 200 lines
  - ✅ Build passes with 0 errors
  - ✅ 100% TypeScript coverage
  - ✅ All tests pass (if applicable)
  - ✅ No functionality broken
  - ✅ Performance same or improved

  ---
  Methodology proven with RecordModal (1,705 → 310 lines) and TimelineMobile (1,678 → 377 lines) refactors