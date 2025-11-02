# Claude Code Configuration

This directory contains Claude Code-specific configuration and automation.

## Files

### `settings.json`
Hooks configuration for automated safety checks and quality enforcement.

**PreToolUse Hooks:**
- Block dangerous commands (rm -rf, force push, DROP TABLE)
- Warn when editing API routes or environment files

**PostToolUse Hooks:**
- Auto-format TypeScript files with Prettier
- Type-check API routes after editing

### `commands/`
Custom slash commands for common workflows:
- `/api-route` - Generate new API route with boilerplate
- `/component` - Create new component with TypeScript pattern
- `/db-query` - Add database query with RLS checks
- `/pre-commit` - Run full quality gate
- `/family-access` - Add family sharing access control

## Usage

These configurations are automatically loaded by Claude Code when working in this repository.

### Using Custom Commands

Type the command name in your conversation with Claude:
```
/pre-commit
```

Claude will execute the steps defined in the corresponding `.md` file.

### Modifying Hooks

Edit `settings.json` to add, remove, or modify hooks. Changes take effect immediately in new Claude Code sessions.

**Hook Structure:**
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "name": "hook-name",
        "matcher": "ToolName",
        "hooks": [
          {
            "type": "command",
            "command": "bash command to run"
          }
        ]
      }
    ]
  }
}
```

## Best Practices

1. **Keep hooks fast** - They run on every tool use, so avoid slow operations
2. **Use exit code 2** to block operations (exit code 1 just shows warning)
3. **Test hooks locally** before committing
4. **Document custom commands** - Include examples and expected usage

## Reference

- [Claude Code Hooks Documentation](https://www.claude.ai/docs/hooks)
- [Custom Commands Guide](https://www.claude.ai/docs/commands)
- Root CLAUDE.md - Project-specific conventions
- app/api/CLAUDE.md - API route patterns
