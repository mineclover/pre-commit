import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

/**
 * Get the package version from package.json
 * @returns Version string (e.g., "1.4.1")
 */
export function getVersion(): string {
  try {
    // Get the directory of this module
    const __dirname = dirname(fileURLToPath(import.meta.url));
    // Navigate to package.json (from dist/utils/ to project root)
    const packagePath = join(__dirname, '..', '..', 'package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
    return packageJson.version || 'unknown';
  } catch {
    return 'unknown';
  }
}
