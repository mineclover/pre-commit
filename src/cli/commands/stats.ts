/**
 * Stats command - shows commit history statistics
 */

import { simpleGit } from 'simple-git';
import { CLI_DISPLAY } from '../../core/constants.js';

export async function statsCommand(): Promise<void> {
  try {
    const args = process.argv.slice(2);
    const lastIndex = args.indexOf('--last');
    const count = lastIndex !== -1 ? parseInt(args[lastIndex + 1]) || 20 : 20;

    const git = simpleGit();
    const log = await git.log({ maxCount: count });

    console.log(`\n📊 Commit Prefix Statistics (last ${count} commits)\n`);
    console.log('━'.repeat(60));

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
    sorted.forEach(([prefix, count]) => {
      const percentage = ((count / log.all.length) * 100).toFixed(1);
      const bar = '█'.repeat(Math.floor(count / CLI_DISPLAY.BAR_SCALE_FACTOR));
      console.log(`  [${prefix.padEnd(20)}] ${count.toString().padStart(3)} (${percentage}%) ${bar}`);
    });

    if (noPrefixCommits.length > 0) {
      console.log(`\n⚠️  Commits without prefix: ${noPrefixCommits.length}`);
      if (noPrefixCommits.length <= CLI_DISPLAY.MAX_COMMITS_TO_SHOW) {
        noPrefixCommits.forEach(msg => console.log(`    - ${msg}`));
      }
    }

    console.log('━'.repeat(60));
    console.log(`Total analyzed: ${log.all.length} commits`);
    console.log(`With prefix: ${log.all.length - noPrefixCommits.length}`);
    console.log(`Without prefix: ${noPrefixCommits.length}`);
    console.log('━'.repeat(60) + '\n');
  } catch (error) {
    console.error('Error generating stats:', error);
    process.exit(1);
  }
}
