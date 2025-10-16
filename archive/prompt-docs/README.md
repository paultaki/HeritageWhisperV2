# Archived Prompt Documentation

**Archived Date:** January 15, 2025  
**Reason:** Consolidated into `CLAUDE.md` (root directory)

## What's Here

This directory contains historical documentation for the AI Prompt System that has been superseded by the current documentation in `/CLAUDE.md`.

### Archived Files

1. **AI_PROMPTING_SYSTEM.md** (97K)
   - Comprehensive system overview with executive summary
   - Duplicate of content now in CLAUDE.md
   - Last updated: Oct 14, 2025

2. **AI Prompt System v1.4 PRODUCTION.md** (89K)
   - Production version documentation
   - Content merged into CLAUDE.md
   - Last updated: Oct 11, 2025

3. **AI_PROMPT_SYSTEM_IMPLEMENTATION.md** (26K)
   - Complete implementation guide
   - System fully implemented, guide preserved for reference
   - Last updated: Oct 11, 2025

4. **EMERGENCY_PROMPT_FIX.md** (6.2K)
   - Emergency fix for entity extraction bug
   - Issue resolved, kept for historical debugging reference
   - Last updated: Oct 12, 2025

5. **PROMPT_INTIMACY_ENGINE.md** (12K)
   - Feature branch documentation for intimacy engine
   - Feature completed and merged
   - Last updated: Oct 13, 2025

6. **PROMPT_SYSTEM_IMPROVEMENTS.md** (7.4K)
   - Prompt rotation system improvements
   - Improvements implemented
   - Last updated: Oct 12, 2025

## Current Documentation

**Primary Reference:** `/CLAUDE.md`
- Section: "AI Prompt Generation System v1.4 (PRODUCTION READY)"
- Includes complete database schema, tier breakdown, and implementation details

**Troubleshooting:** `/FIX_PROMPT_SYSTEM.md`
- Database setup and RLS policy fixes
- Active reference for new deployments

## Recovery

If you need to restore any of these files:

```bash
# Copy file back to root
cp archive/prompt-docs/FILENAME.md ./

# Or view in place
cat archive/prompt-docs/FILENAME.md
```

---

**Note:** These files are preserved for historical reference and debugging. The active documentation is maintained in the root-level markdown files.
