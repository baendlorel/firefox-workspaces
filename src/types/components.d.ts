import { EventBus } from 'minimal-event-bus';

declare global {
  type HTMLPart = HTMLElement[] | string;

  interface Dialog {
    dialog: HTMLDialogElement;
    header: HTMLDivElement;
    body: HTMLDivElement;
    footer: HTMLDivElement;
    closeBtn: HTMLButtonElement;
    yesBtn: HTMLButtonElement;
    setTitle: (text: string) => void;
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
    escClosable: boolean;
    backdropClosable: boolean;
  }
}
