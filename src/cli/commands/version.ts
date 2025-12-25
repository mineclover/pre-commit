/**
 * Version command - displays package version
 */

export function getVersion(): string {
  return '1.5.0';
}

export function versionCommand(): void {
  console.log(`pre-commit-folder-enforcer v${getVersion()}`);
}
