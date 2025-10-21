# Multi-Instance Claude Code Coordination

> **Purpose:** Track which Claude Code instances are working on which parts of the codebase to prevent merge conflicts and coordination issues.

## 🚦 Active Instances

### Instance 1: Prompt Quality & AI Systems
**Status:** ✅ COMPLETE (Oct 20)
**Branch:** `main` (merged)
**Owner:** Paul + Claude
**Focus:** AI prompt generation quality improvements

**Files Owned:**
- `lib/promptGeneration*.ts`
- `lib/echoPrompts.ts`
- `lib/promptQuality.ts`
- `app/api/admin/prompts/**/*`
- `app/admin/prompt-feedback/**/*`
- `migrations/0003_add_prompt_feedback.sql`

**Current Task:** ✅ Built feedback system, fixed Echo prompts, added body part blocklist

---

### Instance 2: Guided Interview Enhancements
**Status:** 🔄 IN PROGRESS
**Branch:** `feature/interview-improvements` (suggested)
**Owner:** [Active Now]
**Focus:** Improving story output from guided interview feature

**Files Owned:**
- `app/interview-chat/**/*`
- `hooks/use-recording-wizard.tsx`
- `contexts/InterviewContext.tsx` (if exists)
- `lib/quickStoryEnhancement.ts`

**Current Task:** Enhancing the narrative quality of stories from guided interviews

**⚠️ DO NOT TOUCH:**
- Any prompt generation files (Instance 1 territory)
- Navigation components (Instance 3 territory)

---

### Instance 3: Navigation & UI Fixes
**Status:** 🔄 IN PROGRESS
**Branch:** `feature/nav-fixes` (suggested)
**Owner:** [Active Now]
**Focus:** Left sidebar navigation bugs and responsive design

**Files Owned:**
- `components/DesktopNavigationBottom.tsx`
- `components/MobileNavigation.tsx`
- `components/Navigation*.tsx`
- `app/layout.tsx`
- `app/globals.css` (navigation sections only)

**Current Task:** Fixing nav bar display issues on certain pages, sizing problems

**⚠️ DO NOT TOUCH:**
- Interview pages (Instance 2 territory)
- Landing page (Instance 4 territory)

---

### Instance 4: Landing Page Updates
**Status:** 🔄 IN PROGRESS
**Branch:** `feature/landing-page` (suggested)
**Owner:** [Active Now]
**Focus:** Marketing and homepage improvements

**Files Owned:**
- `app/page.tsx` (homepage)
- `app/auth/login/page.tsx`
- `app/auth/register/page.tsx`
- `components/landing/**/*` (if exists)
- `public/**/*` (images, assets)

**Current Task:** Landing page changes and improvements

**⚠️ DO NOT TOUCH:**
- Navigation components (Instance 3 territory)
- Any interview pages (Instance 2 territory)

---

### Instance 5: PDF Export (PDFShift Migration)
**Status:** ⏳ STARTING SOON
**Branch:** `feature/pdf-export` (suggested)
**Owner:** [Not Started]
**Focus:** Improving PDF export with PDFShift provider

**Files Owned:**
- `app/api/export/**/*`
- `lib/pdfshift.ts`
- `app/book/print/**/*`

**Current Task:** PDF export improvements and bug fixes

**⚠️ DO NOT TOUCH:**
- Any prompt/AI files (Instance 1 territory)
- Landing page (Instance 4 territory)

---

## 📋 Coordination Rules

### ✅ DO:
1. **Check this doc** before starting work
2. **Update status** when you start/finish a task
3. **Claim files** by adding them to your instance section
4. **Use separate branches** for each instance (recommended)
5. **Commit frequently** so others can see your progress
6. **Mark as complete** when done and ready to merge

### ❌ DON'T:
1. **Touch files owned by another instance** without coordination
2. **Work on shared files** (like `package.json`, `globals.css`) without checking first
3. **Merge directly to main** if multiple instances are active
4. **Forget to update this doc** when claiming new files

### ⚠️ SHARED FILES (Requires Coordination)

These files are touched by multiple instances - **coordinate before editing**:

- `package.json` - Check with all instances first
- `app/globals.css` - Coordinate on which sections you're editing
- `tailwind.config.ts` - Check first
- `.env.local` - Safe (local only, not committed)
- `CLAUDE.md` - Update after merging, not during work

---

## 🔄 Workflow

### Starting New Work
1. Open this doc
2. Find your instance section
3. Add files you'll be working on to "Files Owned"
4. Update status to 🔄 IN PROGRESS
5. (Optional) Create a feature branch
6. Start working!

### During Work
- Commit regularly with clear messages
- If you need to touch a file owned by another instance, **STOP** and coordinate first
- Update "Current Task" as you progress

### Finishing Work
1. Mark status as ✅ COMPLETE
2. Commit all changes
3. If using branches, create PR or merge to main
4. Update `CLAUDE.md` with any new features/changes
5. Move your section to "Completed Instances" below

---

## 📚 Completed Instances

### ✅ Instance 1: Prompt Quality & AI Systems (Oct 20, 2025)
**Completed Tasks:**
- Fixed Echo prompt to use full transcript (no 500-word cap)
- Added body part blocklist to entity extraction
- Enhanced quality gates with context validation
- Built prompt feedback system (database + API + UI)
- Created export functionality (JSON/CSV/JSONL)

**Files Modified:**
- `lib/echoPrompts.ts`
- `lib/promptGenerationV2.ts`
- `lib/promptQuality.ts`
- `app/api/admin/prompts/route.ts`
- `app/api/admin/prompts/feedback/route.ts`
- `app/api/admin/prompts/export/route.ts`
- `app/admin/prompt-feedback/page.tsx`
- `migrations/0003_add_prompt_feedback.sql`

**Merged to:** `main`
**Notes:** Ready for production testing

---

## 🆘 Conflict Resolution

### If Two Instances Touch the Same File:

1. **STOP BOTH INSTANCES**
2. Check git log to see what changed
3. Decide which changes to keep
4. Roll back if needed: `git reset --hard <commit-hash>`
5. Update this doc to prevent future collisions
6. Resume one instance at a time on that file

### Prevention Tips:
- **Use `git status`** before starting work
- **Pull latest** before each session
- **Small commits** make rollbacks easier
- **Branch per instance** = easy conflict resolution

---

## 📊 Quick Status Dashboard

| Instance | Status | Files | Branch | ETA |
|----------|--------|-------|--------|-----|
| 1. Prompt Quality | ✅ Done | 8 files | main | Complete |
| 2. Interview | 🔄 Active | ~4 files | TBD | TBD |
| 3. Navigation | 🔄 Active | ~5 files | TBD | TBD |
| 4. Landing Page | 🔄 Active | ~4 files | TBD | TBD |
| 5. PDF Export | ⏳ Queued | ~4 files | TBD | TBD |

---

## 💡 Tips for Success

1. **Granular = Better**: Smaller, focused tasks = fewer conflicts
2. **Communicate**: Update this doc frequently
3. **Branch Strategy**: Consider using branches per instance for cleaner merges
4. **Test Before Merge**: Run `npm run dev` after merging to catch issues
5. **Document**: Keep `CLAUDE.md` updated with completed work

---

_Last Updated: Oct 20, 2025 - Instance 6 Complete (Timeline Overlay)_
