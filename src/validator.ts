import type { Config, ValidationResult } from './types.js';

export class CommitValidator {
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  /**
   * Get path prefix up to configured depth
   * Example: "src/components/Button/index.ts" with depth=2 -> "src/components"
   */
  private getPathPrefix(filePath: string, depth: number): string {
    const parts = filePath.split('/');
    return parts.slice(0, depth).join('/');
  }

  /**
   * Filter out ignored files
   */
  private filterIgnoredFiles(files: string[]): string[] {
    return files.filter(file => {
      return !this.config.ignorePaths.some(ignorePath => {
        return file === ignorePath || file.startsWith(ignorePath + '/');
      });
    });
  }

  /**
   * Validate that all staged files belong to the same folder prefix
   */
  validate(stagedFiles: string[]): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      commonPath: null,
      files: stagedFiles,
      errors: []
    };

    if (stagedFiles.length === 0) {
      result.errors.push('No files staged for commit');
      result.valid = false;
      return result;
    }

    // Filter ignored files
    const filteredFiles = this.filterIgnoredFiles(stagedFiles);

    if (filteredFiles.length === 0) {
      // All files are ignored, allow commit
      return result;
    }

    // Get path prefixes for all files
    const prefixes = filteredFiles.map(file =>
      this.getPathPrefix(file, this.config.depth)
    );

    // Check if all prefixes are the same
    const uniquePrefixes = [...new Set(prefixes)];

    if (uniquePrefixes.length === 0) {
      result.errors.push('Unable to determine folder structure');
      result.valid = false;
      return result;
    }

    if (uniquePrefixes.length > 1) {
      result.valid = false;
      result.errors.push(
        `Files from multiple folders detected (depth=${this.config.depth}):`
      );
      uniquePrefixes.forEach(prefix => {
        const filesInPrefix = filteredFiles.filter(f =>
          this.getPathPrefix(f, this.config.depth) === prefix
        );
        result.errors.push(`  [${prefix}]: ${filesInPrefix.join(', ')}`);
      });
      result.errors.push('');
      result.errors.push('✖ RULE: All staged files must be in the same folder path');
      result.errors.push(`✖ DEPTH: ${this.config.depth} levels`);
      result.errors.push('✖ SOLUTION: Unstage files from other folders or commit them separately');
      return result;
    }

    result.commonPath = uniquePrefixes[0];
    return result;
  }

  /**
   * Generate commit message prefix from common path
   */
  getCommitPrefix(commonPath: string): string {
    return `[${commonPath}]`;
  }
}
