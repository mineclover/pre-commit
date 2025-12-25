/**
 * @module core/config/loader
 * @description Advanced configuration loader with extends and environment support
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname, resolve, isAbsolute } from 'path';
import type {
  ExtendedConfig,
  ResolvedConfig,
  ConfigLoaderOptions,
  ConfigFileInfo,
  ConditionalConfig,
} from './types.js';
import type { BaseConfig } from '../types.js';
import { interpolateObject } from './environment.js';
import { ConfigValidationError } from '../errors.js';

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: ExtendedConfig = {
  preset: 'folder-based',
  enabled: true,
  logFile: '.commit-logs/violations.log',
};

/**
 * Config file names to search for (in priority order)
 */
const CONFIG_FILES = [
  '.precommitrc.json',
  '.precommitrc.js',
  '.precommitrc.ts',
  'precommit.config.json',
  'precommit.config.js',
];

/**
 * Advanced configuration loader with inheritance and environment support
 */
export class ConfigLoader {
  private readonly cache = new Map<string, ExtendedConfig>();
  private readonly options: Required<Omit<ConfigLoaderOptions, 'configPath'>>;

  constructor(options: ConfigLoaderOptions = {}) {
    this.options = {
      cwd: options.cwd || process.cwd(),
      env: options.env || {},
      branch: options.branch || '',
      stagedFiles: options.stagedFiles || [],
      skipValidation: options.skipValidation ?? false,
    };
  }

  /**
   * Load and resolve configuration
   */
  async load(configPath?: string): Promise<ResolvedConfig> {
    // Find config file
    const configInfo = configPath
      ? this.getConfigInfo(configPath)
      : this.findConfigFile();

    if (!configInfo) {
      return this.createDefaultConfig();
    }

    // Load raw config
    const rawConfig = this.loadFile(configInfo);

    // Resolve with inheritance, env, and conditionals
    const resolved = await this.resolve(rawConfig, dirname(configInfo.path));

    return resolved;
  }

  /**
   * Find config file in directory
   */
  findConfigFile(): ConfigFileInfo | null {
    // Check standard config files
    for (const fileName of CONFIG_FILES) {
      const filePath = join(this.options.cwd, fileName);
      if (existsSync(filePath)) {
        return this.getConfigInfo(filePath);
      }
    }

    // Check package.json for 'precommit' field
    const packageJsonPath = join(this.options.cwd, 'package.json');
    if (existsSync(packageJsonPath)) {
      try {
        const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        if (pkg.precommit) {
          return {
            path: packageJsonPath,
            format: 'package',
            isPackageJson: true,
          };
        }
      } catch {
        // Ignore parse errors
      }
    }

    return null;
  }

  /**
   * Get config file info from path
   */
  private getConfigInfo(filePath: string): ConfigFileInfo {
    const absolutePath = isAbsolute(filePath)
      ? filePath
      : resolve(this.options.cwd, filePath);

    let format: ConfigFileInfo['format'] = 'json';
    if (filePath.endsWith('.js')) format = 'js';
    else if (filePath.endsWith('.ts')) format = 'ts';
    else if (filePath.includes('package.json')) format = 'package';

    return {
      path: absolutePath,
      format,
      isPackageJson: format === 'package',
    };
  }

  /**
   * Load config file
   */
  private loadFile(info: ConfigFileInfo): ExtendedConfig {
    // Check cache
    if (this.cache.has(info.path)) {
      return this.cache.get(info.path)!;
    }

    let config: ExtendedConfig;

    if (info.format === 'json' || info.format === 'package') {
      const content = readFileSync(info.path, 'utf-8');
      const parsed = JSON.parse(content);
      config = info.isPackageJson ? parsed.precommit : parsed;
    } else {
      // JS/TS config not implemented yet
      throw new ConfigValidationError(`Config format not supported: ${info.format}`);
    }

    this.cache.set(info.path, config);
    return config;
  }

  /**
   * Resolve configuration with inheritance and processing
   */
  private async resolve(
    config: ExtendedConfig,
    basePath: string
  ): Promise<ResolvedConfig> {
    let resolved: ExtendedConfig = { ...config };
    const sources: string[] = [basePath];

    // 1. Process extends
    if (config.extends) {
      resolved = await this.processExtends(config, basePath, sources);
    }

    // 2. Merge $env defaults into environment
    const envDefaults = resolved.$env || {};
    const interpolationEnv = { ...envDefaults, ...this.options.env };

    // 3. Interpolate environment variables
    resolved = interpolateObject(resolved, {
      env: interpolationEnv,
      strict: false,
    });

    // 4. Apply conditionals
    resolved = await this.applyConditionals(resolved);

    // 5. Create resolved config
    return {
      ...DEFAULT_CONFIG,
      ...resolved,
      _sources: sources,
      _presets: new Map(),
      _pipeline: resolved.pipeline,
      _resolvedEnv: interpolationEnv,
    };
  }

  /**
   * Process extends inheritance
   */
  private async processExtends(
    config: ExtendedConfig,
    basePath: string,
    sources: string[]
  ): Promise<ExtendedConfig> {
    const extendsList = Array.isArray(config.extends)
      ? config.extends
      : [config.extends!];

    let result: ExtendedConfig = { ...config };
    delete result.extends;

    for (const extend of extendsList) {
      const parentConfig = await this.loadExtend(extend, basePath);
      sources.push(extend);

      // Recursively resolve parent
      const resolvedParent = await this.resolve(parentConfig, basePath);

      // Merge: parent first, then current (current wins)
      result = this.deepMerge(resolvedParent, result);
    }

    return result;
  }

  /**
   * Load an extends reference
   */
  private async loadExtend(extend: string, basePath: string): Promise<ExtendedConfig> {
    // Preset shorthand: preset:name
    if (extend.startsWith('preset:')) {
      const presetName = extend.replace('preset:', '');
      return this.loadPresetConfig(presetName);
    }

    // Relative path
    if (extend.startsWith('./') || extend.startsWith('../')) {
      const filePath = resolve(basePath, extend);
      return this.loadFile(this.getConfigInfo(filePath));
    }

    // Absolute path
    if (isAbsolute(extend)) {
      return this.loadFile(this.getConfigInfo(extend));
    }

    // npm package
    try {
      // Try to find package's precommit config
      const packagePath = require.resolve(`${extend}/package.json`, {
        paths: [this.options.cwd],
      });
      const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'));

      if (pkg.precommit) {
        return pkg.precommit;
      }

      // Look for config file in package
      const packageDir = dirname(packagePath);
      for (const fileName of CONFIG_FILES) {
        const configPath = join(packageDir, fileName);
        if (existsSync(configPath)) {
          return this.loadFile(this.getConfigInfo(configPath));
        }
      }

      throw new ConfigValidationError(`No precommit config found in: ${extend}`);
    } catch (error) {
      if (error instanceof ConfigValidationError) throw error;
      throw new ConfigValidationError(`Cannot resolve extends: ${extend}`);
    }
  }

  /**
   * Load preset-specific config
   */
  private loadPresetConfig(presetName: string): ExtendedConfig {
    // Built-in preset configs with preset-specific options
    const presetConfigs: Record<string, ExtendedConfig & Record<string, unknown>> = {
      recommended: {
        preset: 'folder-based',
        enabled: true,
        logFile: '.commit-logs/violations.log',
        presets: {
          'folder-based': {
            depth: 3,
            maxFiles: 50,
            ignorePaths: [
              'package.json',
              'package-lock.json',
              'tsconfig.json',
              '.gitignore',
              'README.md',
              'CHANGELOG.md',
            ],
          },
        },
      },
      strict: {
        preset: 'folder-based',
        enabled: true,
        logFile: '.commit-logs/violations.log',
        presets: {
          'folder-based': {
            depth: 2,
            maxFiles: 20,
            ignorePaths: ['package.json', 'package-lock.json'],
          },
        },
      },
      relaxed: {
        preset: 'folder-based',
        enabled: true,
        logFile: '.commit-logs/violations.log',
        presets: {
          'folder-based': {
            depth: 5,
            maxFiles: 100,
            ignorePaths: [
              'package.json',
              'package-lock.json',
              '*.md',
              '*.json',
            ],
          },
        },
      },
    };

    const config = presetConfigs[presetName];
    if (!config) {
      throw new ConfigValidationError(`Unknown preset config: ${presetName}`);
    }

    return config as ExtendedConfig;
  }

  /**
   * Apply conditional configurations
   */
  private async applyConditionals(config: ExtendedConfig): Promise<ExtendedConfig> {
    if (!config.conditionals || config.conditionals.length === 0) {
      return config;
    }

    let result = { ...config };

    for (const conditional of config.conditionals) {
      if (await this.matchCondition(conditional.when)) {
        result = this.deepMerge(result, conditional.config as ExtendedConfig);
      }
    }

    // Remove conditionals from final config
    delete result.conditionals;

    return result;
  }

  /**
   * Check if condition matches current context
   */
  private async matchCondition(
    when: ConditionalConfig['when']
  ): Promise<boolean> {
    // Branch matching
    if (when.branch) {
      const branches = Array.isArray(when.branch) ? when.branch : [when.branch];
      const currentBranch = this.options.branch || (await this.getCurrentBranch());

      const matches = branches.some((pattern) => this.matchPattern(currentBranch, pattern));
      if (!matches) return false;
    }

    // Environment matching
    if (when.env) {
      const env = { ...process.env, ...this.options.env };
      for (const [key, value] of Object.entries(when.env)) {
        if (env[key] !== value) return false;
      }
    }

    // File pattern matching
    if (when.files && when.files.length > 0) {
      const hasMatch = this.options.stagedFiles.some((file) =>
        when.files!.some((pattern) => this.matchPattern(file, pattern))
      );
      if (!hasMatch) return false;
    }

    return true;
  }

  /**
   * Get current git branch
   */
  private async getCurrentBranch(): Promise<string> {
    try {
      const { execSync } = await import('child_process');
      return execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
    } catch {
      return '';
    }
  }

  /**
   * Simple pattern matching
   */
  private matchPattern(value: string, pattern: string): boolean {
    const regex = new RegExp(
      '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
    );
    return regex.test(value);
  }

  /**
   * Deep merge two configs
   */
  private deepMerge<T extends object>(target: T, source: Partial<T>): T {
    const result = { ...target };

    for (const key of Object.keys(source) as (keyof T)[]) {
      const sourceValue = source[key];
      const targetValue = target[key];

      if (sourceValue === undefined) continue;

      if (Array.isArray(sourceValue)) {
        // Concatenate arrays
        (result as Record<string, unknown>)[key as string] = [
          ...(Array.isArray(targetValue) ? targetValue : []),
          ...sourceValue,
        ];
      } else if (
        sourceValue &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue) &&
        targetValue &&
        typeof targetValue === 'object'
      ) {
        // Recursively merge objects
        (result as Record<string, unknown>)[key as string] = this.deepMerge(
          targetValue as object,
          sourceValue as object
        );
      } else {
        // Override value
        (result as Record<string, unknown>)[key as string] = sourceValue;
      }
    }

    return result;
  }

  /**
   * Create default config
   */
  private createDefaultConfig(): ResolvedConfig {
    return {
      ...DEFAULT_CONFIG,
      _sources: [],
      _presets: new Map(),
    };
  }
}

/**
 * Create a config loader with options
 */
export function createConfigLoader(options?: ConfigLoaderOptions): ConfigLoader {
  return new ConfigLoader(options);
}

/**
 * Load configuration with default options
 */
export async function loadExtendedConfig(
  configPath?: string,
  options?: ConfigLoaderOptions
): Promise<ResolvedConfig> {
  const loader = new ConfigLoader(options);
  return loader.load(configPath);
}
