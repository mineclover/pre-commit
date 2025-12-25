/**
 * @module core/registry
 * @description Dynamic preset registry with auto-discovery
 *
 * This module provides a dynamic registry for managing presets with:
 * - On-demand loading of external presets
 * - Auto-discovery of installed preset plugins
 * - Lifecycle management for presets
 *
 * @example
 * ```typescript
 * import { DynamicPresetRegistry, discoverPresets } from './registry';
 *
 * // Create registry
 * const registry = new DynamicPresetRegistry();
 *
 * // Register builtin presets
 * registry.register('folder-based', folderBasedPreset, 'builtin');
 *
 * // Discover and register external presets
 * const discovered = discoverPresets();
 * for (const preset of discovered) {
 *   await registry.get(preset.name);
 * }
 *
 * // Use presets
 * const preset = await registry.get('folder-based');
 * const result = preset.validateFiles(files, config);
 * ```
 */

// Types
export type {
  RegistryEntry,
  RegistryOptions,
  DiscoveryOptions,
  DiscoveredPreset,
} from './types.js';

// Registry
export { DynamicPresetRegistry, createRegistry } from './registry.js';

// Discovery
export { PresetDiscovery, createDiscovery, discoverPresets } from './discovery.js';
