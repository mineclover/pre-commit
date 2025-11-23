// ============================================================================
// Preset Base Types - Interface that all presets must implement
// ============================================================================

/**
 * Validation result from file validation
 */
export interface ValidationResult {
  valid: boolean;
  commonPath: string | null;
  files: string[];
  errors: string[];
  warnings?: string[];
  stats?: {
    totalFiles: number;
    filteredFiles: number;
    ignoredFiles: number;
    uniqueFolders: number;
  };
}

/**
 * Commit message validation result
 */
export interface CommitMsgValidationResult {
  valid: boolean;
  errors: string[];
  prefix?: string;
}

/**
 * Base interface that all presets must implement
 */
export interface Preset<TConfig = any> {
  /**
   * Preset name
   */
  name: string;

  /**
   * Preset description
   */
  description: string;

  /**
   * Validate staged files according to preset rules
   */
  validateFiles(stagedFiles: string[], config: TConfig): ValidationResult;

  /**
   * Validate commit message according to preset rules
   */
  validateCommitMessage(commitMsg: string, config: TConfig): CommitMsgValidationResult;

  /**
   * Generate commit message prefix (if applicable)
   */
  getCommitPrefix(validationResult: ValidationResult, config: TConfig): string;
}
