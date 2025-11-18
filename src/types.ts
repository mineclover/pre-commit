export interface Config {
  depth: number;
  logFile: string;
  enabled: boolean;
  ignorePaths: string[];
  maxFiles?: number; // Optional: max files per commit
  verbose?: boolean; // Optional: verbose output
  logMaxAgeHours?: number; // Optional: max age for log files in hours (for manual cleanup)
}

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
