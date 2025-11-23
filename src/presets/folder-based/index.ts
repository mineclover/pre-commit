/**
 * Folder-based Preset
 *
 * Enforces that all committed files must be in the same folder path
 * up to a configured depth level.
 *
 * Features:
 * - Validates files are in the same folder
 * - Auto-generates commit message prefixes
 * - Depth-based path matching
 * - Ignore paths support
 *
 * @example
 * ```json
 * {
 *   "preset": "folder-based",
 *   "depth": 2,
 *   "ignorePaths": ["package.json", "README.md"],
 *   "maxFiles": 100
 * }
 * ```
 */

export * from './types.js';
export * from './preset.js';
