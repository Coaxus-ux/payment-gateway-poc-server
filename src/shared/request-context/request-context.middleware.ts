import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { RequestContextStore } from './request-context';

export const REQUEST_ID_HEADER = 'x-request-id';

export function requestContextMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const requestId =
    (req.header(REQUEST_ID_HEADER) ?? '').trim() || randomUUID();
  res.setHeader(REQUEST_ID_HEADER, requestId);

  RequestContextStore.run({ requestId }, () => next());
}
