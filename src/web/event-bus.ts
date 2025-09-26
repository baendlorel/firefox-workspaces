export class EventBus<T extends Record<string, AnyFn>> {
  private listeners: { [K in keyof T]?: T[K][] } = {};

  on<K extends keyof T>(event: K, fn: T[K]) {
    (this.listeners[event] ??= []).push(fn);
  }

  off<K extends keyof T>(event: K, fn: T[K]) {
    this.listeners[event] = (this.listeners[event] ?? []).filter((cb) => cb !== fn);
  }

  /**
   * Trigger all listeners for the given event
   * @param event
   * @param args
   * @returns
   */
  emit<K extends keyof T, R = ReturnType<T[K]>>(event: K, ...args: Parameters<T[K]>): R[] {
    const handlers = this.listeners[event] as AnyFn[];
    if (!handlers || handlers.length === 0) {
      return [];
    }

    return handlers.map((fn) => fn(...args));
  }
}
