/**
 * @module git-helper
 * @description Git utility functions for working with staged files and paths
 *
 * This module provides helper functions for interacting with Git,
 * including retrieving staged files and analyzing file path depths.
 */

import { simpleGit, SimpleGit } from 'simple-git';

/**
 * Get staged files with duplicates removed
 *
 * Retrieves all files that are staged for commit, including newly created
 * and renamed files. Automatically removes duplicates from the list.
 *
 * @param git - SimpleGit instance (defaults to new instance)
 * @returns Promise resolving to array of unique staged file paths
 *
 * @example
 * const files = await getStagedFiles();
 * console.log(files); // ["src/core/config.ts", "src/core/types.ts"]
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
 *
 * Finds the shallowest file path depth in the given list of files.
 * Returns 0 if the file list is empty.
 *
 * @param files - Array of file paths
 * @returns Minimum depth level (0 if empty)
 *
 * @example
 * getMinDepth(['src/file.ts', 'src/core/types.ts']);
 * // Returns: 1
 *
 * @example
 * getMinDepth(['README.md', 'src/core/types.ts']);
 * // Returns: 0
 */
export function getMinDepth(files: string[]): number {
  if (files.length === 0) return 0;
  return Math.min(...files.map(getPathDepth));
}
