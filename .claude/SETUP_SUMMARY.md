# Claude Code Optimization - Setup Summary

**Date:** November 2, 2025  
**Project:** HeritageWhisperV2

## What Was Created

### 1. Safety Hooks (`.claude/settings.json`)

Automated safety and quality enforcement:

**🚫 Blocked Operations (Exit Code 2):**
- `rm -rf /` or `rm -rf ~` commands
- `git push --force` to main branch
- `DROP TABLE` or `DELETE FROM users` SQL commands

**⚠️ Warning Messages:**
- When editing API routes → Reminds to validate session, check RLS, map snake_case → camelCase
- When editing `.env` files → Reminds to never commit secrets

**✨ Auto-Formatting:**
- TypeScript/TSX files automatically formatted with Prettier after editing
- API routes automatically type-checked after editing

### 2. Custom Slash Commands (`.claude/commands/`)

Five productivity commands for common workflows:

#### `/api-route <path> <method>`
Generates a complete API route with:
- Session validation boilerplate
- Family sharing access control
- Database query with RLS checks
- Error handling with proper status codes
- Field mapping (snake_case → camelCase)

**Example:** `/api-route stories/archive GET`

#### `/component <name> <location>`
Creates a new React component with:
- TypeScript type definitions
- Functional component pattern
- "use client" directive if needed
- shadcn/ui integration examples
- Mobile-responsive patterns

**Example:** `/component StoryCard components/stories`

#### `/db-query <table> <operation>`
Adds database query with:
- RLS security checks
- Type imports from @shared/schema
- Multi-tenant support (storyteller_id)
- Field mapping examples
- Performance tips

**Example:** `/db-query stories select`

#### `/pre-commit`
Runs full quality gate:
1. TypeScript type checking
2. ESLint
3. Unit tests
4. Build check (optional)
5. Security scan for secrets

Includes fix instructions for each check.

#### `/family-access <feature>`
Adds family sharing (multi-tenant) support:
- API route pattern with storyteller_id
- React Query hook pattern
- Component with account context
- Permission level checks
- Testing checklist

**Example:** `/family-access prompts-api`

### 3. API Route Documentation (`app/api/CLAUDE.md`)

Comprehensive guide with:
- Standard API route template (copy-paste ready)
- HTTP method patterns (GET, POST, PUT, DELETE)
- Security patterns (session validation, RLS checks)
- Database field mapping examples
- File upload pattern
- Rate limiting pattern
- Error handling checklist
- Testing guide with curl examples

### 4. Enhanced Root CLAUDE.md

Added new sections:

#### **Universal Rules (RFC-2119)**
- MUST/SHOULD/MAY language for clarity
- Non-negotiable security requirements
- Anti-patterns to avoid

#### **JIT Search Commands**
Quick ripgrep commands to find:
- Components and their usage
- API routes and handlers
- Custom hooks
- Database queries
- Types and schemas
- Styling patterns
- Security issues
- Feature-specific code

#### **MCP Server Usage Guide**
When and how to use each MCP server:
- Supabase (database schema, RLS policies)
- GitHub (issues, PRs, workflows)
- Vercel (deployments, logs)
- Stripe (subscriptions, payments)
- Resend (email delivery)

## File Structure

```
HeritageWhisperV2/
├── .claude/
│   ├── README.md                      # This documentation
│   ├── SETUP_SUMMARY.md              # You are here
│   ├── settings.json                 # Hooks configuration
│   └── commands/
│       ├── api-route.md              # /api-route command
│       ├── component.md              # /component command
│       ├── db-query.md               # /db-query command
│       ├── pre-commit.md             # /pre-commit command
│       └── family-access.md          # /family-access command
├── app/
│   └── api/
│       └── CLAUDE.md                 # API-specific patterns
└── CLAUDE.md (enhanced)              # Root documentation
```

## How to Use

### Using Custom Slash Commands

In your conversation with Claude Code, simply type:

```
/pre-commit
```

Claude will execute all the steps defined in that command's `.md` file.

### Using JIT Search Commands

Copy-paste the search commands from CLAUDE.md:

```bash
# Find all API routes
rg -n "export async function (GET|POST|PUT|DELETE)" app/api/

# Find component usage
rg -n "<StoryCard" app/ components/
```

### Using MCP Servers

Ask Claude to use an MCP server:

```
"Use Supabase MCP to show me the stories table schema"
"Check if the latest Vercel deployment succeeded"
"Create a GitHub issue for the prompt dismiss bug"
```

### Testing Hooks

Hooks are automatically active. Try editing an API route file - you'll see the warning message appear.

Try running a dangerous command - it will be blocked:
```bash
rm -rf / 
# 🚫 BLOCKED: Dangerous rm -rf command detected
```

## Benefits

### Developer Velocity
- **Slash commands** = Instant boilerplate generation
- **JIT search** = Find patterns in seconds
- **MCP integration** = No context switching to dashboards

### Code Quality
- **Auto-formatting** = Consistent style without thinking
- **Type checking** = Catch errors before commit
- **Safety hooks** = Prevent catastrophic mistakes

### Security
- **Blocked commands** = Can't accidentally nuke the repo
- **Warning messages** = Reminders for security patterns
- **Secret detection** = Scans before committing

### Onboarding
- **Comprehensive docs** = New devs get up to speed faster
- **Code templates** = Consistent patterns across team
- **Reference examples** = Copy-paste from existing code

## Customization

### Adding a New Hook

Edit `.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "name": "your-hook-name",
        "matcher": "Execute|Edit|Create",
        "hooks": [
          {
            "type": "command",
            "command": "your bash command here"
          }
        ]
      }
    ]
  }
}
```

### Creating a New Slash Command

Create `.claude/commands/your-command.md`:

```markdown
# Your Command Name

Brief description of what this command does.

**Usage:** `/your-command <args>`

## Steps:

1. Step 1
2. Step 2
3. Step 3

## Example:

[Code example here]
```

### Modifying Existing Commands

Just edit the corresponding `.md` file in `.claude/commands/`. Changes are effective immediately in new sessions.

## Next Steps

1. **Test the hooks** - Try editing files and see the warnings
2. **Try a slash command** - Run `/pre-commit` to see it in action
3. **Use JIT search** - Find components or API routes with ripgrep
4. **Explore MCP** - Ask Claude to check something on Vercel or Supabase
5. **Customize** - Add your own hooks or commands as needed

## Maintenance

- **Update hooks** when new anti-patterns emerge
- **Add commands** for frequently repeated workflows
- **Enhance CLAUDE.md** when new conventions are established
- **Review quarterly** to remove obsolete patterns

## Troubleshooting

### Hook Not Running
- Check `.claude/settings.json` for syntax errors
- Verify the `matcher` pattern matches the tool being used
- Restart Claude Code session

### Command Not Found
- Check the file exists in `.claude/commands/`
- Verify filename matches command name (without `/`)
- Command files must be `.md` format

### MCP Not Working
- Verify MCP server is configured in `~/.mcp.json`
- Check environment variables are set
- Test MCP connection in Claude Code settings

## Reference Links

- Root Documentation: `CLAUDE.md`
- API Patterns: `app/api/CLAUDE.md`
- Database Schema: `DATA_MODEL.md`
- Security Guidelines: `SECURITY.md`
- Family Sharing: `FAMILY_SHARING_README.md`

---

**Questions?** Check `.claude/README.md` or root `CLAUDE.md` for more details.
