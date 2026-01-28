import { LoggerService } from '@nestjs/common';
import { RequestContextStore } from '../request-context/request-context';

function maskSensitive(input: unknown): unknown {
  if (typeof input === 'string') {
    return input.replace(/\b(\d{6})\d{6,9}(\d{4})\b/g, '$1******$2');
  }
  return input;
}

function withRequestId(message: unknown): string {
  const requestId = RequestContextStore.get()?.requestId;
  const suffix = requestId ? ` request_id=${requestId}` : '';
  return `${String(message)}${suffix}`;
}

export class AppLogger implements LoggerService {
  log(message: unknown, ...optionalParams: unknown[]): void {
    console.log(withRequestId(maskSensitive(message)), ...optionalParams);
  }

  error(message: unknown, ...optionalParams: unknown[]): void {
    console.error(withRequestId(maskSensitive(message)), ...optionalParams);
  }

  warn(message: unknown, ...optionalParams: unknown[]): void {
    console.warn(withRequestId(maskSensitive(message)), ...optionalParams);
  }

  debug?(message: unknown, ...optionalParams: unknown[]): void {
    console.debug(withRequestId(maskSensitive(message)), ...optionalParams);
  }

  verbose?(message: unknown, ...optionalParams: unknown[]): void {
    console.info(withRequestId(maskSensitive(message)), ...optionalParams);
  }
}
