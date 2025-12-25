#!/usr/bin/env node
import {
  checkCommand,
  statusCommand,
  configCommand,
  initCommand,
  cleanupCommand,
  logsCommand,
  statsCommand,
  installCommand,
  helpCommand,
  validateConfigCommand
} from './commands/index.js';
import { handleFatalError } from './utils/error.js';
import { getVersion } from './utils/version.js';
import { loadConfig } from './config.js';
import { getMessages } from './messages.js';

type CommandHandler = (args: string[]) => void | Promise<void>;

const COMMANDS: Record<string, CommandHandler> = {
  check: (args) => checkCommand(args),
  status: () => statusCommand(),
  config: () => configCommand(),
  init: () => initCommand(),
  cleanup: (args) => cleanupCommand(args),
  logs: () => logsCommand(),
  stats: (args) => statsCommand(args),
  install: () => installCommand(),
  'validate-config': () => validateConfigCommand(),
  help: () => helpCommand()
};

/** Version flags */
const VERSION_FLAGS = ['--version', '-v', '-V'];

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // Handle version flag
  if (args.length > 0 && VERSION_FLAGS.includes(args[0])) {
    console.log(`pre-commit-folder-enforcer v${getVersion()}`);
    process.exit(0);
  }

  const command = args[0] || 'help';
  const commandArgs = args.slice(1);

  const handler = COMMANDS[command];

  if (handler) {
    try {
      await handler(commandArgs);
    } catch (error: unknown) {
      handleFatalError(error, 'Command execution failed');
    }
  } else {
    let messages = getMessages('en');
    try {
      const config = loadConfig();
      messages = getMessages(config.language);
    } catch {
      // Use default
    }
    console.error(`${messages.unknownCommand}: ${command}\n`);
    helpCommand();
    process.exit(1);
  }
}

main();
