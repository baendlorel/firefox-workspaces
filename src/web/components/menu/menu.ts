import './style.css';
import { div, h } from '@/lib/dom.js';

interface MenuOption {
  label: string | HTMLElement;
  action: () => void;
}

export class ContextMenu {
  private readonly dialog: HTMLDialogElement;
  private readonly content: HTMLDivElement;

  constructor() {
    this.dialog = h('dialog', 'dialog-container');
    this.content = div('dialog-content');
    this.dialog.appendChild(this.content);

    // Add to document body
    document.body.appendChild(this.dialog);

    // Handle backdrop click to close
    this.dialog.addEventListener('click', (e) => {
      if (e.target === this.dialog) {
        this.close();
      }
    });

    // Handle Escape key
    this.dialog.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.close();
      }
    });
  }

  show(x: number, y: number, options: MenuOption[]) {
    // Clear previous content
    this.content.innerHTML = '';

    // Create menu list
    const ul = h('ul', 'dialog-ul-options');

    options.forEach((option) => {
      const li = h('li', 'dialog-li-option');

      if (typeof option.label === 'string') {
        li.textContent = option.label;
      } else {
        li.appendChild(option.label);
      }

      li.addEventListener('click', () => {
        option.action();
        this.close();
      });

      ul.appendChild(li);
    });

    this.content.appendChild(ul);

    // Position the dialog
    this.dialog.style.position = 'fixed';
    this.dialog.style.left = `${x}px`;
    this.dialog.style.top = `${y}px`;
    this.dialog.style.margin = '0';
    this.dialog.style.transform = 'none';

    // Ensure menu stays within viewport
    this.adjustPosition();

    // Show the dialog
    this.dialog.showModal();
  }

  close() {
    this.dialog.close();
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
}
