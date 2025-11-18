# Orphaned Components Archive - November 17, 2025

This directory contains components that were identified as orphaned (not imported or used in production) during a codebase cleanup on November 17, 2025.

## Archived Components

### `/landing-v2/` (4 files)
**Reason:** These components were part of an older landing page iteration (v2). The current production landing page uses `/components/landing-v3/` components exclusively.

**Files archived:**
- `cta-section.tsx` - Call-to-action section component
- `faq-section.tsx` - FAQ section component (duplicate of landing-v3 version)
- `pricing-section.tsx` - Pricing section component (duplicate of landing-v3 version)
- `testimonials-section.tsx` - Testimonials section component

**Last used:** Prior to landing-v3 migration (before November 2025)

**Safe to delete?** Yes, after verifying landing-v3 components cover all needed functionality.

---

### `/ui/` (2 files)
**Reason:** Neither MemoryToolbar variant was imported or used anywhere in the application.

**Files archived:**
- `MemoryToolbar.tsx` - Basic memory filter toolbar with filter chips
- `MemoryToolbarV2.tsx` - Enhanced "Senior-Friendly" version with larger touch targets (44x44px) and high contrast

**Last used:** Unknown - no active imports found

**Safe to delete?** Likely yes, unless there are plans to add memory filtering UI in the future. If reviving this feature, MemoryToolbarV2 is the better implementation (senior-friendly design).

---

### `BookSidebarPanel.tsx` (1 file)
**Reason:** Slide-out navigation panel for Book view that was replaced by the current BookNavigation system.

**Files archived:**
- `BookSidebarPanel.tsx` - 432px slide-out sidebar with navigation menu (left) and Table of Contents (right)

**Last used:** October 2025 - Created Oct 11, 2025, then superseded by "Senior-First Premium Book View Design" update

**Safe to delete?** Yes. Functionality now handled by:
- `BookNavigation.tsx` (desktop progress bar)
- `DesktopProgressBar` component (TOC for desktop)
- `MobileBottomSheet` component (TOC for mobile)

**Note:** BookSidebarPanel included navigation to Timeline, Book, Record, Memories, and Prompts, plus a decade-organized story TOC. Current implementation separates these concerns across multiple components.

---

### `BookNavigation.tsx` (1 file)
**Reason:** Legacy book navigation system that has been replaced by the current book view implementation.

**Files archived:**
- `BookNavigation.tsx` - Comprehensive 752-line book navigation component with desktop/mobile variants

**Features included:**
- Desktop TOC sidebar with expandable decades
- Desktop progress bar with chapter markers and navigation arrows
- Mobile bottom sheet navigation with decade/story picker
- Mobile bottom nav bar with prev/next/menu buttons
- Keyboard shortcuts for decade navigation (number keys 1-9)

**Last used:** Unknown - only referenced in archived directories (`archive/old-app-directories/`)

**Safe to delete?** Yes. The current `/app/book/` implementation uses a different navigation approach.

---

### `DesktopNavigationBottom.tsx` (1 file)
**Reason:** Deprecated stub component explicitly marked as no longer used.

**Files archived:**
- `DesktopNavigationBottom.tsx` - 9-line stub component that returns `null`

**Last used:** Replaced by GlassNav (bottom glass navigation bar)

**Safe to delete?** Yes. Component is explicitly deprecated with comment: "Desktop bottom navigation is no longer used. All pages now use GlassNav."

---

## Restoration Instructions

If you need to restore any of these components:

1. Copy the component file(s) back to the original location:
   - Landing-v2 components → `/components/landing-v2/`
   - MemoryToolbar variants → `/components/ui/`
   - BookSidebarPanel → `/components/`
   - BookNavigation → `/components/`
   - DesktopNavigationBottom → `/components/`

2. Verify imports and dependencies are still valid

3. Test thoroughly before using in production

---

## Related Documentation

- **Landing page history:** See `/archive/old-landing-pages-2025-11-17/README.md`
- **Cleanup scan report:** Documented in project session history (November 17, 2025)

---

_Archived by: Claude Code cleanup process_
_Date: November 17, 2025 (initial), updated November 18, 2025 (BookSidebarPanel, BookNavigation, DesktopNavigationBottom added)_
