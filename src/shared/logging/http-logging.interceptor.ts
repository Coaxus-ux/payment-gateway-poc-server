import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AppLogger } from './app-logger';
import { redactSensitive } from './redact';

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  private readonly logger = new AppLogger();

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const method = request?.method ?? 'UNKNOWN';
    const url = request?.originalUrl ?? request?.url ?? '';
    const startedAt = Date.now();

    const requestDetails = {
      method,
      url,
      params: request?.params ?? {},
      query: request?.query ?? {},
      body: request?.body ?? {},
      headers: request?.headers ?? {},
    };

    this.logger.log(
      `[HTTP] request ${method} ${url} ${JSON.stringify(
        redactSensitive(requestDetails),
      )}`,
    );

    return next.handle().pipe(
      tap((responseBody) => {
        const elapsedMs = Date.now() - startedAt;
        const responseDetails = {
          statusCode: request?.res?.statusCode,
          elapsedMs,
          body: responseBody,
        };
        this.logger.log(
          `[HTTP] response ${method} ${url} ${JSON.stringify(
            redactSensitive(responseDetails),
          )}`,
        );
      }),
      catchError((error) => {
        const elapsedMs = Date.now() - startedAt;
        const errorDetails = {
          statusCode: request?.res?.statusCode,
          elapsedMs,
          message: error?.message,
          response: error?.response?.data,
        };
        this.logger.error(
          `[HTTP] error ${method} ${url} ${JSON.stringify(
            redactSensitive(errorDetails),
          )}`,
        );
        throw error;
      }),
    );
  }
}
