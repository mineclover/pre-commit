import { describe, it, expect } from 'vitest';
import { PluginValidator, defaultValidator, createValidator } from '../../../../src/core/plugin/validator.js';
import { PluginValidationError } from '../../../../src/core/errors.js';

describe('PluginValidator', () => {
  const validPreset = {
    name: 'test-preset',
    description: 'A test preset',
    version: '1.0.0',
    validateFiles: () => ({ valid: true, files: [], errors: [], stats: { totalFiles: 0, filteredFiles: 0, ignoredFiles: 0, uniqueFolders: 0 } }),
    validateCommitMessage: () => ({ valid: true, errors: [] }),
    getCommitPrefix: () => '[test]',
  };

  describe('validate', () => {
    it('should return valid for complete preset', () => {
      const validator = new PluginValidator();
      const result = validator.validate(validPreset);

      expect(result.valid).toBe(true);
      expect(result.missingProperties).toHaveLength(0);
      expect(result.missingMethods).toHaveLength(0);
    });

    it('should detect missing name property', () => {
      const validator = new PluginValidator();
      const invalidPreset = { ...validPreset };
      delete (invalidPreset as any).name;

      const result = validator.validate(invalidPreset);

      expect(result.valid).toBe(false);
      expect(result.missingProperties).toContain('name');
    });

    it('should detect missing description property', () => {
      const validator = new PluginValidator();
      const invalidPreset = { ...validPreset };
      delete (invalidPreset as any).description;

      const result = validator.validate(invalidPreset);

      expect(result.valid).toBe(false);
      expect(result.missingProperties).toContain('description');
    });

    it('should detect missing validateFiles method', () => {
      const validator = new PluginValidator();
      const invalidPreset = { ...validPreset };
      delete (invalidPreset as any).validateFiles;

      const result = validator.validate(invalidPreset);

      expect(result.valid).toBe(false);
      expect(result.missingMethods).toContain('validateFiles');
    });

    it('should detect missing validateCommitMessage method', () => {
      const validator = new PluginValidator();
      const invalidPreset = { ...validPreset };
      delete (invalidPreset as any).validateCommitMessage;

      const result = validator.validate(invalidPreset);

      expect(result.valid).toBe(false);
      expect(result.missingMethods).toContain('validateCommitMessage');
    });

    it('should detect missing getCommitPrefix method', () => {
      const validator = new PluginValidator();
      const invalidPreset = { ...validPreset };
      delete (invalidPreset as any).getCommitPrefix;

      const result = validator.validate(invalidPreset);

      expect(result.valid).toBe(false);
      expect(result.missingMethods).toContain('getCommitPrefix');
    });

    it('should return invalid for null', () => {
      const validator = new PluginValidator();
      const result = validator.validate(null);

      expect(result.valid).toBe(false);
      expect(result.missingProperties).toContain('name');
      expect(result.missingMethods).toContain('validateFiles');
    });

    it('should return invalid for non-object', () => {
      const validator = new PluginValidator();
      const result = validator.validate('string');

      expect(result.valid).toBe(false);
    });

    it('should detect non-function methods', () => {
      const validator = new PluginValidator();
      const invalidPreset = {
        ...validPreset,
        validateFiles: 'not a function',
      };

      const result = validator.validate(invalidPreset);

      expect(result.valid).toBe(false);
      expect(result.missingMethods).toContain('validateFiles');
    });

    it('should warn about invalid name type', () => {
      const validator = new PluginValidator();
      const invalidPreset = {
        ...validPreset,
        name: 123,
      };

      const result = validator.validate(invalidPreset);

      expect(result.warnings).toContain("Property 'name' should be a string");
    });

    it('should warn about invalid optional lifecycle method type', () => {
      const validator = new PluginValidator();
      const invalidPreset = {
        ...validPreset,
        onRegister: 'not a function',
      };

      const result = validator.validate(invalidPreset);

      expect(result.valid).toBe(true);
      expect(result.warnings).toContain("Optional method 'onRegister' is defined but not a function");
    });

    it('should accept valid lifecycle methods', () => {
      const validator = new PluginValidator();
      const presetWithLifecycle = {
        ...validPreset,
        onRegister: () => {},
        onBeforeValidate: async () => {},
        onAfterValidate: async () => {},
        onUnload: async () => {},
      };

      const result = validator.validate(presetWithLifecycle);

      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('assertValid', () => {
    it('should not throw for valid preset', () => {
      const validator = new PluginValidator();

      expect(() => validator.assertValid(validPreset)).not.toThrow();
    });

    it('should throw PluginValidationError for invalid preset', () => {
      const validator = new PluginValidator();
      const invalidPreset = { name: 'test' };

      expect(() => validator.assertValid(invalidPreset, 'test-plugin')).toThrow(PluginValidationError);
    });

    it('should include missing members in error message', () => {
      const validator = new PluginValidator();
      const invalidPreset = { name: 'test' };

      try {
        validator.assertValid(invalidPreset, 'test-plugin');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(PluginValidationError);
        expect((error as Error).message).toContain('description');
        expect((error as Error).message).toContain('validateFiles');
      }
    });
  });

  describe('isPreset', () => {
    it('should return true for valid preset', () => {
      const validator = new PluginValidator();

      expect(validator.isPreset(validPreset)).toBe(true);
    });

    it('should return false for invalid preset', () => {
      const validator = new PluginValidator();

      expect(validator.isPreset({})).toBe(false);
      expect(validator.isPreset(null)).toBe(false);
      expect(validator.isPreset('string')).toBe(false);
    });
  });

  describe('factory functions', () => {
    it('createValidator should return PluginValidator instance', () => {
      const validator = createValidator();

      expect(validator).toBeInstanceOf(PluginValidator);
    });

    it('defaultValidator should be PluginValidator instance', () => {
      expect(defaultValidator).toBeInstanceOf(PluginValidator);
    });
  });
});
