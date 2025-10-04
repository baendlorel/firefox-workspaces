class Storage {
  localGet(): Promise<Local>;
  localGet<T extends LocalKey>(key: T): Promise<{ [K in T]: Local[T] }>;
  localGet<T extends LocalKey[]>(...keys: T): Promise<PartialLocal<T>>;
  localGet(...args: LocalKey[]): Promise<any> {
    if (args.length === 0) {
      return browser.storage.local.get();
    }
    return browser.storage.local.get([...args, 'timestamp']); // always get timestamp
  }

  localPersistSet(data: Partial<Persist>) {
    data.timestamp = Date.now();
    return browser.storage.local.set(data);
  }

  localStateSet(state: Partial<State>) {
    return browser.storage.local.set(state);
  }

  syncGet(): Promise<Persist> {
    return browser.storage.sync.get() as any;
  }

  syncSet(persist: Persist) {
    persist.timestamp = Date.now();
    return browser.storage.sync.set(persist);
  }
}

export const store = new Storage();
