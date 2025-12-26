/**
 * @module core/registry/preset-schemas
 * @description Built-in property schemas for core presets
 */

import type { PresetPropertySchema, PropertyDefinition } from './property-types.js';

/**
 * Common base config properties shared by all presets
 */
export const BASE_PROPERTIES: Record<string, PropertyDefinition> = {
  preset: {
    name: 'preset',
    type: 'string',
    description: 'Preset to use for validation',
    required: true,
    examples: ['folder-based', 'conventional-commits'],
  },
  enabled: {
    name: 'enabled',
    type: 'boolean',
    description: 'Whether hooks are enabled',
    default: true,
  },
  logFile: {
    name: 'logFile',
    type: 'string',
    description: 'Path to log file for violations',
    default: '.commit-logs/violations.log',
    examples: ['.commit-logs/violations.log', 'logs/precommit.log'],
  },
  logMaxAgeHours: {
    name: 'logMaxAgeHours',
    type: 'number',
    description: 'Maximum age of log files in hours before cleanup',
    min: 1,
    max: 8760, // 1 year
    examples: [24, 168, 720],
  },
  language: {
    name: 'language',
    type: 'enum',
    description: 'Language for messages',
    enum: ['en', 'ko'],
    default: 'en',
  },
  verbose: {
    name: 'verbose',
    type: 'boolean',
    description: 'Enable verbose output',
    default: false,
  },
};

/**
 * Folder-based preset property schema
 */
export const FOLDER_BASED_SCHEMA: PresetPropertySchema = {
  preset: 'folder-based',
  version: '1.0.0',
  properties: {
    ...BASE_PROPERTIES,
    depth: {
      name: 'depth',
      type: 'number',
      description: 'Folder path depth level (1-10) or use string "auto" for automatic detection',
      default: 3,
      min: 1,
      max: 10,
      examples: [1, 2, 3],
      category: 'validation',
    },
    ignorePaths: {
      name: 'ignorePaths',
      type: 'array',
      description: 'Paths to ignore from validation (glob patterns supported)',
      default: [],
      items: {
        name: 'path',
        type: 'string',
        description: 'Path or glob pattern to ignore',
      },
      examples: [
        ['package.json', 'README.md'],
        ['*.md', 'package*.json'],
        ['dist', 'node_modules'],
      ],
      category: 'filtering',
    },
    maxFiles: {
      name: 'maxFiles',
      type: 'number',
      description: 'Maximum number of files allowed per commit',
      min: 1,
      max: 1000,
      default: 100,
      examples: [50, 100, 200],
      category: 'limits',
    },
    depthOverrides: {
      name: 'depthOverrides',
      type: 'object',
      description: 'Path-specific depth overrides (path prefix -> depth)',
      properties: {},
      examples: [
        { 'src/hooks': 2, 'src/presets': 3 },
        { '.husky': 1, 'scripts': 1 },
      ],
      category: 'validation',
    },
    maxDepth: {
      name: 'maxDepth',
      type: 'number',
      description: 'Maximum depth when using "auto" mode',
      default: 5,
      min: 1,
      max: 10,
      category: 'validation',
    },
  },
  additionalProperties: false,
};

/**
 * Conventional commits preset property schema
 */
export const CONVENTIONAL_COMMITS_SCHEMA: PresetPropertySchema = {
  preset: 'conventional-commits',
  version: '1.0.0',
  properties: {
    ...BASE_PROPERTIES,
    types: {
      name: 'types',
      type: 'array',
      description: 'Allowed commit types',
      default: ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore'],
      items: {
        name: 'type',
        type: 'string',
        description: 'Commit type',
      },
      examples: [
        ['feat', 'fix', 'docs'],
        ['feature', 'bugfix', 'hotfix', 'chore'],
      ],
      category: 'commit-message',
    },
    scopes: {
      name: 'scopes',
      type: 'array',
      description: 'Allowed scopes (empty for any scope)',
      default: [],
      items: {
        name: 'scope',
        type: 'string',
        description: 'Scope name',
      },
      examples: [
        ['core', 'cli', 'api'],
        ['frontend', 'backend', 'shared'],
      ],
      category: 'commit-message',
    },
    requireScope: {
      name: 'requireScope',
      type: 'boolean',
      description: 'Whether scope is required in commit message',
      default: false,
      category: 'commit-message',
    },
    requireBody: {
      name: 'requireBody',
      type: 'boolean',
      description: 'Whether commit body is required',
      default: false,
      category: 'commit-message',
    },
    maxHeaderLength: {
      name: 'maxHeaderLength',
      type: 'number',
      description: 'Maximum length of commit header',
      default: 100,
      min: 20,
      max: 200,
      category: 'commit-message',
    },
    allowBreakingChange: {
      name: 'allowBreakingChange',
      type: 'boolean',
      description: 'Whether BREAKING CHANGE footer is allowed',
      default: true,
      category: 'commit-message',
    },
  },
  additionalProperties: false,
};

/**
 * All built-in preset schemas
 */
export const BUILTIN_SCHEMAS: PresetPropertySchema[] = [
  FOLDER_BASED_SCHEMA,
  CONVENTIONAL_COMMITS_SCHEMA,
];

/**
 * Get schema for a preset by name
 */
export function getBuiltinSchema(preset: string): PresetPropertySchema | undefined {
  return BUILTIN_SCHEMAS.find(s => s.preset === preset);
}

/**
 * Get all property categories for a preset
 */
export function getPropertyCategories(schema: PresetPropertySchema): string[] {
  const categories = new Set<string>();
  for (const prop of Object.values(schema.properties)) {
    if (prop.category) {
      categories.add(prop.category);
    }
  }
  return Array.from(categories);
}

/**
 * Get properties by category
 */
export function getPropertiesByCategory(
  schema: PresetPropertySchema,
  category: string
): PropertyDefinition[] {
  return Object.values(schema.properties).filter(p => p.category === category);
}
