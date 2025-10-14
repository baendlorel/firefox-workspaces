import { $sleep } from './utils.js';

type Until = (result: any) => boolean;

/**
 * Try something until a condition is met
 * @param fn The function to try
 * @param until The condition to meet, passed the result of fn
 * @param interval in seconds
 * @param count How many times to try, default 10
 * @returns The result of the function when the condition is met
 */
export async function tryUntil(fn: AnyFn, until: Until, interval = 1, count = 10): Promise<any> {
  const result = await fn();
  const meet = await until(result);
  if (meet) {
    return result;
  }

  if (count <= 0) {
    return null;
  }

  await $sleep(interval * 1000);
  return tryUntil(fn, until, interval, count - 1);
}
