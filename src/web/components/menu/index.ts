import { autoPopOutDialog, popIn, popOut } from '../pop/index.js';
import './style.css';
import { h } from '@/lib/dom.js';

interface MenuOption {
  label: string | HTMLElement;
  action: (this: Menu) => void;
}

export class Menu {
  readonly dialog: HTMLDialogElement;
  private readonly ul: HTMLUListElement;
  private readonly popIn: () => void;
  close: () => void;

  constructor(options: (MenuOption | 'divider')[]) {
    // # Elements
    const ulChilren = options.map((o) => {
      if (o === 'divider') {
        return h('hr');
      }

      const opt = typeof o.label === 'string' ? o.label : [o.label];
      const el = h('li', 'menu-option', opt);
      el.addEventListener('click', () => o.action.call(this));
      return el;
    });

    this.ul = h('ul', 'menu-options', ulChilren);
    this.dialog = h('dialog', 'menu', [this.ul]);
    this.close = popOut(this.dialog, undefined, () => this.dialog.close());

    // # register events
    // Handle backdrop click to close
    autoPopOutDialog(this.dialog);
    this.popIn = popIn(this.dialog, () => this.dialog.showModal());

    // Add to document body
    document.body.appendChild(this.dialog);
  }

  show(x: number, y: number) {
    // Position the dialog
    this.dialog.style.left = `${x}px`;
    this.dialog.style.top = `${y}px`;

    // Ensure menu stays within viewport
    this.adjustPosition();

    this.popIn();
  }

  private adjustPosition() {
    const rect = this.dialog.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = parseInt(this.dialog.style.left);
    let top = parseInt(this.dialog.style.top);

    // Adjust horizontal position if menu goes beyond right edge
    if (rect.right > viewportWidth) {
      left = viewportWidth - rect.width - 10;
    }

    // Adjust horizontal position if menu goes beyond left edge
    if (left < 10) {
      left = 10;
    }

    // Adjust vertical position if menu goes beyond bottom edge
    if (rect.bottom > viewportHeight) {
      top = viewportHeight - rect.height - 10;
    }

    // Adjust vertical position if menu goes beyond top edge
    if (top < 10) {
      top = 10;
    }

    this.dialog.style.left = `${left}px`;
    this.dialog.style.top = `${top}px`;
  }

  destroy() {
    this.dialog.parentNode?.removeChild(this.dialog);
  }

  /**
   * Calculate the bounding client rect of the menu dialog.
   */
  getBoundingClientRect() {
    // & trigger calculation
    this.dialog.show();
    const drect = this.dialog.getBoundingClientRect();
    this.dialog.close();
    return drect;
  }
}
