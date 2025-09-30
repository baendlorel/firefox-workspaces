import { danger } from '../web/components/dialog/alerts.js';
import { Sym } from './consts.js';

declare global {
  interface Promise<T> {
    fallback<S>(message?: string): Promise<T | typeof Sym.Reject>;
    fallback<S>(message: string, value: S | PromiseLike<S>): Promise<T | S>;
    fallbackWithDialog<S>(message: string): Promise<T | typeof Sym.Reject>;
    fallbackWithDialog<S>(message: string, value: S | PromiseLike<S>): Promise<T | S>;
  }
}

Promise.prototype.fallback = function <S = typeof Sym.Reject>(
  this: Promise<any>,
  ...args: any[]
): Promise<S> {
  let message: string = '';
  let value = Sym.Reject;

  if (args.length === 1) {
    message = args[0] as string;
  }

  if (args.length === 2) {
    message = args[0] as string;
    value = args[1];
  }

  return Promise.prototype.catch.call(this, (error: unknown) => {
    if (message) {
      console.debug('[__NAME__] ' + message, error);
    } else {
      console.debug(error);
    }
    return value;
  });
};

Promise.prototype.fallbackWithDialog = function <S = typeof Sym.Reject>(
  this: Promise<any>,
  message: string,
  value = Sym.Reject
): Promise<S> {
  return Promise.prototype.catch.call(this, (error: unknown) => {
    if (message) {
      console.debug('[__NAME__] ' + message, error);
      danger(message);
    } else {
      console.debug(error);
    }
    return value;
  });
};
