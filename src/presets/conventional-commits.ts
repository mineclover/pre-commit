import type {
  Preset,
  Config,
  ConventionalCommitsConfig,
  ValidationResult,
  CommitMsgValidationResult
} from '../types.js';

/**
 * Conventional Commits preset
 * Enforces Conventional Commits specification (https://www.conventionalcommits.org/)
 * Format: <type>(<scope>): <description>
 */
export class ConventionalCommitsPreset implements Preset {
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

  /**
   * Validate staged files (no specific rules for conventional commits)
   * All files can be committed together
   */
  validateFiles(stagedFiles: string[], config: Config): ValidationResult {
    const result: ValidationResult = {
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

    if (stagedFiles.length === 0) {
      result.errors.push('No files staged for commit');
      result.valid = false;
      return result;
    }

    return result;
  }

  /**
   * Validate commit message format
   * Expected format: <type>(<scope>): <description>
   * Examples:
   *   - feat(api): add new endpoint
   *   - fix: resolve memory leak
   *   - docs(readme): update installation instructions
   */
  validateCommitMessage(commitMsg: string, config: Config): CommitMsgValidationResult {
    const conventionalConfig = config as ConventionalCommitsConfig;
    const minDescriptionLength = 3;
    const types = conventionalConfig.types || this.defaultTypes;

    const result: CommitMsgValidationResult = {
      valid: true,
      errors: []
    };

    const trimmedMsg = commitMsg.trim();

    // Check if message is empty
    if (!trimmedMsg) {
      result.valid = false;
      result.errors.push('Commit message is empty');
      result.errors.push('');
      result.errors.push('✖ FORMAT: <type>(<scope>): <description>');
      result.errors.push(`✖ TYPES: ${types.join(', ')}`);
      result.errors.push('');
      result.errors.push('💡 EXAMPLES:');
      result.errors.push('   feat(api): add new user endpoint');
      result.errors.push('   fix: resolve memory leak issue');
      result.errors.push('   docs(readme): update installation steps');
      return result;
    }

    // Parse conventional commit format: type(scope): description
    // Scope is optional unless requireScope is true
    const conventionalPattern = /^(\w+)(?:\(([^)]+)\))?:\s*(.+)$/;
    const match = trimmedMsg.match(conventionalPattern);

    if (!match) {
      result.valid = false;
      result.errors.push('Commit message does not follow Conventional Commits format');
      result.errors.push('');
      result.errors.push('✖ FORMAT: <type>(<scope>): <description>');
      result.errors.push(`✖ TYPES: ${types.join(', ')}`);
      result.errors.push('✖ SCOPE: Optional (use parentheses if provided)');
      result.errors.push('');
      result.errors.push('💡 EXAMPLES:');
      result.errors.push('   feat(api): add new user endpoint');
      result.errors.push('   fix: resolve memory leak issue');
      result.errors.push('   docs(readme): update installation steps');
      result.errors.push('');
      result.errors.push(`📝 Your message: "${trimmedMsg}"`);
      return result;
    }

    const [, type, scope, description] = match;

    // Validate type
    if (!types.includes(type)) {
      result.valid = false;
      result.errors.push(`Invalid type: "${type}"`);
      result.errors.push('');
      result.errors.push(`✖ ALLOWED TYPES: ${types.join(', ')}`);
      result.errors.push('');
      result.errors.push('💡 Did you mean one of these?');
      const suggestions = this.getSuggestions(type, types);
      suggestions.forEach(s => result.errors.push(`   - ${s}`));
      return result;
    }

    // Validate scope if required
    if (conventionalConfig.requireScope && !scope) {
      result.valid = false;
      result.errors.push('Scope is required');
      result.errors.push('');
      result.errors.push('✖ FORMAT: <type>(<scope>): <description>');
      if (conventionalConfig.scopes && conventionalConfig.scopes.length > 0) {
        result.errors.push(`✖ ALLOWED SCOPES: ${conventionalConfig.scopes.join(', ')}`);
      }
      result.errors.push('');
      result.errors.push('💡 EXAMPLE: feat(api): add new endpoint');
      return result;
    }

    // Validate scope against allowed scopes (if specified)
    if (scope && conventionalConfig.scopes && conventionalConfig.scopes.length > 0) {
      if (!conventionalConfig.scopes.includes(scope)) {
        result.valid = false;
        result.errors.push(`Invalid scope: "${scope}"`);
        result.errors.push('');
        result.errors.push(`✖ ALLOWED SCOPES: ${conventionalConfig.scopes.join(', ')}`);
        return result;
      }
    }

    // Validate description
    const trimmedDescription = description.trim();
    if (trimmedDescription.length < minDescriptionLength) {
      result.valid = false;
      result.errors.push(
        `Description is too short (minimum ${minDescriptionLength} characters)`
      );
      return result;
    }

    // Check description doesn't start with uppercase (conventional commits style)
    if (/^[A-Z]/.test(trimmedDescription)) {
      result.errors.push('⚠️  Warning: Description should start with lowercase letter');
      result.errors.push('   (Following Conventional Commits convention)');
      // This is a warning, not an error
    }

    result.prefix = scope ? `${type}(${scope})` : type;
    return result;
  }

  /**
   * Generate commit message prefix (not applicable for conventional commits)
   */
  getCommitPrefix(validationResult: ValidationResult, config: Config): string {
    // Conventional commits don't auto-generate prefixes
    return '';
  }

  /**
   * Get type suggestions based on similarity
   */
  private getSuggestions(input: string, validTypes: string[]): string[] {
    return validTypes
      .filter(t => {
        // Simple similarity check: starts with same letter or contains input
        return t.startsWith(input[0]) || t.includes(input) || input.includes(t);
      })
      .slice(0, 3); // Return max 3 suggestions
  }
}
