# Search Patterns - HeritageWhisperV2

> Quick reference for finding code patterns using ripgrep (rg)
>
> **For most users:** Just ask Claude to find things - these commands are here if you want to search manually.

## Find Components

```bash
# Find component definition
rg -n "^export (function|const) .*[A-Z]" components/

# Find component usage
rg -n "<ComponentName" app/ components/

# Find props interface/type
rg -n "type.*Props.*=|interface.*Props" components/
```

## Find API Routes

```bash
# Find all API route handlers
rg -n "export async function (GET|POST|PUT|DELETE)" app/api/

# Find API routes using specific table
rg -n "from\(\"table_name\"\)" app/api/

# Find routes with RLS checks
rg -n "has_collaboration_access" app/api/
```

## Find Hooks

```bash
# Find custom hook definitions
rg -n "export (function|const) use[A-Z]" hooks/

# Find hook usage
rg -n "use[A-Z][a-zA-Z]+\(" app/ components/

# Find TanStack Query hooks
rg -n "useQuery|useMutation" --type tsx
```

## Find Database Queries

```bash
# Find queries on specific table
rg -n "\.from\(\"stories\"\)" app/api/ lib/

# Find INSERT operations
rg -n "\.insert\(" app/api/

# Find UPDATE operations
rg -n "\.update\(" app/api/

# Find DELETE operations
rg -n "\.delete\(" app/api/
```

## Find Types & Schemas

```bash
# Find type definition
rg -n "^export (type|interface) YourType" shared/ types/

# Find Zod schemas
rg -n "z\.(object|string|number)" lib/ shared/

# Find type imports
rg -n "import.*type.*from.*schema" app/ components/
```

## Find Styling

```bash
# Find Tailwind classes with specific color
rg -n "className=.*bg-primary" app/ components/

# Find inline styles (anti-pattern)
rg -n "style=" app/ components/

# Find responsive breakpoints
rg -n "md:|lg:|xl:" app/ components/
```

## Security Scans

```bash
# Find potential secret leaks
rg -n "console\.log.*token|password|email" app/ lib/

# Find service role key usage
rg -n "SUPABASE_SERVICE_ROLE_KEY" app/api/

# Find RLS bypass attempts
rg -n "\.rpc\(\"bypass" app/api/
```

## Find by Feature

```bash
# Family sharing features
rg -n "storyteller_id|has_collaboration_access" app/

# Authentication code
rg -n "auth\.getUser|auth\.getSession" app/api/

# File uploads
rg -n "supabaseStorage|\.upload\(" app/api/

# Rate limiting
rg -n "rateLimit\.check" app/api/
```

## Tips

- `-n` shows line numbers
- `--type tsx` filters to TypeScript files only
- Use quotes around patterns with special characters
- `\(` and `\)` escape parentheses in regex patterns
- Add `-C 3` to show 3 lines of context before/after matches

---

_For general development docs, see [CLAUDE.md](CLAUDE.md)_
