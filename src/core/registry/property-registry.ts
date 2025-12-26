/**
 * @module core/registry/property-registry
 * @description Centralized registry for preset configuration properties
 */

import type {
  PropertyDefinition,
  PresetPropertySchema,
  PropertyValidationResult,
  ValidationOptions,
  PropertyRegistryOptions,
  PropertyMetadata,
  PropertyType,
} from './property-types.js';

/**
 * Centralized registry for managing preset configuration properties
 *
 * Provides:
 * - Property registration per preset
 * - Validation with type coercion
 * - Default value resolution
 * - Schema generation for documentation
 *
 * @example
 * ```typescript
 * const registry = new ConfigPropertyRegistry();
 *
 * // Register properties for a preset
 * registry.registerSchema({
 *   preset: 'folder-based',
 *   properties: {
 *     depth: { type: 'number', default: 3, min: 1, max: 10 },
 *     ignorePaths: { type: 'array', items: { type: 'string' } }
 *   }
 * });
 *
 * // Validate config
 * const result = registry.validate('folder-based', { depth: 5 });
 * ```
 */
export class ConfigPropertyRegistry {
  private readonly schemas = new Map<string, PresetPropertySchema>();
  private readonly options: Required<PropertyRegistryOptions>;

  constructor(options: PropertyRegistryOptions = {}) {
    this.options = {
      autoValidate: options.autoValidate ?? true,
      strict: options.strict ?? false,
    };
  }

  /**
   * Register a property schema for a preset
   */
  registerSchema(schema: PresetPropertySchema): void {
    this.schemas.set(schema.preset, schema);
  }

  /**
   * Register individual properties for a preset
   */
  registerProperties(
    preset: string,
    properties: Record<string, PropertyDefinition>
  ): void {
    const existing = this.schemas.get(preset);
    if (existing) {
      existing.properties = { ...existing.properties, ...properties };
    } else {
      this.schemas.set(preset, {
        preset,
        properties,
        additionalProperties: true,
      });
    }
  }

  /**
   * Register a single property for a preset
   */
  registerProperty(
    preset: string,
    name: string,
    definition: PropertyDefinition
  ): void {
    this.registerProperties(preset, { [name]: { ...definition, name } });
  }

  /**
   * Get schema for a preset
   */
  getSchema(preset: string): PresetPropertySchema | undefined {
    return this.schemas.get(preset);
  }

  /**
   * Get all registered presets
   */
  listPresets(): string[] {
    return Array.from(this.schemas.keys());
  }

  /**
   * Get property definition
   */
  getProperty(preset: string, name: string): PropertyDefinition | undefined {
    return this.schemas.get(preset)?.properties[name];
  }

  /**
   * Get all properties for a preset
   */
  getProperties(preset: string): Record<string, PropertyDefinition> {
    return this.schemas.get(preset)?.properties || {};
  }

  /**
   * Validate configuration against registered schema
   */
  validate(
    preset: string,
    config: Record<string, unknown>,
    options: ValidationOptions = {}
  ): PropertyValidationResult {
    const schema = this.schemas.get(preset);
    const result: PropertyValidationResult = {
      valid: true,
      errors: {},
      warnings: {},
    };

    if (!schema) {
      // No schema registered - allow all
      return result;
    }

    const opts: Required<ValidationOptions> = {
      coerce: options.coerce ?? true,
      allowUnknown: options.allowUnknown ?? schema.additionalProperties ?? true,
      applyDefaults: options.applyDefaults ?? true,
      strict: options.strict ?? this.options.strict,
    };

    const coerced: Record<string, unknown> = {};

    // Validate each defined property
    for (const [name, def] of Object.entries(schema.properties)) {
      const value = config[name];
      const path = name;

      // Check required
      if (def.required && value === undefined) {
        this.addError(result, path, `Required property '${name}' is missing`);
        continue;
      }

      // Apply default
      if (value === undefined && opts.applyDefaults && def.default !== undefined) {
        coerced[name] = def.default;
        continue;
      }

      if (value === undefined) {
        continue;
      }

      // Validate and coerce
      const validated = this.validateProperty(def, value, path, opts);
      if (validated.error) {
        this.addError(result, path, validated.error);
      }
      if (validated.warning) {
        this.addWarning(result, path, validated.warning);
      }
      if (validated.coerced !== undefined) {
        coerced[name] = validated.coerced;
      } else {
        coerced[name] = value;
      }
    }

    // Check for unknown properties
    if (!opts.allowUnknown) {
      for (const key of Object.keys(config)) {
        if (!schema.properties[key]) {
          this.addWarning(result, key, `Unknown property '${key}'`);
        }
      }
    }

    // Treat warnings as errors in strict mode
    if (opts.strict) {
      for (const [path, warnings] of Object.entries(result.warnings)) {
        result.errors[path] = [...(result.errors[path] || []), ...warnings];
      }
      result.warnings = {};
    }

    result.valid = Object.keys(result.errors).length === 0;
    result.coerced = coerced;

    return result;
  }

  /**
   * Apply defaults to a config
   */
  applyDefaults(
    preset: string,
    config: Record<string, unknown>
  ): Record<string, unknown> {
    const schema = this.schemas.get(preset);
    if (!schema) {
      return config;
    }

    const result = { ...config };

    for (const [name, def] of Object.entries(schema.properties)) {
      if (result[name] === undefined && def.default !== undefined) {
        result[name] = def.default;
      }
    }

    return result;
  }

  /**
   * Get all property metadata for documentation
   */
  getMetadata(preset?: string): PropertyMetadata[] {
    const metadata: PropertyMetadata[] = [];

    const presets = preset ? [preset] : this.listPresets();

    for (const presetName of presets) {
      const schema = this.schemas.get(presetName);
      if (!schema) continue;

      for (const [name, def] of Object.entries(schema.properties)) {
        metadata.push({
          path: name,
          definition: def,
          preset: presetName,
          resolvedDefault: def.default,
        });
      }
    }

    return metadata;
  }

  /**
   * Generate JSON Schema for a preset
   */
  toJsonSchema(preset: string): object | null {
    const schema = this.schemas.get(preset);
    if (!schema) return null;

    const properties: Record<string, object> = {};
    const required: string[] = [];

    for (const [name, def] of Object.entries(schema.properties)) {
      properties[name] = this.propertyToJsonSchema(def);
      if (def.required) {
        required.push(name);
      }
    }

    return {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties,
      required: required.length > 0 ? required : undefined,
      additionalProperties: schema.additionalProperties,
    };
  }

  /**
   * Clear all registered schemas
   */
  clear(): void {
    this.schemas.clear();
  }

  /**
   * Validate a single property value
   */
  private validateProperty(
    def: PropertyDefinition,
    value: unknown,
    path: string,
    opts: Required<ValidationOptions>
  ): { error?: string; warning?: string; coerced?: unknown } {
    // Check deprecated
    if (def.deprecated) {
      return {
        warning: `Property '${path}' is deprecated: ${def.deprecated}`,
        coerced: value,
      };
    }

    // Type validation and coercion
    const typeResult = this.validateType(def, value, opts.coerce);
    if (typeResult.error) {
      return typeResult;
    }

    const coerced = typeResult.coerced ?? value;

    // Enum validation
    if (def.enum && !def.enum.includes(coerced as never)) {
      return {
        error: `Value must be one of: ${def.enum.join(', ')}`,
      };
    }

    // Number constraints
    if (def.type === 'number' && typeof coerced === 'number') {
      if (def.min !== undefined && coerced < def.min) {
        return { error: `Value must be >= ${def.min}` };
      }
      if (def.max !== undefined && coerced > def.max) {
        return { error: `Value must be <= ${def.max}` };
      }
    }

    // String constraints
    if (def.type === 'string' && typeof coerced === 'string') {
      if (def.minLength !== undefined && coerced.length < def.minLength) {
        return { error: `Length must be >= ${def.minLength}` };
      }
      if (def.maxLength !== undefined && coerced.length > def.maxLength) {
        return { error: `Length must be <= ${def.maxLength}` };
      }
      if (def.pattern) {
        const regex = new RegExp(def.pattern);
        if (!regex.test(coerced)) {
          return { error: `Value must match pattern: ${def.pattern}` };
        }
      }
    }

    // Array constraints
    if (def.type === 'array' && Array.isArray(coerced)) {
      if (def.minLength !== undefined && coerced.length < def.minLength) {
        return { error: `Array must have >= ${def.minLength} items` };
      }
      if (def.maxLength !== undefined && coerced.length > def.maxLength) {
        return { error: `Array must have <= ${def.maxLength} items` };
      }
    }

    // Custom validation
    if (def.validate) {
      const customResult = def.validate(coerced);
      if (customResult !== true) {
        return {
          error: typeof customResult === 'string' ? customResult : 'Validation failed',
        };
      }
    }

    return { coerced };
  }

  /**
   * Validate and optionally coerce type
   */
  private validateType(
    def: PropertyDefinition,
    value: unknown,
    coerce: boolean
  ): { error?: string; coerced?: unknown } {
    const expectedType = def.type;
    const actualType = this.getValueType(value);

    // Enum type allows any primitive that matches one of the enum values
    // The actual enum value check happens in validateProperty
    if (expectedType === 'enum') {
      return { coerced: value };
    }

    if (actualType === expectedType) {
      return { coerced: value };
    }

    // Attempt coercion
    if (coerce) {
      const coerced = this.coerceValue(value, expectedType);
      if (coerced !== undefined) {
        return { coerced };
      }
    }

    return {
      error: `Expected ${expectedType} but got ${actualType}`,
    };
  }

  /**
   * Get the type of a value
   */
  private getValueType(value: unknown): PropertyType {
    if (value === null) return 'object';
    if (Array.isArray(value)) return 'array';
    return typeof value as PropertyType;
  }

  /**
   * Attempt to coerce a value to the expected type
   */
  private coerceValue(value: unknown, targetType: PropertyType): unknown {
    switch (targetType) {
      case 'string':
        if (typeof value === 'number' || typeof value === 'boolean') {
          return String(value);
        }
        break;
      case 'number':
        if (typeof value === 'string') {
          const num = Number(value);
          if (!isNaN(num)) return num;
        }
        break;
      case 'boolean':
        if (value === 'true' || value === 1) return true;
        if (value === 'false' || value === 0) return false;
        break;
      case 'array':
        if (!Array.isArray(value)) {
          return [value];
        }
        break;
    }
    return undefined;
  }

  /**
   * Convert property definition to JSON Schema
   */
  private propertyToJsonSchema(def: PropertyDefinition): object {
    const schema: Record<string, unknown> = {
      description: def.description,
    };

    switch (def.type) {
      case 'string':
        schema.type = 'string';
        if (def.pattern) schema.pattern = def.pattern;
        if (def.minLength) schema.minLength = def.minLength;
        if (def.maxLength) schema.maxLength = def.maxLength;
        break;
      case 'number':
        schema.type = 'number';
        if (def.min !== undefined) schema.minimum = def.min;
        if (def.max !== undefined) schema.maximum = def.max;
        break;
      case 'boolean':
        schema.type = 'boolean';
        break;
      case 'array':
        schema.type = 'array';
        if (def.items) {
          schema.items = this.propertyToJsonSchema(def.items);
        }
        if (def.minLength) schema.minItems = def.minLength;
        if (def.maxLength) schema.maxItems = def.maxLength;
        break;
      case 'object':
        schema.type = 'object';
        if (def.properties) {
          schema.properties = Object.fromEntries(
            Object.entries(def.properties).map(([k, v]) => [
              k,
              this.propertyToJsonSchema(v),
            ])
          );
        }
        break;
      case 'enum':
        schema.enum = def.enum;
        break;
    }

    if (def.default !== undefined) {
      schema.default = def.default;
    }

    if (def.examples) {
      schema.examples = def.examples;
    }

    if (def.deprecated) {
      schema.deprecated = true;
    }

    return schema;
  }

  /**
   * Add error to result
   */
  private addError(
    result: PropertyValidationResult,
    path: string,
    message: string
  ): void {
    if (!result.errors[path]) {
      result.errors[path] = [];
    }
    result.errors[path].push(message);
  }

  /**
   * Add warning to result
   */
  private addWarning(
    result: PropertyValidationResult,
    path: string,
    message: string
  ): void {
    if (!result.warnings[path]) {
      result.warnings[path] = [];
    }
    result.warnings[path].push(message);
  }
}

/**
 * Create a new property registry
 */
export function createPropertyRegistry(
  options?: PropertyRegistryOptions
): ConfigPropertyRegistry {
  return new ConfigPropertyRegistry(options);
}

/**
 * Global property registry instance
 */
let globalPropertyRegistry: ConfigPropertyRegistry | null = null;

/**
 * Get the global property registry
 */
export function getGlobalPropertyRegistry(): ConfigPropertyRegistry {
  if (!globalPropertyRegistry) {
    globalPropertyRegistry = new ConfigPropertyRegistry();
  }
  return globalPropertyRegistry;
}

/**
 * Set the global property registry
 */
export function setGlobalPropertyRegistry(
  registry: ConfigPropertyRegistry
): void {
  globalPropertyRegistry = registry;
}
