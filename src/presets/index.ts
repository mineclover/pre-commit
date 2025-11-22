/**
 * Preset System
 *
 * Central registry and exports for all available presets
 */

import { PresetRegistry } from './base/registry.js';
import { FolderBasedPreset } from './folder-based/preset.js';
import { ConventionalCommitsPreset } from './conventional-commits/preset.js';

// Register all presets
PresetRegistry.register('folder-based', new FolderBasedPreset());
PresetRegistry.register('conventional-commits', new ConventionalCommitsPreset());

// Re-export everything
export * from './base/types.js';
export * from './base/registry.js';
export { FolderBasedPreset, type FolderBasedConfig } from './folder-based/index.js';
export { ConventionalCommitsPreset, type ConventionalCommitsConfig } from './conventional-commits/index.js';
