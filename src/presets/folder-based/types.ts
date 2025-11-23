import type { BaseConfig } from '../../core/types.js';

/**
 * Path-specific depth override
 * Allows different depths for different paths
 *
 * @example
 * {
 *   "src/hooks": 2,          // src/hooks/* files use depth 2
 *   "src/presets": 3,        // src/presets/* files use depth 3
 *   ".husky": 1              // .husky/* files use depth 1
 * }
 */
export type DepthOverrides = Record<string, number>;

/**
 * Folder-based preset configuration
 */
export interface FolderBasedConfig extends BaseConfig {
  preset: 'folder-based';
  depth: number | 'auto';         // Folder path depth (1-10) or 'auto' for automatic detection
  ignorePaths: string[];          // Paths to ignore from validation
  maxFiles?: number;              // Maximum files per commit
  depthOverrides?: DepthOverrides; // Path-specific depth settings
  maxDepth?: number;              // Maximum depth when using 'auto' mode (default: 5)
}
