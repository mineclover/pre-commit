import { writeFileSync, mkdirSync, existsSync, chmodSync } from 'fs';
import { printHeader, printFooter, printSuccess, printError } from '../utils/console.js';
import { HUSKY_DIR, HOOKS } from '../constants.js';
import { getErrorMessage } from '../utils/error.js';
import { loadConfig } from '../config.js';
import { getMessages } from '../messages.js';

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
      console.log(`📁 ${messages.createdHuskyDir}`);
    }

    // Write each hook file
    for (const [hookName, content] of Object.entries(HOOKS)) {
      const hookPath = `${HUSKY_DIR}/${hookName}`;

      try {
        writeFileSync(hookPath, content + '\n', 'utf-8');
        chmodSync(hookPath, 0o755);
        printSuccess(`Installed ${hookName}`);
      } catch (error: unknown) {
        printError(`Failed to install ${hookName}: ${getErrorMessage(error)}`);
        process.exit(1);
      }
    }

    printFooter();
    console.log('');
    printSuccess('Husky hooks installed successfully!\n');
    console.log(`${messages.nextSteps}:`);
    console.log(`  1. ${messages.installStep1}`);
    console.log(`  2. ${messages.installStep2}`);
    console.log(`  3. ${messages.installStep3}\n`);
  } catch (error: unknown) {
    printError(`Failed to create ${HUSKY_DIR}: ${getErrorMessage(error)}`);
    process.exit(1);
  }
}
