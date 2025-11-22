import type {
  Preset,
  Config,
  FolderBasedConfig,
  ValidationResult,
  CommitMsgValidationResult
} from '../types.js';
import { getMessages, formatMessage, type Language } from '../messages.js';

/**
 * Folder-based preset
 * Enforces that all staged files must be in the same folder path up to configured depth
 */
export class FolderBasedPreset implements Preset {
  name = 'folder-based';
  description = 'Enforce folder-based commit rules with automatic prefix generation';

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
  private filterIgnoredFiles(files: string[], ignorePaths: string[]): string[] {
    return files.filter(file => {
      return !ignorePaths.some(ignorePath => {
        return file === ignorePath || file.startsWith(ignorePath + '/');
      });
    });
  }

  /**
   * Validate that all staged files belong to the same folder prefix
   */
  validateFiles(stagedFiles: string[], config: Config): ValidationResult {
    const folderConfig = config as FolderBasedConfig;
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
    const filteredFiles = this.filterIgnoredFiles(stagedFiles, folderConfig.ignorePaths);
    result.stats!.filteredFiles = filteredFiles.length;
    result.stats!.ignoredFiles = stagedFiles.length - filteredFiles.length;

    if (filteredFiles.length === 0) {
      // All files are ignored, allow commit
      result.warnings!.push('All staged files are in ignore list');
      result.commonPath = ''; // Will be converted to [config] or [meta]
      return result;
    }

    // Check maxFiles limit
    if (folderConfig.maxFiles && filteredFiles.length > folderConfig.maxFiles) {
      result.warnings!.push(
        `Warning: ${filteredFiles.length} files staged (limit: ${folderConfig.maxFiles})`
      );
    }

    // Get path prefixes for all files
    const prefixes = filteredFiles.map(file =>
      this.getPathPrefix(file, folderConfig.depth)
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
        formatMessage(messages.multipleFolder, { depth: folderConfig.depth })
      );

      // Sort prefixes for consistent output
      uniquePrefixes.sort().forEach(prefix => {
        const filesInPrefix = filteredFiles.filter(f =>
          this.getPathPrefix(f, folderConfig.depth) === prefix
        );
        const displayPrefix = prefix || '(root)';
        result.errors.push(`  [${displayPrefix}] (${filesInPrefix.length} files):`);
        filesInPrefix.forEach(f => result.errors.push(`    - ${f}`));
      });

      result.errors.push('');
      result.errors.push(`✖ ${messages.rule}`);
      result.errors.push(`✖ ${formatMessage(messages.depth, { depth: folderConfig.depth })}`);
      result.errors.push(`✖ ${messages.solution}`);
      result.errors.push('');
      result.errors.push(`💡 ${messages.quickFixes}`);
      uniquePrefixes.forEach(prefix => {
        const filesInPrefix = filteredFiles.filter(f =>
          this.getPathPrefix(f, folderConfig.depth) === prefix
        );
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
  validateCommitMessage(commitMsg: string, config: Config): CommitMsgValidationResult {
    const folderConfig = config as FolderBasedConfig;
    const messages = getMessages(config.language as Language);
    const minDescriptionLength = 3;

    const result: CommitMsgValidationResult = {
      valid: true,
      errors: []
    };

    const trimmedMsg = commitMsg.trim();

    // Generate dynamic examples based on depth
    const examplePrefix = this.generateExamplePrefix(folderConfig.depth);
    const depthFormat = this.generateDepthFormat(folderConfig.depth);

    // Check if message is empty
    if (!trimmedMsg) {
      result.valid = false;
      result.errors.push(messages.commitMsgInvalid);
      result.errors.push(formatMessage(messages.commitMsgMissingPrefix, {
        examplePrefix
      }));
      return result;
    }

    // Check if message starts with [prefix]
    const prefixMatch = trimmedMsg.match(/^\[([^\]]+)\]\s*(.*)$/);

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
        depth: folderConfig.depth,
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
  getCommitPrefix(validationResult: ValidationResult, config: Config): string {
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
    const parts = ['src', 'components', 'Button', 'tests', 'hooks'];
    return `[${parts.slice(0, Math.min(depth, parts.length)).join('/')}]`;
  }

  /**
   * Generate depth format description
   * depth=1: [folder]
   * depth=2: [folder/path]
   * depth=3: [folder/path/to]
   */
  private generateDepthFormat(depth: number): string {
    const parts = ['folder', 'path', 'to', 'file'];
    return `[${parts.slice(0, Math.min(depth, parts.length)).join('/')}]`;
  }
}
