import { describe, it, expect } from 'vitest';
import {
  BASE_PROPERTIES,
  FOLDER_BASED_SCHEMA,
  CONVENTIONAL_COMMITS_SCHEMA,
  BUILTIN_SCHEMAS,
  getBuiltinSchema,
  getPropertyCategories,
  getPropertiesByCategory,
} from '../../../../src/core/registry/preset-schemas.js';

describe('BASE_PROPERTIES', () => {
  it('should define preset property', () => {
    expect(BASE_PROPERTIES.preset).toBeDefined();
    expect(BASE_PROPERTIES.preset.type).toBe('string');
    expect(BASE_PROPERTIES.preset.required).toBe(true);
  });

  it('should define enabled property', () => {
    expect(BASE_PROPERTIES.enabled).toBeDefined();
    expect(BASE_PROPERTIES.enabled.type).toBe('boolean');
    expect(BASE_PROPERTIES.enabled.default).toBe(true);
  });

  it('should define logFile property', () => {
    expect(BASE_PROPERTIES.logFile).toBeDefined();
    expect(BASE_PROPERTIES.logFile.type).toBe('string');
  });

  it('should define language property', () => {
    expect(BASE_PROPERTIES.language).toBeDefined();
    expect(BASE_PROPERTIES.language.type).toBe('enum');
    expect(BASE_PROPERTIES.language.enum).toContain('en');
    expect(BASE_PROPERTIES.language.enum).toContain('ko');
  });

  it('should define verbose property', () => {
    expect(BASE_PROPERTIES.verbose).toBeDefined();
    expect(BASE_PROPERTIES.verbose.type).toBe('boolean');
    expect(BASE_PROPERTIES.verbose.default).toBe(false);
  });
});

describe('FOLDER_BASED_SCHEMA', () => {
  it('should have correct preset name', () => {
    expect(FOLDER_BASED_SCHEMA.preset).toBe('folder-based');
  });

  it('should include base properties', () => {
    expect(FOLDER_BASED_SCHEMA.properties.preset).toBeDefined();
    expect(FOLDER_BASED_SCHEMA.properties.enabled).toBeDefined();
    expect(FOLDER_BASED_SCHEMA.properties.logFile).toBeDefined();
  });

  it('should define depth property', () => {
    const depth = FOLDER_BASED_SCHEMA.properties.depth;
    expect(depth).toBeDefined();
    expect(depth.type).toBe('number');
    expect(depth.default).toBe(3);
    expect(depth.min).toBe(1);
    expect(depth.max).toBe(10);
    expect(depth.category).toBe('validation');
  });

  it('should define ignorePaths property', () => {
    const ignorePaths = FOLDER_BASED_SCHEMA.properties.ignorePaths;
    expect(ignorePaths).toBeDefined();
    expect(ignorePaths.type).toBe('array');
    expect(ignorePaths.items?.type).toBe('string');
    expect(ignorePaths.category).toBe('filtering');
  });

  it('should define maxFiles property', () => {
    const maxFiles = FOLDER_BASED_SCHEMA.properties.maxFiles;
    expect(maxFiles).toBeDefined();
    expect(maxFiles.type).toBe('number');
    expect(maxFiles.min).toBe(1);
    expect(maxFiles.max).toBe(1000);
    expect(maxFiles.category).toBe('limits');
  });

  it('should define depthOverrides property', () => {
    const depthOverrides = FOLDER_BASED_SCHEMA.properties.depthOverrides;
    expect(depthOverrides).toBeDefined();
    expect(depthOverrides.type).toBe('object');
  });

  it('should define maxDepth property', () => {
    const maxDepth = FOLDER_BASED_SCHEMA.properties.maxDepth;
    expect(maxDepth).toBeDefined();
    expect(maxDepth.type).toBe('number');
    expect(maxDepth.default).toBe(5);
  });

  it('should not allow additional properties', () => {
    expect(FOLDER_BASED_SCHEMA.additionalProperties).toBe(false);
  });
});

describe('CONVENTIONAL_COMMITS_SCHEMA', () => {
  it('should have correct preset name', () => {
    expect(CONVENTIONAL_COMMITS_SCHEMA.preset).toBe('conventional-commits');
  });

  it('should include base properties', () => {
    expect(CONVENTIONAL_COMMITS_SCHEMA.properties.preset).toBeDefined();
    expect(CONVENTIONAL_COMMITS_SCHEMA.properties.enabled).toBeDefined();
  });

  it('should define types property', () => {
    const types = CONVENTIONAL_COMMITS_SCHEMA.properties.types;
    expect(types).toBeDefined();
    expect(types.type).toBe('array');
    expect(types.default).toContain('feat');
    expect(types.default).toContain('fix');
    expect(types.category).toBe('commit-message');
  });

  it('should define scopes property', () => {
    const scopes = CONVENTIONAL_COMMITS_SCHEMA.properties.scopes;
    expect(scopes).toBeDefined();
    expect(scopes.type).toBe('array');
    expect(scopes.default).toEqual([]);
  });

  it('should define requireScope property', () => {
    const requireScope = CONVENTIONAL_COMMITS_SCHEMA.properties.requireScope;
    expect(requireScope).toBeDefined();
    expect(requireScope.type).toBe('boolean');
    expect(requireScope.default).toBe(false);
  });

  it('should define maxHeaderLength property', () => {
    const maxHeaderLength = CONVENTIONAL_COMMITS_SCHEMA.properties.maxHeaderLength;
    expect(maxHeaderLength).toBeDefined();
    expect(maxHeaderLength.type).toBe('number');
    expect(maxHeaderLength.default).toBe(100);
    expect(maxHeaderLength.min).toBe(20);
    expect(maxHeaderLength.max).toBe(200);
  });
});

describe('BUILTIN_SCHEMAS', () => {
  it('should contain folder-based and conventional-commits', () => {
    const presets = BUILTIN_SCHEMAS.map(s => s.preset);
    expect(presets).toContain('folder-based');
    expect(presets).toContain('conventional-commits');
  });

  it('should have exactly 2 schemas', () => {
    expect(BUILTIN_SCHEMAS).toHaveLength(2);
  });
});

describe('getBuiltinSchema', () => {
  it('should return folder-based schema', () => {
    const schema = getBuiltinSchema('folder-based');
    expect(schema).toBe(FOLDER_BASED_SCHEMA);
  });

  it('should return conventional-commits schema', () => {
    const schema = getBuiltinSchema('conventional-commits');
    expect(schema).toBe(CONVENTIONAL_COMMITS_SCHEMA);
  });

  it('should return undefined for unknown preset', () => {
    const schema = getBuiltinSchema('unknown');
    expect(schema).toBeUndefined();
  });
});

describe('getPropertyCategories', () => {
  it('should return categories for folder-based schema', () => {
    const categories = getPropertyCategories(FOLDER_BASED_SCHEMA);
    expect(categories).toContain('validation');
    expect(categories).toContain('filtering');
    expect(categories).toContain('limits');
  });

  it('should return categories for conventional-commits schema', () => {
    const categories = getPropertyCategories(CONVENTIONAL_COMMITS_SCHEMA);
    expect(categories).toContain('commit-message');
  });
});

describe('getPropertiesByCategory', () => {
  it('should return validation properties for folder-based', () => {
    const props = getPropertiesByCategory(FOLDER_BASED_SCHEMA, 'validation');
    const names = props.map(p => p.name);
    expect(names).toContain('depth');
    expect(names).toContain('depthOverrides');
    expect(names).toContain('maxDepth');
  });

  it('should return filtering properties for folder-based', () => {
    const props = getPropertiesByCategory(FOLDER_BASED_SCHEMA, 'filtering');
    const names = props.map(p => p.name);
    expect(names).toContain('ignorePaths');
  });

  it('should return commit-message properties for conventional-commits', () => {
    const props = getPropertiesByCategory(CONVENTIONAL_COMMITS_SCHEMA, 'commit-message');
    const names = props.map(p => p.name);
    expect(names).toContain('types');
    expect(names).toContain('scopes');
    expect(names).toContain('requireScope');
  });

  it('should return empty array for unknown category', () => {
    const props = getPropertiesByCategory(FOLDER_BASED_SCHEMA, 'unknown');
    expect(props).toEqual([]);
  });
});
