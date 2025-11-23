/**
 * Conventional Commits Preset
 *
 * Enforces Conventional Commits specification (https://www.conventionalcommits.org/)
 * Format: <type>(<scope>): <description>
 *
 * Features:
 * - Validates commit message format
 * - Supports custom types and scopes
 * - Optional scope requirement
 * - No file grouping restrictions
 *
 * @example
 * ```json
 * {
 *   "preset": "conventional-commits",
 *   "types": ["feat", "fix", "docs"],
 *   "scopes": ["api", "ui", "db"],
 *   "requireScope": false
 * }
 * ```
 */

export * from './types.js';
export * from './preset.js';
