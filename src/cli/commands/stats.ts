/**
 * Stats command - shows commit history statistics
 */

import { simpleGit } from 'simple-git';
import { CLI_DISPLAY } from '../../core/constants.js';
import {
  printHeader,
  printFooter,
  printSeparator,
  printWarning,
  printError,
} from '../../core/utils/console.js';

export async function statsCommand(): Promise<void> {
  try {
    const args = process.argv.slice(2);
    const lastIndex = args.indexOf('--last');
    const count = lastIndex !== -1 ? parseInt(args[lastIndex + 1]) || 20 : 20;

    const git = simpleGit();
    const log = await git.log({ maxCount: count });

    printHeader(`Commit Prefix Statistics (last ${count} commits)`, '📊');

    // Parse prefixes
    const prefixes: Record<string, number> = {};
    const noPrefixCommits: string[] = [];

    log.all.forEach(commit => {
      const match = commit.message.match(/^\[([^\]]+)\]/);
      if (match) {
        const prefix = match[1];
        prefixes[prefix] = (prefixes[prefix] || 0) + 1;
      } else {
        noPrefixCommits.push(commit.message.substring(0, 50));
      }
    });

    // Sort by count
    const sorted = Object.entries(prefixes).sort((a, b) => b[1] - a[1]);

    console.log('Prefix distribution:');
    sorted.forEach(([prefix, prefixCount]) => {
      const percentage = ((prefixCount / log.all.length) * 100).toFixed(1);
      const bar = '█'.repeat(Math.floor(prefixCount / CLI_DISPLAY.BAR_SCALE_FACTOR));
      console.log(`  [${prefix.padEnd(20)}] ${prefixCount.toString().padStart(3)} (${percentage}%) ${bar}`);
    });

    if (noPrefixCommits.length > 0) {
      console.log('');
      printWarning(`Commits without prefix: ${noPrefixCommits.length}`);
      if (noPrefixCommits.length <= CLI_DISPLAY.MAX_COMMITS_TO_SHOW) {
        noPrefixCommits.forEach(msg => console.log(`    - ${msg}`));
      }
    }

    printSeparator();
    console.log(`Total analyzed: ${log.all.length} commits`);
    console.log(`With prefix: ${log.all.length - noPrefixCommits.length}`);
    console.log(`Without prefix: ${noPrefixCommits.length}`);

    printFooter();
  } catch (error) {
    printError(`Error generating stats: ${error}`);
    process.exit(1);
  }
}
