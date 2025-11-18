import type { Config, ValidationResult } from './types.js';
import { getMessages, formatMessage, type Language } from './messages.js';

export class CommitValidator {
  private config: Config;
  private messages;

  constructor(config: Config) {
    this.config = config;
    this.messages = getMessages(config.language as Language);
  }

  /**
   * Get path prefix up to configured depth
   * Example: "src/components/Button/index.ts" with depth=2 -> "src/components"
   * Special cases:
   *   - "file.ts" with depth=2 -> "" (root, no prefix)
   *   - "src/file.ts" with depth=2 -> "src"
   */
  private getPathPrefix(filePath: string, depth: number): string {
    const parts = filePath.split('/');
    const actualDepth = Math.min(parts.length - 1, depth); // -1 because last is filename
    if (actualDepth === 0) return ''; // Root file
    return parts.slice(0, actualDepth).join('/');
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
      errors: [],
      warnings: [],
      stats: {
        totalFiles: stagedFiles.length,
        filteredFiles: 0,
        ignoredFiles: 0,
        uniqueFolders: 0
      }
    };

    if (stagedFiles.length === 0) {
      result.errors.push('No files staged for commit');
      result.valid = false;
      return result;
    }

    // Filter ignored files
    const filteredFiles = this.filterIgnoredFiles(stagedFiles);
    result.stats!.filteredFiles = filteredFiles.length;
    result.stats!.ignoredFiles = stagedFiles.length - filteredFiles.length;

    if (filteredFiles.length === 0) {
      // All files are ignored, allow commit
      result.warnings!.push('All staged files are in ignore list');
      return result;
    }

    // Check maxFiles limit
    if (this.config.maxFiles && filteredFiles.length > this.config.maxFiles) {
      result.warnings!.push(
        `Warning: ${filteredFiles.length} files staged (limit: ${this.config.maxFiles})`
      );
    }

    // Get path prefixes for all files
    const prefixes = filteredFiles.map(file =>
      this.getPathPrefix(file, this.config.depth)
    );

    // Check if all prefixes are the same
    const uniquePrefixes = [...new Set(prefixes)];
    result.stats!.uniqueFolders = uniquePrefixes.length;

    if (uniquePrefixes.length === 0) {
      result.errors.push('Unable to determine folder structure');
      result.valid = false;
      return result;
    }

    if (uniquePrefixes.length > 1) {
      result.valid = false;
      result.errors.push(
        formatMessage(this.messages.multipleFolder, { depth: this.config.depth })
      );

      // Sort prefixes for consistent output
      uniquePrefixes.sort().forEach(prefix => {
        const filesInPrefix = filteredFiles.filter(f =>
          this.getPathPrefix(f, this.config.depth) === prefix
        );
        const displayPrefix = prefix || '(root)';
        result.errors.push(`  [${displayPrefix}] (${filesInPrefix.length} files):`);
        filesInPrefix.forEach(f => result.errors.push(`    - ${f}`));
      });

      result.errors.push('');
      result.errors.push(`✖ ${this.messages.rule}`);
      result.errors.push(`✖ ${formatMessage(this.messages.depth, { depth: this.config.depth })}`);
      result.errors.push(`✖ ${this.messages.solution}`);
      result.errors.push('');
      result.errors.push(`💡 ${this.messages.quickFixes}`);
      uniquePrefixes.forEach(prefix => {
        const filesInPrefix = filteredFiles.filter(f =>
          this.getPathPrefix(f, this.config.depth) === prefix
        );
        const displayPrefix = prefix || '(root)';
        result.errors.push(`   git reset ${filesInPrefix.join(' ')}  # ${this.messages.unstage} [${displayPrefix}]`);
      });

      return result;
    }

    result.commonPath = uniquePrefixes[0];
    return result;
  }

  /**
   * Generate commit message prefix from common path
   */
  getCommitPrefix(commonPath: string): string {
    if (!commonPath) return '[root]';
    return `[${commonPath}]`;
  }
}
