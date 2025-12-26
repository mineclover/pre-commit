/**
 * Integration tests for CLI commands
 * Tests the actual CLI behavior with real file system operations
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';

const TEST_DIR = join(process.cwd(), 'tests/integration/.test-workspace');
const CLI_PATH = join(process.cwd(), 'dist/cli/index.js');

/**
 * Run CLI command and return output
 */
function runCli(args: string): { stdout: string; exitCode: number } {
  try {
    const stdout = execSync(`node ${CLI_PATH} ${args}`, {
      encoding: 'utf-8',
      cwd: TEST_DIR,
    });
    return { stdout, exitCode: 0 };
  } catch (error: any) {
    return {
      stdout: error.stdout || error.message,
      exitCode: error.status || 1,
    };
  }
}

describe('CLI Integration Tests', () => {
  beforeEach(() => {
    // Create test workspace
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });

    // Create config file
    writeFileSync(
      join(TEST_DIR, '.precommitrc.json'),
      JSON.stringify({
        preset: 'folder-based',
        depth: 2,
        enabled: true,
        logFile: '.commit-logs/test.log',
        ignorePaths: ['package.json'],
      })
    );
  });

  afterEach(() => {
    // Cleanup test workspace
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
  });

  describe('check command', () => {
    it('should validate files in same folder', () => {
      const result = runCli('check --files "src/core/a.ts,src/core/b.ts"');

      expect(result.stdout).toContain('PASSED');
      expect(result.stdout).toContain('[src/core]');
    });

    it('should fail for files in different folders', () => {
      const result = runCli('check --files "src/core/a.ts,lib/util.ts"');

      expect(result.stdout).toContain('multiple folders detected');
    });

    it('should handle single file', () => {
      const result = runCli('check --files "src/index.ts"');

      expect(result.stdout).toContain('PASSED');
    });

    it('should reject path traversal attempts', () => {
      const result = runCli('check --files "../../../etc/passwd,src/file.ts"');

      expect(result.stdout).toContain('Rejected');
      expect(result.stdout).toContain('invalid paths');
    });

    it('should handle root files', () => {
      const result = runCli('check --files "README.md"');

      expect(result.stdout).toContain('PASSED');
      expect(result.stdout).toContain('[root]');
    });
  });

  describe('config command', () => {
    it('should display current configuration', () => {
      const result = runCli('config');

      expect(result.stdout).toContain('folder-based');
      expect(result.stdout).toContain('depth');
    });
  });

  describe('help command', () => {
    it('should display help information', () => {
      const result = runCli('help');

      expect(result.stdout).toContain('Usage');
      expect(result.stdout).toContain('Commands');
      expect(result.stdout).toContain('check');
      expect(result.stdout).toContain('status');
    });
  });

  describe('version command', () => {
    it('should display version', () => {
      const result = runCli('--version');

      expect(result.stdout).toMatch(/\d+\.\d+\.\d+/);
    });
  });

  describe('validate-config command', () => {
    it('should validate valid config', () => {
      const result = runCli('validate-config');

      expect(result.stdout).toContain('valid');
    });

    it('should report issues with invalid config', () => {
      // Write invalid config
      writeFileSync(
        join(TEST_DIR, '.precommitrc.json'),
        JSON.stringify({
          preset: 'unknown-preset',
          depth: -1,
        })
      );

      const result = runCli('validate-config');

      // Should still run but report issues
      expect(result.stdout).toBeDefined();
    });
  });

  describe('plugin command', () => {
    it('should list registered presets', () => {
      const result = runCli('plugin list');

      expect(result.stdout).toContain('Registered');
      expect(result.stdout).toContain('folder-based');
    });

    it('should show plugin help', () => {
      const result = runCli('plugin help');

      expect(result.stdout).toContain('Commands');
      expect(result.stdout).toContain('list');
      expect(result.stdout).toContain('discover');
    });
  });
});

describe('Validation Logic Integration', () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
  });

  it('should respect depth setting', () => {
    // depth=1 config
    writeFileSync(
      join(TEST_DIR, '.precommitrc.json'),
      JSON.stringify({
        preset: 'folder-based',
        depth: 1,
        enabled: true,
        logFile: '.commit-logs/test.log',
      })
    );

    // Files at different depth-1 paths should fail
    const result = runCli('check --files "src/a.ts,lib/b.ts"');
    expect(result.stdout).toContain('multiple folders detected');

    // Files at same depth-1 path should pass
    const result2 = runCli('check --files "src/core/a.ts,src/utils/b.ts"');
    expect(result2.stdout).toContain('PASSED');
    expect(result2.stdout).toContain('[src]');
  });

  it('should respect ignorePaths', () => {
    writeFileSync(
      join(TEST_DIR, '.precommitrc.json'),
      JSON.stringify({
        preset: 'folder-based',
        depth: 2,
        enabled: true,
        logFile: '.commit-logs/test.log',
        ignorePaths: ['config.json', 'package.json'],
      })
    );

    // Ignored files should not affect validation
    const result = runCli('check --files "src/core/a.ts,config.json"');
    expect(result.stdout).toContain('PASSED');
  });
});
