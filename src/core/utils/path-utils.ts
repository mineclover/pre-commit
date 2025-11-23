/**
 * Path manipulation utilities
 * Centralized path-related operations for consistency
 */

/**
 * Extract path prefix up to the specified depth level
 *
 * Returns the folder path up to the specified depth, excluding the filename.
 * If the actual path depth is less than the specified depth, returns the maximum
 * available depth. Root-level files return an empty string.
 *
 * @param filePath - The file path to process (e.g., "src/components/Button/index.ts")
 * @param depth - Number of folder levels to include (1-based)
 * @returns The path prefix, or empty string for root files
 *
 * @example
 * // With depth=2
 * getPathPrefix("src/components/Button/index.ts", 2);  // "src/components"
 * getPathPrefix("src/utils.ts", 2);                    // "src" (only 1 level available)
 * getPathPrefix("README.md", 2);                       // "" (root file)
 *
 * @example
 * // With depth=1
 * getPathPrefix("src/components/Button/index.ts", 1);  // "src"
 * getPathPrefix("dist/bundle.js", 1);                  // "dist"
 *
 * @example
 * // Edge cases
 * getPathPrefix("file.ts", 5);                         // "" (no folders)
 * getPathPrefix("a/b/c/d.ts", 10);                     // "a/b/c" (max available depth)
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
 * Calculate the folder depth of a file path
 *
 * Returns the number of folder levels in the path, excluding the filename.
 * Root-level files have depth 0.
 *
 * @param filePath - The file path to analyze
 * @returns Number of folder levels (0 for root files)
 *
 * @example
 * getPathDepth("src/components/Button.tsx");     // 2 (src/components)
 * getPathDepth("dist/bundle.js");                // 1 (dist)
 * getPathDepth("README.md");                     // 0 (root level)
 * getPathDepth("a/b/c/d/e/file.ts");            // 5 (a/b/c/d/e)
 */
export function getPathDepth(filePath: string): number {
  const parts = filePath.split('/');
  return Math.max(0, parts.length - 1); // -1 for filename
}

/**
 * Check if a file path matches any ignore pattern
 *
 * A file is considered ignored if it either:
 * 1. Exactly matches an ignore path, OR
 * 2. Is a descendant of an ignore path (starts with ignorePath + '/')
 *
 * @param filePath - The file path to check
 * @param ignorePaths - Array of paths to ignore
 * @returns True if the file should be ignored, false otherwise
 *
 * @example
 * shouldIgnoreFile("dist/bundle.js", ["dist", "node_modules"]);        // true (exact match parent)
 * shouldIgnoreFile("node_modules/lib/index.js", ["node_modules"]);     // true (descendant)
 * shouldIgnoreFile("package.json", ["package.json"]);                  // true (exact match)
 * shouldIgnoreFile("src/index.ts", ["dist"]);                          // false (no match)
 *
 * @example
 * // Edge cases
 * shouldIgnoreFile("distribution/file.js", ["dist"]);                  // false (must match exactly or be descendant)
 * shouldIgnoreFile("dist", ["dist"]);                                  // true (exact match)
 */
export function shouldIgnoreFile(filePath: string, ignorePaths: string[]): boolean {
  return ignorePaths.some(ignorePath => {
    return filePath === ignorePath || filePath.startsWith(ignorePath + '/');
  });
}

/**
 * Filter out ignored files from a file list
 *
 * Returns a new array containing only the files that don't match any ignore patterns.
 * Uses shouldIgnoreFile() internally for consistent ignore logic.
 *
 * @param files - Array of file paths to filter
 * @param ignorePaths - Array of paths to ignore
 * @returns Filtered array containing only non-ignored files
 *
 * @example
 * filterIgnoredFiles(
 *   ["src/index.ts", "dist/bundle.js", "README.md"],
 *   ["dist", "README.md"]
 * );
 * // Returns: ["src/index.ts"]
 *
 * @example
 * filterIgnoredFiles(["a.ts", "b.ts"], []);              // ["a.ts", "b.ts"] (no ignore paths)
 * filterIgnoredFiles([], ["dist"]);                      // [] (empty input)
 * filterIgnoredFiles(["dist/a.js"], ["dist"]);           // [] (all ignored)
 */
export function filterIgnoredFiles(files: string[], ignorePaths: string[]): string[] {
  return files.filter(file => !shouldIgnoreFile(file, ignorePaths));
}

/**
 * Find the longest matching path prefix from a list of prefixes
 *
 * Used for depthOverrides matching where multiple prefixes may match a file path.
 * Returns the longest (most specific) matching prefix. This ensures that more
 * specific path overrides take precedence over general ones.
 *
 * @param filePath - The file path to match against
 * @param prefixes - Array of prefix paths to check
 * @returns The longest matching prefix, or null if no match found
 *
 * @example
 * findLongestMatchingPrefix(
 *   "src/presets/folder-based/preset.ts",
 *   ["src", "src/presets", "src/presets/folder-based"]
 * );
 * // Returns: "src/presets/folder-based" (longest match)
 *
 * @example
 * findLongestMatchingPrefix(
 *   "src/hooks/pre-commit.ts",
 *   ["src/presets", "dist"]
 * );
 * // Returns: null (no match)
 *
 * @example
 * // Exact match vs prefix match
 * findLongestMatchingPrefix("src", ["src"]);              // "src" (exact match)
 * findLongestMatchingPrefix("src/file.ts", ["src"]);      // "src" (prefix match)
 * findLongestMatchingPrefix("source/file.ts", ["src"]);   // null (no match - must be exact or prefix)
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
 * Normalize path separators to forward slashes
 *
 * Converts Windows-style backslashes to Unix-style forward slashes for
 * consistent path handling across different operating systems.
 *
 * @param filePath - The file path to normalize
 * @returns Path with forward slashes only
 *
 * @example
 * normalizePath("src/components/Button.ts");       // "src/components/Button.ts" (unchanged)
 * normalizePath("src\\components\\Button.ts");     // "src/components/Button.ts" (Windows → Unix)
 * normalizePath("C:\\Users\\file.ts");             // "C:/Users/file.ts" (Windows drive)
 */
export function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

/**
 * Check if a path represents a root-level file
 *
 * A root-level file is one that has no parent directories (no '/' in the path).
 *
 * @param filePath - The file path to check
 * @returns True if the file is at root level, false otherwise
 *
 * @example
 * isRootFile("README.md");                  // true
 * isRootFile("package.json");               // true
 * isRootFile(".gitignore");                 // true
 * isRootFile("src/index.ts");               // false (has parent directory)
 * isRootFile("dist/bundle.js");             // false (has parent directory)
 */
export function isRootFile(filePath: string): boolean {
  return !filePath.includes('/');
}
