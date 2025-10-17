# Console.log Cleanup Strategy

## Current State

**Total Console Statements**: 796 across 89 files

**Top Offenders**:
- `/app/review/book-style/page.tsx`: 63 statements
- `/app/recording/page.tsx`: 16 statements
- `/app/book/print/2up/page.tsx`: 14 statements
- `/app/timeline-test/page.tsx`: 11 statements
- `/app/book/print/trim/page.tsx`: 7 statements

## Why This Matters

### Production Issues
1. **Performance**: Console statements add overhead, especially in loops
2. **Security**: May leak sensitive data (user IDs, API keys, PII)
3. **Bundle Size**: All console statements increase client-side JS
4. **Browser Console Spam**: Makes actual errors harder to find

### Development Issues
1. **Debugging Difficulty**: Too much noise hides real problems
2. **Inconsistency**: Some use logger, some use console
3. **No Log Levels**: Can't filter by severity
4. **No Structure**: Unstructured strings harder to search

## Strategy

### Phase 1: Categorize (Automated)

Run these commands to categorize console usage:

```bash
# Find all console.log statements
grep -r "console\.log" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.next

# Find console.error (keep most of these)
grep -r "console\.error" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.next

# Find console.warn (keep some)
grep -r "console\.warn" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.next

# Find console.debug (remove all in production)
grep -r "console\.debug" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.next
```

### Phase 2: Replace with Proper Logging

#### Logger Configuration

Use the existing `/lib/logger.ts` which provides:
- `logger.info()` - Important events (keep in production)
- `logger.warn()` - Warnings (keep in production)
- `logger.error()` - Errors (keep in production)
- `logger.debug()` - Debug info (strip in production builds)
- `logger.api()` - API call tracking (keep for telemetry)

#### Replacement Rules

**1. Debug Statements (REMOVE)**
```typescript
// ❌ Remove these entirely
console.log('[Component] Rendering with props:', props);
console.log('State updated:', state);
console.log('Variable value:', value);
```

**2. Important Events (REPLACE with logger.info)**
```typescript
// Before
console.log('User logged in:', userId);

// After
logger.info('User logged in', { userId });
```

**3. Errors (REPLACE with logger.error)**
```typescript
// Before
console.error('Failed to fetch:', error);

// After
logger.error('Failed to fetch data', error);
```

**4. Warnings (REPLACE with logger.warn)**
```typescript
// Before
console.warn('Deprecated API call');

// After
logger.warn('Deprecated API call detected');
```

**5. Structured Logging**
```typescript
// Before
console.log(`User ${userId} created story ${storyId} at ${timestamp}`);

// After
logger.info('Story created', {
  userId,
  storyId,
  timestamp,
});
```

### Phase 3: Automated Cleanup

Create a script to automate common replacements:

```bash
# /scripts/cleanup-console-logs.sh

#!/bin/bash

# Backup files before modification
git add -A
git commit -m "Pre-cleanup snapshot"

# Replace common patterns (run with caution!)

# Replace console.log with logger.debug (can be stripped)
find . -type f \( -name "*.ts" -o -name "*.tsx" \) \
  -not -path "./node_modules/*" \
  -not -path "./.next/*" \
  -exec sed -i '' 's/console\.log(\(.*\))/logger.debug(\1)/g' {} \;

# Replace console.error with logger.error
find . -type f \( -name "*.ts" -o -name "*.tsx" \) \
  -not -path "./node_modules/*" \
  -not -path "./.next/*" \
  -exec sed -i '' 's/console\.error(\(.*\))/logger.error(\1)/g' {} \;

# Replace console.warn with logger.warn
find . -type f \( -name "*.ts" -o -name "*.tsx" \) \
  -not -path "./node_modules/*" \
  -not -path "./.next/*" \
  -exec sed -i '' 's/console\.warn(\(.*\))/logger.warn(\1)/g' {} \;

echo "✅ Automated replacements complete. Review changes before committing."
```

### Phase 4: ESLint Configuration

Add ESLint rules to prevent future console statements:

```json
// .eslintrc.json
{
  "rules": {
    "no-console": [
      "warn",
      {
        "allow": ["error", "warn", "info"]
      }
    ]
  }
}
```

**Better approach** - Ban console entirely:
```json
{
  "rules": {
    "no-console": "error"
  }
}
```

Then use the logger exclusively.

### Phase 5: Production Build Optimization

Update `next.config.ts` to strip debug logs in production:

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  // Existing config...

  webpack: (config, { dev, isServer }) => {
    if (!dev) {
      // Remove console.debug in production builds
      config.optimization = {
        ...config.optimization,
        minimize: true,
        minimizer: [
          ...config.optimization.minimizer,
          new TerserPlugin({
            terserOptions: {
              compress: {
                drop_console: ['log', 'debug'],  // Remove console.log and console.debug
                pure_funcs: ['logger.debug'],     // Remove logger.debug calls
              },
            },
          }),
        ],
      };
    }
    return config;
  },
};
```

## Implementation Plan

### Week 1: High-Priority Files (Manual Review)

Focus on files with security implications:

1. **API Routes** - `/app/api/**/*.ts`
   - May log user data, tokens, or API keys
   - Replace with structured logger calls
   - Remove all debug console.log statements

2. **Auth Files** - `/app/auth/**/*.tsx`, `/lib/auth.tsx`
   - May log passwords or tokens
   - Critical security risk
   - Audit every console statement

3. **Database Operations** - `/lib/supabase.ts`, `/shared/schema.ts`
   - May log query results with PII
   - Replace with logger (redact sensitive fields)

### Week 2: Top Offender Files

**Priority Order**:
1. `/app/review/book-style/page.tsx` (63 statements)
2. `/app/recording/page.tsx` (16 statements)
3. `/app/book/print/2up/page.tsx` (14 statements)
4. `/app/timeline-test/page.tsx` (11 statements)
5. `/app/book/print/trim/page.tsx` (7 statements)

**Process for each file**:
1. Read the file
2. Categorize each console statement (debug/info/warn/error)
3. Remove debug statements
4. Replace important logs with logger calls
5. Test the functionality
6. Commit with message: "chore: cleanup console.log in [filename]"

### Week 3: Automated Cleanup + ESLint

1. Run automated replacement script on remaining files
2. Review all changes (don't blindly commit!)
3. Add ESLint `no-console` rule
4. Fix any ESLint errors
5. Update `next.config.ts` for production stripping

### Week 4: Documentation & Training

1. Update `CLAUDE.md` with logging guidelines
2. Add logging examples to codebase
3. Document logger API usage
4. Add pre-commit hook to reject console.log

## Quick Reference

### DO Use Logger

```typescript
import { logger } from '@/lib/logger';

// Info: Important events
logger.info('User action completed', { userId, action });

// Error: Failures
logger.error('Operation failed', error);

// Warning: Unexpected states
logger.warn('Deprecated feature used', { feature });

// Debug: Development only (stripped in production)
logger.debug('Variable state', { variable });

// API: API calls (telemetry)
logger.api('External API call', { endpoint, status });
```

### DON'T Use Console

```typescript
// ❌ Never in production code
console.log('Debug info');
console.log('User data:', user);
console.log(sensitiveData);

// ❌ Only if absolutely necessary (temporary debugging)
console.error('Critical error:', error);  // Use logger.error instead
```

### Exceptions (Rare)

Only use console in these cases:
1. **Build scripts** - `scripts/*.js`
2. **Test utilities** - `tests/**/*.ts`
3. **CLI tools** - Standalone command-line utilities
4. **Development-only pages** - `/app/dev/**` (if gated behind auth)

## Checklist

Before deploying to production:
- [ ] Zero `console.log` statements in `/app/api/**`
- [ ] Zero `console.log` statements in `/lib/**`
- [ ] Zero `console.log` statements in auth flows
- [ ] ESLint `no-console` rule enabled
- [ ] Production build strips `logger.debug` calls
- [ ] No sensitive data in any remaining console/logger statements
- [ ] All important events use structured logging

## Monitoring

After cleanup, monitor for regressions:

```bash
# Daily check for new console statements
git diff HEAD~1 | grep "console\."

# Pre-commit hook (add to .husky/pre-commit)
#!/bin/sh
FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx)$')
if [ -n "$FILES" ]; then
  for FILE in $FILES; do
    if grep -q "console\." "$FILE"; then
      echo "❌ Console statement found in $FILE"
      echo "Use logger instead: import { logger } from '@/lib/logger'"
      exit 1
    fi
  done
fi
```

## Success Metrics

**Target Goals**:
- ✅ Reduce from 796 → 0 console statements in src files
- ✅ All API routes use structured logger
- ✅ ESLint prevents new console statements
- ✅ Production builds strip debug logs
- ✅ Zero PII in production logs

---

**Last Updated**: October 2025
**Status**: Strategy Defined - Implementation Pending
