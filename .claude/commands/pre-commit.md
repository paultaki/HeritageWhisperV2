# Pre-Commit Quality Gate

Run all quality checks before committing code.

**Usage:** `/pre-commit`

## Full Quality Gate

Run these commands in sequence:

```bash
# 1. TypeScript type checking
echo "🔍 Type checking..."
npm run check

# 2. ESLint
echo "🧹 Linting..."
npm run lint

# 3. Run tests
echo "🧪 Running tests..."
npm test

# 4. Build check (optional but recommended)
echo "🏗️  Build check..."
npm run build
```

## If Any Check Fails:

### TypeScript Errors:
- Fix type errors in the reported files
- Don't use `@ts-ignore` - fix the underlying issue
- Check @shared/schema.ts for correct types
- Common issue: snake_case vs camelCase field names

### Lint Errors:
- Auto-fix: `npm run lint:fix` (if available)
- Common issues:
  - Unused imports
  - Missing dependencies in useEffect
  - Console.log statements (remove in production code)

### Test Failures:
- Check test output for specific failures
- Update tests if you changed functionality
- Add tests for new features

### Build Failures:
- Usually TypeScript or import errors
- Check for circular dependencies
- Verify all imports are correct

## Additional Checks:

### Security Scan:
```bash
# Check for hardcoded secrets
rg -n "SUPABASE_SERVICE_ROLE_KEY|OPENAI_API_KEY|sk-" --type ts --type tsx

# Check for console.log with sensitive data
rg -n "console\.(log|error).*email|token|password" --type ts --type tsx
```

### Mobile Responsiveness:
- [ ] Manually test at 375px width
- [ ] Check tap targets are 44x44px minimum
- [ ] Verify text is left-aligned (not justified)

### Family Sharing:
If feature involves user data:
- [ ] Test with account switcher
- [ ] Verify `has_collaboration_access()` is called
- [ ] Test as both owner and contributor

### Database Changes:
If you modified queries:
- [ ] Verify RLS policies allow the query
- [ ] Test that users can't access others' data
- [ ] Check fields are mapped snake_case → camelCase

## Git Commit:

Once all checks pass:

```bash
# Stage changes
git add .

# Commit with conventional commit format
git commit -m "feat: your feature description"
# or
git commit -m "fix: your bug fix description"

# Push to remote
git push origin your-branch-name
```

## Commit Message Guidelines:
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code refactoring
- `docs:` - Documentation changes
- `style:` - Formatting changes
- `test:` - Adding tests
- `chore:` - Build/tooling changes

## Quick Pre-Commit (Fast):
If you just need a quick check:
```bash
npm run check && npm run lint
```

## Remember:
- All checks must pass before creating PR
- If deploying to production, run full build check
- Update CLAUDE.md if you established new patterns
- Update documentation files if you changed architecture
