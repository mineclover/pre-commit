import { existsSync } from 'fs';
import { loadConfig, DEFAULT_CONFIG } from '../config.js';
import { printHeader, printFooter, printSuccess, printWarning, printError, printInfo } from '../utils/console.js';
import { CONFIG_FILE } from '../constants.js';
import { getErrorMessage } from '../utils/error.js';
import { getMessages, formatMessage } from '../messages.js';

/**
 * Check if a path is a glob pattern
 */
function isGlobPattern(path: string): boolean {
  return path.includes('*') || path.includes('?');
}

/**
 * Validate configuration file and check for potential issues
 */
export function validateConfigCommand(): void {
  // Load config first to get language, fallback to EN if fails
  let messages = getMessages('en');
  try {
    const tempConfig = loadConfig();
    messages = getMessages(tempConfig.language);
  } catch {
    // Use default messages
  }

  printHeader('Configuration Validation', '🔍');

  // Check if config file exists
  if (!existsSync(CONFIG_FILE)) {
    printWarning(formatMessage(messages.configNotFound, { file: CONFIG_FILE }));
    console.log(`\n${messages.defaultConfig}:`);
    console.log(JSON.stringify(DEFAULT_CONFIG, null, 2));
    printFooter();
    printInfo(messages.runInit);
    return;
  }

  // Try to load and validate config
  try {
    const config = loadConfig();
    messages = getMessages(config.language);
    printSuccess(messages.configValid);
    console.log('');

    // Check ignorePaths
    let missingPaths = 0;
    let validPaths = 0;
    let globPatterns = 0;

    if (config.ignorePaths.length > 0) {
      console.log(`${messages.ignoredPaths}:`);
      for (const ignorePath of config.ignorePaths) {
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

    // Summary
    console.log(`${messages.summary}:`);
    console.log(`  - ${messages.depth.split(':')[0]}: ${config.depth}`);
    console.log(`  - ${messages.maxFilesLabel}: ${config.maxFiles ?? messages.unlimited}`);
    console.log(`  - ${messages.languageLabel}: ${config.language ?? 'en'}`);
    console.log(`  - ${messages.verboseLabel}: ${config.verbose ? messages.enabled : messages.disabled}`);
    console.log(`  - ${messages.logFileLabel}: ${config.logFile}`);

    const pathSummary = [];
    if (validPaths > 0) pathSummary.push(formatMessage(messages.pathsValid, { count: validPaths }));
    if (globPatterns > 0) pathSummary.push(formatMessage(messages.pathsPatterns, { count: globPatterns }));
    if (missingPaths > 0) pathSummary.push(formatMessage(messages.pathsMissing, { count: missingPaths }));
    console.log(`  - ${messages.ignoredPaths}: ${pathSummary.join(', ') || messages.pathsNone}`);

    if (missingPaths > 0) {
      console.log('');
      printWarning(formatMessage(messages.missingPathsWarning, { count: missingPaths }));
    }

    printFooter();
  } catch (error: unknown) {
    printError(`${messages.configError}: ${getErrorMessage(error)}`);
    printFooter();
    process.exit(1);
  }
}
