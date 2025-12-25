/**
 * @module core/config
 * @description Extended configuration system with inheritance and environment support
 *
 * This module provides advanced configuration features:
 * - Configuration inheritance via 'extends'
 * - Environment variable interpolation (${VAR}, ${VAR:-default})
 * - Conditional configurations based on branch, env, or files
 * - Preset-based default configs (recommended, strict, relaxed)
 *
 * @example
 * ```typescript
 * import { ConfigLoader } from './config';
 *
 * const loader = new ConfigLoader({ cwd: process.cwd() });
 * const config = await loader.load();
 *
 * // Config with extends
 * // .precommitrc.json:
 * // {
 * //   "extends": "preset:recommended",
 * //   "depth": "${COMMIT_DEPTH:-3}",
 * //   "conditionals": [
 * //     { "when": { "branch": "main" }, "config": { "depth": 2 } }
 * //   ]
 * // }
 * ```
 */

// Types
export type {
  ConditionalConfig,
  ExtendedConfig,
  ResolvedConfig,
  ConfigLoaderOptions,
  ConfigFileInfo,
} from './types.js';

// Loader
export { ConfigLoader, createConfigLoader, loadExtendedConfig } from './loader.js';

// Environment utilities
export {
  interpolateString,
  interpolateObject,
  hasEnvRefs,
  extractEnvVars,
  extractEnvVarsFromObject,
  type InterpolationOptions,
} from './environment.js';
