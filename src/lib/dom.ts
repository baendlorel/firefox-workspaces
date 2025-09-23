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

export const h = <T extends HTMLTag>(
  tag: T,
  className: string | Record<string, string>,
  children: (HTMLElement | string)[] | string = ''
): HTMLElementTagNameMap[T] => {
  // Create element
  const el = document.createElement(tag);
  // Set className or attributes
  if (typeof className === 'string') {
    el.className = className;
  } else {
    for (const [key, value] of Object.entries(className)) {
      if (key === 'class') {
        el.className = value;
      } else if (key === 'style') {
        el.style = value;
      } else {
        el.setAttribute(key, value);
      }
    }
  }

  if (typeof children === 'string') {
    if (children) {
      el.appendChild(document.createTextNode(children));
    }
  } else {
    // Append children
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (typeof child === 'string') {
        el.appendChild(document.createTextNode(child));
      } else {
        el.appendChild(child);
      }
    }
  }

  return el;
};
