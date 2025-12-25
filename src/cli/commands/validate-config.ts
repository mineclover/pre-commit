/**
 * Validate-config command - validates configuration file
 */

import { existsSync } from 'fs';
import { loadConfig } from '../../core/config.js';
import { CONFIG_FILE } from '../../core/constants.js';
import { isGlobPattern } from '../../core/utils/glob.js';
import { getMessages, formatMessage } from '../../core/messages.js';
import type { FolderBasedConfig } from '../../presets/folder-based/types.js';

export function validateConfigCommand(): void {
  let messages = getMessages('en');
  try {
    const tempConfig = loadConfig();
    messages = getMessages(tempConfig.language);
  } catch {
    // Use default messages
  }

  console.log('\n🔍 Configuration Validation\n');
  console.log('━'.repeat(60));

  // Check if config file exists
  if (!existsSync(CONFIG_FILE)) {
    console.log(`⚠️  ${formatMessage(messages.configNotFound, { file: CONFIG_FILE })}`);
    console.log(`\n${messages.defaultConfig}:`);
    const defaultConfig = {
      preset: 'folder-based',
      depth: 2,
      logFile: '.commit-logs/violations.log',
      enabled: true,
      ignorePaths: ['package.json', 'package-lock.json', 'tsconfig.json', '.gitignore', 'README.md']
    };
    console.log(JSON.stringify(defaultConfig, null, 2));
    console.log('━'.repeat(60));
    console.log(`ℹ️  ${messages.runInit}`);
    return;
  }

  try {
    const config = loadConfig();
    messages = getMessages(config.language);
    console.log(`✅ ${messages.configValid}`);
    console.log('');

    const folderConfig = config as FolderBasedConfig;
    let missingPaths = 0;
    let validPaths = 0;
    let globPatterns = 0;

    if (folderConfig.ignorePaths && folderConfig.ignorePaths.length > 0) {
      console.log(`${messages.ignoredPaths}:`);
      for (const ignorePath of folderConfig.ignorePaths) {
        if (isGlobPattern(ignorePath)) {
          console.log(`  🔍 ${ignorePath} (${messages.globPattern})`);
          globPatterns++;
        } else if (existsSync(ignorePath)) {
          console.log(`  ✅ ${ignorePath}`);
          validPaths++;
        } else {
          console.log(`  ⚠️  ${ignorePath} (${messages.notFound})`);
          missingPaths++;
        }
      }
      console.log('');
    }

    console.log(`${messages.summary}:`);
    console.log(`  - ${messages.depthSetting.split(':')[0]}: ${folderConfig.depth}`);
    console.log(`  - ${messages.maxFilesLabel}: ${folderConfig.maxFiles ?? messages.unlimited}`);
    console.log(`  - ${messages.languageLabel}: ${config.language ?? 'en'}`);
    console.log(`  - ${messages.verboseLabel}: ${folderConfig.verbose ? messages.enabled : messages.disabled}`);
    console.log(`  - ${messages.logFileLabel}: ${config.logFile}`);

    const pathSummary = [];
    if (validPaths > 0) pathSummary.push(formatMessage(messages.pathsValid, { count: validPaths }));
    if (globPatterns > 0) pathSummary.push(formatMessage(messages.pathsPatterns, { count: globPatterns }));
    if (missingPaths > 0) pathSummary.push(formatMessage(messages.pathsMissing, { count: missingPaths }));
    console.log(`  - ${messages.ignoredPaths}: ${pathSummary.join(', ') || messages.pathsNone}`);

    if (missingPaths > 0) {
      console.log('');
      console.log(`⚠️  ${formatMessage(messages.missingPathsWarning, { count: missingPaths })}`);
    }

    console.log('━'.repeat(60) + '\n');
  } catch (error) {
    console.error(`❌ ${messages.configError}: ${error}`);
    process.exit(1);
  }
}
