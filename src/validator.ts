import type { Config, ValidationResult } from './types.js';
import { getMessages, formatMessage } from './messages.js';
import { PREFIX_CONFIG, PREFIX_ROOT } from './constants.js';
import { normalizePath } from './git-helper.js';
import { matchAnyGlob } from './utils/glob.js';

/**
 * Validates staged files against folder-based commit rules
 * Ensures all files in a commit belong to the same folder path (up to configured depth)
 */
export class CommitValidator {
  private config: Config;
  private messages;

  /**
   * Create a new CommitValidator
   * @param config - Configuration object with depth, ignorePaths, etc.
   */
  constructor(config: Config) {
    this.config = config;
    this.messages = getMessages(config.language);
  }

  /**
   * Get path prefix up to configured depth (cross-platform)
   * Example: "src/components/Button/index.ts" with depth=2 -> "src/components"
   * Special cases:
   *   - "file.ts" with depth=2 -> "" (root, no prefix)
   *   - "src/file.ts" with depth=2 -> "src"
   */
  private getPathPrefix(filePath: string, depth: number): string {
    const normalized = normalizePath(filePath);
    const parts = normalized.split('/');
    const actualDepth = Math.min(parts.length - 1, depth); // -1 because last is filename
    if (actualDepth === 0) return ''; // Root file
    return parts.slice(0, actualDepth).join('/');
  }

  /**
   * Filter out ignored files (cross-platform)
   * Supports glob patterns: *, **, ?
   */
  private filterIgnoredFiles(files: string[]): string[] {
    if (this.config.ignorePaths.length === 0) {
      return files;
    }
    return files.filter(file => {
      const normalized = normalizePath(file);
      return !matchAnyGlob(normalized, this.config.ignorePaths);
    });
  }

  /**
   * Build a map of file -> prefix for efficient lookup
   */
  private buildPrefixMap(files: string[], depth: number): Map<string, string> {
    const map = new Map<string, string>();
    for (const file of files) {
      map.set(file, this.getPathPrefix(file, depth));
    }
    return map;
  }

  /**
   * Validate that all staged files belong to the same folder prefix
   * @param stagedFiles - Array of staged file paths
   * @returns ValidationResult with valid flag, commonPath, errors, and stats
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
    result.stats.filteredFiles = filteredFiles.length;
    result.stats.ignoredFiles = stagedFiles.length - filteredFiles.length;

    if (filteredFiles.length === 0) {
      // All files are ignored, allow commit
      result.warnings.push('All staged files are in ignore list');
      result.commonPath = ''; // Will be converted to [config]
      return result;
    }

    // Check maxFiles limit
    if (this.config.maxFiles && filteredFiles.length > this.config.maxFiles) {
      result.warnings.push(
        `Warning: ${filteredFiles.length} files staged (limit: ${this.config.maxFiles})`
      );
    }

    // Build prefix map for efficient lookup (caching)
    const prefixMap = this.buildPrefixMap(filteredFiles, this.config.depth);
    const uniquePrefixes = [...new Set(prefixMap.values())];
    result.stats.uniqueFolders = uniquePrefixes.length;

    if (uniquePrefixes.length > 1) {
      result.valid = false;
      result.errors.push(
        formatMessage(this.messages.multipleFolder, { depth: this.config.depth })
      );

      // Group files by prefix using cached values
      const filesByPrefix = new Map<string, string[]>();
      for (const [file, prefix] of prefixMap) {
        const files = filesByPrefix.get(prefix) || [];
        files.push(file);
        filesByPrefix.set(prefix, files);
      }

      // Sort prefixes for consistent output
      uniquePrefixes.sort().forEach(prefix => {
        const filesInPrefix = filesByPrefix.get(prefix) || [];
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
        const filesInPrefix = filesByPrefix.get(prefix) || [];
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
   * @param commonPath - The common folder path (empty string for root)
   * @param allFilesIgnored - True if all files are in ignorePaths
   * @returns Prefix string like "[src/components]", "[root]", or "[config]"
   */
  getCommitPrefix(commonPath: string, allFilesIgnored: boolean = false): string {
    if (allFilesIgnored) return PREFIX_CONFIG;
    if (!commonPath) return PREFIX_ROOT;
    return `[${commonPath}]`;
  }
}
