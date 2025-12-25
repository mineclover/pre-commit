import { loadConfig } from '../config.js';
import { Logger } from '../logger.js';
import { printHeader, printFooter } from '../utils/console.js';
import { getMessages, formatMessage } from '../messages.js';

export function cleanupCommand(args: string[]): void {
  const config = loadConfig();
  const messages = getMessages(config.language);
  const logger = new Logger(config.logFile, config.logMaxAgeHours);
  const cleanAll = args.includes('--all');

  printHeader('Log Cleanup', '🗑️');

  let deletedCount: number;
  if (cleanAll) {
    deletedCount = logger.cleanupAll();
    console.log(`${messages.cleanedAll}: ${formatMessage(messages.filesDeleted, { count: deletedCount })}`);
  } else {
    deletedCount = logger.cleanupOldLogs();
    console.log(`${formatMessage(messages.cleanedOld, { hours: config.logMaxAgeHours ?? 24 })}: ${formatMessage(messages.filesDeleted, { count: deletedCount })}`);
  }

  printFooter();
}
