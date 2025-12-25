import { simpleGit } from 'simple-git';
import { loadConfig } from '../config.js';
import { getStagedFiles } from '../git-helper.js';
import { printHeader, printFooter, printListItem } from '../utils/console.js';
import { getMessages, formatMessage } from '../messages.js';

export async function statusCommand(): Promise<void> {
  const config = loadConfig();
  const messages = getMessages(config.language);
  const git = simpleGit();
  const status = await git.status();
  const stagedFiles = await getStagedFiles(git);

  printHeader('Status Report', '📊');
  console.log(`${messages.configuration}:`);
  console.log(`  - ${messages.enabled}: ${config.enabled ? '✅' : '❌'}`);
  console.log(`  - ${messages.depth.split(':')[0]}: ${config.depth}`);
  console.log(`  - ${messages.logFileLabel}: ${config.logFile}`);
  console.log(`  - ${messages.ignoredPaths}: ${formatMessage(messages.entries, { count: config.ignorePaths.length })}`);
  printFooter();
  console.log(`${messages.gitStatus}:`);
  console.log(`  - ${messages.currentBranch}: ${status.current || messages.unknown}`);
  console.log(`  - ${messages.stagedFiles.split(':')[0]}: ${stagedFiles.length}`);
  console.log(`  - ${messages.modifiedFiles}: ${status.modified.length}`);
  console.log(`  - ${messages.untrackedFiles}: ${status.not_added.length}`);
  printFooter();

  if (stagedFiles.length > 0) {
    console.log(`${messages.stagedFiles.split(':')[0]}:`);
    stagedFiles.forEach(f => printListItem(f));
    printFooter();
  }
}
