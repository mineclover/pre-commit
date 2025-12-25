import { SEPARATOR_WIDTH, SEPARATOR_CHAR } from '../constants.js';

/** Verbose mode flag (set by setVerbose) */
let verboseMode = false;

/**
 * Enable or disable verbose mode
 */
export function setVerbose(enabled: boolean): void {
  verboseMode = enabled;
}

/**
 * Print verbose message (only when verbose mode is enabled)
 */
export function printVerbose(message: string): void {
  if (verboseMode) {
    console.log(`[verbose] ${message}`);
  }
}

/**
 * Print a separator line
 */
function printSeparator(): void {
  console.log(SEPARATOR_CHAR.repeat(SEPARATOR_WIDTH));
}

/**
 * Print a section header with title
 */
export function printHeader(title: string, emoji?: string): void {
  console.log('');
  if (emoji) {
    console.log(`${emoji} ${title}\n`);
  } else {
    console.log(`${title}\n`);
  }
  printSeparator();
}

/**
 * Print a section footer
 */
export function printFooter(): void {
  printSeparator();
  console.log('');
}

/**
 * Print a list item
 */
export function printListItem(item: string, indent: number = 2): void {
  const indentStr = ' '.repeat(indent);
  console.log(`${indentStr}- ${item}`);
}

/**
 * Print success message
 */
export function printSuccess(message: string): void {
  console.log(`✅ ${message}`);
}

/**
 * Print error message
 */
export function printError(message: string): void {
  console.error(`❌ ${message}`);
}

/**
 * Print warning message
 */
export function printWarning(message: string): void {
  console.log(`⚠️  ${message}`);
}

/**
 * Print info message
 */
export function printInfo(message: string): void {
  console.log(`ℹ️  ${message}`);
}
