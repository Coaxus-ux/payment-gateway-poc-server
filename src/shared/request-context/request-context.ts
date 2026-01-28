import { AsyncLocalStorage } from 'node:async_hooks';

export type RequestContext = {
  requestId: string;
};

const storage = new AsyncLocalStorage<RequestContext>();

export const RequestContextStore = {
  run<T>(context: RequestContext, fn: () => T): T {
    return storage.run(context, fn);
  },
  get(): RequestContext | undefined {
    return storage.getStore();
  },
};
