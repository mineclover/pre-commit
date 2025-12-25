/**
 * @module core/registry/discovery
 * @description Auto-discovery of preset plugins
 */

import { existsSync, readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import type { DiscoveryOptions, DiscoveredPreset } from './types.js';

/**
 * Default patterns for preset plugin packages
 */
const DEFAULT_PATTERNS = [
  'precommit-preset-*',
  'precommit-plugin-*',
  '@*/precommit-preset-*',
  '@*/precommit-plugin-*',
];

/**
 * Discovers preset plugins in the project
 */
export class PresetDiscovery {
  private readonly patterns: string[];
  private readonly searchDirs: string[];
  private readonly includeDevDeps: boolean;

  constructor(options: DiscoveryOptions = {}) {
    this.patterns = options.patterns || DEFAULT_PATTERNS;
    this.searchDirs = options.searchDirs || [process.cwd()];
    this.includeDevDeps = options.includeDevDeps ?? true;
  }

  /**
   * Discover all preset plugins in the project
   * @returns Array of discovered presets
   */
  discover(): DiscoveredPreset[] {
    const discovered: DiscoveredPreset[] = [];

    for (const searchDir of this.searchDirs) {
      // Discover from package.json dependencies
      const fromDeps = this.discoverFromPackageJson(searchDir);
      discovered.push(...fromDeps);

      // Discover from node_modules
      const fromNodeModules = this.discoverFromNodeModules(searchDir);
      discovered.push(...fromNodeModules);
    }

    // Deduplicate by name
    const seen = new Set<string>();
    return discovered.filter((preset) => {
      if (seen.has(preset.name)) {
        return false;
      }
      seen.add(preset.name);
      return true;
    });
  }

  /**
   * Discover presets from package.json dependencies
   */
  private discoverFromPackageJson(dir: string): DiscoveredPreset[] {
    const packageJsonPath = join(dir, 'package.json');
    if (!existsSync(packageJsonPath)) {
      return [];
    }

    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      const deps = {
        ...packageJson.dependencies,
        ...(this.includeDevDeps ? packageJson.devDependencies : {}),
      };

      const discovered: DiscoveredPreset[] = [];

      for (const [name, version] of Object.entries(deps)) {
        if (this.matchesPatterns(name)) {
          const modulePath = this.resolveModulePath(dir, name);
          if (modulePath) {
            discovered.push({
              name,
              path: modulePath,
              source: 'npm',
              version: String(version).replace(/^[\^~]/, ''),
            });
          }
        }
      }

      return discovered;
    } catch {
      return [];
    }
  }

  /**
   * Discover presets from node_modules directory
   */
  private discoverFromNodeModules(dir: string): DiscoveredPreset[] {
    const nodeModulesPath = join(dir, 'node_modules');
    if (!existsSync(nodeModulesPath)) {
      return [];
    }

    const discovered: DiscoveredPreset[] = [];

    try {
      const entries = readdirSync(nodeModulesPath, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        // Handle scoped packages (@org/package)
        if (entry.name.startsWith('@')) {
          const scopePath = join(nodeModulesPath, entry.name);
          const scopedEntries = readdirSync(scopePath, { withFileTypes: true });

          for (const scopedEntry of scopedEntries) {
            if (!scopedEntry.isDirectory()) continue;

            const fullName = `${entry.name}/${scopedEntry.name}`;
            if (this.matchesPatterns(fullName)) {
              const preset = this.loadPresetInfo(
                join(scopePath, scopedEntry.name),
                fullName
              );
              if (preset) discovered.push(preset);
            }
          }
        } else {
          if (this.matchesPatterns(entry.name)) {
            const preset = this.loadPresetInfo(
              join(nodeModulesPath, entry.name),
              entry.name
            );
            if (preset) discovered.push(preset);
          }
        }
      }
    } catch {
      // Ignore errors reading node_modules
    }

    return discovered;
  }

  /**
   * Check if a package name matches discovery patterns
   */
  private matchesPatterns(name: string): boolean {
    return this.patterns.some((pattern) => {
      const regex = new RegExp(
        '^' + pattern.replace(/\*/g, '.*').replace(/\//g, '\\/') + '$'
      );
      return regex.test(name);
    });
  }

  /**
   * Resolve module path from node_modules
   */
  private resolveModulePath(baseDir: string, moduleName: string): string | null {
    const possiblePaths = [
      join(baseDir, 'node_modules', moduleName),
      join(baseDir, 'node_modules', ...moduleName.split('/')),
    ];

    for (const p of possiblePaths) {
      if (existsSync(p)) {
        return p;
      }
    }

    return null;
  }

  /**
   * Load preset information from a module path
   */
  private loadPresetInfo(modulePath: string, name: string): DiscoveredPreset | null {
    const packageJsonPath = join(modulePath, 'package.json');
    if (!existsSync(packageJsonPath)) {
      return null;
    }

    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

      // Verify it has precommit configuration
      if (!packageJson.precommit && !existsSync(join(modulePath, 'plugin.json'))) {
        // Check if it has a preset entry point
        const hasPresetFile =
          existsSync(join(modulePath, 'preset.js')) ||
          existsSync(join(modulePath, 'preset.ts')) ||
          existsSync(join(modulePath, 'dist', 'preset.js'));

        if (!hasPresetFile) {
          return null;
        }
      }

      return {
        name,
        path: modulePath,
        source: 'npm',
        version: packageJson.version,
      };
    } catch {
      return null;
    }
  }
}

/**
 * Create a new preset discovery instance
 */
export function createDiscovery(options?: DiscoveryOptions): PresetDiscovery {
  return new PresetDiscovery(options);
}

/**
 * Discover presets with default options
 */
export function discoverPresets(options?: DiscoveryOptions): DiscoveredPreset[] {
  return new PresetDiscovery(options).discover();
}
