import { mkdirSync, appendFileSync, existsSync, unlinkSync, statSync, readdirSync, renameSync } from 'fs';
import { dirname, join, basename } from 'path';

export class Logger {
  private logPath: string;
  private maxAgeHours: number;

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

  log(message: string): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    appendFileSync(this.logPath, logEntry, 'utf-8');
  }

  clear(): void {
    if (existsSync(this.logPath)) {
      unlinkSync(this.logPath);
    }
  }

  /**
   * Archive current log file with timestamp
   */
  archive(): void {
    if (!existsSync(this.logPath)) {
      return;
    }

    const dir = dirname(this.logPath);
    const filename = basename(this.logPath);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const archivePath = join(dir, `${filename}.${timestamp}.archive`);

    try {
      renameSync(this.logPath, archivePath);
    } catch (error) {
      // If archive fails, just delete the log
      this.clear();
    }
  }

  /**
   * Clean up old log files (older than maxAgeHours)
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
          } catch (err) {
            // Ignore errors for individual files
          }
        }
      });
    } catch (err) {
      // Ignore errors reading directory
    }

    return deletedCount;
  }

  /**
   * Clean all logs in the directory
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
          } catch (err) {
            // Ignore errors for individual files
          }
        }
      });
    } catch (err) {
      // Ignore errors reading directory
    }

    return deletedCount;
  }

  logViolation(files: string[], errors: string[]): void {
    this.log('=== COMMIT VIOLATION ===');
    this.log(`Staged files: ${files.join(', ')}`);
    errors.forEach(error => this.log(`ERROR: ${error}`));
    this.log('========================\n');
  }

  /**
   * Get log file statistics
   */
  getStats(): { exists: boolean; size?: number; age?: number; modified?: Date } {
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
