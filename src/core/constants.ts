/**
 * Core constants for the pre-commit system
 * Centralizes all magic numbers and common strings
 */

// Depth configuration
export const DEPTH_CONSTRAINTS = {
  MIN: 1,
  MAX: 10,
  DEFAULT: 3,
  DEFAULT_MAX_DEPTH: 5,
} as const;

// File limits
export const FILE_CONSTRAINTS = {
  MIN: 1,
  MAX_FILES: 1000,
  DEFAULT_MAX_FILES: 100,
} as const;

// Commit message validation
export const COMMIT_MESSAGE = {
  MIN_DESCRIPTION_LENGTH: 3,
  PREFIX_PATTERN: /^\[([^\]]+)\]\s*(.*)$/,
} as const;

// Special commit types to skip validation
export const SPECIAL_COMMIT_TYPES = [
  'Merge ',
  'Revert ',
  'Squash ',
] as const;

// Default ignore paths
export const DEFAULT_IGNORE_PATHS = [
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  '.gitignore',
] as const;

// Log configuration
export const LOG_DEFAULTS = {
  FILE_PATH: '.commit-logs/violations.log',
  MAX_AGE_HOURS: 24,
} as const;

// Preset names
export const PRESET_NAMES = {
  FOLDER_BASED: 'folder-based',
  CONVENTIONAL_COMMITS: 'conventional-commits',
} as const;

// Special prefixes
export const SPECIAL_PREFIXES = {
  ROOT: 'root',
  CONFIG: 'config',
  META: 'meta',
} as const;

// Example path components for documentation
export const EXAMPLE_PATHS = {
  FOLDERS: ['src', 'components', 'Button', 'tests', 'hooks'] as const,
  GENERIC: ['folder', 'path', 'to', 'file'] as const,
} as const;

// CLI display limits
export const CLI_DISPLAY = {
  MAX_COMMITS_TO_SHOW: 5,
  BAR_SCALE_FACTOR: 2,
  SEPARATOR_WIDTH: 60,
  SEPARATOR_CHAR: '━',
} as const;

// Husky hooks configuration
export const HUSKY_DIR = '.husky';

export const HOOKS = {
  'pre-commit': 'node dist/hooks/pre-commit.js',
  'prepare-commit-msg': 'node dist/hooks/prepare-commit-msg.js "$1" "$2" "$3"',
  'commit-msg': 'node dist/hooks/commit-msg.js "$1"',
  'post-commit': 'node dist/hooks/post-commit.js',
} as const;

// Config file
export const CONFIG_FILE = '.precommitrc.json';
