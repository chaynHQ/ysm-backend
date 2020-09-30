import { Logger as NestLogger } from '@nestjs/common';

export class Logger extends NestLogger {
  error(message: string, trace?: string): void {
    const taggedMessage = `[error] ${message}`;
    super.error(taggedMessage, trace);
  }
}
