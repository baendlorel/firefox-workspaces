/**
 * Stringify JavaScript objects to their literal representation
 * Preserves special values like NaN, undefined, Infinity, etc.
 * Assumes no circular references in the object
 */

type StringifyOptions = {
  indent?: string | number;
  currentIndent?: string;
};

const stringifySymbol = (value: symbol) => {
  if (Symbol.keyFor(value)) {
    if (value.description === undefined) {
      return 'Symbol()';
    } else {
      return `Symbol(${JSON.stringify(value.description)})`;
    }
  } else {
    return `Symbol.for(${JSON.stringify(value.description)})`;
  }
};

/**
 * Convert a JavaScript value to its literal string representation
 * @param value - The value to stringify
 * @param options - Formatting options
 * @returns String representation of the value
 */
export function stringify(value: unknown, options: StringifyOptions = {}): string {
  const indent =
    typeof options.indent === 'number' ? ' '.repeat(options.indent) : options.indent || '';
  const currentIndent = options.currentIndent || '';
  const nextIndent = currentIndent + indent;

  // Handle primitives and special values
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';

  switch (typeof value) {
    case 'string':
      return JSON.stringify(value);
    case 'number':
      if (Number.isNaN(value)) {
        return 'NaN';
      } else if (value === Infinity) {
        return 'Infinity';
      } else if (value === -Infinity) {
        return '-Infinity';
      }
    case 'boolean':
      return String(value);
    case 'undefined':
      return 'undefined';
    case 'function':
      return value.toString();
    case 'symbol':
      return stringifySymbol(value);
    case 'object':
    default:
      break;
  }

  // Handle Date objects
  if (value instanceof Date) {
    return `new Date(${value.getTime()})`;
  }

  if (value instanceof RegExp) {
    return value.toString();
  }

  // Handle Arrays
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '[]';
    }

    const items = value.map((item) => stringify(item, { indent, currentIndent: nextIndent }));

    if (!indent) {
      return `[${items.join(', ')}]`;
    }

    return `[\n${nextIndent}${items.join(`,\n${nextIndent}`)}\n${currentIndent}]`;
  }

  // Handle Objects
  const keys = Reflect.ownKeys(value);

  if (keys.length === 0) {
    return '{}';
  }

  const pairs = keys.map((key) => {
    const val = Reflect.get(value, key);
    const keyStr = typeof key === 'string' ? key : stringifySymbol(key);
    const valueStr = stringify(val, { indent, currentIndent: nextIndent });
    return `${keyStr}: ${valueStr}`;
  });

  if (!indent) {
    return `{${pairs.join(', ')}}`;
  }

  return `{\n${nextIndent}${pairs.join(`,\n${nextIndent}`)}\n${currentIndent}}`;
}

/**
 * Generate a complete JavaScript module string with export default
 * @param data - The data to export
 * @param indent - Indentation (number of spaces or string)
 * @returns Complete JavaScript module string
 */
export function generateExportModule(data: unknown, indent: string | number = 2): string {
  const dataStr = stringify(data, { indent });
  return `export default ${dataStr}\n`;
}
