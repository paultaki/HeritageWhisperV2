# Archived Mobile Fixes - November 2025

**Archived Date:** November 18, 2025
**Reason:** Deprecated iterations and completed fixes superseded by final solutions

## Files in This Archive

### SCROLL_RESET_FIX_SUMMARY.md (5.4K, Nov 13, 2025)
**Purpose:** Initial attempt to fix book scroll position carryover issue

**Status:** ❌ **EXPLICITLY DEPRECATED**
- Header states: "This fix did not work. See SCROLL_CARRYOVER_FIX_FINAL.md"
- Attempted fix: Reset scroll position in useEffect
- Issue: Timing issues, didn't solve root cause

**Superseded By:** `/docs/troubleshooting/SCROLL_CARRYOVER_FIX_FINAL.md` (working solution)

---

### SCROLL_RESET_FIX_V2.md (7.7K, Nov 14, 2025)
**Purpose:** Second iteration attempt to fix scroll carryover

**Status:** ⚠️ **SUPERSEDED**
- Attempted fix: Adjust useEffect timing
- Issue: Still had stale viewport state issues
- Created day AFTER the final fix (experimentation)

**Superseded By:** `/docs/troubleshooting/SCROLL_CARRYOVER_FIX_FINAL.md` (Nov 13 - actual working solution)

---

### RECORDING_PAGE_CLEANUP.md (7K, Nov 13, 2025)
**Purpose:** Removal of PreRecordHints component clutter

**Status:** ✅ **COMPLETED**
- Simplified recording page UI
- Removed confusing pre-record hints
- Cleanup complete, no longer needs active reference

**Note:** Kept for historical context on UI simplification decisions

---

## Working Solutions

For active troubleshooting documentation, see:

**`/docs/troubleshooting/`:**
- `SCROLL_CARRYOVER_FIX_FINAL.md` - Working scroll fix (stale viewport state solution)
- `VIEWPORT_FIX_SUMMARY.md` - Mobile Chrome URL bar image cutoff fix
- `IPHONE_NAV_STRETCH_FIX.md` - Bottom nav bar visual stretch fix
- `SESSION_SUMMARY.md` - Overview of all Nov 2025 mobile fixes

---

## Restoration Instructions

These files are preserved for historical reference only. The issues they attempted to fix have been resolved.

```bash
# If you need to reference the progression
cat archive/mobile-fixes-2025-11/SCROLL_RESET_FIX_SUMMARY.md
cat archive/mobile-fixes-2025-11/SCROLL_RESET_FIX_V2.md
cat /docs/troubleshooting/SCROLL_CARRYOVER_FIX_FINAL.md  # The working solution
```

---

## Fix Progression Timeline

**Nov 13, 2025:**
1. 🔴 SCROLL_RESET_FIX_SUMMARY.md - Failed attempt
2. ✅ SCROLL_CARRYOVER_FIX_FINAL.md - Working solution (stale viewport state)
3. ✅ VIEWPORT_FIX_SUMMARY.md - Related viewport fix
4. ✅ IPHONE_NAV_STRETCH_FIX.md - Nav bar fix
5. ✅ RECORDING_PAGE_CLEANUP.md - UI simplification

**Nov 14, 2025:**
6. 🔴 SCROLL_RESET_FIX_V2.md - Later experimentation (superseded)

**Lesson:** The final fix (Nov 13) was the actual solution. V2 (Nov 14) was experimentation after the fact.

---

## Related Documentation

- **Active Troubleshooting:** `/docs/troubleshooting/`
- **Completed Implementations:** `/archive/completed-implementations-2025/`
- **Planning Docs:** `/archive/planning-docs-2025/`

---

_Archived by: Development team during November 2025 codebase cleanup_
_Issues documented here have been resolved_
