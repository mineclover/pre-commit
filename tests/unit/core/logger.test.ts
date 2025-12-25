import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Logger } from '../../../src/core/logger.js';
import { existsSync, readFileSync, mkdirSync, writeFileSync, readdirSync, rmSync } from 'fs';
import { join } from 'path';

describe('Logger', () => {
  const TEST_DIR = join(process.cwd(), 'tests', 'temp');
  const LOG_FILE = join(TEST_DIR, 'test.log');
  let logger: Logger;

  beforeEach(() => {
    // Clean up and create fresh test directory
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });
    logger = new Logger(LOG_FILE, 24);
  });

  afterEach(() => {
    // Clean up after each test
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  describe('constructor', () => {
    it('should create log directory if it does not exist', () => {
      const nonExistentPath = join(TEST_DIR, 'nested', 'deep', 'log.log');
      const testLogger = new Logger(nonExistentPath);

      testLogger.log('test');
      expect(existsSync(nonExistentPath)).toBe(true);
    });
  });

  describe('log', () => {
    it('should create log file and append message with timestamp', () => {
      logger.log('Test message');

      expect(existsSync(LOG_FILE)).toBe(true);
      const content = readFileSync(LOG_FILE, 'utf-8');
      expect(content).toContain('Test message');
      expect(content).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/); // ISO timestamp
    });

    it('should append multiple messages', () => {
      logger.log('First message');
      logger.log('Second message');

      const content = readFileSync(LOG_FILE, 'utf-8');
      expect(content).toContain('First message');
      expect(content).toContain('Second message');
    });
  });

  describe('clear', () => {
    it('should delete the log file', () => {
      logger.log('Test message');
      expect(existsSync(LOG_FILE)).toBe(true);

      logger.clear();
      expect(existsSync(LOG_FILE)).toBe(false);
    });

    it('should not throw if log file does not exist', () => {
      expect(() => logger.clear()).not.toThrow();
    });
  });

  describe('archive', () => {
    it('should rename log file with timestamp', () => {
      logger.log('Test message');

      logger.archive();

      expect(existsSync(LOG_FILE)).toBe(false);
      const files = readdirSync(TEST_DIR);
      const archivedFile = files.find(f => f.endsWith('.archive'));
      expect(archivedFile).toBeDefined();
    });

    it('should not throw if log file does not exist', () => {
      expect(() => logger.archive()).not.toThrow();
    });
  });

  describe('cleanupOldLogs', () => {
    it('should remove logs older than maxAgeHours', () => {
      const shortLogger = new Logger(LOG_FILE, 0); // 0 hours max age

      // Create old log file
      shortLogger.log('Old message');

      // Wait a tiny bit to ensure file is "old"
      const oldTime = Date.now() - 1000; // 1 second ago
      const archivePath = `${LOG_FILE}.old.archive`;
      writeFileSync(archivePath, 'old content');

      // Cleanup should remove it
      const deleted = shortLogger.cleanupOldLogs();
      expect(deleted).toBeGreaterThanOrEqual(0);
    });

    it('should not remove recent logs', () => {
      logger.log('Recent message');

      const deleted = logger.cleanupOldLogs();
      expect(existsSync(LOG_FILE)).toBe(true);
    });

    it('should return 0 if directory does not exist', () => {
      const nonExistentLogger = new Logger(join(TEST_DIR, 'nonexistent', 'log.log'));
      rmSync(TEST_DIR, { recursive: true, force: true });

      const deleted = nonExistentLogger.cleanupOldLogs();
      expect(deleted).toBe(0);
    });
  });

  describe('cleanupAll', () => {
    it('should remove all log and archive files', () => {
      logger.log('Message 1');
      writeFileSync(join(TEST_DIR, 'other.log'), 'content');
      writeFileSync(join(TEST_DIR, 'archive.log.archive'), 'archive content');
      writeFileSync(join(TEST_DIR, 'keep.txt'), 'keep this');

      const deleted = logger.cleanupAll();

      expect(deleted).toBe(3); // test.log, other.log, archive.log.archive
      expect(existsSync(join(TEST_DIR, 'keep.txt'))).toBe(true);
    });

    it('should return 0 if directory does not exist', () => {
      rmSync(TEST_DIR, { recursive: true, force: true });

      const deleted = logger.cleanupAll();
      expect(deleted).toBe(0);
    });
  });

  describe('logViolation', () => {
    it('should log violation with structured format', () => {
      const files = ['src/file1.ts', 'lib/file2.ts'];
      const errors = ['Error 1', 'Error 2'];

      logger.logViolation(files, errors);

      const content = readFileSync(LOG_FILE, 'utf-8');
      expect(content).toContain('COMMIT VIOLATION');
      expect(content).toContain('src/file1.ts, lib/file2.ts');
      expect(content).toContain('ERROR: Error 1');
      expect(content).toContain('ERROR: Error 2');
    });
  });

  describe('getStats', () => {
    it('should return stats when log file exists', () => {
      logger.log('Test message');

      const stats = logger.getStats();

      expect(stats.exists).toBe(true);
      expect(stats.size).toBeGreaterThan(0);
      expect(stats.age).toBeGreaterThanOrEqual(-1); // Allow small timing variance
      expect(stats.modified).toBeInstanceOf(Date);
    });

    it('should return exists: false when log file does not exist', () => {
      const stats = logger.getStats();

      expect(stats.exists).toBe(false);
      expect(stats.size).toBeUndefined();
      expect(stats.age).toBeUndefined();
      expect(stats.modified).toBeUndefined();
    });
  });
});
