/**
 * Check command - validates staged files
 */

import { simpleGit } from 'simple-git';
import { loadConfig } from '../../core/config.js';
import { CommitValidator } from '../../core/validator.js';
import { matchAnyGlob } from '../../core/utils/glob.js';
import { validatePaths } from '../../core/utils/path-utils.js';
import {
  printHeader,
  printFooter,
  printSuccess,
  printError,
  printWarning,
  printListItem,
} from '../../core/utils/console.js';
import { getMessages } from '../../core/messages.js';
import type { FolderBasedConfig } from '../../presets/folder-based/types.js';

const git = simpleGit();

/** Parse --files argument for dry-run validation */
function parseFilesArg(args: string[]): string[] | null {
  const filesIndex = args.indexOf('--files');
  if (filesIndex === -1 || filesIndex + 1 >= args.length) {
    return null;
  }
  return args[filesIndex + 1]
    .split(',')
    .map(f => f.trim())
    .filter(f => f.length > 0);
}

export async function checkCommand(args: string[] = []): Promise<void> {
  try {
    const config = loadConfig();
    const messages = getMessages(config.language);

    // Check for --files argument (dry-run mode)
    const customFiles = parseFilesArg(args);
    const isDryRun = customFiles !== null;

    let rawFiles: string[];
    if (isDryRun) {
      rawFiles = customFiles;
    } else {
      const status = await git.status();
      rawFiles = Array.from(new Set([
        ...status.staged,
        ...status.created,
        ...status.renamed.map(r => r.to)
      ]));
    }

    // Validate paths for security (filter out path traversal patterns)
    const { valid: stagedFiles, rejected: invalidPaths } = validatePaths(rawFiles);

    if (invalidPaths.length > 0) {
      printWarning(`Rejected ${invalidPaths.length} file(s) with invalid paths:`);
      invalidPaths.forEach(f => printListItem(f, 3));
      console.log('');
    }

    if (stagedFiles.length === 0) {
      printWarning(messages.noFilesStaged);
      return;
    }

    const validator = new CommitValidator(config);
    const result = validator.validate(stagedFiles);
    const folderConfig = config as FolderBasedConfig;

    const title = isDryRun ? 'Validation Check (Dry Run)' : 'Validation Check';
    printHeader(title, '📋');

    console.log(`Preset: ${config.preset}`);
    console.log(`${isDryRun ? messages.testFiles : 'Staged files'}: ${stagedFiles.length}`);
    if (config.preset === 'folder-based') {
      console.log(`${messages.depthSetting}: ${folderConfig.depth}`);
    }

    // Show ignored files if any
    const ignoredFiles = stagedFiles.filter(f => matchAnyGlob(f, folderConfig.ignorePaths || []));
    if (ignoredFiles.length > 0) {
      console.log(`\n📝 ${messages.ignoredFiles} (${ignoredFiles.length}):`);
      ignoredFiles.forEach(f => printListItem(f, 3));
      console.log('');
    }

    if (result.valid) {
      printSuccess(messages.checkPassed);
      if (result.commonPath !== undefined && result.commonPath !== null) {
        console.log(`📁 ${messages.commonPath}: [${result.commonPath || 'root'}]`);
        console.log(`📝 ${messages.commitPrefix}: ${validator.getCommitPrefix(result.commonPath || '')}`);
      }
      const validatedFiles = stagedFiles.filter(f => !ignoredFiles.includes(f));
      if (validatedFiles.length > 0) {
        console.log(`\n📄 ${messages.validatedFiles}:`);
        validatedFiles.forEach(f => printListItem(f, 3));
      }
    } else {
      printError(messages.checkFailed);
      console.log('');
      result.errors.forEach(err => console.log(err));
    }

    if (isDryRun) {
      console.log('');
      printWarning(messages.dryRunWarning);
    }

    printFooter();
  } catch (error) {
    printError(`Error: ${error}`);
    process.exit(1);
  }
}
