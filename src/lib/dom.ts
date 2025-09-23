// # DOM

export const $getElementByIdOrThrow = <E extends HTMLElement = HTMLElement>(id: string): E => {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`__NAME__: Element with id "${id}" not found`);
  }
  return element as E;
};

export const $query = document.querySelector;

export const $queryAll = document.querySelectorAll;
