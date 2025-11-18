import { mkdirSync, appendFileSync, existsSync, unlinkSync } from 'fs';
import { dirname } from 'path';

export class Logger {
  private logPath: string;

  constructor(logPath: string) {
    this.logPath = logPath;
    this.ensureLogDirectory();
  }

  private ensureLogDirectory(): void {
    const dir = dirname(this.logPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  log(message: string): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    appendFileSync(this.logPath, logEntry, 'utf-8');
  }

  clear(): void {
    if (existsSync(this.logPath)) {
      unlinkSync(this.logPath);
    }
  }

  logViolation(files: string[], errors: string[]): void {
    this.log('=== COMMIT VIOLATION ===');
    this.log(`Staged files: ${files.join(', ')}`);
    errors.forEach(error => this.log(`ERROR: ${error}`));
    this.log('========================\n');
  }
}
