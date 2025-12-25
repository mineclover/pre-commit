/**
 * @module core/pipeline/executor
 * @description Pipeline execution strategies
 */

import type { Preset, ValidationResult, ValidationContext } from '../../presets/base/types.js';
import type { BaseConfig } from '../types.js';
import type {
  PipelineStage,
  StageResult,
  StageCondition,
  ExecutorOptions,
} from './types.js';

/**
 * Execute a single pipeline stage
 */
export async function executeStage(
  stage: PipelineStage,
  preset: Preset,
  options: ExecutorOptions
): Promise<StageResult> {
  const stageName = stage.name || (typeof stage.preset === 'string' ? stage.preset : preset.name);
  const startTime = Date.now();

  // Check condition
  if (stage.when) {
    const conditionMet = await evaluateCondition(stage.when, options.context);
    if (!conditionMet) {
      return {
        stageName,
        presetName: preset.name,
        result: createEmptyResult(),
        duration: 0,
        skipped: true,
        skipReason: 'Condition not met',
      };
    }
  }

  try {
    // Merge configs
    const mergedConfig = { ...options.baseConfig, ...stage.config } as BaseConfig;

    // Call lifecycle hook
    if (preset.onBeforeValidate) {
      await preset.onBeforeValidate(options.context);
    }

    // Execute validation
    const result = await Promise.resolve(
      preset.validateFiles(options.context.stagedFiles, mergedConfig, options.context)
    );

    // Call lifecycle hook
    if (preset.onAfterValidate) {
      await preset.onAfterValidate(result);
    }

    return {
      stageName,
      presetName: preset.name,
      result,
      duration: Date.now() - startTime,
      skipped: false,
    };
  } catch (error) {
    return {
      stageName,
      presetName: preset.name,
      result: createErrorResult(error),
      duration: Date.now() - startTime,
      skipped: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Execute stages sequentially
 */
export async function executeSequential(
  stages: Array<{ stage: PipelineStage; preset: Preset }>,
  options: ExecutorOptions,
  failFast: boolean
): Promise<StageResult[]> {
  const results: StageResult[] = [];

  for (const { stage, preset } of stages) {
    const result = await executeStage(stage, preset, {
      ...options,
      context: {
        ...options.context,
        previousResults: results.map((r) => r.result),
      },
    });

    results.push(result);

    // Check fail fast
    if (failFast && !result.result.valid && !result.skipped) {
      break;
    }

    // Check continueOnError
    if (!stage.continueOnError && !result.result.valid && !result.skipped) {
      break;
    }
  }

  return results;
}

/**
 * Execute stages in parallel
 */
export async function executeParallel(
  stages: Array<{ stage: PipelineStage; preset: Preset }>,
  options: ExecutorOptions
): Promise<StageResult[]> {
  const promises = stages.map(({ stage, preset }) =>
    executeStage(stage, preset, options)
  );

  return Promise.all(promises);
}

/**
 * Execute until first passing stage
 */
export async function executeFirstPass(
  stages: Array<{ stage: PipelineStage; preset: Preset }>,
  options: ExecutorOptions
): Promise<StageResult[]> {
  const results: StageResult[] = [];

  for (const { stage, preset } of stages) {
    const result = await executeStage(stage, preset, options);
    results.push(result);

    if (result.result.valid && !result.skipped) {
      break;
    }
  }

  return results;
}

/**
 * Execute until first failing stage
 */
export async function executeFirstFail(
  stages: Array<{ stage: PipelineStage; preset: Preset }>,
  options: ExecutorOptions
): Promise<StageResult[]> {
  const results: StageResult[] = [];

  for (const { stage, preset } of stages) {
    const result = await executeStage(stage, preset, options);
    results.push(result);

    if (!result.result.valid && !result.skipped) {
      break;
    }
  }

  return results;
}

/**
 * Evaluate stage condition
 */
async function evaluateCondition(
  condition: StageCondition,
  context: ValidationContext
): Promise<boolean> {
  // File pattern matching
  if (condition.files && condition.files.length > 0) {
    const hasMatch = context.stagedFiles.some((file) =>
      condition.files!.some((pattern) => matchPattern(file, pattern))
    );
    if (!hasMatch) return false;
  }

  // Branch matching
  if (condition.branches && condition.branches.length > 0 && context.branch) {
    const branchMatches = condition.branches.some((pattern) =>
      matchPattern(context.branch!, pattern)
    );
    if (!branchMatches) return false;
  }

  // Environment matching
  if (condition.env && context.env) {
    for (const [key, value] of Object.entries(condition.env)) {
      if (context.env[key] !== value) return false;
    }
  }

  return true;
}

/**
 * Simple glob-like pattern matching
 */
function matchPattern(value: string, pattern: string): boolean {
  // Escape special regex chars except * and ?
  const regexPattern = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(value);
}

/**
 * Create an empty validation result (for skipped stages)
 */
function createEmptyResult(): ValidationResult {
  return {
    valid: true,
    commonPath: null,
    files: [],
    errors: [],
    warnings: [],
  };
}

/**
 * Create an error validation result
 */
function createErrorResult(error: unknown): ValidationResult {
  return {
    valid: false,
    commonPath: null,
    files: [],
    errors: [error instanceof Error ? error.message : String(error)],
    warnings: [],
  };
}
