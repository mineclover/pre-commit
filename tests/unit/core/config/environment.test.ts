import { describe, it, expect } from 'vitest';
import {
  interpolateString,
  interpolateObject,
  hasEnvRefs,
  extractEnvVars,
  extractEnvVarsFromObject,
} from '../../../../src/core/config/environment.js';

describe('Environment Interpolation', () => {
  describe('interpolateString', () => {
    it('should interpolate ${VAR} syntax', () => {
      const result = interpolateString('Hello ${NAME}!', { env: { NAME: 'World' } });

      expect(result).toBe('Hello World!');
    });

    it('should interpolate ${VAR:-default} syntax', () => {
      const result = interpolateString('Port: ${PORT:-3000}', { env: {} });

      expect(result).toBe('Port: 3000');
    });

    it('should use env value over default', () => {
      const result = interpolateString('Port: ${PORT:-3000}', { env: { PORT: '8080' } });

      expect(result).toBe('Port: 8080');
    });

    it('should return empty string for missing var without default', () => {
      const result = interpolateString('${MISSING}', { env: {} });

      expect(result).toBe('');
    });

    it('should throw in strict mode for missing var', () => {
      expect(() => {
        interpolateString('${MISSING}', { env: {}, strict: true });
      }).toThrow('Environment variable not found: MISSING');
    });

    it('should use defaults option', () => {
      const result = interpolateString('${DB_HOST}', {
        env: {},
        defaults: { DB_HOST: 'localhost' },
      });

      expect(result).toBe('localhost');
    });

    it('should handle multiple variables', () => {
      const result = interpolateString('${USER}@${HOST}', {
        env: { USER: 'admin', HOST: 'server.com' },
      });

      expect(result).toBe('admin@server.com');
    });

    it('should handle no variables', () => {
      const result = interpolateString('plain text', {});

      expect(result).toBe('plain text');
    });
  });

  describe('interpolateObject', () => {
    it('should interpolate strings in object', () => {
      const obj = { name: '${NAME}', value: 'plain' };
      const result = interpolateObject(obj, { env: { NAME: 'Test' } });

      expect(result).toEqual({ name: 'Test', value: 'plain' });
    });

    it('should handle nested objects', () => {
      const obj = {
        outer: {
          inner: '${VALUE}',
        },
      };
      const result = interpolateObject(obj, { env: { VALUE: 'nested' } });

      expect(result).toEqual({ outer: { inner: 'nested' } });
    });

    it('should handle arrays', () => {
      const arr = ['${A}', '${B}', 'plain'];
      const result = interpolateObject(arr, { env: { A: '1', B: '2' } });

      expect(result).toEqual(['1', '2', 'plain']);
    });

    it('should preserve non-string values', () => {
      const obj = { num: 42, bool: true, str: '${VAR}' };
      const result = interpolateObject(obj, { env: { VAR: 'test' } });

      expect(result).toEqual({ num: 42, bool: true, str: 'test' });
    });

    it('should handle null and undefined', () => {
      expect(interpolateObject(null, {})).toBeNull();
      expect(interpolateObject(undefined, {})).toBeUndefined();
    });
  });

  describe('hasEnvRefs', () => {
    it('should return true for ${VAR} syntax', () => {
      expect(hasEnvRefs('${HOME}')).toBe(true);
    });

    it('should return false for plain string', () => {
      expect(hasEnvRefs('plain text')).toBe(false);
    });

    it('should return true for ${VAR:-default} syntax', () => {
      expect(hasEnvRefs('${PORT:-3000}')).toBe(true);
    });
  });

  describe('extractEnvVars', () => {
    it('should extract variable names from ${VAR} syntax', () => {
      const vars = extractEnvVars('${HOME}/path/${USER}');

      expect(vars).toContain('HOME');
      expect(vars).toContain('USER');
    });

    it('should extract variable name without default value', () => {
      const vars = extractEnvVars('${PORT:-3000}');

      expect(vars).toEqual(['PORT']);
    });

    it('should not duplicate variables', () => {
      const vars = extractEnvVars('${VAR} and ${VAR}');

      expect(vars).toEqual(['VAR']);
    });

    it('should return empty array for no variables', () => {
      expect(extractEnvVars('plain text')).toEqual([]);
    });
  });

  describe('extractEnvVarsFromObject', () => {
    it('should extract vars from nested object', () => {
      const obj = {
        a: '${VAR_A}',
        nested: {
          b: '${VAR_B}',
        },
        arr: ['${VAR_C}'],
      };

      const vars = extractEnvVarsFromObject(obj);

      expect(vars).toContain('VAR_A');
      expect(vars).toContain('VAR_B');
      expect(vars).toContain('VAR_C');
    });

    it('should handle non-object values', () => {
      expect(extractEnvVarsFromObject(null)).toEqual([]);
      expect(extractEnvVarsFromObject(42)).toEqual([]);
      expect(extractEnvVarsFromObject('${VAR}')).toEqual(['VAR']);
    });
  });
});
