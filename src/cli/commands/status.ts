/**
 * Status command - shows current configuration and git status
 */

import { simpleGit } from 'simple-git';
import { loadConfig } from '../../core/config.js';
import {
  printHeader,
  printFooter,
  printSeparator,
  printListItem,
  printError,
} from '../../core/utils/console.js';
import type { FolderBasedConfig } from '../../presets/folder-based/types.js';

const git = simpleGit();

export async function statusCommand(): Promise<void> {
  try {
    const config = loadConfig();
    const status = await git.status();
    const stagedFiles = Array.from(new Set([
      ...status.staged,
      ...status.created,
      ...status.renamed.map(r => r.to)
    ]));

    printHeader('Status Report', '📊');

    console.log('Configuration:');
    printListItem(`Preset: ${config.preset}`);
    printListItem(`Enabled: ${config.enabled ? '✅' : '❌'}`);
    if (config.preset === 'folder-based') {
      const folderConfig = config as FolderBasedConfig;
      printListItem(`Depth: ${folderConfig.depth}`);
      printListItem(`Ignored paths: ${folderConfig.ignorePaths.length} entries`);
    }
    printListItem(`Log file: ${config.logFile}`);

    printSeparator();

    console.log('Git Status:');
    printListItem(`Current branch: ${status.current || 'unknown'}`);
    printListItem(`Staged files: ${stagedFiles.length}`);
    printListItem(`Modified files: ${status.modified.length}`);
    printListItem(`Untracked files: ${status.not_added.length}`);

    if (stagedFiles.length > 0) {
      printSeparator();
      console.log('Staged files:');
      stagedFiles.forEach(f => printListItem(f));
    }

    printFooter();
  } catch (error) {
    printError(`Error: ${error}`);
    process.exit(1);
  }
}
