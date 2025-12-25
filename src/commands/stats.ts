import { simpleGit } from 'simple-git';
import { printHeader, printFooter, printWarning } from '../utils/console.js';
import { loadConfig } from '../config.js';
import { getMessages } from '../messages.js';

const DEFAULT_COMMIT_COUNT = 20;

function parseCommitCount(args: string[]): number {
  const lastIndex = args.indexOf('--last');
  if (lastIndex === -1 || lastIndex + 1 >= args.length) {
    return DEFAULT_COMMIT_COUNT;
  }

  const parsed = parseInt(args[lastIndex + 1], 10);
  if (isNaN(parsed) || parsed < 1) {
    return DEFAULT_COMMIT_COUNT;
  }

  return Math.min(parsed, 1000); // Cap at 1000 for performance
}

export async function statsCommand(args: string[]): Promise<void> {
  const config = loadConfig();
  const messages = getMessages(config.language);
  const count = parseCommitCount(args);

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

  console.log(`${messages.prefixDistribution}:`);
  sorted.forEach(([prefix, prefixCount]) => {
    const percentage = ((prefixCount / log.all.length) * 100).toFixed(1);
    const bar = '█'.repeat(Math.floor(prefixCount / 2));
    console.log(`  [${prefix.padEnd(20)}] ${prefixCount.toString().padStart(3)} (${percentage}%) ${bar}`);
  });

  if (noPrefixCommits.length > 0) {
    console.log('');
    printWarning(`${messages.commitsWithoutPrefix}: ${noPrefixCommits.length}`);
    if (noPrefixCommits.length <= 5) {
      noPrefixCommits.forEach(msg => console.log(`    - ${msg}`));
    }
  }

  printFooter();
  console.log(`${messages.totalAnalyzed}: ${log.all.length} commits`);
  console.log(`${messages.withPrefix}: ${log.all.length - noPrefixCommits.length}`);
  console.log(`${messages.withoutPrefix}: ${noPrefixCommits.length}`);
  printFooter();
}
