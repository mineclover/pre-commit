// ============================================================================
// Preset System Types
// ============================================================================

/**
 * Available preset types
 */
export type PresetType = 'folder-based' | 'conventional-commits' | 'custom';

/**
 * Base configuration for all presets
 */
export interface BaseConfig {
  enabled: boolean;
  logFile: string;
  logMaxAgeHours?: number;
  language?: 'en' | 'ko';
  verbose?: boolean;
}

/**
 * Folder-based preset configuration
 */
export interface FolderBasedConfig extends BaseConfig {
  preset: 'folder-based';
  depth: number;
  ignorePaths: string[];
  maxFiles?: number;
}

/**
 * Conventional Commits preset configuration
 */
export interface ConventionalCommitsConfig extends BaseConfig {
  preset: 'conventional-commits';
  types?: string[]; // Optional: custom types (default: feat, fix, docs, etc.)
  scopes?: string[]; // Optional: allowed scopes
  requireScope?: boolean; // Optional: require scope
}

/**
 * Custom preset configuration (user-defined validation)
 */
export interface CustomConfig extends BaseConfig {
  preset: 'custom';
  pattern?: string; // Optional: regex pattern for validation
  example?: string; // Optional: example commit message
}

/**
 * Union type for all preset configs
 */
export type Config = FolderBasedConfig | ConventionalCommitsConfig | CustomConfig;

/**
 * Validation result from any preset
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

// ============================================================================
// Preset Interface
// ============================================================================

/**
 * Base interface that all presets must implement
 */
export interface Preset {
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
  validateFiles(stagedFiles: string[], config: Config): ValidationResult;

  /**
   * Validate commit message according to preset rules
   */
  validateCommitMessage(commitMsg: string, config: Config): CommitMsgValidationResult;

  /**
   * Generate commit message prefix (if applicable)
   */
  getCommitPrefix(validationResult: ValidationResult, config: Config): string;
}
