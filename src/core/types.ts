/**
 * @module types
 * @description Core type definitions used across the pre-commit validation system
 *
 * This module defines the fundamental types and interfaces that are shared
 * across all components of the system, including configuration, validation,
 * and commit message handling.
 */

/**
 * Supported languages for internationalization
 * @typedef {('en'|'ko')} Language
 */
export type Language = 'en' | 'ko';

/**
 * Supported preset names
 */
export type PresetName = 'folder-based' | 'conventional-commits';

/**
 * Base configuration interface that all preset configs must extend
 */
export interface BaseConfig {
  /** Preset to use for validation */
  preset: PresetName;
  /** Whether hooks are enabled */
  enabled: boolean;
  /** Path to log file */
  logFile: string;
  /** Maximum age of log files in hours */
  logMaxAgeHours?: number;
  /** Language for messages */
  language?: Language;
  /** Enable verbose output */
  verbose?: boolean;
}

/**
 * Type guard for Node.js filesystem errors
 */
export function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}

/**
 * Type guard for file not found errors
 */
export function isFileNotFoundError(error: unknown): boolean {
  return isNodeError(error) && error.code === 'ENOENT';
}
