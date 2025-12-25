/**
 * @module core/pipeline
 * @description Validation pipeline for multi-preset execution
 *
 * This module provides infrastructure for running multiple presets
 * in a configurable pipeline with various execution strategies.
 *
 * @example
 * ```typescript
 * import { ValidationPipeline } from './pipeline';
 *
 * const pipeline = new ValidationPipeline();
 *
 * const result = await pipeline.execute(
 *   {
 *     strategy: 'sequential',
 *     stages: [
 *       { preset: 'folder-based' },
 *       { preset: 'conventional-commits', continueOnError: true }
 *     ]
 *   },
 *   baseConfig,
 *   { stagedFiles: ['src/file.ts'] }
 * );
 * ```
 */

// Types
export type {
  ExecutionStrategy,
  StageCondition,
  PipelineStage,
  PipelineConfig,
  StageResult,
  PipelineResult,
  CommitMsgPipelineResult,
  ExecutorOptions,
} from './types.js';

// Pipeline
export { ValidationPipeline, createPipeline } from './pipeline.js';

// Executor utilities
export {
  executeStage,
  executeSequential,
  executeParallel,
  executeFirstPass,
  executeFirstFail,
} from './executor.js';
