import { Logger } from '@nestjs/common';

class AppLogger extends Logger {
  log(context: string, message: string, ...args: unknown[]) {
    super.log(`[${context}] ${message}`, ...args);
  }
  warn(context: string, message: string, ...args: unknown[]) {
    super.warn(`[${context}] ${message}`, ...args);
  }
  error(context: string, message: string, ...args: unknown[]) {
    super.error(`[${context}] ${message}`, ...args);
  }
}

export const logger = new AppLogger();
