# Contributing to Pre-commit Folder Enforcer

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to this project.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Commit Guidelines](#commit-guidelines)
6. [Pull Request Process](#pull-request-process)
7. [Adding a New Preset](#adding-a-new-preset)

---

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Assume good intentions

---

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- Git

### Setup

1. **Fork the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/pre-commit.git
   cd pre-commit
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

4. **Verify setup**
   ```bash
   npm run precommit status
   ```

---

## Development Workflow

### Project Structure

```
src/
├── core/              # Core system modules
│   ├── utils/         # Utility functions
│   ├── constants.ts   # All constants
│   ├── errors.ts      # Custom error classes
│   └── ...
├── presets/           # Preset implementations
│   ├── base/          # Base types and registry
│   ├── folder-based/  # Folder-based preset
│   └── ...
├── hooks/             # Git hooks
└── cli/               # CLI tool
```

### Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the [coding standards](#coding-standards)
   - Write tests if applicable
   - Update documentation

3. **Build and test**
   ```bash
   npm run build
   npm run precommit check
   ```

4. **Commit your changes**
   - Follow our [commit guidelines](#commit-guidelines)
   - Use the folder-based commit format: `[folder/path] Description`

---

## Coding Standards

This project follows strict coding conventions. Please review [CONVENTIONS.md](./CONVENTIONS.md) for detailed guidelines.

### Key Points

1. **File Naming**
   - Use `kebab-case` for files: `path-utils.ts`
   - Use `index.ts` for module exports

2. **Naming Conventions**
   - Constants: `UPPER_SNAKE_CASE`
   - Variables/Functions: `camelCase`
   - Classes: `PascalCase`
   - Types/Interfaces: `PascalCase`

3. **No Magic Numbers**
   - All numbers must be defined as named constants
   - Use constants from `src/core/constants.ts`

4. **TypeScript**
   - Use strict type checking
   - Avoid `any` type
   - Use `type` for unions, `interface` for objects

5. **Documentation**
   - All public functions must have JSDoc
   - Include `@param`, `@returns`, `@throws`, and `@example`
   - Provide at least 2-3 examples per function

### Example

```typescript
/**
 * Validate depth value for folder path depth configuration
 *
 * Ensures the depth value is either 'auto' or a valid integer within the allowed range.
 *
 * @param depth - The depth value to validate (number or 'auto')
 * @param fieldName - Name of the field being validated (for error messages)
 *
 * @throws {Error} If depth is not a number or 'auto'
 * @throws {Error} If depth is not an integer
 * @throws {Error} If depth is outside the valid range (1-10)
 *
 * @example
 * validateDepth(3, 'depth');              // OK
 * validateDepth('auto', 'depth');         // OK
 * validateDepth(0, 'depth');              // throws
 */
export function validateDepth(depth: number | 'auto', fieldName = 'depth'): void {
  if (depth === 'auto') return;

  if (typeof depth !== 'number') {
    throw new Error(`${fieldName} must be a number or 'auto'`);
  }

  if (!Number.isInteger(depth)) {
    throw new Error(`${fieldName} must be an integer`);
  }

  if (depth < DEPTH_CONSTRAINTS.MIN || depth > DEPTH_CONSTRAINTS.MAX) {
    throw new Error(
      `${fieldName} must be between ${DEPTH_CONSTRAINTS.MIN} and ${DEPTH_CONSTRAINTS.MAX}`
    );
  }
}
```

---

## Commit Guidelines

This project uses **folder-based commit rules** with depth=3. All commits must follow this format:

### Format

```
[folder/path/to] Description

Optional detailed description

- Bullet points for details
- More information
```

### Examples

```bash
# Core module changes
git commit -m "[src/core/utils] Add new validation utility function"

# Preset changes
git commit -m "[src/presets/folder-based] Improve depth detection algorithm"

# Documentation
git commit -m "[root] Update README with new examples"

# Hooks
git commit -m "[src/hooks] Fix commit-msg validation edge case"
```

### Rules

1. **Prefix is required**: `[folder/path/to]`
2. **Description must be clear**: Explain what and why
3. **Use imperative mood**: "Add feature" not "Added feature"
4. **Depth must match**: Follow the 3-depth structure
5. **One concern per commit**: Separate unrelated changes

### Automatic Validation

The pre-commit hook will automatically:
- Validate that files are from the same folder (depth=3)
- Add the correct prefix if missing
- Validate the commit message format

---

## Pull Request Process

### Before Submitting

1. **Ensure code quality**
   ```bash
   npm run build        # Must succeed
   npm run precommit check  # Must pass
   ```

2. **Update documentation**
   - Update README.md if adding features
   - Update CONVENTIONS.md if changing standards
   - Add JSDoc to all new functions

3. **Test your changes**
   - Manually test affected functionality
   - Verify on different scenarios

### Submitting

1. **Push your branch**
   ```bash
   git push -u origin feature/your-feature-name
   ```

2. **Create Pull Request**
   - Use a descriptive title
   - Explain what changes were made and why
   - Reference related issues if applicable
   - Include screenshots for UI changes

3. **PR Template**
   ```markdown
   ## Summary
   Brief description of changes

   ## Changes Made
   - [src/core] Added validation utility
   - [src/presets/folder-based] Improved depth detection

   ## Testing
   - [ ] Built successfully
   - [ ] Manual testing completed
   - [ ] Documentation updated

   ## Related Issues
   Closes #123
   ```

### Review Process

- Maintainers will review your PR
- Address feedback in new commits
- Once approved, PR will be merged
- Squash commits if requested

---

## Adding a New Preset

Want to add a new validation preset? Here's how:

### 1. Create Preset Structure

```
src/presets/your-preset/
├── types.ts       # Configuration type
├── preset.ts      # Preset implementation
├── index.ts       # Exports
└── README.md      # Documentation
```

### 2. Define Types

```typescript
// src/presets/your-preset/types.ts
import type { BaseConfig } from '../../core/types.js';

export interface YourPresetConfig extends BaseConfig {
  preset: 'your-preset';
  // Your custom configuration options
  customOption: string;
}
```

### 3. Implement Preset

```typescript
// src/presets/your-preset/preset.ts
import type { Preset, ValidationResult, CommitMsgValidationResult } from '../base/types.js';
import type { YourPresetConfig } from './types.js';

export class YourPreset implements Preset<YourPresetConfig> {
  name = 'your-preset';
  description = 'Description of your preset';

  validateFiles(files: string[], config: YourPresetConfig): ValidationResult {
    // Implement file validation logic
  }

  validateCommitMessage(msg: string, config: YourPresetConfig): CommitMsgValidationResult {
    // Implement message validation logic
  }

  getCommitPrefix(result: ValidationResult, config: YourPresetConfig): string {
    // Generate commit prefix
  }
}
```

### 4. Register Preset

```typescript
// src/presets/index.ts
import { YourPreset } from './your-preset/preset.js';

// Register in initialization
PresetRegistry.register('your-preset', new YourPreset());
```

### 5. Update Config Type

```typescript
// src/core/config.ts
import type { YourPresetConfig } from '../presets/your-preset/types.js';

export type Config = FolderBasedConfig | ConventionalCommitsConfig | YourPresetConfig;
```

### 6. Add Documentation

Create `src/presets/your-preset/README.md`:

```markdown
# Your Preset

Description of what this preset does and when to use it.

## Configuration

\`\`\`json
{
  "preset": "your-preset",
  "customOption": "value"
}
\`\`\`

## Examples

...
```

### 7. Test Your Preset

1. Build: `npm run build`
2. Create test config: `.precommitrc.json`
3. Test manually with various scenarios
4. Submit PR with examples

---

## Questions?

- Check existing [Issues](https://github.com/mineclover/pre-commit/issues)
- Read the [Documentation](./README.md)
- Review [Conventions](./CONVENTIONS.md)

Thank you for contributing! 🎉
