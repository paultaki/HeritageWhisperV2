# Archived Directories - November 2, 2025

This document lists directories that were archived during code cleanup to remove unused/old code versions.

## Book View Versions (Old Implementations)

### `/app/book-old`
- **Archived:** 2025-11-02
- **Last Modified:** Oct 29, 2024
- **Contents:** Previous book view implementation with custom CSS
- **Size:** 7 files/directories including components, export, print folders
- **Status:** Superseded by `/app/book`

### `/app/book-v2`
- **Archived:** 2025-11-02
- **Last Modified:** Oct 30, 2024
- **Contents:** Second iteration of book view
- **Size:** 9 files/directories including nested book folder
- **Status:** Superseded by `/app/book`

### `/app/book-v3`
- **Archived:** 2025-11-02
- **Last Modified:** Oct 24, 2024
- **Contents:** Third iteration of book view
- **Size:** 7 files/directories
- **Status:** Superseded by `/app/book`

## Test/Prototype Pages

### `/app/book-test`
- **Archived:** 2025-11-02
- **Last Modified:** Oct 31, 2024
- **Contents:** Book view testing page (15KB)
- **Status:** Development/testing artifact

### `/app/book-test-simple`
- **Archived:** 2025-11-02
- **Last Modified:** Oct 31, 2024
- **Contents:** Simplified book test page (1.6KB)
- **Status:** Development/testing artifact

### `/app/audio-test`
- **Archived:** 2025-11-02
- **Last Modified:** Oct 28, 2024
- **Contents:** Audio playback testing page (21KB)
- **Status:** Development/testing artifact

### `/app/interview-test`
- **Archived:** 2025-11-02
- **Contents:** Interview feature testing page
- **Status:** Development/testing artifact

### `/app/realtime-test`
- **Archived:** 2025-11-02
- **Contents:** Realtime API testing page
- **Status:** Development/testing artifact

## Active Production Routes

The following remain active:
- `/app/book` - Current production book view
- `/app/timeline` - Current production timeline view
- `/app/family/book` - Family member book view

## Restoration Instructions

If you need to restore any of these:
```bash
cd /Users/paul/Development/HeritageWhisperV2
cp -r archive/old-app-directories/[directory-name] app/
```

## Cleanup Rationale

These directories were archived to:
1. Reduce codebase complexity
2. Eliminate confusion about which version is production
3. Remove dead code that could introduce bugs
4. Improve build times and maintainability
