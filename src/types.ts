export interface Config {
  depth: number;
  logFile: string;
  enabled: boolean;
  ignorePaths: string[];
}

export interface ValidationResult {
  valid: boolean;
  commonPath: string | null;
  files: string[];
  errors: string[];
}
