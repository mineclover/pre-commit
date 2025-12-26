import { describe, it, expect, vi } from 'vitest';
import {
  executeStage,
  executeSequential,
  executeParallel,
  executeFirstPass,
  executeFirstFail,
} from '../../../../src/core/pipeline/executor.js';
import type { Preset, ValidationResult } from '../../../../src/presets/base/types.js';
import type { PipelineStage, ExecutorOptions } from '../../../../src/core/pipeline/types.js';

describe('Pipeline Executor', () => {
  const createMockPreset = (name: string, valid: boolean): Preset => ({
    name,
    description: `Mock ${name} preset`,
    validateFiles: vi.fn().mockReturnValue({
      valid,
      commonPath: 'src',
      files: [],
      errors: valid ? [] : ['Validation failed'],
      stats: { totalFiles: 1, filteredFiles: 1, ignoredFiles: 0, uniqueFolders: 1 },
    } as ValidationResult),
    validateCommitMessage: vi.fn().mockReturnValue({ valid: true, errors: [] }),
    getCommitPrefix: vi.fn().mockReturnValue(`[${name}]`),
  });

  const createBaseOptions = (): ExecutorOptions => ({
    baseConfig: {
      preset: 'test',
      enabled: true,
      logFile: '.commit-logs/test.log',
    },
    context: {
      stagedFiles: ['src/file.ts'],
    },
  });

  describe('executeStage', () => {
    it('should execute a stage and return result', async () => {
      const preset = createMockPreset('test', true);
      const stage: PipelineStage = { preset: 'test' };
      const options = createBaseOptions();

      const result = await executeStage(stage, preset, options);

      expect(result.presetName).toBe('test');
      expect(result.result.valid).toBe(true);
      expect(result.skipped).toBe(false);
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should skip stage when condition not met', async () => {
      const preset = createMockPreset('test', true);
      const stage: PipelineStage = {
        preset: 'test',
        when: { files: ['*.py'] },
      };
      const options = createBaseOptions();

      const result = await executeStage(stage, preset, options);

      expect(result.skipped).toBe(true);
      expect(result.skipReason).toBe('Condition not met');
    });

    it('should execute stage when condition met', async () => {
      const preset = createMockPreset('test', true);
      const stage: PipelineStage = {
        preset: 'test',
        when: { files: ['*.ts'] },
      };
      const options = createBaseOptions();

      const result = await executeStage(stage, preset, options);

      expect(result.skipped).toBe(false);
      expect(result.result.valid).toBe(true);
    });

    it('should call lifecycle hooks', async () => {
      const preset = createMockPreset('test', true);
      preset.onBeforeValidate = vi.fn();
      preset.onAfterValidate = vi.fn();
      const stage: PipelineStage = { preset: 'test' };
      const options = createBaseOptions();

      await executeStage(stage, preset, options);

      expect(preset.onBeforeValidate).toHaveBeenCalled();
      expect(preset.onAfterValidate).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const preset = createMockPreset('test', true);
      (preset.validateFiles as any).mockImplementation(() => {
        throw new Error('Validation error');
      });
      const stage: PipelineStage = { preset: 'test' };
      const options = createBaseOptions();

      const result = await executeStage(stage, preset, options);

      expect(result.result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.result.errors).toContain('Validation error');
    });

    it('should use stage name if provided', async () => {
      const preset = createMockPreset('test', true);
      const stage: PipelineStage = { preset: 'test', name: 'custom-name' };
      const options = createBaseOptions();

      const result = await executeStage(stage, preset, options);

      expect(result.stageName).toBe('custom-name');
    });
  });

  describe('executeSequential', () => {
    it('should execute all stages in order', async () => {
      const stages = [
        { stage: { preset: 'a' } as PipelineStage, preset: createMockPreset('a', true) },
        { stage: { preset: 'b' } as PipelineStage, preset: createMockPreset('b', true) },
      ];
      const options = createBaseOptions();

      const results = await executeSequential(stages, options, false);

      expect(results).toHaveLength(2);
      expect(results[0].presetName).toBe('a');
      expect(results[1].presetName).toBe('b');
    });

    it('should stop on failure when failFast is true', async () => {
      const stages = [
        { stage: { preset: 'a' } as PipelineStage, preset: createMockPreset('a', false) },
        { stage: { preset: 'b' } as PipelineStage, preset: createMockPreset('b', true) },
      ];
      const options = createBaseOptions();

      const results = await executeSequential(stages, options, true);

      expect(results).toHaveLength(1);
      expect(results[0].result.valid).toBe(false);
    });

    it('should continue on error when continueOnError is true', async () => {
      const stages = [
        { stage: { preset: 'a', continueOnError: true } as PipelineStage, preset: createMockPreset('a', false) },
        { stage: { preset: 'b' } as PipelineStage, preset: createMockPreset('b', true) },
      ];
      const options = createBaseOptions();

      const results = await executeSequential(stages, options, false);

      expect(results).toHaveLength(2);
    });

    it('should pass previous results to context', async () => {
      const secondPreset = createMockPreset('b', true);
      const stages = [
        { stage: { preset: 'a' } as PipelineStage, preset: createMockPreset('a', true) },
        { stage: { preset: 'b' } as PipelineStage, preset: secondPreset },
      ];
      const options = createBaseOptions();

      await executeSequential(stages, options, false);

      expect(secondPreset.validateFiles).toHaveBeenCalled();
    });
  });

  describe('executeParallel', () => {
    it('should execute all stages in parallel', async () => {
      const stages = [
        { stage: { preset: 'a' } as PipelineStage, preset: createMockPreset('a', true) },
        { stage: { preset: 'b' } as PipelineStage, preset: createMockPreset('b', true) },
      ];
      const options = createBaseOptions();

      const results = await executeParallel(stages, options);

      expect(results).toHaveLength(2);
    });

    it('should return all results even when some fail', async () => {
      const stages = [
        { stage: { preset: 'a' } as PipelineStage, preset: createMockPreset('a', false) },
        { stage: { preset: 'b' } as PipelineStage, preset: createMockPreset('b', true) },
      ];
      const options = createBaseOptions();

      const results = await executeParallel(stages, options);

      expect(results).toHaveLength(2);
      expect(results.find(r => r.presetName === 'a')?.result.valid).toBe(false);
      expect(results.find(r => r.presetName === 'b')?.result.valid).toBe(true);
    });
  });

  describe('executeFirstPass', () => {
    it('should stop after first passing stage', async () => {
      const stages = [
        { stage: { preset: 'a' } as PipelineStage, preset: createMockPreset('a', false) },
        { stage: { preset: 'b' } as PipelineStage, preset: createMockPreset('b', true) },
        { stage: { preset: 'c' } as PipelineStage, preset: createMockPreset('c', true) },
      ];
      const options = createBaseOptions();

      const results = await executeFirstPass(stages, options);

      expect(results).toHaveLength(2);
      expect(results[1].result.valid).toBe(true);
    });

    it('should execute all stages if none pass', async () => {
      const stages = [
        { stage: { preset: 'a' } as PipelineStage, preset: createMockPreset('a', false) },
        { stage: { preset: 'b' } as PipelineStage, preset: createMockPreset('b', false) },
      ];
      const options = createBaseOptions();

      const results = await executeFirstPass(stages, options);

      expect(results).toHaveLength(2);
    });
  });

  describe('executeFirstFail', () => {
    it('should stop after first failing stage', async () => {
      const stages = [
        { stage: { preset: 'a' } as PipelineStage, preset: createMockPreset('a', true) },
        { stage: { preset: 'b' } as PipelineStage, preset: createMockPreset('b', false) },
        { stage: { preset: 'c' } as PipelineStage, preset: createMockPreset('c', true) },
      ];
      const options = createBaseOptions();

      const results = await executeFirstFail(stages, options);

      expect(results).toHaveLength(2);
      expect(results[1].result.valid).toBe(false);
    });

    it('should execute all stages if all pass', async () => {
      const stages = [
        { stage: { preset: 'a' } as PipelineStage, preset: createMockPreset('a', true) },
        { stage: { preset: 'b' } as PipelineStage, preset: createMockPreset('b', true) },
      ];
      const options = createBaseOptions();

      const results = await executeFirstFail(stages, options);

      expect(results).toHaveLength(2);
    });
  });
});
