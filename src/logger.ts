import { mkdirSync, appendFileSync, existsSync, unlinkSync, statSync, readdirSync } from 'fs';
import { dirname, join } from 'path';

/**
 * Logger for commit violations and debug information
 * Handles log file creation and cleanup
 */
export class Logger {
  private logPath: string;
  private maxAgeHours: number;

  /**
   * Create a new Logger instance
   * @param logPath - Path to the log file
   * @param maxAgeHours - Maximum age of log files in hours before cleanup
   */
  constructor(logPath: string, maxAgeHours: number = 24) {
    this.logPath = logPath;
    this.maxAgeHours = maxAgeHours;
    this.ensureLogDirectory();
  }

  private ensureLogDirectory(): void {
    const dir = dirname(this.logPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Append a timestamped message to the log file
   * @param message - Message to log
   */
  log(message: string): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    appendFileSync(this.logPath, logEntry, 'utf-8');
  }

  /**
   * Delete the current log file
   */
  clear(): void {
    if (existsSync(this.logPath)) {
      unlinkSync(this.logPath);
    }
  }

  /**
   * Clean up old log files (older than maxAgeHours)
   * @returns Number of deleted files
   */
  cleanupOldLogs(): number {
    const dir = dirname(this.logPath);
    if (!existsSync(dir)) {
      return 0;
    }

    const now = Date.now();
    const maxAge = this.maxAgeHours * 60 * 60 * 1000; // Convert to milliseconds
    let deletedCount = 0;

    try {
      const files = readdirSync(dir);

      files.forEach(file => {
        if (file.endsWith('.archive') || file.endsWith('.log')) {
          const filePath = join(dir, file);
          try {
            const stats = statSync(filePath);
            const age = now - stats.mtimeMs;

            if (age > maxAge) {
              unlinkSync(filePath);
              deletedCount++;
            }
          } catch {
            // Ignore errors for individual files
          }
        }
      });
    } catch {
      // Ignore errors reading directory
    }

    return deletedCount;
  }

  /**
   * Clean all logs in the directory
   * @returns Number of deleted files
   */
  cleanupAll(): number {
    const dir = dirname(this.logPath);
    if (!existsSync(dir)) {
      return 0;
    }

    let deletedCount = 0;

    try {
      const files = readdirSync(dir);

      files.forEach(file => {
        if (file.endsWith('.archive') || file.endsWith('.log')) {
          const filePath = join(dir, file);
          try {
            unlinkSync(filePath);
            deletedCount++;
          } catch {
            // Ignore errors for individual files
          }
        }
      });
    } catch {
      // Ignore errors reading directory
    }

    return deletedCount;
  }

  /**
   * Log a commit violation with staged files and errors
   * @param files - List of staged files
   * @param errors - List of validation errors
   */
  logViolation(files: string[], errors: string[]): void {
    this.log('=== COMMIT VIOLATION ===');
    this.log(`Staged files: ${files.join(', ')}`);
    errors.forEach(error => this.log(`ERROR: ${error}`));
    this.log('========================\n');
  }

  /**
   * Get log file statistics
   */
  getStats(): LogStats {
    if (!existsSync(this.logPath)) {
      return { exists: false };
    }

    try {
      const stats = statSync(this.logPath);
      return {
        exists: true,
        size: stats.size,
        age: Date.now() - stats.mtimeMs,
        modified: stats.mtime
      };
    } catch {
      return { exists: false };
    }
  }
}

/** Discriminated union for log stats */
export type LogStats =
  | { exists: false }
  | { exists: true; size: number; age: number; modified: Date };
