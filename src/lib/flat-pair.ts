export class FlatPair<K, V> {
  static add<K, V>(items: any[], key: K, value: V): any[] {
    for (let i = 0; i < items.length; i += 2) {
      if (items[i] === key) {
        return items;
      }
    }
    items.push(key, value);
    return items;
  }

  static delete<K>(items: any[], key: K): boolean {
    for (let i = 0; i < items.length; i += 2) {
      if (items[i] === key) {
        items.splice(i, 2);
        return true;
      }
    }
    return false;
  }

  static find<K, V>(items: any[], key: K): V | undefined {
    for (let i = 0; i < items.length; i += 2) {
      if (items[i] === key) {
        return items[i + 1];
      }
    }
    return undefined;
  }

  static findByValue<K, V>(items: any[], value: V): K | undefined {
    for (let i = 1; i < items.length; i += 2) {
      if (items[i] === value) {
        return items[i - 1];
      }
    }
    return undefined;
  }

  static clear(items: any[]): void {
    items.length = 0;
  }

  private readonly items: any[];
  constructor(items: any[]) {
    if (items.length % 2 !== 0) {
      throw new TypeError('FlatPair items length must be even');
    }
    this.items = items;
  }

  add(key: K, value: V): this {
    for (let i = 0; i < this.items.length; i += 2) {
      const t = this.items[i];
      if (t[0] === key) {
        return this;
      }
    }

    this.items.push(key, value);
    return this;
  }

  delete(key: K): boolean {
    for (let i = 0; i < this.items.length; i += 2) {
      const t = this.items[i];
      if (t[0] === key) {
        this.items.splice(i, 2);
        return true;
      }
    }
    return false;
  }

  find(key: K): V | undefined {
    for (let i = 0; i < this.items.length; i += 2) {
      const t = this.items[i];
      if (t[0] === key) {
        return this.items[i + 1];
      }
    }
    return undefined;
  }

  findByValue(value: V): K | undefined {
    for (let i = 1; i < this.items.length; i += 2) {
      const t = this.items[i];
      if (t === value) {
        return this.items[i - 1];
      }
    }
    return undefined;
  }

  clear() {
    this.items.length = 0;
  }
}
