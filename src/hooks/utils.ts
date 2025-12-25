/**
 * Shared utilities for git hooks
 */

import { loadConfig, type Config } from '../core/config.js';

export interface HookContext {
  config: Config;
  commitMsgFile?: string;
}

/**
 * Initialize hook context with config
 * Returns null if hook should exit early (disabled)
 */
export function initHook(): HookContext | null {
  const config = loadConfig();

  if (!config.enabled) {
    return null;
  }

  return { config };
}

/**
 * Handle hook errors consistently
 * @param hookName - Name of the hook for error messages
 * @param error - The error that occurred
 * @param blocking - If true, exit with code 1; if false, exit with code 0
 */
export function handleHookError(hookName: string, error: unknown, blocking: boolean = true): never {
  const prefix = blocking ? '❌' : '⚠️ ';
  const label = blocking ? 'Error' : 'Warning';
  console.error(`${prefix} ${label} in ${hookName}:`, error);
  process.exit(blocking ? 1 : 0);
}

/**
 * Exit hook successfully
 */
export function exitSuccess(): never {
  process.exit(0);
}

/**
 * Exit hook with failure
 */
export function exitFailure(): never {
  process.exit(1);
}
