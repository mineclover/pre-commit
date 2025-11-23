import type { Preset, ValidationResult, CommitMsgValidationResult } from '../base/types.js';
import type { ConventionalCommitsConfig } from './types.js';

/**
 * Conventional Commits Preset
 *
 * Enforces Conventional Commits specification (https://www.conventionalcommits.org/).
 * Format: <type>(<scope>): <description>
 *
 * @example
 * feat(api): add user authentication endpoint
 * fix: resolve memory leak in cache
 * docs(readme): update installation steps
 */
export class ConventionalCommitsPreset implements Preset<ConventionalCommitsConfig> {
  name = 'conventional-commits';
  description = 'Enforce Conventional Commits specification';

  // Default types if not specified in config
  private defaultTypes = [
    'feat',     // New feature
    'fix',      // Bug fix
    'docs',     // Documentation changes
    'style',    // Code style changes (formatting, missing semi colons, etc)
    'refactor', // Code refactoring
    'perf',     // Performance improvements
    'test',     // Adding or updating tests
    'build',    // Build system or external dependencies
    'ci',       // CI configuration files and scripts
    'chore',    // Other changes that don't modify src or test files
    'revert'    // Revert previous commit
  ];

  validateFiles(stagedFiles: string[], config: ConventionalCommitsConfig): ValidationResult {
    return {
      valid: true,
      commonPath: null,
      files: stagedFiles,
      errors: [],
      warnings: [],
      stats: {
        totalFiles: stagedFiles.length,
        filteredFiles: stagedFiles.length,
        ignoredFiles: 0,
        uniqueFolders: 0
      }
    };
  }

  validateCommitMessage(commitMsg: string, config: ConventionalCommitsConfig): CommitMsgValidationResult {
    const types = config.types || this.defaultTypes;
    const result: CommitMsgValidationResult = { valid: true, errors: [] };
    const trimmedMsg = commitMsg.trim();

    if (!trimmedMsg) {
      result.valid = false;
      result.errors.push('Commit message is empty');
      return result;
    }

    const conventionalPattern = /^(\w+)(?:\(([^)]+)\))?:\s*(.+)$/;
    const match = trimmedMsg.match(conventionalPattern);

    if (!match) {
      result.valid = false;
      result.errors.push('Commit message does not follow Conventional Commits format');
      result.errors.push('✖ FORMAT: <type>(<scope>): <description>');
      result.errors.push(`✖ TYPES: ${types.join(', ')}`);
      return result;
    }

    const [, type, scope, description] = match;

    if (!types.includes(type)) {
      result.valid = false;
      result.errors.push(`Invalid type: "${type}"`);
      result.errors.push(`✖ ALLOWED TYPES: ${types.join(', ')}`);
      return result;
    }

    if (config.requireScope && !scope) {
      result.valid = false;
      result.errors.push('Scope is required');
      return result;
    }

    if (scope && config.scopes && config.scopes.length > 0 && !config.scopes.includes(scope)) {
      result.valid = false;
      result.errors.push(`Invalid scope: "${scope}"`);
      result.errors.push(`✖ ALLOWED SCOPES: ${config.scopes.join(', ')}`);
      return result;
    }

    result.prefix = scope ? `${type}(${scope})` : type;
    return result;
  }

  getCommitPrefix(validationResult: ValidationResult, config: ConventionalCommitsConfig): string {
    return '';
  }
}
