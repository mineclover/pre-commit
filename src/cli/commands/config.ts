/**
 * Config command - displays current configuration
 */

import { loadConfig } from '../../core/config.js';
import { printHeader, printFooter, printError } from '../../core/utils/console.js';

export function configCommand(): void {
  try {
    const config = loadConfig();
    printHeader('Current Configuration', '⚙️');
    console.log(JSON.stringify(config, null, 2));
    printFooter();
  } catch (error) {
    printError(`Error loading config: ${error}`);
    process.exit(1);
  }
}
