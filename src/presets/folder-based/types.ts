import type { BaseConfig } from '../../core/types.js';

/**
 * Folder-based preset configuration
 */
export interface FolderBasedConfig extends BaseConfig {
  preset: 'folder-based';
  depth: number;          // Folder path depth (1-10)
  ignorePaths: string[];  // Paths to ignore from validation
  maxFiles?: number;      // Maximum files per commit
}
