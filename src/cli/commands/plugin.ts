/**
 * Plugin command - manage external presets
 */

import { PluginLoader } from '../../core/plugin/loader.js';
import { discoverPresets } from '../../core/registry/discovery.js';
import { PresetRegistry } from '../../presets/base/registry.js';
import {
  printHeader,
  printFooter,
  printSuccess,
  printError,
  printWarning,
  printInfo,
  printListItem,
} from '../../core/utils/console.js';

export async function pluginCommand(args: string[]): Promise<void> {
  const subCommand = args[0] || 'list';

  switch (subCommand) {
    case 'list':
      await listPlugins();
      break;
    case 'discover':
      await discoverPlugins();
      break;
    case 'info':
      await pluginInfo(args[1]);
      break;
    case 'load':
      await loadPlugin(args[1]);
      break;
    default:
      printPluginHelp();
  }
}

async function listPlugins(): Promise<void> {
  printHeader('Registered Presets', '🔌');

  const presets = PresetRegistry.list();

  if (presets.length === 0) {
    printWarning('No presets registered');
  } else {
    console.log(`Found ${presets.length} registered preset(s):\n`);
    for (const name of presets) {
      const preset = PresetRegistry.get(name);
      printListItem(`${name} - ${preset.description}`);
    }
  }

  printFooter();
}

async function discoverPlugins(): Promise<void> {
  printHeader('Discovering Plugins', '🔍');

  const discovered = discoverPresets();

  if (discovered.length === 0) {
    printInfo('No plugins found in node_modules');
    console.log('\nTo use external plugins:');
    console.log('  npm install precommit-preset-<name>');
    console.log('  npm install precommit-plugin-<name>');
  } else {
    printSuccess(`Found ${discovered.length} plugin(s):\n`);
    for (const plugin of discovered) {
      const version = plugin.version ? `@${plugin.version}` : '';
      printListItem(`${plugin.name}${version} (${plugin.source})`);
      console.log(`      Path: ${plugin.path}`);
    }
  }

  printFooter();
}

async function pluginInfo(specifier?: string): Promise<void> {
  if (!specifier) {
    printError('Usage: precommit plugin info <preset-name>');
    return;
  }

  printHeader(`Plugin Info: ${specifier}`, '📋');

  try {
    // Check if registered
    if (PresetRegistry.has(specifier)) {
      const preset = PresetRegistry.get(specifier);
      console.log(`Name: ${preset.name}`);
      console.log(`Description: ${preset.description}`);
      if (preset.version) {
        console.log(`Version: ${preset.version}`);
      }
      printSuccess('Status: Registered');
    } else {
      // Try to load it
      const loader = new PluginLoader({ validate: true });
      const loaded = await loader.load(specifier);

      console.log(`Name: ${loaded.preset.name}`);
      console.log(`Description: ${loaded.preset.description}`);
      console.log(`Source: ${loaded.resolved.source}`);
      console.log(`Path: ${loaded.resolved.path}`);
      if (loaded.resolved.metadata.version) {
        console.log(`Version: ${loaded.resolved.metadata.version}`);
      }
      printInfo('Status: Not registered (use "plugin load" to register)');
    }
  } catch (error) {
    printError(`Plugin not found: ${specifier}`);
    if (error instanceof Error) {
      console.log(`Error: ${error.message}`);
    }
  }

  printFooter();
}

async function loadPlugin(specifier?: string): Promise<void> {
  if (!specifier) {
    printError('Usage: precommit plugin load <preset-specifier>');
    console.log('\nExamples:');
    console.log('  precommit plugin load ./my-preset');
    console.log('  precommit plugin load precommit-preset-eslint');
    return;
  }

  printHeader(`Loading Plugin: ${specifier}`, '📦');

  try {
    const loader = new PluginLoader({ validate: true, cache: true });
    const loaded = await loader.load(specifier);

    // Register in static registry
    PresetRegistry.register(loaded.preset.name, loaded.preset);

    printSuccess(`Loaded: ${loaded.preset.name}`);
    console.log(`Description: ${loaded.preset.description}`);
    console.log(`Source: ${loaded.resolved.source}`);

    printInfo('\nTo use this preset, add to .precommitrc.json:');
    console.log(`  { "preset": "${loaded.preset.name}" }`);
  } catch (error) {
    printError(`Failed to load plugin: ${specifier}`);
    if (error instanceof Error) {
      console.log(`Error: ${error.message}`);
    }
  }

  printFooter();
}

function printPluginHelp(): void {
  printHeader('Plugin Commands', '🔌');

  console.log('Usage: precommit plugin <command> [options]\n');
  console.log('Commands:');
  printListItem('list        - List registered presets');
  printListItem('discover    - Discover installed plugins');
  printListItem('info <name> - Show plugin information');
  printListItem('load <spec> - Load an external plugin');

  console.log('\nExamples:');
  console.log('  precommit plugin list');
  console.log('  precommit plugin discover');
  console.log('  precommit plugin info folder-based');
  console.log('  precommit plugin load ./my-preset');
  console.log('  precommit plugin load precommit-preset-eslint');

  printFooter();
}
