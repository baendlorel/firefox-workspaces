// # DOM

export const $id = <E extends HTMLElement = HTMLElement>(id: string): E => {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`[__NAME__] __func__: Element with id "${id}" not found`);
  }
  return element as E;
};

const qs = document.querySelector;
const qsa = document.querySelectorAll;

export const $query: typeof qs = (s: string) => qs.call(document, s);

export const $queryAll: typeof qsa = (s: string) => qsa.call(document, s);

export const h = <T extends HTMLTag>(
  tag: T,
  className: string | Record<string, string> = '',
  children: (HTMLElement | SVGElement | string)[] | string = ''
): HTMLElementTagNameMap[T] => {
  // Create element
  const el = document.createElement(tag);
  // Set className or attributes
  if (className !== '') {
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

export const div = (
  className: string | Record<string, string> = '',
  children: (HTMLElement | SVGElement | string)[] | string = ''
): HTMLDivElement => h('div', className, children);

export const span = (
  className: string | Record<string, string> = '',
  children: (HTMLElement | SVGElement | string)[] | string = ''
): HTMLSpanElement => h('span', className, children);

export const btn = (
  className: string | Record<string, string> = '',
  children: (HTMLElement | SVGElement | string)[] | string = ''
): HTMLButtonElement => h('button', className, children);

const dummy = div();
export const svg = (
  svg: string,
  color: string | null = null,
  width: number = 16,
  height: number = width
): SVGElement => {
  color = color ?? 'currentColor';
  let html = svg.replace('<svg ', '<svg width="' + width + '" height="' + height + '" ');
  if (color) {
    html = html.replaceAll('currentColor', color);
  }
  dummy.innerHTML = html;
  return dummy.firstElementChild as SVGElement;
};
