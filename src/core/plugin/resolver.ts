/**
 * @module core/plugin/resolver
 * @description Plugin path resolution utilities
 */

import { existsSync, readFileSync } from 'fs';
import { join, resolve, isAbsolute, dirname } from 'path';
import { createRequire } from 'module';
import type {
  ResolvedPlugin,
  PluginManifest,
  PluginMetadata,
  PluginResolverOptions,
  PluginSource,
} from './types.js';
import { PluginResolveError } from '../errors.js';

/**
 * Resolves plugin specifiers to their full paths and metadata
 */
export class PluginResolver {
  private readonly cwd: string;
  private readonly searchPaths: string[];
  private readonly require: NodeRequire;

  constructor(options: PluginResolverOptions = {}) {
    this.cwd = options.cwd || process.cwd();
    this.searchPaths = options.searchPaths || [];
    this.require = createRequire(join(this.cwd, 'package.json'));
  }

  /**
   * Resolve a plugin specifier to full path and metadata
   * @param specifier - Plugin specifier (local path, npm package, or builtin)
   * @returns Resolved plugin information
   * @throws {PluginResolveError} If plugin cannot be resolved
   */
  resolve(specifier: string): ResolvedPlugin {
    // Check for builtin preset
    if (this.isBuiltin(specifier)) {
      return this.resolveBuiltin(specifier);
    }

    // Check if it's a local file path
    if (this.isLocalPath(specifier)) {
      return this.resolveLocal(specifier);
    }

    // Assume it's an npm package
    return this.resolveNpm(specifier);
  }

  /**
   * Check if specifier refers to a builtin preset
   */
  private isBuiltin(specifier: string): boolean {
    const builtins = ['folder-based', 'conventional-commits'];
    return builtins.includes(specifier);
  }

  /**
   * Check if specifier is a local path
   */
  private isLocalPath(specifier: string): boolean {
    return (
      specifier.startsWith('./') ||
      specifier.startsWith('../') ||
      specifier.startsWith('/') ||
      isAbsolute(specifier)
    );
  }

  /**
   * Resolve builtin preset
   */
  private resolveBuiltin(specifier: string): ResolvedPlugin {
    const presetPath = resolve(
      dirname(new URL(import.meta.url).pathname),
      '../../presets',
      specifier
    );

    if (!existsSync(presetPath)) {
      throw new PluginResolveError(
        `Builtin preset not found: ${specifier}`,
        specifier
      );
    }

    return {
      path: presetPath,
      metadata: {
        name: specifier,
        version: '1.0.0',
        description: `Builtin ${specifier} preset`,
      },
      manifest: {
        precommit: {
          preset: 'preset.js',
        },
      },
      source: 'builtin',
    };
  }

  /**
   * Resolve local file path
   */
  private resolveLocal(specifier: string): ResolvedPlugin {
    const absolutePath = isAbsolute(specifier)
      ? specifier
      : resolve(this.cwd, specifier);

    // Check if path exists
    if (!existsSync(absolutePath)) {
      // Try with additional search paths
      for (const searchPath of this.searchPaths) {
        const altPath = resolve(searchPath, specifier);
        if (existsSync(altPath)) {
          return this.resolveLocalPath(altPath, specifier);
        }
      }
      throw new PluginResolveError(
        `Local plugin not found: ${specifier}`,
        specifier
      );
    }

    return this.resolveLocalPath(absolutePath, specifier);
  }

  /**
   * Resolve local path to plugin info
   */
  private resolveLocalPath(absolutePath: string, specifier: string): ResolvedPlugin {
    const metadata = this.loadMetadata(absolutePath) || {
      name: specifier,
      version: '0.0.0',
      description: 'Local plugin',
    };

    const manifest = this.loadManifest(absolutePath);

    return {
      path: absolutePath,
      metadata,
      manifest,
      source: 'local',
    };
  }

  /**
   * Resolve npm package
   */
  private resolveNpm(specifier: string): ResolvedPlugin {
    try {
      // Try to resolve package.json
      const packageJsonPath = this.require.resolve(`${specifier}/package.json`);
      const packageDir = dirname(packageJsonPath);
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

      const metadata: PluginMetadata = {
        name: packageJson.name || specifier,
        version: packageJson.version || '0.0.0',
        description: packageJson.description || '',
        author: packageJson.author,
        repository: typeof packageJson.repository === 'string'
          ? packageJson.repository
          : packageJson.repository?.url,
        keywords: packageJson.keywords,
      };

      const manifest = this.extractManifest(packageJson, packageDir);

      return {
        path: packageDir,
        metadata,
        manifest,
        source: 'npm',
      };
    } catch (error) {
      throw new PluginResolveError(
        `NPM package not found: ${specifier}`,
        specifier,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Load metadata from package.json if exists
   */
  private loadMetadata(pluginPath: string): PluginMetadata | null {
    const packageJsonPath = join(pluginPath, 'package.json');
    if (!existsSync(packageJsonPath)) {
      return null;
    }

    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      return {
        name: packageJson.name || 'unknown',
        version: packageJson.version || '0.0.0',
        description: packageJson.description || '',
        author: packageJson.author,
        repository: typeof packageJson.repository === 'string'
          ? packageJson.repository
          : packageJson.repository?.url,
        keywords: packageJson.keywords,
      };
    } catch {
      return null;
    }
  }

  /**
   * Load manifest from plugin directory
   */
  private loadManifest(pluginPath: string): PluginManifest {
    // Check for package.json with precommit field
    const packageJsonPath = join(pluginPath, 'package.json');
    if (existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        if (packageJson.precommit) {
          return { precommit: packageJson.precommit };
        }
      } catch {
        // Continue to check other options
      }
    }

    // Check for plugin.json
    const pluginJsonPath = join(pluginPath, 'plugin.json');
    if (existsSync(pluginJsonPath)) {
      try {
        return JSON.parse(readFileSync(pluginJsonPath, 'utf-8'));
      } catch {
        // Continue to default
      }
    }

    // Default: assume index.js or preset.js is the entry
    const defaultEntry = existsSync(join(pluginPath, 'preset.js'))
      ? 'preset.js'
      : existsSync(join(pluginPath, 'preset.ts'))
        ? 'preset.ts'
        : 'index.js';

    return {
      precommit: {
        preset: defaultEntry,
      },
    };
  }

  /**
   * Extract manifest from package.json
   */
  private extractManifest(packageJson: Record<string, unknown>, packageDir: string): PluginManifest {
    // Check for precommit field in package.json
    if (packageJson.precommit && typeof packageJson.precommit === 'object') {
      return { precommit: packageJson.precommit as PluginManifest['precommit'] };
    }

    // Default: use main or index.js
    const main = (packageJson.main as string) || 'index.js';
    return {
      precommit: {
        preset: main,
      },
    };
  }
}

/**
 * Create a new plugin resolver with default options
 */
export function createResolver(options?: PluginResolverOptions): PluginResolver {
  return new PluginResolver(options);
}
