/**
 * Path manipulation utilities
 * Centralized path-related operations for consistency
 */

/**
 * Get path prefix up to specified depth
 * @example
 * getPathPrefix("src/components/Button/index.ts", 2) // "src/components"
 * getPathPrefix("file.ts", 2) // "" (root file)
 * getPathPrefix("src/file.ts", 2) // "src"
 */
export function getPathPrefix(filePath: string, depth: number): string {
  const parts = filePath.split('/');
  const actualDepth = Math.min(parts.length - 1, depth); // -1 because last is filename

  if (actualDepth === 0) {
    return ''; // Root file
  }

  return parts.slice(0, actualDepth).join('/');
}

/**
 * Get the depth of a file path
 * @example
 * getPathDepth("src/components/Button.tsx") // 2
 * getPathDepth("README.md") // 0
 */
export function getPathDepth(filePath: string): number {
  const parts = filePath.split('/');
  return Math.max(0, parts.length - 1); // -1 for filename
}

/**
 * Check if a file matches an ignore pattern
 * @param filePath File path to check
 * @param ignorePaths Array of paths/patterns to ignore
 */
export function shouldIgnoreFile(filePath: string, ignorePaths: string[]): boolean {
  return ignorePaths.some(ignorePath => {
    return filePath === ignorePath || filePath.startsWith(ignorePath + '/');
  });
}

/**
 * Filter out ignored files from a list
 */
export function filterIgnoredFiles(files: string[], ignorePaths: string[]): string[] {
  return files.filter(file => !shouldIgnoreFile(file, ignorePaths));
}

/**
 * Find the longest matching path prefix for a file
 * Used for depthOverrides matching
 */
export function findLongestMatchingPrefix(
  filePath: string,
  prefixes: string[]
): string | null {
  let longestMatch: string | null = null;
  let maxLength = 0;

  for (const prefix of prefixes) {
    if (filePath.startsWith(prefix + '/') || filePath.startsWith(prefix)) {
      if (prefix.length > maxLength) {
        longestMatch = prefix;
        maxLength = prefix.length;
      }
    }
  }

  return longestMatch;
}

/**
 * Normalize path separators (handle Windows paths)
 */
export function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

/**
 * Check if path is a root-level file (no directories)
 */
export function isRootFile(filePath: string): boolean {
  return !filePath.includes('/');
}
