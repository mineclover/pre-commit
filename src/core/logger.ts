/**
 * @module logger
 * @description Logging and log file management system
 *
 * This module provides comprehensive logging functionality including:
 * - Timestamped log entries
 * - Automatic log rotation and archiving
 * - Age-based log cleanup
 * - Log file statistics and monitoring
 */

import { mkdirSync, appendFileSync, existsSync, unlinkSync, statSync, readdirSync, renameSync } from 'fs';
import { dirname, join, basename } from 'path';

/**
 * Logger class for managing timestamped log files with automatic cleanup
 *
 * Features:
 * - Automatic directory creation
 * - Timestamped log entries
 * - Log archiving and rotation
 * - Automatic cleanup of old logs
 * - Statistics and monitoring
 *
 * @example
 * const logger = new Logger('.commit-logs/violations.log', 24);
 * logger.log('Validation error occurred');
 * logger.logViolation(['file1.ts'], ['Error: Multiple folders']);
 * logger.cleanupOldLogs();
 */
export class Logger {
  private logPath: string;
  private maxAgeHours: number;

  /**
   * Create a new Logger instance
   *
   * @param logPath - Path to the log file
   * @param maxAgeHours - Maximum age in hours for log retention (default: 24)
   *
   * @example
   * const logger = new Logger('.commit-logs/violations.log', 48);
   */
  constructor(logPath: string, maxAgeHours: number = 24) {
    this.logPath = logPath;
    this.maxAgeHours = maxAgeHours;
    this.ensureLogDirectory();
  }

  /**
   * Ensure the log directory exists, creating it if necessary
   * @private
   */
  private ensureLogDirectory(): void {
    const dir = dirname(this.logPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Append a message to the log file with timestamp
   *
   * @param message - The message to log
   *
   * @example
   * logger.log('Commit validation started');
   * logger.log('Found 5 staged files');
   */
  log(message: string): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    appendFileSync(this.logPath, logEntry, 'utf-8');
  }

  /**
   * Clear the log file by deleting it
   *
   * @example
   * logger.clear(); // Removes the log file completely
   */
  clear(): void {
    if (existsSync(this.logPath)) {
      unlinkSync(this.logPath);
    }
  }

  /**
   * Archive current log file with timestamp
   *
   * Renames the current log file by appending a timestamp and .archive extension.
   * If archiving fails, the log file is deleted instead.
   *
   * @example
   * logger.archive();
   * // Creates: violations.log.2025-11-23T10-30-00-000Z.archive
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
   *
   * Scans the log directory and removes all .log and .archive files
   * that are older than the configured maxAgeHours.
   *
   * @returns Number of files deleted
   *
   * @example
   * const deleted = logger.cleanupOldLogs();
   * console.log(`Deleted ${deleted} old log files`);
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
   *
   * Removes ALL .log and .archive files in the log directory,
   * regardless of their age.
   *
   * @returns Number of files deleted
   *
   * @example
   * const deleted = logger.cleanupAll();
   * console.log(`Deleted ${deleted} log files`);
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

  /**
   * Log a commit rule violation with structured format
   *
   * Creates a formatted log entry including the staged files
   * and all validation errors.
   *
   * @param files - Array of staged file paths
   * @param errors - Array of error messages
   *
   * @example
   * logger.logViolation(
   *   ['src/core/config.ts', 'src/hooks/pre-commit.ts'],
   *   ['Files from multiple folders detected']
   * );
   */
  logViolation(files: string[], errors: string[]): void {
    this.log('=== COMMIT VIOLATION ===');
    this.log(`Staged files: ${files.join(', ')}`);
    errors.forEach(error => this.log(`ERROR: ${error}`));
    this.log('========================\n');
  }

  /**
   * Get log file statistics
   *
   * Returns information about the log file including its existence,
   * size, age, and last modification date.
   *
   * @returns Object containing log statistics
   *
   * @example
   * const stats = logger.getStats();
   * if (stats.exists) {
   *   console.log(`Log size: ${stats.size} bytes`);
   *   console.log(`Last modified: ${stats.modified}`);
   * }
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
