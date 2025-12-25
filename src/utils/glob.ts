/**
 * Simple glob pattern matching utilities
 * Supports: *, **, ?, and exact matching
 */

/**
 * Convert a simple glob pattern to a regular expression
 * Supports:
 *   - * : matches any characters except /
 *   - ** : matches any characters including /
 *   - ? : matches any single character except /
 *   - exact match
 *
 * @param pattern - Glob pattern
 * @returns Regular expression
 */
function globToRegex(pattern: string): RegExp {
  // Escape special regex characters except * and ?
  let regexStr = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    // Handle ** (match anything including /)
    .replace(/\*\*/g, '{{GLOBSTAR}}')
    // Handle * (match anything except /)
    .replace(/\*/g, '[^/]*')
    // Handle ? (match single char except /)
    .replace(/\?/g, '[^/]')
    // Replace placeholder with actual globstar pattern
    .replace(/{{GLOBSTAR}}/g, '.*');

  return new RegExp(`^${regexStr}$`);
}

/**
 * Check if a path matches a glob pattern
 * @param path - File path to check
 * @param pattern - Glob pattern
 * @returns true if path matches pattern
 */
export function matchGlob(path: string, pattern: string): boolean {
  // Normalize path separators
  const normalizedPath = path.replace(/\\/g, '/');
  const normalizedPattern = pattern.replace(/\\/g, '/');

  // Direct match (for backwards compatibility)
  if (normalizedPath === normalizedPattern) {
    return true;
  }

  // Directory prefix match (e.g., "src" matches "src/file.ts")
  if (!normalizedPattern.includes('*') && !normalizedPattern.includes('?')) {
    return normalizedPath === normalizedPattern ||
           normalizedPath.startsWith(normalizedPattern + '/');
  }

  // Glob pattern match
  const regex = globToRegex(normalizedPattern);
  return regex.test(normalizedPath);
}

/**
 * Check if a path matches any of the given patterns
 * @param path - File path to check
 * @param patterns - Array of glob patterns
 * @returns true if path matches any pattern
 */
export function matchAnyGlob(path: string, patterns: string[]): boolean {
  return patterns.some(pattern => matchGlob(path, pattern));
}

