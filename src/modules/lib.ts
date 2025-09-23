export const $NumberToString = Number.prototype.toString;
export const $SubString = String.prototype.substring;

export const $assign = Object.assign;

export const $isArray = Array.isArray;
export const $ArrayFrom = Array.from;
export const $ArrayPush = Array.prototype.push;
export const $ArrayJoin = Array.prototype.join;
export const $ArrayFind = Array.prototype.find;
export const $ArrayFindIndex = Array.prototype.findIndex;
export const $ArrayFilter = Array.prototype.filter;
export const $ArraySplice = Array.prototype.splice;

export const $MapSet = Map.prototype.set;
export const $MapGet = Map.prototype.get;
export const $MapHas = Map.prototype.has;
export const $MapValues = Map.prototype.values;

export const $now = Date.now;

export const $rand = Math.random;
export const $floor = Math.floor;
export const $randInt = (max: number) => $floor($rand() * max);

export const $setTimeout = setTimeout;

export const $JSONParse = JSON.parse;

// # custom utils
const alphabets = '0123456789abcdefghijklmnopqrstuvwxyz' as const;
export const $genId = () => {
  const digits: string[] = ['kskb_', $NumberToString.call($now())];
  for (let i = 0; i < 16; i++) {
    $ArrayPush.call(digits, alphabets[$randInt(36)]);
  }
  return $ArrayJoin.call(digits, '');
};

export const $sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
export const $truncate = (s: string, maxLen = 50) => {
  if (!s) {
    return '';
  }
  if (s.length <= maxLen) {
    return s;
  }
  return $SubString.call(s, 0, maxLen - 3) + '...';
};

export const $escapeHtml = (text: string) => {
  const div = $createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

export const $invaidHexColorRegex = /^#([0-9a-fA-F]{3}){1,2}$/;

// # DOM
const createElement = document.createElement;
const getElementById = document.getElementById;
const querySelector = document.querySelector;
const querySelectorAll = document.querySelectorAll;

export const $createElement = (tag: HTMLTag) => createElement.call(document, tag);

export const $getElementByIdOrThrow = <E extends HTMLElement = HTMLElement>(id: string): E => {
  const element = getElementById.call(document, id);
  if (!element) {
    throw new Error(`__NAME__: Element with id "${id}" not found`);
  }
  return element as E;
};

export const $query = <E extends Element = Element>(selector: string) =>
  querySelector.call(document, selector) as E | null;

export const $queryAll = <E extends Element = Element>(selector: string): NodeListOf<E> =>
  querySelectorAll.call(document, selector) as NodeListOf<E>;

export const $on = HTMLElement.prototype.addEventListener;
