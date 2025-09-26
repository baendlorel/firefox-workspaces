import { EventBus } from '../web/event-bus.ts';
declare global {
  type HTMLPart = HTMLElement[] | string;

  interface Dialog {
    dialog: HTMLDialogElement;
    closeBtn: HTMLButtonElement;
    confirmBtn: HTMLButtonElement;
  }

  type DialogEventMap = {
    show: () => void;
    shown: () => void;
    close: () => void;
    closed: () => void;
    confirmed: () => void;
  };

  interface HTMLDialogElement {
    readonly bus: EventBus<DialogEventMap>;
  }
}
