/**
 * @module core/registry/property-types
 * @description Type definitions for the configuration property registry
 */

/**
 * Supported property value types
 */
export type PropertyType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'array'
  | 'object'
  | 'enum';

/**
 * Property definition with full metadata
 */
export interface PropertyDefinition<T = unknown> {
  /** Property name (key in config) */
  name: string;
  /** Value type */
  type: PropertyType;
  /** Human-readable description */
  description: string;
  /** Default value */
  default?: T;
  /** Whether the property is required */
  required?: boolean;
  /** Allowed values for enum type */
  enum?: T[];
  /** Minimum value for number type */
  min?: number;
  /** Maximum value for number type */
  max?: number;
  /** Minimum length for string/array type */
  minLength?: number;
  /** Maximum length for string/array type */
  maxLength?: number;
  /** Regex pattern for string type */
  pattern?: string;
  /** Item type for array type */
  items?: PropertyDefinition;
  /** Nested properties for object type */
  properties?: Record<string, PropertyDefinition>;
  /** Custom validation function */
  validate?: (value: T) => boolean | string;
  /** Example values for documentation */
  examples?: T[];
  /** Deprecation message if deprecated */
  deprecated?: string;
  /** Category for grouping in UI/docs */
  category?: string;
}

/**
 * Preset property schema - collection of properties for a preset
 */
export interface PresetPropertySchema {
  /** Preset name */
  preset: string;
  /** Schema version */
  version?: string;
  /** Property definitions */
  properties: Record<string, PropertyDefinition>;
  /** Additional properties allowed */
  additionalProperties?: boolean;
}

/**
 * Property validation result
 */
export interface PropertyValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Error messages by property path */
  errors: Record<string, string[]>;
  /** Warning messages by property path */
  warnings: Record<string, string[]>;
  /** Coerced/normalized values */
  coerced?: Record<string, unknown>;
}

/**
 * Options for property validation
 */
export interface ValidationOptions {
  /** Coerce values to correct types */
  coerce?: boolean;
  /** Allow unknown properties */
  allowUnknown?: boolean;
  /** Apply default values */
  applyDefaults?: boolean;
  /** Strict mode - treat warnings as errors */
  strict?: boolean;
}

/**
 * Property registry options
 */
export interface PropertyRegistryOptions {
  /** Auto-validate on config load */
  autoValidate?: boolean;
  /** Strict validation by default */
  strict?: boolean;
}

/**
 * Property metadata for documentation/UI
 */
export interface PropertyMetadata {
  /** Full property path */
  path: string;
  /** Property definition */
  definition: PropertyDefinition;
  /** Preset this property belongs to */
  preset: string;
  /** Resolved default value */
  resolvedDefault?: unknown;
}
