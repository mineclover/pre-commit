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

export type {
  PropertyDefinition,
  PresetPropertySchema,
  PropertyValidationResult,
  ValidationOptions,
  PropertyRegistryOptions,
  PropertyMetadata,
  PropertyType,
} from './property-types.js';

// Registry
export { DynamicPresetRegistry, createRegistry } from './registry.js';

// Property Registry
export {
  ConfigPropertyRegistry,
  createPropertyRegistry,
  getGlobalPropertyRegistry,
  setGlobalPropertyRegistry,
} from './property-registry.js';

// Discovery
export { PresetDiscovery, createDiscovery, discoverPresets } from './discovery.js';

// Built-in Schemas
export {
  BASE_PROPERTIES,
  FOLDER_BASED_SCHEMA,
  CONVENTIONAL_COMMITS_SCHEMA,
  BUILTIN_SCHEMAS,
  getBuiltinSchema,
  getPropertyCategories,
  getPropertiesByCategory,
} from './preset-schemas.js';

// Convenience: Initialize global registry with built-in schemas
import { BUILTIN_SCHEMAS as schemas } from './preset-schemas.js';
import { getGlobalPropertyRegistry } from './property-registry.js';
import type { PropertyValidationResult } from './property-types.js';

/**
 * Initialize the global property registry with built-in schemas
 * Call this at application startup to enable config validation
 */
export function initializePropertyRegistry(): void {
  const registry = getGlobalPropertyRegistry();
  for (const schema of schemas) {
    registry.registerSchema(schema);
  }
}

/**
 * Validate config using the global property registry
 * @param preset - Preset name
 * @param config - Config object to validate
 * @returns Validation result
 */
export function validateConfigWithRegistry(
  preset: string,
  config: Record<string, unknown>
): PropertyValidationResult {
  const registry = getGlobalPropertyRegistry();
  return registry.validate(preset, config);
}
