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

## Restoration Instructions

If you need to restore any of these components:

1. Copy the component file(s) back to the original location:
   - Landing-v2 components → `/components/landing-v2/`
   - MemoryToolbar variants → `/components/ui/`

2. Verify imports and dependencies are still valid

3. Test thoroughly before using in production

---

## Related Documentation

- **Landing page history:** See `/archive/old-landing-pages-2025-11-17/README.md`
- **Cleanup scan report:** Documented in project session history (November 17, 2025)

---

_Archived by: Claude Code cleanup process_
_Date: November 17, 2025_
