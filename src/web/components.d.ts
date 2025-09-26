import { EventBus } from './event-bus.ts';
declare global {
  type HTMLPart = HTMLElement[] | string;

  interface Dialog {
    bus: EventBus<DialogEventMap>;
    dialog: HTMLDialogElement;
    closeBtn: HTMLButtonElement;
    confirmBtn: HTMLButtonElement;
  }

  type DialogEventMap = {
    closed: () => void;
    confirmed: () => void;
  };
}
