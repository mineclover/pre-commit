// Default configuration values
export const DEFAULT_DEPTH = 2;
export const DEFAULT_LOG_FILE = '.commit-logs/violations.log';
export const DEFAULT_MAX_FILES = 100;
export const DEFAULT_LOG_MAX_AGE_HOURS = 24;
export const DEFAULT_LANGUAGE = 'en' as const;

// Validation limits
export const MIN_DEPTH = 1;
export const MAX_DEPTH = 10;
export const MIN_MAX_FILES = 1;
export const MAX_MAX_FILES = 1000;

// CLI output
export const SEPARATOR_WIDTH = 60;
export const SEPARATOR_CHAR = '━';

// Commit prefixes
export const PREFIX_CONFIG = '[config]';
export const PREFIX_ROOT = '[root]';

// Hook files
export const HUSKY_DIR = '.husky';
export const HOOKS = {
  'pre-commit': 'node dist/pre-commit.js',
  'prepare-commit-msg': 'node dist/prepare-commit-msg.js "$1" "$2" "$3"',
  'post-commit': 'node dist/post-commit.js'
} as const;

// Config file
export const CONFIG_FILE = '.precommitrc.json';
