/**
 * Config command - displays current configuration
 */

import { loadConfig } from '../../core/config.js';

export function configCommand(): void {
  try {
    const config = loadConfig();
    console.log('\n⚙️  Current Configuration\n');
    console.log(JSON.stringify(config, null, 2));
    console.log('\n');
  } catch (error) {
    console.error('Error loading config:', error);
    process.exit(1);
  }
}
