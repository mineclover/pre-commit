/**
 * Custom error classes for better error handling
 * Provides structured error information for different failure scenarios
 */

/**
 * Base error class for pre-commit validation errors
 */
export class PrecommitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PrecommitError';
    Object.setPrototypeOf(this, PrecommitError.prototype);
  }
}

/**
 * Configuration validation error
 */
export class ConfigValidationError extends PrecommitError {
  constructor(
    message: string,
    public field?: string,
    public value?: unknown
  ) {
    super(message);
    this.name = 'ConfigValidationError';
    Object.setPrototypeOf(this, ConfigValidationError.prototype);
  }
}

/**
 * Folder rule validation error
 */
export class FolderRuleViolationError extends PrecommitError {
  constructor(
    message: string,
    public folders: string[],
    public files: string[]
  ) {
    super(message);
    this.name = 'FolderRuleViolationError';
    Object.setPrototypeOf(this, FolderRuleViolationError.prototype);
  }
}

/**
 * Commit message format error
 */
export class CommitMessageFormatError extends PrecommitError {
  constructor(
    message: string,
    public commitMessage: string,
    public expectedFormat?: string
  ) {
    super(message);
    this.name = 'CommitMessageFormatError';
    Object.setPrototypeOf(this, CommitMessageFormatError.prototype);
  }
}

/**
 * Git operation error
 */
export class GitOperationError extends PrecommitError {
  constructor(
    message: string,
    public operation: string,
    public exitCode?: number
  ) {
    super(message);
    this.name = 'GitOperationError';
    Object.setPrototypeOf(this, GitOperationError.prototype);
  }
}

/**
 * File system error
 */
export class FileSystemError extends PrecommitError {
  constructor(
    message: string,
    public filePath: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'FileSystemError';
    Object.setPrototypeOf(this, FileSystemError.prototype);
  }
}

/**
 * Preset not found error
 */
export class PresetNotFoundError extends PrecommitError {
  constructor(
    public presetName: string,
    public availablePresets: string[]
  ) {
    super(`Preset "${presetName}" not found. Available: ${availablePresets.join(', ')}`);
    this.name = 'PresetNotFoundError';
    Object.setPrototypeOf(this, PresetNotFoundError.prototype);
  }
}
