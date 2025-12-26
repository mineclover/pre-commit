/**
 * Core System
 *
 * Shared utilities and types used across the entire application
 */

// Types
export { type Language, type BaseConfig } from './types.js';
export { type Config } from './config.js';

// Core modules
export { loadConfig } from './config.js';
export { Logger } from './logger.js';
export { getMessages, formatMessage } from './messages.js';
export { getStagedFiles } from './git-helper.js';
export { CommitValidator } from './validator.js';

// Constants
export * from './constants.js';

// Utilities
export * from './utils/index.js';

// Error classes
export * from './errors.js';

// Plugin system
export * from './plugin/index.js';

// Dynamic registry
export * from './registry/index.js';

// Validation pipeline
export * from './pipeline/index.js';

// Extended config
export * from './config/index.js';
