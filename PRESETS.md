# Pre-commit Presets Guide

This project supports multiple commit validation presets to fit different workflows and conventions.

## Available Presets

### 1. `folder-based` (Default)

Enforces that all staged files must be in the same folder path up to a configured depth.

**Configuration:**
```json
{
  "preset": "folder-based",
  "depth": 2,
  "ignorePaths": ["package.json", "README.md", ".gitignore"],
  "maxFiles": 100,
  "logFile": ".commit-logs/violations.log",
  "enabled": true,
  "language": "en"
}
```

**Options:**
- `depth` (required): Folder path depth (1-10)
- `ignorePaths` (required): Array of paths to ignore
- `maxFiles` (optional): Maximum files per commit
- `language` (optional): Message language ('en' | 'ko')

**Examples:**
```bash
# depth=1
git commit -m "Update files"
# Result: "[src] Update files"

# depth=2
git commit -m "Add component"
# Result: "[src/components] Add component"

# depth=3
git commit -m "Fix button"
# Result: "[src/components/Button] Fix button"
```

**Valid Prefixes:**
- `[folder/path]` - Based on configured depth
- `[root]` - Root level files
- `[config]` - Files in ignorePaths only

---

### 2. `conventional-commits`

Enforces Conventional Commits specification (https://www.conventionalcommits.org/).

**Configuration:**
```json
{
  "preset": "conventional-commits",
  "types": ["feat", "fix", "docs", "style", "refactor", "perf", "test", "build", "ci", "chore"],
  "scopes": ["api", "ui", "db", "auth"],
  "requireScope": false,
  "logFile": ".commit-logs/violations.log",
  "enabled": true,
  "language": "en"
}
```

**Options:**
- `types` (optional): Allowed commit types (default: standard conventional types)
- `scopes` (optional): Allowed scopes (if empty, any scope is valid)
- `requireScope` (optional): Require scope to be specified (default: false)

**Format:**
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Examples:**
```bash
# Valid commits
git commit -m "feat(api): add user authentication endpoint"
git commit -m "fix: resolve memory leak in cache"
git commit -m "docs(readme): update installation steps"
git commit -m "refactor(ui): simplify button component"

# Invalid commits
git commit -m "added new feature"        # Missing type
git commit -m "feat add feature"         # Missing colon
git commit -m "update(core): changes"    # Invalid type
```

**Standard Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `build`: Build system changes
- `ci`: CI configuration changes
- `chore`: Other changes

---

### 3. `custom`

Define your own validation pattern using regex (coming soon).

---

## Switching Presets

To switch presets, update your `.precommitrc.json`:

```bash
# Use folder-based preset
{
  "preset": "folder-based",
  "depth": 2,
  ...
}

# Use conventional-commits preset
{
  "preset": "conventional-commits",
  "types": ["feat", "fix", "docs"],
  ...
}
```

## Example Configuration Files

See example configuration files:
- `.precommitrc.json` - Current configuration
- `.precommitrc.conventional.example.json` - Conventional commits example

## Migration Guide

### From folder-based to conventional-commits:

1. Backup current config:
   ```bash
   cp .precommitrc.json .precommitrc.backup.json
   ```

2. Update preset:
   ```json
   {
     "preset": "conventional-commits",
     "logFile": ".commit-logs/violations.log",
     "enabled": true
   }
   ```

3. Test with a commit:
   ```bash
   git commit -m "feat: test conventional commits"
   ```

### From conventional-commits to folder-based:

1. Update preset and add folder-based options:
   ```json
   {
     "preset": "folder-based",
     "depth": 2,
     "ignorePaths": ["package.json", "README.md"],
     "logFile": ".commit-logs/violations.log",
     "enabled": true
   }
   ```

2. Rebuild:
   ```bash
   npm run build
   ```

## Creating Custom Presets

You can create custom presets by implementing the `Preset` interface:

```typescript
import type { Preset, Config, ValidationResult, CommitMsgValidationResult } from './types.js';

export class MyCustomPreset implements Preset {
  name = 'my-custom-preset';
  description = 'My custom validation rules';

  validateFiles(stagedFiles: string[], config: Config): ValidationResult {
    // Your file validation logic
  }

  validateCommitMessage(commitMsg: string, config: Config): CommitMsgValidationResult {
    // Your commit message validation logic
  }

  getCommitPrefix(validationResult: ValidationResult, config: Config): string {
    // Generate prefix if applicable
  }
}
```

Then register it in `src/presets/index.ts`:

```typescript
import { MyCustomPreset } from './my-custom-preset.js';

PresetRegistry.registerPreset('my-custom-preset', new MyCustomPreset());
```
