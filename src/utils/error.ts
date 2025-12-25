/**
 * Unified error handling utilities
 */

/**
 * Extract error message from unknown error type
 * @param error - The caught error (unknown type)
 * @returns Human-readable error message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error occurred';
}

/**
 * Check if error is a Node.js filesystem error with a code
 */
function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}

/**
 * Check if error is a "file not found" error
 */
export function isFileNotFoundError(error: unknown): boolean {
  return isNodeError(error) && error.code === 'ENOENT';
}

/**
 * Handle error and exit process
 * @param error - The caught error
 * @param context - Context description for the error message
 * @param exitCode - Process exit code (default: 1)
 */
export function handleFatalError(error: unknown, context: string, exitCode: number = 1): never {
  const message = getErrorMessage(error);
  console.error(`❌ ${context}: ${message}`);
  process.exit(exitCode);
}

/**
 * Log warning without exiting
 * @param error - The caught error
 * @param context - Context description for the warning
 */
export function handleWarning(error: unknown, context: string): void {
  const message = getErrorMessage(error);
  console.error(`⚠️  ${context}: ${message}`);
}
