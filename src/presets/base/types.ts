// ============================================================================
// Preset Base Types - Interface that all presets must implement
// ============================================================================

import type { BaseConfig } from '../../core/types.js';

/**
 * Validation statistics
 */
export interface ValidationStats {
  /** Total number of files being validated */
  totalFiles: number;
  /** Number of files after filtering */
  filteredFiles: number;
  /** Number of ignored files */
  ignoredFiles: number;
  /** Number of unique folders detected */
  uniqueFolders: number;
}

/**
 * Validation result from file validation
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Common path prefix for all files (null if validation failed) */
  commonPath: string | null;
  /** List of validated files */
  files: string[];
  /** Error messages (empty if valid) */
  errors: string[];
  /** Warning messages (optional) */
  warnings?: string[];
  /** Validation statistics */
  stats?: ValidationStats;
}

/**
 * Commit message validation result
 */
export interface CommitMsgValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Error messages (empty if valid) */
  errors: string[];
  /** Extracted prefix from commit message */
  prefix?: string;
}

/**
 * Base interface that all presets must implement
 * @template TConfig - The configuration type for this preset (must extend BaseConfig)
 */
export interface Preset<TConfig extends BaseConfig = BaseConfig> {
  /** Preset identifier name */
  readonly name: string;

  /** Human-readable preset description */
  readonly description: string;

  /**
   * Validate staged files according to preset rules
   * @param stagedFiles - Array of file paths to validate
   * @param config - Preset configuration
   * @returns Validation result
   */
  validateFiles(stagedFiles: string[], config: TConfig): ValidationResult;

  /**
   * Validate commit message according to preset rules
   * @param commitMsg - Commit message to validate
   * @param config - Preset configuration
   * @returns Validation result
   */
  validateCommitMessage(commitMsg: string, config: TConfig): CommitMsgValidationResult;

  /**
   * Generate commit message prefix from validation result
   * @param validationResult - Result from validateFiles
   * @param config - Preset configuration
   * @returns Formatted prefix string
   */
  getCommitPrefix(validationResult: ValidationResult, config: TConfig): string;
}
