import { simpleGit, SimpleGit } from 'simple-git';

/**
 * Normalize file path to use forward slashes (cross-platform)
 * Converts Windows backslashes to forward slashes
 * @param filePath - The file path to normalize
 * @returns Normalized path with forward slashes
 */
export function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

/**
 * Get staged files with duplicates removed (cross-platform)
 * Includes staged, created, and renamed files
 * @param git - SimpleGit instance (optional, creates new one if not provided)
 * @returns Array of normalized file paths
 */
export async function getStagedFiles(git: SimpleGit = simpleGit()): Promise<string[]> {
  const status = await git.status();
  const files = Array.from(new Set([
    ...status.staged,
    ...status.created,
    ...status.renamed.map(r => r.to)
  ]));
  // Normalize paths for cross-platform compatibility
  return files.map(normalizePath);
}

/**
 * Check if commit message already has a prefix like [folder]
 * @param message - The commit message to check
 * @returns true if message starts with [prefix] format
 */
export function hasCommitPrefix(message: string): boolean {
  return /^\[[^\]]+\]\s/.test(message);
}

/**
 * Check if this is a merge commit message
 * @param message - The commit message to check
 * @returns true if message starts with "Merge "
 */
export function isMergeCommit(message: string): boolean {
  return message.startsWith('Merge ');
}
