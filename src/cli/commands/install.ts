/**
 * Install command - installs husky hooks
 */

import { existsSync, mkdirSync, writeFileSync, chmodSync } from 'fs';
import { loadConfig } from '../../core/config.js';
import { HUSKY_DIR, HOOKS } from '../../core/constants.js';
import { getMessages } from '../../core/messages.js';
import {
  printHeader,
  printFooter,
  printSuccess,
  printError,
  printInfo,
} from '../../core/utils/console.js';

export function installCommand(): void {
  let messages = getMessages('en');
  try {
    const config = loadConfig();
    messages = getMessages(config.language);
  } catch {
    // Use default messages
  }

  printHeader('Installing Husky Hooks', '🔧');

  try {
    // Create .husky directory if not exists
    if (!existsSync(HUSKY_DIR)) {
      mkdirSync(HUSKY_DIR, { recursive: true });
      printInfo(messages.createdHuskyDir);
    }

    // Write each hook file
    for (const [hookName, content] of Object.entries(HOOKS)) {
      const hookPath = `${HUSKY_DIR}/${hookName}`;

      try {
        writeFileSync(hookPath, content + '\n', 'utf-8');
        chmodSync(hookPath, 0o755);
        printSuccess(`Installed ${hookName}`);
      } catch (error) {
        printError(`Failed to install ${hookName}: ${error}`);
        process.exit(1);
      }
    }

    printFooter();
    printSuccess('Husky hooks installed successfully!\n');
    console.log(`${messages.nextSteps}:`);
    console.log(`  1. ${messages.installStep1}`);
    console.log(`  2. ${messages.installStep2}`);
    console.log(`  3. ${messages.installStep3}\n`);
  } catch (error) {
    printError(`Failed to create ${HUSKY_DIR}: ${error}`);
    process.exit(1);
  }
}
