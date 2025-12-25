/**
 * @module core/config/environment
 * @description Environment variable interpolation for configuration
 */

/**
 * Pattern for matching environment variable references
 * Supports: ${VAR}, ${VAR:-default}, $VAR
 */
const ENV_PATTERN = /\$\{([^}]+)\}|\$([A-Z_][A-Z0-9_]*)/g;

/**
 * Environment interpolation options
 */
export interface InterpolationOptions {
  /** Environment variables to use */
  env?: Record<string, string>;

  /** Default values for missing variables */
  defaults?: Record<string, string>;

  /** Throw on missing variables */
  strict?: boolean;
}

/**
 * Interpolate environment variables in a string
 *
 * @example
 * ```typescript
 * interpolateString('${HOME}/logs', { env: process.env });
 * // => '/home/user/logs'
 *
 * interpolateString('${PORT:-3000}', { env: {} });
 * // => '3000'
 * ```
 */
export function interpolateString(
  value: string,
  options: InterpolationOptions = {}
): string {
  const env = { ...process.env, ...options.env };
  const defaults = options.defaults || {};

  return value.replace(ENV_PATTERN, (match, braced, simple) => {
    const envRef = braced || simple;

    // Handle default value syntax: ${VAR:-default}
    const [varName, defaultValue] = envRef.split(':-');

    // Try to get value from environment
    let result = env[varName];

    // Fall back to default from syntax
    if (result === undefined && defaultValue !== undefined) {
      result = defaultValue;
    }

    // Fall back to defaults option
    if (result === undefined && defaults[varName] !== undefined) {
      result = defaults[varName];
    }

    // Handle strict mode
    if (result === undefined) {
      if (options.strict) {
        throw new Error(`Environment variable not found: ${varName}`);
      }
      return '';
    }

    return result;
  });
}

/**
 * Interpolate environment variables in an object recursively
 */
export function interpolateObject<T>(
  obj: T,
  options: InterpolationOptions = {}
): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return interpolateString(obj, options) as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => interpolateObject(item, options)) as T;
  }

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = interpolateObject(value, options);
    }
    return result as T;
  }

  return obj;
}

/**
 * Check if a string contains environment variable references
 */
export function hasEnvRefs(value: string): boolean {
  return ENV_PATTERN.test(value);
}

/**
 * Extract all environment variable names from a string
 */
export function extractEnvVars(value: string): string[] {
  const vars: string[] = [];
  let match: RegExpExecArray | null;

  // Reset lastIndex for global regex
  ENV_PATTERN.lastIndex = 0;

  while ((match = ENV_PATTERN.exec(value)) !== null) {
    const envRef = match[1] || match[2];
    const [varName] = envRef.split(':-');
    if (!vars.includes(varName)) {
      vars.push(varName);
    }
  }

  return vars;
}

/**
 * Extract all environment variables from an object recursively
 */
export function extractEnvVarsFromObject(obj: unknown): string[] {
  const vars: string[] = [];

  const extract = (value: unknown): void => {
    if (typeof value === 'string') {
      const found = extractEnvVars(value);
      for (const v of found) {
        if (!vars.includes(v)) {
          vars.push(v);
        }
      }
    } else if (Array.isArray(value)) {
      for (const item of value) {
        extract(item);
      }
    } else if (value && typeof value === 'object') {
      for (const v of Object.values(value)) {
        extract(v);
      }
    }
  };

  extract(obj);
  return vars;
}
