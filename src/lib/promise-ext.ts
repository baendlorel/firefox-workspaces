import { Sym } from './consts.js';

type ValueGetter<V> = V | PromiseLike<V> | (() => V | PromiseLike<V>);

declare global {
  interface Promise<T> {
    fallback<S>(message?: string): Promise<T | typeof Sym.Reject>;
    fallback<S>(message: string, value: ValueGetter<S>): Promise<T | S>;
    fallbackWithDialog<S>(message: string): Promise<T | typeof Sym.Reject>;
    fallbackWithDialog<S>(message: string, value: ValueGetter<S>): Promise<T | S>;
  }

  interface PromiseConstructor {
    create<T>(): {
      promise: Promise<T>;
      resolve: (value: T | PromiseLike<T>) => any;
      reject: (reason?: any) => any;
    };

    dialogDanger: (message: string, title?: string) => Promise<void>;
  }
}

Promise.prototype.fallback = function <S = typeof Sym.Reject>(
  this: Promise<any>,
  ...args: any[]
): Promise<S> {
  let message: string = '';
  let value: any = Sym.Reject;

  if (args.length === 1) {
    message = args[0] as string;
  }

  if (args.length === 2) {
    message = args[0] as string;
    value = args[1];
  }

  return Promise.prototype.catch.call(this, (error: unknown) => {
    if (message) {
      logger.debug(message, error);
    } else {
      logger.debug(error);
    }
    return typeof value === 'function' ? value() : value;
  });
};

Promise.create = <T>() => {
  let resolve: (value: T | PromiseLike<T>) => void = null as any;
  let reject: (reason?: any) => void = null as any;
  const promise = new Promise<T>((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });

  return {
    promise,
    resolve,
    reject,
  };
};

Promise.prototype.fallbackWithDialog = function <S = typeof Sym.Reject>(
  this: Promise<any>,
  message: string,
  value: any = Sym.Reject
): Promise<S> {
  return Promise.prototype.catch.call(this, (error: unknown) => {
    if (message) {
      logger.debug(message, error);
      Promise.dialogDanger(message);
    } else {
      logger.debug(error);
    }
    return typeof value === 'function' ? value() : value;
  });
};
