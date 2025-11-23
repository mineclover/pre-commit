import type { Config } from './config.js';
import type { ValidationResult, CommitMsgValidationResult } from '../presets/base/types.js';
import { PresetRegistry } from '../presets/index.js';

/**
 * CommitValidator - Main validator class that delegates to preset implementations
 *
 * Acts as a facade for the preset system, providing a simple interface for
 * validating staged files and commit messages. Maintains backward compatibility
 * with the old API while using the new extensible preset system.
 *
 * @example
 * const config = loadConfig();
 * const validator = new CommitValidator(config);
 *
 * // Validate staged files
 * const result = validator.validate(stagedFiles);
 * if (!result.valid) {
 *   console.error(result.errors);
 * }
 *
 * // Validate commit message
 * const msgResult = validator.validateCommitMessage(commitMsg);
 * if (!msgResult.valid) {
 *   console.error(msgResult.errors);
 * }
 */
export class CommitValidator {
  private config: Config;
  private preset;

  constructor(config: Config) {
    this.config = config;
    this.preset = PresetRegistry.get(config.preset);
  }

  /**
   * Validate that staged files comply with the configured preset rules
   *
   * Delegates to the active preset's validateFiles() method to check if
   * the staged files meet the preset's requirements (e.g., same folder for
   * folder-based preset).
   *
   * @param stagedFiles - Array of staged file paths to validate
   * @returns Validation result containing validity status, errors, and metadata
   *
   * @example
   * const result = validator.validate(["src/core/config.ts", "src/core/types.ts"]);
   * if (result.valid) {
   *   console.log(`✓ ${result.stats.totalFiles} files validated`);
   *   console.log(`Common path: ${result.commonPath}`);
   * } else {
   *   result.errors.forEach(err => console.error(err));
   * }
   */
  validate(stagedFiles: string[]): ValidationResult {
    return this.preset.validateFiles(stagedFiles, this.config);
  }

  /**
   * Validate commit message format according to the active preset
   *
   * Checks if the commit message follows the format required by the configured
   * preset (e.g., `[prefix] description` for folder-based, `type(scope): description`
   * for conventional-commits).
   *
   * @param commitMsg - The commit message to validate
   * @returns Validation result with validity status and error messages
   *
   * @example
   * const result = validator.validateCommitMessage("[src/core] Add new feature");
   * if (result.valid) {
   *   console.log(`✓ Valid commit message`);
   *   console.log(`Prefix: ${result.prefix}`);
   * } else {
   *   result.errors.forEach(err => console.error(err));
   * }
   */
  validateCommitMessage(commitMsg: string): CommitMsgValidationResult {
    return this.preset.validateCommitMessage(commitMsg, this.config);
  }

  /**
   * Generate commit message prefix from validation result
   *
   * Supports two signatures for backward compatibility:
   * 1. New: getCommitPrefix(validationResult)
   * 2. Old: getCommitPrefix(commonPath, allFilesIgnored)
   *
   * Delegates to the preset's getCommitPrefix() method to generate the
   * appropriate prefix (e.g., `[src/core]` for folder-based preset).
   *
   * @param validationResult - Validation result from validate()
   * @returns Formatted prefix string
   *
   * @example
   * const result = validator.validate(stagedFiles);
   * const prefix = validator.getCommitPrefix(result);
   * console.log(prefix); // "[src/core]" or "[root]"
   *
   * @example
   * // Old signature (backward compatibility)
   * const prefix = validator.getCommitPrefix("src/core", false);
   * console.log(prefix); // "[src/core]"
   */
  getCommitPrefix(validationResult: ValidationResult): string;
  getCommitPrefix(commonPath: string, allFilesIgnored?: boolean): string;
  getCommitPrefix(
    validationResultOrCommonPath: ValidationResult | string,
    allFilesIgnored?: boolean
  ): string {
    // Backward compatibility: support old signature (commonPath, allFilesIgnored)
    if (typeof validationResultOrCommonPath === 'string') {
      const commonPath = validationResultOrCommonPath;
      const mockResult: ValidationResult = {
        valid: true,
        commonPath,
        files: [],
        errors: [],
        stats: {
          totalFiles: 1,
          filteredFiles: allFilesIgnored ? 0 : 1,
          ignoredFiles: allFilesIgnored ? 1 : 0,
          uniqueFolders: 1
        }
      };
      return this.preset.getCommitPrefix(mockResult, this.config);
    }

    // New signature: use ValidationResult
    return this.preset.getCommitPrefix(validationResultOrCommonPath, this.config);
  }

  /**
   * Get the name of the currently active preset
   *
   * @returns Preset name (e.g., "folder-based", "conventional-commits")
   *
   * @example
   * const name = validator.getPresetName();
   * console.log(`Active preset: ${name}`); // "Active preset: folder-based"
   */
  getPresetName(): string {
    return this.preset.name;
  }

  /**
   * Get the description of the currently active preset
   *
   * @returns Human-readable preset description
   *
   * @example
   * const description = validator.getPresetDescription();
   * console.log(description);
   * // "Enforce folder-based commit rules with automatic prefix generation"
   */
  getPresetDescription(): string {
    return this.preset.description;
  }
}
