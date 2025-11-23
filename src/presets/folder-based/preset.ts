import type { Preset, ValidationResult, CommitMsgValidationResult } from '../base/types.js';
import type { FolderBasedConfig } from './types.js';
import { getMessages, formatMessage, type Language } from '../../core/messages.js';
import {
  getPathPrefix,
  filterIgnoredFiles,
  findLongestMatchingPrefix,
} from '../../core/utils/path-utils.js';
import {
  COMMIT_MESSAGE,
  EXAMPLE_PATHS,
} from '../../core/constants.js';

/**
 * Folder-based Preset
 *
 * Enforces that all staged files must be in the same folder path up to configured depth.
 * Automatically generates commit message prefixes based on the common folder path.
 *
 * @example
 * // depth=2
 * // Files: src/components/Button.tsx, src/components/Input.tsx
 * // Prefix: [src/components]
 *
 * @example
 * // depth=1
 * // Files: src/utils.ts, src/helpers.ts
 * // Prefix: [src]
 */
export class FolderBasedPreset implements Preset<FolderBasedConfig> {
  name = 'folder-based';
  description = 'Enforce folder-based commit rules with automatic prefix generation';

  /**
   * Get the appropriate depth for a file based on depthOverrides
   * Checks for matching path prefixes in depthOverrides
   */
  private getDepthForFile(filePath: string, config: FolderBasedConfig): number {
    const baseDepth = config.depth === 'auto' ? (config.maxDepth || 5) : config.depth;

    if (!config.depthOverrides) {
      return baseDepth;
    }

    // Find matching override (longest match wins)
    const prefixes = Object.keys(config.depthOverrides);
    const matchedPrefix = findLongestMatchingPrefix(filePath, prefixes);

    return matchedPrefix ? config.depthOverrides[matchedPrefix] : baseDepth;
  }

  /**
   * Detect optimal depth for a set of files (auto mode)
   * Finds the shortest common path depth that groups all files meaningfully
   */
  private detectOptimalDepth(files: string[], maxDepth: number = 5): number {
    if (files.length === 0) return 1;

    // Try each depth from 1 to maxDepth and find the one that groups files best
    for (let depth = 1; depth <= maxDepth; depth++) {
      const prefixes = files.map(f => getPathPrefix(f, depth));
      const uniquePrefixes = new Set(prefixes);

      // If all files share the same prefix at this depth, this is optimal
      if (uniquePrefixes.size === 1) {
        return depth;
      }
    }

    // If no common prefix found, return maxDepth
    return maxDepth;
  }

  /**
   * Validate that all staged files belong to the same folder prefix
   */
  validateFiles(stagedFiles: string[], config: FolderBasedConfig): ValidationResult {
    const messages = getMessages(config.language as Language);

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
    const filteredFiles = filterIgnoredFiles(stagedFiles, config.ignorePaths);
    result.stats!.filteredFiles = filteredFiles.length;
    result.stats!.ignoredFiles = stagedFiles.length - filteredFiles.length;

    if (filteredFiles.length === 0) {
      // All files are ignored, allow commit
      result.warnings!.push('All staged files are in ignore list');
      result.commonPath = ''; // Will be converted to [config] or [meta]
      return result;
    }

    // Check maxFiles limit
    if (config.maxFiles && filteredFiles.length > config.maxFiles) {
      result.warnings!.push(
        `Warning: ${filteredFiles.length} files staged (limit: ${config.maxFiles})`
      );
    }

    // Determine effective depth
    let effectiveDepth: number;
    if (config.depth === 'auto') {
      // Auto-detect optimal depth
      effectiveDepth = this.detectOptimalDepth(filteredFiles, config.maxDepth || 5);
    } else {
      effectiveDepth = config.depth;
    }

    // Get path prefixes for all files
    const prefixes = filteredFiles.map(file => {
      const fileDepth = config.depthOverrides
        ? this.getDepthForFile(file, config)
        : effectiveDepth;
      return getPathPrefix(file, fileDepth);
    });

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

      const depthInfo = config.depth === 'auto'
        ? `auto (detected: ${effectiveDepth})`
        : config.depthOverrides
          ? `${config.depth} (with path-specific overrides)`
          : String(config.depth);

      result.errors.push(
        formatMessage(messages.multipleFolder, { depth: depthInfo })
      );

      // Sort prefixes for consistent output
      uniquePrefixes.sort().forEach(prefix => {
        const filesInPrefix = filteredFiles.filter((f, idx) => prefixes[idx] === prefix);
        const displayPrefix = prefix || '(root)';
        result.errors.push(`  [${displayPrefix}] (${filesInPrefix.length} files):`);
        filesInPrefix.forEach(f => result.errors.push(`    - ${f}`));
      });

      result.errors.push('');
      result.errors.push(`✖ ${messages.rule}`);
      result.errors.push(`✖ ${formatMessage(messages.depth, { depth: depthInfo })}`);
      result.errors.push(`✖ ${messages.solution}`);
      result.errors.push('');
      result.errors.push(`💡 ${messages.quickFixes}`);
      uniquePrefixes.forEach(prefix => {
        const filesInPrefix = filteredFiles.filter((f, idx) => prefixes[idx] === prefix);
        const displayPrefix = prefix || '(root)';
        result.errors.push(`   git reset ${filesInPrefix.join(' ')}  # ${messages.unstage} [${displayPrefix}]`);
      });

      return result;
    }

    result.commonPath = uniquePrefixes[0];
    return result;
  }

  /**
   * Validate commit message format for folder-based preset
   * Expected format: [prefix] Description
   * Valid prefixes: [folder/path], [root], [config]
   */
  validateCommitMessage(commitMsg: string, config: FolderBasedConfig): CommitMsgValidationResult {
    const messages = getMessages(config.language as Language);
    const minDescriptionLength = COMMIT_MESSAGE.MIN_DESCRIPTION_LENGTH;

    const result: CommitMsgValidationResult = {
      valid: true,
      errors: []
    };

    const trimmedMsg = commitMsg.trim();

    // Get effective depth for examples
    const effectiveDepth = config.depth === 'auto' ? (config.maxDepth || 3) : config.depth;

    // Generate dynamic examples based on depth
    const examplePrefix = this.generateExamplePrefix(effectiveDepth);
    const depthFormat = this.generateDepthFormat(effectiveDepth);

    // Check if message is empty
    if (!trimmedMsg) {
      result.valid = false;
      result.errors.push(messages.commitMsgInvalid);
      result.errors.push(formatMessage(messages.commitMsgMissingPrefix, {
        examplePrefix
      }));
      return result;
    }

    // For multi-line messages, validate only the first line
    const firstLine = trimmedMsg.split('\n')[0];

    // Check if message starts with [prefix]
    const prefixMatch = firstLine.match(/^\[([^\]]+)\]\s*(.*)$/);

    if (!prefixMatch) {
      result.valid = false;
      result.errors.push(messages.commitMsgInvalid);
      result.errors.push(formatMessage(messages.commitMsgMissingPrefix, {
        examplePrefix
      }));
      result.errors.push('');
      result.errors.push(`✖ ${messages.commitMsgRule}`);
      result.errors.push(`✖ ${formatMessage(messages.commitMsgValidPrefixes, {
        depthFormat
      })}`);
      result.errors.push(`✖ ${formatMessage(messages.commitMsgDepthInfo, {
        depth: effectiveDepth,
        examplePrefix
      })}`);
      result.errors.push('');
      result.errors.push(`💡 ${formatMessage(messages.commitMsgExample, {
        examplePrefix
      })}`);
      return result;
    }

    const [, prefix, description] = prefixMatch;

    // Validate prefix format (should not be empty)
    if (!prefix || prefix.trim() === '') {
      result.valid = false;
      result.errors.push(formatMessage(messages.commitMsgInvalidPrefix, {
        depthFormat
      }));
      return result;
    }

    // Check if description exists
    const trimmedDescription = description.trim();
    if (!trimmedDescription) {
      result.valid = false;
      result.errors.push(messages.commitMsgMissingDescription);
      result.errors.push('');
      result.errors.push(`💡 ${formatMessage(messages.commitMsgExample, {
        examplePrefix
      })}`);
      return result;
    }

    // Check description length
    if (trimmedDescription.length < minDescriptionLength) {
      result.valid = false;
      result.errors.push(
        formatMessage(messages.commitMsgTooShort, { minLength: minDescriptionLength })
      );
      return result;
    }

    result.prefix = prefix;
    return result;
  }

  /**
   * Generate commit message prefix from validation result
   */
  getCommitPrefix(validationResult: ValidationResult, config: FolderBasedConfig): string {
    const allFilesIgnored = validationResult.stats?.ignoredFiles === validationResult.stats?.totalFiles;

    if (allFilesIgnored) return '[config]';
    if (!validationResult.commonPath) return '[root]';
    return `[${validationResult.commonPath}]`;
  }

  /**
   * Generate example prefix based on depth
   * depth=1: [src]
   * depth=2: [src/components]
   * depth=3: [src/components/Button]
   */
  private generateExamplePrefix(depth: number): string {
    const parts = EXAMPLE_PATHS.FOLDERS;
    return `[${parts.slice(0, Math.min(depth, parts.length)).join('/')}]`;
  }

  /**
   * Generate depth format description
   * depth=1: [folder]
   * depth=2: [folder/path]
   * depth=3: [folder/path/to]
   */
  private generateDepthFormat(depth: number): string {
    const parts = EXAMPLE_PATHS.GENERIC;
    return `[${parts.slice(0, Math.min(depth, parts.length)).join('/')}]`;
  }
}
