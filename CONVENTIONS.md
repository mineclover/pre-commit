# Coding Conventions

This document outlines the coding conventions used in this project. Following these conventions ensures consistency, maintainability, and readability across the codebase.

## Table of Contents

1. [File and Folder Structure](#file-and-folder-structure)
2. [Naming Conventions](#naming-conventions)
3. [Import Organization](#import-organization)
4. [TypeScript Conventions](#typescript-conventions)
5. [Error Handling](#error-handling)
6. [Comments and Documentation](#comments-and-documentation)
7. [Constants and Configuration](#constants-and-configuration)

---

## File and Folder Structure

### Folder Organization

```
src/
├── core/              # Core system modules
│   ├── utils/         # Utility functions
│   ├── config.ts      # Configuration management
│   ├── constants.ts   # Application constants
│   ├── errors.ts      # Custom error classes
│   └── ...
├── presets/           # Preset implementations
│   ├── base/          # Base types and registry
│   ├── folder-based/  # Folder-based preset
│   └── ...
├── hooks/             # Git hooks
└── cli/               # CLI tool
```

### File Naming

- **TypeScript files**: Use `kebab-case` for module files
  - ✅ `path-utils.ts`, `validation-utils.ts`, `commit-msg.ts`
  - ❌ `pathUtils.ts`, `PathUtils.ts`, `commit_msg.ts`

- **Index files**: Always name as `index.ts`
  - Used for re-exporting module contents
  - Makes imports cleaner: `from './utils'` instead of `from './utils/index'`

- **Type definition files**: Use descriptive names ending with purpose
  - ✅ `types.ts`, `errors.ts`, `constants.ts`
  - ❌ `defs.ts`, `err.ts`, `const.ts`

### Folder Structure Rules

1. **Depth-based organization**: Follow the 3-depth structure
   - Level 1: Major components (`core`, `presets`, `hooks`)
   - Level 2: Functional groups (`utils`, `folder-based`)
   - Level 3: Specific modules (`path-utils.ts`)

2. **Separation of concerns**: Each folder has a single responsibility
   - `core/` - Shared infrastructure
   - `presets/` - Validation presets
   - `hooks/` - Git hook implementations

---

## Naming Conventions

### Variables and Constants

```typescript
// Constants: UPPER_SNAKE_CASE for exported constants
export const DEPTH_CONSTRAINTS = {
  MIN: 1,
  MAX: 10,
  DEFAULT: 3,
} as const;

export const SPECIAL_COMMIT_TYPES = ['Merge ', 'Revert '] as const;

// Regular variables: camelCase
const effectiveDepth = 3;
const filteredFiles = [];
const isValid = true;
```

### Functions

```typescript
// Functions: camelCase with verb prefix
export function validateDepth(depth: number): void { }
export function getPathPrefix(path: string): string { }
export function filterIgnoredFiles(files: string[]): string[] { }

// Boolean functions: use is/has/should prefix
function isRootFile(path: string): boolean { }
function hasValidPrefix(message: string): boolean { }
function shouldIgnoreFile(path: string): boolean { }
```

### Classes

```typescript
// Classes: PascalCase
export class CommitValidator { }
export class PresetRegistry { }
export class FolderBasedPreset { }

// Error classes: end with "Error"
export class ConfigValidationError extends Error { }
export class PresetNotFoundError extends Error { }
```

### Types and Interfaces

```typescript
// Types: PascalCase
export type Config = FolderBasedConfig | ConventionalCommitsConfig;
export type Language = 'en' | 'ko';
export type DepthOverrides = Record<string, number>;

// Interfaces: PascalCase
export interface BaseConfig { }
export interface ValidationResult { }
export interface Preset<TConfig = any> { }

// Generic type parameters: Single uppercase letter or PascalCase with T prefix
interface Preset<TConfig = any> { }
function validate<TResult>(data: unknown): TResult { }
```

### File-level Constants

```typescript
// Private constants within files: UPPER_SNAKE_CASE
const DEFAULT_CONFIG: FolderBasedConfig = { };
const VALID_PRESETS = ['folder-based', 'conventional-commits'];
```

---

## Import Organization

### Import Order

Always organize imports in this order:

```typescript
#!/usr/bin/env node  // Shebang (if applicable)

// 1. Node.js built-in modules
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// 2. External dependencies
import { simpleGit } from 'simple-git';

// 3. Internal modules - group by type
// 3a. Type-only imports first
import type { Config } from '../core/config.js';
import type { ValidationResult } from '../base/types.js';

// 3b. Regular imports
import { loadConfig } from '../core/config.js';
import { CommitValidator } from '../core/validator.js';
import { DEPTH_CONSTRAINTS } from '../core/constants.js';
```

### Import Grouping

```typescript
// Group related imports together with multi-line format
import {
  DEPTH_CONSTRAINTS,
  FILE_CONSTRAINTS,
  LOG_DEFAULTS,
} from './constants.js';

import {
  validateDepth,
  validateMaxFiles,
  validatePathArray,
} from './utils/validation-utils.js';
```

### Import Best Practices

1. **Always use `.js` extension** in imports (ESM requirement)
   ```typescript
   ✅ import { loadConfig } from './config.js';
   ❌ import { loadConfig } from './config';
   ```

2. **Use type-only imports** when importing only types
   ```typescript
   ✅ import type { Config } from './config.js';
   ❌ import { Config } from './config.js';  // if Config is a type
   ```

3. **Prefer named imports** over default imports
   ```typescript
   ✅ import { CommitValidator } from './validator.js';
   ❌ import CommitValidator from './validator.js';
   ```

---

## TypeScript Conventions

### Type Definitions

```typescript
// Use 'type' for unions and simple aliases
export type Language = 'en' | 'ko';
export type Config = FolderBasedConfig | ConventionalCommitsConfig;

// Use 'interface' for object shapes (more extensible)
export interface BaseConfig {
  enabled: boolean;
  language: Language;
}

// Use 'as const' for immutable constants
export const PRESET_NAMES = {
  FOLDER_BASED: 'folder-based',
  CONVENTIONAL_COMMITS: 'conventional-commits',
} as const;
```

### Type Safety

```typescript
// Use assertion functions for runtime type validation
export function validatePathArray(
  paths: unknown,
  fieldName = 'paths'
): asserts paths is string[] {
  if (!Array.isArray(paths)) {
    throw new Error(`${fieldName} must be an array`);
  }
}

// Use discriminated unions for config types
export type Config =
  | { preset: 'folder-based'; depth: number }
  | { preset: 'conventional-commits'; types: string[] };

// Use generics for reusable interfaces
export interface Preset<TConfig = any> {
  name: string;
  validate(config: TConfig): ValidationResult;
}
```

### Null and Undefined Handling

```typescript
// Prefer explicit null/undefined over implicit
✅ function getPrefix(path: string | null): string
❌ function getPrefix(path?: string): string  // unclear if undefined or not provided

// Use optional chaining and nullish coalescing
const depth = config.maxDepth ?? 5;
const prefix = validationResult.commonPath ?? '[root]';
```

---

## Error Handling

### Custom Error Classes

Always use custom error classes for different error types:

```typescript
// Define specific error classes
export class ConfigValidationError extends PrecommitError {
  constructor(
    message: string,
    public field?: string,
    public value?: unknown
  ) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}

// Use them with meaningful context
throw new ConfigValidationError(
  'Invalid depth value',
  'depth',
  config.depth
);
```

### Error Handling Patterns

```typescript
// Pattern 1: Catch specific error types
try {
  validateConfig(config);
} catch (error) {
  if (error instanceof ConfigValidationError) {
    console.error(`Config error in ${error.field}:`, error.message);
    throw error;
  }
  throw new ConfigValidationError((error as Error).message);
}

// Pattern 2: Validation functions throw errors
export function validateDepth(depth: number | 'auto'): void {
  if (depth === 'auto') return;

  if (typeof depth !== 'number') {
    throw new Error('depth must be a number or "auto"');
  }

  if (depth < DEPTH_CONSTRAINTS.MIN || depth > DEPTH_CONSTRAINTS.MAX) {
    throw new Error(
      `depth must be between ${DEPTH_CONSTRAINTS.MIN} and ${DEPTH_CONSTRAINTS.MAX}`
    );
  }
}
```

### Process Exit Codes

In CLI and hooks, use consistent exit codes:

```typescript
// Success
process.exit(0);

// Validation failure
process.exit(1);

// Usage:
if (!result.valid) {
  console.error('❌ Validation failed');
  process.exit(1);
}
```

---

## Comments and Documentation

### File Headers

```typescript
/**
 * Module description
 *
 * Brief explanation of what this module does and when to use it
 */
```

### Function Documentation

```typescript
/**
 * Get path prefix up to specified depth
 *
 * @param filePath - The file path to process
 * @param depth - Number of folder levels to include
 * @returns The path prefix, or empty string for root files
 *
 * @example
 * getPathPrefix("src/components/Button/index.ts", 2) // "src/components"
 * getPathPrefix("file.ts", 2) // "" (root file)
 */
export function getPathPrefix(filePath: string, depth: number): string {
  // Implementation
}
```

### Inline Comments

```typescript
// Use comments to explain WHY, not WHAT
✅ // Skip validation for merge commits as they follow different format
❌ // Check if first line starts with 'Merge '

// Use comments before complex logic
// Try each depth from 1 to maxDepth and find the one that groups files best
for (let depth = 1; depth <= maxDepth; depth++) {
  // ...
}

// Use TODO comments with context
// TODO: Add support for custom commit message templates
// TODO: Optimize path matching algorithm for large file sets
```

### JSDoc Tags

```typescript
/**
 * Validate configuration
 *
 * @throws {ConfigValidationError} If configuration is invalid
 * @internal Only used within the config module
 */

/**
 * @deprecated Use validateDepth() instead
 * @see validateDepth
 */
```

---

## Constants and Configuration

### Constant Organization

```typescript
// Group related constants into objects
export const DEPTH_CONSTRAINTS = {
  MIN: 1,
  MAX: 10,
  DEFAULT: 3,
  DEFAULT_MAX_DEPTH: 5,
} as const;

export const FILE_CONSTRAINTS = {
  MIN: 1,
  MAX_FILES: 1000,
  DEFAULT_MAX_FILES: 100,
} as const;
```

### Magic Numbers

**Never use magic numbers in code**. Always define them as named constants:

```typescript
❌ if (depth < 1 || depth > 10) { }
❌ const minLength = 3;

✅ if (depth < DEPTH_CONSTRAINTS.MIN || depth > DEPTH_CONSTRAINTS.MAX) { }
✅ const minLength = COMMIT_MESSAGE.MIN_DESCRIPTION_LENGTH;
```

### Configuration Defaults

```typescript
// Centralize default configuration
const DEFAULT_CONFIG: FolderBasedConfig = {
  preset: PRESET_NAMES.FOLDER_BASED,
  depth: DEPTH_CONSTRAINTS.DEFAULT,
  logFile: LOG_DEFAULTS.FILE_PATH,
  enabled: true,
  ignorePaths: [],
  maxFiles: FILE_CONSTRAINTS.DEFAULT_MAX_FILES,
  verbose: false,
  logMaxAgeHours: LOG_DEFAULTS.MAX_AGE_HOURS,
  language: 'en'
};
```

---

## Module Exports

### Export Organization

```typescript
// In index.ts files, organize exports by category

// Types
export { type Language, type BaseConfig } from './types.js';
export { type Config } from './config.js';

// Core modules
export { loadConfig } from './config.js';
export { Logger } from './logger.js';
export { CommitValidator } from './validator.js';

// Constants
export * from './constants.js';

// Utilities
export * from './utils/index.js';

// Error classes
export * from './errors.js';
```

### Named vs Default Exports

**Prefer named exports** over default exports:

```typescript
✅ export class CommitValidator { }
   import { CommitValidator } from './validator.js';

❌ export default class CommitValidator { }
   import CommitValidator from './validator.js';
```

**Reasoning**: Named exports provide better IDE support, make refactoring easier, and prevent naming inconsistencies.

---

## Additional Best Practices

### 1. Utility Function Organization

Group utility functions by purpose into separate files:
- `path-utils.ts` - Path manipulation
- `validation-utils.ts` - Validation logic
- Each utility file should have a single, clear purpose

### 2. Avoid Code Duplication

```typescript
❌ // Duplicated logic
if (file.startsWith(ignore + '/') || file.startsWith(ignore)) { }

✅ // Extracted to utility function
export function shouldIgnoreFile(file: string, ignorePath: string): boolean {
  return file === ignorePath || file.startsWith(ignorePath + '/');
}
```

### 3. Type Narrowing

```typescript
// Use type guards and narrowing
export type Config = FolderBasedConfig | ConventionalCommitsConfig;

function validateConfig(config: Config): void {
  if (config.preset === PRESET_NAMES.FOLDER_BASED) {
    // TypeScript knows config is FolderBasedConfig here
    const folderConfig = config as FolderBasedConfig;
    validateDepth(folderConfig.depth);
  }
}
```

### 4. Immutability

```typescript
// Use 'as const' for immutable data
export const SPECIAL_COMMIT_TYPES = [
  'Merge ',
  'Revert ',
  'Squash ',
] as const;

// Use readonly for properties that shouldn't change
export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}
```

---

## Convention Compliance

To ensure these conventions are followed:

1. **Code Reviews**: Check for convention compliance during reviews
2. **Linting**: Use ESLint with TypeScript rules
3. **Formatting**: Use Prettier for consistent formatting
4. **Documentation**: Keep this document updated as conventions evolve
5. **Refactoring**: Gradually update old code to match new conventions

---

## Examples

See the following files for reference implementations:

- **Constants**: `src/core/constants.ts`
- **Error Classes**: `src/core/errors.ts`
- **Utilities**: `src/core/utils/path-utils.ts`
- **Type Definitions**: `src/presets/folder-based/types.ts`
- **Module Organization**: `src/core/index.ts`
