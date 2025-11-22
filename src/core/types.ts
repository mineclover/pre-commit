// ============================================================================
// Core Types - Common types used across the system
// ============================================================================

export type Language = 'en' | 'ko';

export interface BaseConfig {
  enabled: boolean;
  logFile: string;
  logMaxAgeHours?: number;
  language?: Language;
  verbose?: boolean;
}
