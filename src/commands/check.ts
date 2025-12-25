import { loadConfig } from '../config.js';
import { CommitValidator } from '../validator.js';
import { getStagedFiles } from '../git-helper.js';
import { printHeader, printFooter, printSuccess, printError, printInfo, printListItem, printWarning } from '../utils/console.js';
import { matchAnyGlob } from '../utils/glob.js';
import { getMessages } from '../messages.js';

/**
 * Parse --files argument for dry-run validation
 */
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

/**
 * Get files that are being ignored (supports glob patterns)
 */
function getIgnoredFiles(allFiles: string[], ignorePaths: string[]): string[] {
  if (ignorePaths.length === 0) return [];
  return allFiles.filter(file => matchAnyGlob(file, ignorePaths));
}

export async function checkCommand(args: string[] = []): Promise<void> {
  const config = loadConfig();
  const messages = getMessages(config.language);

  // Check for --files argument (dry-run mode)
  const customFiles = parseFilesArg(args);
  const isDryRun = customFiles !== null;

  const stagedFiles = isDryRun ? customFiles : await getStagedFiles();

  if (stagedFiles.length === 0) {
    printInfo(messages.noFilesStaged);
    return;
  }

  const validator = new CommitValidator(config);
  const result = validator.validate(stagedFiles);

  printHeader(isDryRun ? 'Validation Check (Dry Run)' : 'Validation Check', '📋');
  console.log(`${isDryRun ? messages.testFiles : messages.stagedFiles.split(':')[0]}: ${stagedFiles.length}`);
  console.log(`${messages.depthSetting}: ${config.depth}`);
  printFooter();

  // Show ignored files if any
  const ignoredFilesInStaged = getIgnoredFiles(stagedFiles, config.ignorePaths);
  if (ignoredFilesInStaged.length > 0) {
    console.log(`\n📝 ${messages.ignoredFiles} (${ignoredFilesInStaged.length}):`);
    ignoredFilesInStaged.forEach(f => printListItem(f, 3));
    console.log('');
  }

  if (result.valid) {
    printSuccess(messages.checkPassed);
    if (result.commonPath !== null) {
      console.log(`📁 ${messages.commonPath}: [${result.commonPath || 'root'}]`);
      const allFilesIgnored = result.stats.ignoredFiles === stagedFiles.length;
      console.log(`📝 ${messages.commitPrefix}: ${validator.getCommitPrefix(result.commonPath, allFilesIgnored)}`);
    }
    const validatedFiles = stagedFiles.filter(f => !ignoredFilesInStaged.includes(f));
    if (validatedFiles.length > 0) {
      console.log(`\n📄 ${messages.validatedFiles}:`);
      validatedFiles.forEach(f => printListItem(f, 3));
    }
  } else {
    printError(`${messages.checkFailed}\n`);
    result.errors.forEach(err => console.log(err));
  }

  if (isDryRun) {
    console.log('');
    printWarning(messages.dryRunWarning);
  }

  printFooter();
}
