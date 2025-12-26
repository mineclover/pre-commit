import { describe, it, expect, beforeEach } from 'vitest';
import {
  ConfigPropertyRegistry,
  createPropertyRegistry,
  getGlobalPropertyRegistry,
  setGlobalPropertyRegistry,
} from '../../../../src/core/registry/property-registry.js';
import type { PresetPropertySchema } from '../../../../src/core/registry/property-types.js';

describe('ConfigPropertyRegistry', () => {
  let registry: ConfigPropertyRegistry;

  beforeEach(() => {
    registry = new ConfigPropertyRegistry();
  });

  describe('constructor', () => {
    it('should create with default options', () => {
      const reg = new ConfigPropertyRegistry();
      expect(reg).toBeDefined();
    });

    it('should create with custom options', () => {
      const reg = new ConfigPropertyRegistry({
        autoValidate: true,
        strict: true,
      });
      expect(reg).toBeDefined();
    });
  });

  describe('registerSchema', () => {
    it('should register a schema', () => {
      const schema: PresetPropertySchema = {
        preset: 'test-preset',
        properties: {
          foo: { name: 'foo', type: 'string', description: 'Test property' },
        },
      };

      registry.registerSchema(schema);

      expect(registry.getSchema('test-preset')).toEqual(schema);
    });

    it('should overwrite existing schema', () => {
      const schema1: PresetPropertySchema = {
        preset: 'test',
        properties: { foo: { name: 'foo', type: 'string', description: 'v1' } },
      };
      const schema2: PresetPropertySchema = {
        preset: 'test',
        properties: { bar: { name: 'bar', type: 'number', description: 'v2' } },
      };

      registry.registerSchema(schema1);
      registry.registerSchema(schema2);

      expect(registry.getSchema('test')).toEqual(schema2);
    });
  });

  describe('registerProperties', () => {
    it('should register properties for new preset', () => {
      registry.registerProperties('new-preset', {
        prop1: { name: 'prop1', type: 'string', description: 'Prop 1' },
      });

      expect(registry.getProperty('new-preset', 'prop1')).toBeDefined();
    });

    it('should merge properties for existing preset', () => {
      registry.registerProperties('test', {
        prop1: { name: 'prop1', type: 'string', description: 'Prop 1' },
      });
      registry.registerProperties('test', {
        prop2: { name: 'prop2', type: 'number', description: 'Prop 2' },
      });

      expect(registry.getProperty('test', 'prop1')).toBeDefined();
      expect(registry.getProperty('test', 'prop2')).toBeDefined();
    });
  });

  describe('registerProperty', () => {
    it('should register a single property', () => {
      registry.registerProperty('test', 'myProp', {
        name: 'myProp',
        type: 'boolean',
        description: 'My property',
      });

      expect(registry.getProperty('test', 'myProp')).toBeDefined();
    });
  });

  describe('listPresets', () => {
    it('should return empty array when no presets registered', () => {
      expect(registry.listPresets()).toEqual([]);
    });

    it('should return registered preset names', () => {
      registry.registerSchema({ preset: 'a', properties: {} });
      registry.registerSchema({ preset: 'b', properties: {} });

      expect(registry.listPresets()).toEqual(['a', 'b']);
    });
  });

  describe('getProperties', () => {
    it('should return empty object for unknown preset', () => {
      expect(registry.getProperties('unknown')).toEqual({});
    });

    it('should return all properties for preset', () => {
      registry.registerSchema({
        preset: 'test',
        properties: {
          foo: { name: 'foo', type: 'string', description: 'Foo' },
          bar: { name: 'bar', type: 'number', description: 'Bar' },
        },
      });

      const props = registry.getProperties('test');
      expect(Object.keys(props)).toEqual(['foo', 'bar']);
    });
  });

  describe('validate', () => {
    beforeEach(() => {
      registry.registerSchema({
        preset: 'test',
        properties: {
          name: { name: 'name', type: 'string', description: 'Name', required: true },
          count: { name: 'count', type: 'number', description: 'Count', min: 0, max: 100 },
          enabled: { name: 'enabled', type: 'boolean', description: 'Enabled', default: true },
        },
        additionalProperties: false,
      });
    });

    it('should pass valid config', () => {
      const result = registry.validate('test', { name: 'hello', count: 50 });

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should fail on missing required property', () => {
      const result = registry.validate('test', { count: 50 });

      expect(result.valid).toBe(false);
      expect(result.errors.name).toBeDefined();
    });

    it('should fail on invalid type', () => {
      const result = registry.validate('test', { name: 123 }, { coerce: false });

      expect(result.valid).toBe(false);
      expect(result.errors.name).toBeDefined();
    });

    it('should coerce types when enabled', () => {
      const result = registry.validate('test', { name: 'test', count: '50' }, { coerce: true });

      expect(result.valid).toBe(true);
      expect(result.coerced?.count).toBe(50);
    });

    it('should fail on min constraint', () => {
      const result = registry.validate('test', { name: 'test', count: -1 });

      expect(result.valid).toBe(false);
      expect(result.errors.count).toBeDefined();
    });

    it('should fail on max constraint', () => {
      const result = registry.validate('test', { name: 'test', count: 150 });

      expect(result.valid).toBe(false);
      expect(result.errors.count).toBeDefined();
    });

    it('should apply defaults', () => {
      const result = registry.validate('test', { name: 'test' }, { applyDefaults: true });

      expect(result.valid).toBe(true);
      expect(result.coerced?.enabled).toBe(true);
    });

    it('should warn on unknown properties when not allowed', () => {
      const result = registry.validate('test', { name: 'test', unknown: 'value' });

      expect(result.warnings.unknown).toBeDefined();
    });

    it('should allow all for unknown preset', () => {
      const result = registry.validate('unknown-preset', { anything: 'goes' });

      expect(result.valid).toBe(true);
    });
  });

  describe('validate - enum type', () => {
    beforeEach(() => {
      registry.registerSchema({
        preset: 'enum-test',
        properties: {
          level: {
            name: 'level',
            type: 'enum',
            description: 'Level',
            enum: ['low', 'medium', 'high'],
          },
        },
      });
    });

    it('should pass valid enum value', () => {
      const result = registry.validate('enum-test', { level: 'medium' });
      expect(result.valid).toBe(true);
    });

    it('should fail invalid enum value', () => {
      const result = registry.validate('enum-test', { level: 'invalid' });
      expect(result.valid).toBe(false);
    });
  });

  describe('validate - string constraints', () => {
    beforeEach(() => {
      registry.registerSchema({
        preset: 'string-test',
        properties: {
          code: {
            name: 'code',
            type: 'string',
            description: 'Code',
            minLength: 3,
            maxLength: 10,
            pattern: '^[A-Z]+$',
          },
        },
      });
    });

    it('should pass valid string', () => {
      const result = registry.validate('string-test', { code: 'ABC' });
      expect(result.valid).toBe(true);
    });

    it('should fail on minLength', () => {
      const result = registry.validate('string-test', { code: 'AB' });
      expect(result.valid).toBe(false);
    });

    it('should fail on maxLength', () => {
      const result = registry.validate('string-test', { code: 'ABCDEFGHIJK' });
      expect(result.valid).toBe(false);
    });

    it('should fail on pattern', () => {
      const result = registry.validate('string-test', { code: 'abc' });
      expect(result.valid).toBe(false);
    });
  });

  describe('validate - array constraints', () => {
    beforeEach(() => {
      registry.registerSchema({
        preset: 'array-test',
        properties: {
          items: {
            name: 'items',
            type: 'array',
            description: 'Items',
            minLength: 1,
            maxLength: 5,
          },
        },
      });
    });

    it('should pass valid array', () => {
      const result = registry.validate('array-test', { items: ['a', 'b'] });
      expect(result.valid).toBe(true);
    });

    it('should fail on minLength', () => {
      const result = registry.validate('array-test', { items: [] });
      expect(result.valid).toBe(false);
    });

    it('should fail on maxLength', () => {
      const result = registry.validate('array-test', { items: [1, 2, 3, 4, 5, 6] });
      expect(result.valid).toBe(false);
    });
  });

  describe('validate - custom validator', () => {
    it('should use custom validate function', () => {
      registry.registerSchema({
        preset: 'custom-test',
        properties: {
          email: {
            name: 'email',
            type: 'string',
            description: 'Email',
            validate: (v: unknown) => {
              if (typeof v !== 'string') return 'Must be string';
              return v.includes('@') || 'Must contain @';
            },
          },
        },
      });

      expect(registry.validate('custom-test', { email: 'test@example.com' }).valid).toBe(true);
      expect(registry.validate('custom-test', { email: 'invalid' }).valid).toBe(false);
    });
  });

  describe('validate - deprecated property', () => {
    it('should warn on deprecated property', () => {
      registry.registerSchema({
        preset: 'deprecated-test',
        properties: {
          oldProp: {
            name: 'oldProp',
            type: 'string',
            description: 'Old property',
            deprecated: 'Use newProp instead',
          },
        },
      });

      const result = registry.validate('deprecated-test', { oldProp: 'value' });
      expect(result.warnings.oldProp).toBeDefined();
    });
  });

  describe('validate - strict mode', () => {
    it('should treat warnings as errors in strict mode', () => {
      registry.registerSchema({
        preset: 'strict-test',
        properties: {},
        additionalProperties: false,
      });

      const result = registry.validate(
        'strict-test',
        { unknown: 'value' },
        { strict: true }
      );

      expect(result.valid).toBe(false);
      expect(result.errors.unknown).toBeDefined();
    });
  });

  describe('applyDefaults', () => {
    it('should apply defaults to config', () => {
      registry.registerSchema({
        preset: 'defaults-test',
        properties: {
          name: { name: 'name', type: 'string', description: 'Name' },
          count: { name: 'count', type: 'number', description: 'Count', default: 10 },
          enabled: { name: 'enabled', type: 'boolean', description: 'Enabled', default: true },
        },
      });

      const config = registry.applyDefaults('defaults-test', { name: 'test' });

      expect(config).toEqual({
        name: 'test',
        count: 10,
        enabled: true,
      });
    });

    it('should not override existing values', () => {
      registry.registerSchema({
        preset: 'defaults-test2',
        properties: {
          count: { name: 'count', type: 'number', description: 'Count', default: 10 },
        },
      });

      const config = registry.applyDefaults('defaults-test2', { count: 5 });
      expect(config.count).toBe(5);
    });

    it('should return original config for unknown preset', () => {
      const original = { foo: 'bar' };
      const config = registry.applyDefaults('unknown', original);
      expect(config).toEqual(original);
    });
  });

  describe('getMetadata', () => {
    it('should return metadata for all presets', () => {
      registry.registerSchema({
        preset: 'a',
        properties: { foo: { name: 'foo', type: 'string', description: 'Foo' } },
      });
      registry.registerSchema({
        preset: 'b',
        properties: { bar: { name: 'bar', type: 'number', description: 'Bar' } },
      });

      const metadata = registry.getMetadata();

      expect(metadata.length).toBe(2);
      expect(metadata.map(m => m.preset)).toContain('a');
      expect(metadata.map(m => m.preset)).toContain('b');
    });

    it('should return metadata for specific preset', () => {
      registry.registerSchema({
        preset: 'a',
        properties: { foo: { name: 'foo', type: 'string', description: 'Foo' } },
      });
      registry.registerSchema({
        preset: 'b',
        properties: { bar: { name: 'bar', type: 'number', description: 'Bar' } },
      });

      const metadata = registry.getMetadata('a');

      expect(metadata.length).toBe(1);
      expect(metadata[0].preset).toBe('a');
    });
  });

  describe('toJsonSchema', () => {
    it('should generate JSON Schema', () => {
      registry.registerSchema({
        preset: 'json-test',
        properties: {
          name: { name: 'name', type: 'string', description: 'Name', required: true },
          count: { name: 'count', type: 'number', description: 'Count', min: 0, max: 100 },
        },
      });

      const schema = registry.toJsonSchema('json-test');

      expect(schema).toBeDefined();
      expect((schema as any).$schema).toContain('json-schema');
      expect((schema as any).type).toBe('object');
      expect((schema as any).properties.name).toBeDefined();
      expect((schema as any).properties.count).toBeDefined();
      expect((schema as any).required).toContain('name');
    });

    it('should return null for unknown preset', () => {
      expect(registry.toJsonSchema('unknown')).toBeNull();
    });
  });

  describe('clear', () => {
    it('should clear all schemas', () => {
      registry.registerSchema({ preset: 'a', properties: {} });
      registry.registerSchema({ preset: 'b', properties: {} });

      registry.clear();

      expect(registry.listPresets()).toEqual([]);
    });
  });
});

describe('createPropertyRegistry', () => {
  it('should create a registry instance', () => {
    const registry = createPropertyRegistry();
    expect(registry).toBeInstanceOf(ConfigPropertyRegistry);
  });

  it('should accept options', () => {
    const registry = createPropertyRegistry({ strict: true });
    expect(registry).toBeInstanceOf(ConfigPropertyRegistry);
  });
});

describe('global registry', () => {
  it('should get and set global registry', () => {
    const custom = new ConfigPropertyRegistry();
    setGlobalPropertyRegistry(custom);

    expect(getGlobalPropertyRegistry()).toBe(custom);
  });

  it('should create default global registry if not set', () => {
    setGlobalPropertyRegistry(null as any);
    const global = getGlobalPropertyRegistry();
    expect(global).toBeInstanceOf(ConfigPropertyRegistry);
  });
});
