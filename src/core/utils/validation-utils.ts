/**
 * Validation utilities
 * Reusable validation functions for configuration and input
 */

import { DEPTH_CONSTRAINTS, FILE_CONSTRAINTS } from '../constants.js';

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
 * validateDepth(0, 'depth');              // throws: must be between 1 and 10
 * validateDepth(3.5, 'depth');            // throws: must be an integer
 * validateDepth('invalid', 'depth');      // throws: must be a number or 'auto'
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
      `${fieldName} must be between ${DEPTH_CONSTRAINTS.MIN} and ${DEPTH_CONSTRAINTS.MAX}, or 'auto'`
    );
  }
}

/**
 * Validate maximum files per commit configuration
 *
 * Ensures maxFiles is a valid positive integer within the allowed range.
 *
 * @param maxFiles - Maximum number of files allowed per commit (or undefined for no limit)
 *
 * @throws {Error} If maxFiles is not an integer or is less than 1
 * @throws {Error} If maxFiles exceeds the maximum allowed value (1000)
 *
 * @example
 * validateMaxFiles(50);        // OK
 * validateMaxFiles(undefined); // OK (no limit)
 * validateMaxFiles(0);         // throws: must be >= 1
 * validateMaxFiles(1001);      // throws: cannot exceed 1000
 * validateMaxFiles(10.5);      // throws: must be an integer
 */
export function validateMaxFiles(maxFiles: number | undefined): void {
  if (maxFiles === undefined) return;

  if (!Number.isInteger(maxFiles) || maxFiles < FILE_CONSTRAINTS.MIN) {
    throw new Error(
      `maxFiles must be an integer >= ${FILE_CONSTRAINTS.MIN}`
    );
  }

  if (maxFiles > FILE_CONSTRAINTS.MAX_FILES) {
    throw new Error(
      `maxFiles cannot exceed ${FILE_CONSTRAINTS.MAX_FILES}`
    );
  }
}

/**
 * Validate that a value is an array of strings (TypeScript assertion function)
 *
 * This is an assertion function that narrows the type of `paths` to `string[]` after validation.
 * TypeScript will know that `paths` is a string array in subsequent code.
 *
 * @param paths - The value to validate (unknown type)
 * @param fieldName - Name of the field being validated (for error messages)
 *
 * @throws {Error} If paths is not an array
 * @throws {Error} If any element in the array is not a string
 *
 * @example
 * const data: unknown = ['src', 'dist'];
 * validatePathArray(data, 'ignorePaths');
 * // Now TypeScript knows data is string[]
 * data.forEach(path => console.log(path));
 *
 * @example
 * validatePathArray(['a', 'b'], 'paths');     // OK
 * validatePathArray([], 'paths');             // OK (empty array is valid)
 * validatePathArray('not-array', 'paths');    // throws: must be an array
 * validatePathArray(['a', 1], 'paths');       // throws: must contain only strings
 */
export function validatePathArray(paths: unknown, fieldName = 'paths'): asserts paths is string[] {
  if (!Array.isArray(paths)) {
    throw new Error(`${fieldName} must be an array`);
  }

  if (!paths.every(p => typeof p === 'string')) {
    throw new Error(`${fieldName} must contain only strings`);
  }
}

/**
 * Validate path-specific depth overrides configuration
 *
 * Ensures that depth overrides is a valid object with string keys (paths) and
 * valid depth values. Each depth value is validated using validateDepth().
 *
 * @param overrides - Object mapping paths to depth values (or undefined)
 *
 * @throws {Error} If overrides is not an object
 * @throws {Error} If any key is not a non-empty string
 * @throws {Error} If any depth value is invalid
 *
 * @example
 * validateDepthOverrides({
 *   "src/hooks": 2,
 *   "src/presets/folder-based": 3
 * }); // OK
 *
 * @example
 * validateDepthOverrides(undefined);      // OK (no overrides)
 * validateDepthOverrides({});             // OK (empty overrides)
 * validateDepthOverrides("not-object");   // throws: must be an object
 * validateDepthOverrides({"": 2});        // throws: keys must be non-empty
 * validateDepthOverrides({"src": 0});     // throws: invalid depth
 */
export function validateDepthOverrides(
  overrides: Record<string, number> | undefined
): void {
  if (overrides === undefined) return;

  if (typeof overrides !== 'object' || overrides === null) {
    throw new Error('depthOverrides must be an object');
  }

  for (const [path, depth] of Object.entries(overrides)) {
    if (typeof path !== 'string' || path.length === 0) {
      throw new Error('depthOverrides keys must be non-empty strings');
    }

    try {
      validateDepth(depth, `depthOverrides["${path}"]`);
    } catch (error) {
      throw new Error(`Invalid depth override for "${path}": ${(error as Error).message}`);
    }
  }
}

/**
 * Check if a numeric value is within a specified range (inclusive)
 *
 * @param value - The value to check
 * @param min - Minimum allowed value (inclusive)
 * @param max - Maximum allowed value (inclusive)
 * @returns True if value is within [min, max], false otherwise
 *
 * @example
 * isInRange(5, 1, 10);    // true
 * isInRange(1, 1, 10);    // true (inclusive)
 * isInRange(10, 1, 10);   // true (inclusive)
 * isInRange(0, 1, 10);    // false
 * isInRange(11, 1, 10);   // false
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Parse and validate commit message prefix format
 *
 * Extracts the prefix and description from a commit message that follows
 * the `[prefix] description` format. Both prefix and description must be non-empty.
 *
 * @param message - The commit message to parse
 * @returns Object with prefix and description if valid, null if invalid
 *
 * @example
 * parseCommitMessagePrefix("[src/core] Add validation");
 * // Returns: { prefix: "src/core", description: "Add validation" }
 *
 * @example
 * parseCommitMessagePrefix("[root] Fix bug");
 * // Returns: { prefix: "root", description: "Fix bug" }
 *
 * @example
 * parseCommitMessagePrefix("No prefix here");
 * // Returns: null (no bracket prefix)
 *
 * @example
 * parseCommitMessagePrefix("[] Empty prefix");
 * // Returns: null (empty prefix)
 *
 * @example
 * parseCommitMessagePrefix("[prefix]");
 * // Returns: null (no description)
 */
export function parseCommitMessagePrefix(
  message: string
): { prefix: string; description: string } | null {
  const trimmed = message.trim();
  const match = trimmed.match(/^\[([^\]]+)\]\s*(.*)$/);

  if (!match) return null;

  const [, prefix, description] = match;

  if (!prefix || !prefix.trim()) return null;
  if (!description || !description.trim()) return null;

  return {
    prefix: prefix.trim(),
    description: description.trim(),
  };
}
