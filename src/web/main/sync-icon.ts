import { info } from '@comp/dialog/alerts.js';
import { svg } from '@/lib/dom.js';
import { i } from '@/lib/ext-apis.js';

import arrowRepeatSvg from '@assets/arrow-repeat.svg?raw';

export class SyncIcon {
  private errorMsg: string = '';
  readonly el: SVGElement;

  constructor() {
    this.el = svg(arrowRepeatSvg, null, 18);
    this.el.classList.add('sync-indicator');

    // Handle sync icon click (show error details)
    this.el.addEventListener('click', () => {
      if (this.el.classList.contains('error')) {
        info(this.errorMsg, i('dialog.type.danger'));
      }
    });
  }

  setStatus(state: SyncState, errorMsg: string = '') {
    this.el.classList.remove(SyncState.Success, SyncState.Error, SyncState.Syncing);
    this.el.classList.add(state);
    this.errorMsg = errorMsg;
  }
}
