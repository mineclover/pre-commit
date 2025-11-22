import type { BaseConfig } from '../../core/types.js';

/**
 * Conventional Commits preset configuration
 */
export interface ConventionalCommitsConfig extends BaseConfig {
  preset: 'conventional-commits';
  types?: string[];       // Allowed commit types (default: feat, fix, docs, etc.)
  scopes?: string[];      // Allowed scopes (if empty, any scope is valid)
  requireScope?: boolean; // Require scope to be specified (default: false)
}
