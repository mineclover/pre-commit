/**
 * @module core/pipeline/pipeline
 * @description Validation pipeline orchestrator
 */

import type { Preset, ValidationResult, ValidationContext } from '../../presets/base/types.js';
import type { BaseConfig } from '../types.js';
import type {
  PipelineConfig,
  PipelineResult,
  PipelineStage,
  StageResult,
  CommitMsgPipelineResult,
} from './types.js';
import {
  executeSequential,
  executeParallel,
  executeFirstPass,
  executeFirstFail,
} from './executor.js';
import { PresetRegistry } from '../../presets/base/registry.js';

/**
 * Validation Pipeline
 *
 * Orchestrates multiple preset validations with configurable execution strategies.
 *
 * @example
 * ```typescript
 * const pipeline = new ValidationPipeline();
 *
 * const result = await pipeline.execute(pipelineConfig, baseConfig, {
 *   stagedFiles: ['src/core/file.ts'],
 *   branch: 'main',
 * });
 *
 * if (result.valid) {
 *   console.log('All stages passed');
 * }
 * ```
 */
export class ValidationPipeline {
  /**
   * Execute the validation pipeline
   * @param config - Pipeline configuration
   * @param baseConfig - Base preset configuration
   * @param context - Validation context
   * @returns Pipeline result
   */
  async execute(
    config: PipelineConfig,
    baseConfig: BaseConfig,
    context: ValidationContext
  ): Promise<PipelineResult> {
    const startTime = Date.now();

    // Resolve all presets
    const resolvedStages = await this.resolveStages(config.stages);

    // Execute based on strategy
    const stageResults = await this.executeStrategy(
      config,
      resolvedStages,
      baseConfig,
      context
    );

    // Aggregate results
    return this.aggregateResults(stageResults, config, startTime);
  }

  /**
   * Execute commit message validation pipeline
   */
  async executeCommitMsg(
    config: PipelineConfig,
    baseConfig: BaseConfig,
    commitMsg: string
  ): Promise<CommitMsgPipelineResult> {
    const startTime = Date.now();
    const resolvedStages = await this.resolveStages(config.stages);

    const results: CommitMsgPipelineResult['stages'] = [];
    let overallValid = true;
    const allErrors: string[] = [];

    for (const { stage, preset } of resolvedStages) {
      const stageStart = Date.now();
      const stageName = stage.name || preset.name;

      try {
        const result = await Promise.resolve(
          preset.validateCommitMessage(commitMsg, { ...baseConfig, ...stage.config } as BaseConfig)
        );

        results.push({
          stageName,
          presetName: preset.name,
          result,
          duration: Date.now() - stageStart,
          skipped: false,
        });

        if (!result.valid) {
          overallValid = false;
          allErrors.push(...result.errors);

          if (config.failFast || !stage.continueOnError) {
            break;
          }
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        results.push({
          stageName,
          presetName: preset.name,
          result: { valid: false, errors: [errorMsg] },
          duration: Date.now() - stageStart,
          skipped: false,
        });
        overallValid = false;
        allErrors.push(errorMsg);

        if (config.failFast) break;
      }
    }

    return {
      valid: overallValid,
      stages: results,
      errors: allErrors,
      duration: Date.now() - startTime,
    };
  }

  /**
   * Resolve preset references to instances
   */
  private async resolveStages(
    stages: PipelineStage[]
  ): Promise<Array<{ stage: PipelineStage; preset: Preset }>> {
    const resolved: Array<{ stage: PipelineStage; preset: Preset }> = [];

    for (const stage of stages) {
      let preset: Preset;

      if (typeof stage.preset === 'string') {
        // Try sync first, then async
        if (PresetRegistry.has(stage.preset)) {
          preset = PresetRegistry.get(stage.preset);
        } else {
          preset = await PresetRegistry.getAsync(stage.preset);
        }
      } else {
        preset = stage.preset;
      }

      resolved.push({ stage, preset });
    }

    return resolved;
  }

  /**
   * Execute stages based on strategy
   */
  private async executeStrategy(
    config: PipelineConfig,
    stages: Array<{ stage: PipelineStage; preset: Preset }>,
    baseConfig: BaseConfig,
    context: ValidationContext
  ): Promise<StageResult[]> {
    const options = { baseConfig, context };

    switch (config.strategy) {
      case 'sequential':
        return executeSequential(stages, options, config.failFast ?? false);

      case 'parallel':
        return executeParallel(stages, options);

      case 'first-pass':
        return executeFirstPass(stages, options);

      case 'first-fail':
        return executeFirstFail(stages, options);

      default:
        return executeSequential(stages, options, config.failFast ?? false);
    }
  }

  /**
   * Aggregate stage results into pipeline result
   */
  private aggregateResults(
    stageResults: StageResult[],
    config: PipelineConfig,
    startTime: number
  ): PipelineResult {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];
    const prefixes: string[] = [];

    let passedStages = 0;
    let failedStages = 0;
    let skippedStages = 0;

    for (const stage of stageResults) {
      if (stage.skipped) {
        skippedStages++;
        continue;
      }

      if (stage.result.valid) {
        passedStages++;
        if (stage.result.commonPath) {
          prefixes.push(`[${stage.result.commonPath}]`);
        }
      } else {
        failedStages++;
        allErrors.push(...stage.result.errors);
      }

      if (stage.result.warnings) {
        allWarnings.push(...stage.result.warnings);
      }
    }

    // Determine overall validity based on strategy
    let valid: boolean;
    switch (config.strategy) {
      case 'first-pass':
        valid = passedStages > 0;
        break;
      case 'parallel':
      case 'sequential':
      case 'first-fail':
      default:
        valid = failedStages === 0;
        break;
    }

    return {
      valid,
      stages: stageResults,
      errors: allErrors,
      warnings: allWarnings,
      combinedPrefix: prefixes.length > 0 ? prefixes[0] : undefined,
      duration: Date.now() - startTime,
      metadata: {
        strategy: config.strategy,
        totalStages: stageResults.length,
        executedStages: passedStages + failedStages,
        skippedStages,
        passedStages,
        failedStages,
      },
    };
  }
}

/**
 * Create a new validation pipeline
 */
export function createPipeline(): ValidationPipeline {
  return new ValidationPipeline();
}
