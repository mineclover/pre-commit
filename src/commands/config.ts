import { loadConfig } from '../config.js';

export function configCommand(): void {
  const config = loadConfig();
  console.log('\n⚙️  Current Configuration\n');
  console.log(JSON.stringify(config, null, 2));
  console.log('\n');
}
