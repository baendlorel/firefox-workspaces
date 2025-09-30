import { Sym } from './consts.js';

declare global {
  interface Promise<T> {
    fallback<S>(message?: string, value?: S | PromiseLike<S>): Promise<S>;
    fallback<S>(functionName: string, message: string, value: S | PromiseLike<S>): Promise<S>;
  }
}

Promise.prototype.fallback = function <S = typeof Sym.Reject>(
  this: Promise<any>,
  ...args: any[]
): Promise<S> {
  let functionName: string = '';
  let message: string = '';
  let value = Sym.Reject;

  if (args.length === 1) {
    message = args[0] as string;
  }

  if (args.length === 2) {
    message = args[0] as string;
    value = args[1];
  }

  if (args.length === 3) {
    functionName = args[0] as string;
    message = args[1] as string;
    value = args[2];
  }

  return this.catch((error: unknown) => {
    if (message) {
      console.log('[__NAME__] ' + message, error);
    } else {
      console.log(error);
    }
    return value;
  });
};
