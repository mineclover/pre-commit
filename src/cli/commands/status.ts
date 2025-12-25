/**
 * Status command - shows current configuration and git status
 */

import { simpleGit } from 'simple-git';
import { loadConfig } from '../../core/config.js';
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

    console.log('\n📊 Status Report\n');
    console.log('━'.repeat(60));
    console.log('Configuration:');
    console.log(`  - Preset: ${config.preset}`);
    console.log(`  - Enabled: ${config.enabled ? '✅' : '❌'}`);
    if (config.preset === 'folder-based') {
      const folderConfig = config as FolderBasedConfig;
      console.log(`  - Depth: ${folderConfig.depth}`);
      console.log(`  - Ignored paths: ${folderConfig.ignorePaths.length} entries`);
    }
    console.log(`  - Log file: ${config.logFile}`);
    console.log('━'.repeat(60));
    console.log('Git Status:');
    console.log(`  - Current branch: ${status.current || 'unknown'}`);
    console.log(`  - Staged files: ${stagedFiles.length}`);
    console.log(`  - Modified files: ${status.modified.length}`);
    console.log(`  - Untracked files: ${status.not_added.length}`);
    console.log('━'.repeat(60));

    if (stagedFiles.length > 0) {
      console.log('Staged files:');
      stagedFiles.forEach(f => console.log(`  - ${f}`));
      console.log('━'.repeat(60));
    }

    console.log('\n');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}
