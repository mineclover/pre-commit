/**
 * @module core/pipeline/types
 * @description Type definitions for the validation pipeline
 */

import type { Preset, ValidationResult, CommitMsgValidationResult, ValidationContext } from '../../presets/base/types.js';
import type { BaseConfig } from '../types.js';

/**
 * Execution strategy for pipeline
 */
export type ExecutionStrategy =
  | 'sequential'   // Run stages one after another
  | 'parallel'     // Run all stages simultaneously
  | 'first-pass'   // Stop at first passing stage
  | 'first-fail';  // Stop at first failing stage

/**
 * Condition for conditional stage execution
 */
export interface StageCondition {
  /** Match file patterns (glob-like) */
  files?: string[];
  /** Match branch names */
  branches?: string[];
  /** Match environment variables */
  env?: Record<string, string>;
}

/**
 * Pipeline stage configuration
 */
export interface PipelineStage {
  /** Preset name or instance */
  preset: string | Preset;
  /** Stage-specific config overrides */
  config?: Partial<BaseConfig>;
  /** Continue pipeline on stage failure */
  continueOnError?: boolean;
  /** Conditional execution */
  when?: StageCondition;
  /** Stage weight for result aggregation (default: 1) */
  weight?: number;
  /** Stage name for logging (defaults to preset name) */
  name?: string;
}

/**
 * Pipeline configuration
 */
export interface PipelineConfig {
  /** Pipeline stages */
  stages: PipelineStage[];
  /** Execution strategy */
  strategy: ExecutionStrategy;
  /** Stop on first error (overrides stage continueOnError) */
  failFast?: boolean;
  /** Timeout per stage in milliseconds */
  stageTimeout?: number;
  /** Total pipeline timeout in milliseconds */
  pipelineTimeout?: number;
}

/**
 * Result from a single stage execution
 */
export interface StageResult {
  /** Stage name */
  stageName: string;
  /** Preset name */
  presetName: string;
  /** Validation result */
  result: ValidationResult;
  /** Execution duration in milliseconds */
  duration: number;
  /** Whether stage was skipped */
  skipped: boolean;
  /** Reason for skipping */
  skipReason?: string;
  /** Error if stage failed unexpectedly */
  error?: Error;
}

/**
 * Aggregated pipeline result
 */
export interface PipelineResult {
  /** Overall validity */
  valid: boolean;
  /** Results from each stage */
  stages: StageResult[];
  /** Combined errors from all stages */
  errors: string[];
  /** Combined warnings from all stages */
  warnings: string[];
  /** Combined prefix from passing stages */
  combinedPrefix?: string;
  /** Total execution duration in milliseconds */
  duration: number;
  /** Pipeline execution metadata */
  metadata?: {
    strategy: ExecutionStrategy;
    totalStages: number;
    executedStages: number;
    skippedStages: number;
    passedStages: number;
    failedStages: number;
  };
}

/**
 * Commit message pipeline result
 */
export interface CommitMsgPipelineResult {
  /** Overall validity */
  valid: boolean;
  /** Results from each stage */
  stages: Array<{
    stageName: string;
    presetName: string;
    result: CommitMsgValidationResult;
    duration: number;
    skipped: boolean;
  }>;
  /** Combined errors */
  errors: string[];
  /** Total duration */
  duration: number;
}

/**
 * Pipeline executor options
 */
export interface ExecutorOptions {
  /** Base configuration to use */
  baseConfig: BaseConfig;
  /** Validation context */
  context: ValidationContext;
  /** Abort signal for cancellation */
  abortSignal?: AbortSignal;
}
