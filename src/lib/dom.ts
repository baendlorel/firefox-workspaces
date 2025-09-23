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
