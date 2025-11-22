import type { Config, ValidationResult, CommitMsgValidationResult } from './types.js';
import { PresetRegistry } from './presets/index.js';

/**
 * CommitValidator - Wrapper class that delegates to preset implementations
 * Maintains backward compatibility while using the new preset system
 */
export class CommitValidator {
  private config: Config;
  private preset;

  constructor(config: Config) {
    this.config = config;
    this.preset = PresetRegistry.getPresetFromConfig(config);
  }

  /**
   * Validate that staged files pass preset rules
   */
  validate(stagedFiles: string[]): ValidationResult {
    return this.preset.validateFiles(stagedFiles, this.config);
  }

  /**
   * Validate commit message format
   */
  validateCommitMessage(commitMsg: string): CommitMsgValidationResult {
    return this.preset.validateCommitMessage(commitMsg, this.config);
  }

  /**
   * Generate commit message prefix from validation result
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
   * Get the current preset name
   */
  getPresetName(): string {
    return this.preset.name;
  }

  /**
   * Get the current preset description
   */
  getPresetDescription(): string {
    return this.preset.description;
  }
}
