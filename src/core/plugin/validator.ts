/**
 * @module core/plugin/validator
 * @description Plugin interface validation utilities
 */

import type { Preset } from '../../presets/base/types.js';
import type { BaseConfig } from '../types.js';
import { PluginValidationError } from '../errors.js';

/**
 * Required members for a valid preset
 */
const REQUIRED_PROPERTIES = ['name', 'description'] as const;
const REQUIRED_METHODS = ['validateFiles', 'validateCommitMessage', 'getCommitPrefix'] as const;

/**
 * Optional lifecycle methods
 */
const OPTIONAL_LIFECYCLE_METHODS = [
  'onRegister',
  'onBeforeValidate',
  'onAfterValidate',
  'onUnload',
] as const;

/**
 * Validation result for a plugin
 */
export interface ValidationResult {
  valid: boolean;
  missingProperties: string[];
  missingMethods: string[];
  warnings: string[];
}

/**
 * Validates that an object conforms to the Preset interface
 */
export class PluginValidator {
  /**
   * Validate that an object implements the Preset interface
   * @param plugin - Object to validate
   * @returns Validation result
   */
  validate(plugin: unknown): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      missingProperties: [],
      missingMethods: [],
      warnings: [],
    };

    if (!plugin || typeof plugin !== 'object') {
      result.valid = false;
      result.missingProperties = [...REQUIRED_PROPERTIES];
      result.missingMethods = [...REQUIRED_METHODS];
      return result;
    }

    // Check required properties
    for (const prop of REQUIRED_PROPERTIES) {
      if (!(prop in plugin)) {
        result.missingProperties.push(prop);
        result.valid = false;
      }
    }

    // Check required methods
    for (const method of REQUIRED_METHODS) {
      if (!(method in plugin) || typeof (plugin as Record<string, unknown>)[method] !== 'function') {
        result.missingMethods.push(method);
        result.valid = false;
      }
    }

    // Check optional lifecycle methods (generate warnings if invalid type)
    for (const method of OPTIONAL_LIFECYCLE_METHODS) {
      if (method in plugin) {
        const value = (plugin as Record<string, unknown>)[method];
        if (typeof value !== 'function') {
          result.warnings.push(`Optional method '${method}' is defined but not a function`);
        }
      }
    }

    // Validate property types
    const pluginObj = plugin as Record<string, unknown>;
    if (typeof pluginObj.name !== 'string') {
      result.warnings.push("Property 'name' should be a string");
    }
    if (typeof pluginObj.description !== 'string') {
      result.warnings.push("Property 'description' should be a string");
    }
    if ('version' in pluginObj && typeof pluginObj.version !== 'string') {
      result.warnings.push("Optional property 'version' should be a string");
    }

    return result;
  }

  /**
   * Assert that an object is a valid preset, throwing if not
   * @param plugin - Object to validate
   * @param pluginName - Name for error messages
   * @throws {PluginValidationError} If validation fails
   */
  assertValid(plugin: unknown, pluginName?: string): asserts plugin is Preset<BaseConfig> {
    const result = this.validate(plugin);

    if (!result.valid) {
      const missing = [...result.missingProperties, ...result.missingMethods];
      throw new PluginValidationError(
        `Plugin does not implement Preset interface: missing ${missing.join(', ')}`,
        pluginName,
        missing
      );
    }
  }

  /**
   * Check if an object is a valid preset
   * @param plugin - Object to check
   * @returns True if valid preset
   */
  isPreset(plugin: unknown): plugin is Preset<BaseConfig> {
    return this.validate(plugin).valid;
  }
}

/**
 * Create a new plugin validator
 */
export function createValidator(): PluginValidator {
  return new PluginValidator();
}

/**
 * Default validator instance
 */
export const defaultValidator = new PluginValidator();
