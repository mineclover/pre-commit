/**
 * Check command - validates staged files
 */

import { simpleGit } from 'simple-git';
import { loadConfig } from '../../core/config.js';
import { CommitValidator } from '../../core/validator.js';
import { matchAnyGlob } from '../../core/utils/glob.js';
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

    let stagedFiles: string[];
    if (isDryRun) {
      stagedFiles = customFiles;
    } else {
      const status = await git.status();
      stagedFiles = Array.from(new Set([
        ...status.staged,
        ...status.created,
        ...status.renamed.map(r => r.to)
      ]));
    }

    if (stagedFiles.length === 0) {
      console.log(`ℹ️  ${messages.noFilesStaged}`);
      return;
    }

    const validator = new CommitValidator(config);
    const result = validator.validate(stagedFiles);
    const folderConfig = config as FolderBasedConfig;

    console.log(`\n📋 ${isDryRun ? 'Validation Check (Dry Run)' : 'Validation Check'}\n`);
    console.log('━'.repeat(60));
    console.log(`Preset: ${config.preset}`);
    console.log(`${isDryRun ? messages.testFiles : 'Staged files'}: ${stagedFiles.length}`);
    if (config.preset === 'folder-based') {
      console.log(`${messages.depthSetting}: ${folderConfig.depth}`);
    }
    console.log('━'.repeat(60));

    // Show ignored files if any
    const ignoredFiles = stagedFiles.filter(f => matchAnyGlob(f, folderConfig.ignorePaths || []));
    if (ignoredFiles.length > 0) {
      console.log(`\n📝 ${messages.ignoredFiles} (${ignoredFiles.length}):`);
      ignoredFiles.forEach(f => console.log(`   - ${f}`));
      console.log('');
    }

    if (result.valid) {
      console.log(`✅ ${messages.checkPassed}`);
      if (result.commonPath !== undefined && result.commonPath !== null) {
        console.log(`📁 ${messages.commonPath}: [${result.commonPath || 'root'}]`);
        console.log(`📝 ${messages.commitPrefix}: ${validator.getCommitPrefix(result.commonPath || '')}`);
      }
      const validatedFiles = stagedFiles.filter(f => !ignoredFiles.includes(f));
      if (validatedFiles.length > 0) {
        console.log(`\n📄 ${messages.validatedFiles}:`);
        validatedFiles.forEach(f => console.log(`   - ${f}`));
      }
    } else {
      console.log(`❌ ${messages.checkFailed}\n`);
      result.errors.forEach(err => console.log(err));
    }

    if (isDryRun) {
      console.log('');
      console.log(`⚠️  ${messages.dryRunWarning}`);
    }

    console.log('━'.repeat(60) + '\n');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}
