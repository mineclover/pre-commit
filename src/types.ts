import type { Language } from './messages.js';

export interface Config {
  depth: number;
  logFile: string;
  enabled: boolean;
  ignorePaths: string[];
  maxFiles?: number;
  verbose?: boolean;
  logMaxAgeHours?: number;
  language?: Language;
}

export interface ValidationStats {
  totalFiles: number;
  filteredFiles: number;
  ignoredFiles: number;
  uniqueFolders: number;
}

export interface ValidationResult {
  valid: boolean;
  commonPath: string | null;
  files: string[];
  errors: string[];
  warnings: string[];
  stats: ValidationStats;
}
