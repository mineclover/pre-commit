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

export interface BaseConfig {
  enabled: boolean;
  logFile: string;
  logMaxAgeHours?: number;
  language?: Language;
  verbose?: boolean;
}
