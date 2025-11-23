/**
 * Validation utilities
 * Reusable validation functions for configuration and input
 */

import { DEPTH_CONSTRAINTS, FILE_CONSTRAINTS } from '../constants.js';

/**
 * Validate depth value
 * @throws Error if depth is invalid
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
 * Validate maxFiles value
 * @throws Error if maxFiles is invalid
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
 * Validate array of paths
 * @throws Error if paths is not a valid array
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
 * Validate depth overrides object
 * @throws Error if depthOverrides is invalid
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
 * Check if a value is within a range (inclusive)
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Validate commit message format
 * Returns the match result if valid, null otherwise
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
