/**
 * Core System
 *
 * Shared utilities and types used across the entire application
 */

export { type Language, type BaseConfig } from './types.js';
export { loadConfig, type Config } from './config.js';
export { Logger } from './logger.js';
export { getMessages, formatMessage } from './messages.js';
export { getStagedFiles } from './git-helper.js';
export { CommitValidator } from './validator.js';
