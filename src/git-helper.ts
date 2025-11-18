import { simpleGit, SimpleGit } from 'simple-git';

/**
 * Get staged files with duplicates removed
 */
export async function getStagedFiles(git: SimpleGit = simpleGit()): Promise<string[]> {
  const status = await git.status();
  return Array.from(new Set([
    ...status.staged,
    ...status.created,
    ...status.renamed.map(r => r.to)
  ]));
}

/**
 * Get path depth (number of directory levels)
 * Examples:
 *   "file.ts" -> 0
 *   "src/file.ts" -> 1
 *   "src/components/Button.tsx" -> 2
 */
export function getPathDepth(filePath: string): number {
  const parts = filePath.split('/');
  // If last part is a file, depth is parts.length - 1
  return Math.max(0, parts.length - 1);
}

/**
 * Get minimum depth among files
 */
export function getMinDepth(files: string[]): number {
  if (files.length === 0) return 0;
  return Math.min(...files.map(getPathDepth));
}
