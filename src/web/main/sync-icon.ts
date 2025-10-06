import { danger, info } from '@comp/dialog/alerts.js';
import { svg } from '@/lib/dom.js';
import { i } from '@/lib/ext-apis.js';
import { store } from '@/lib/storage.js';

import arrowRepeatSvg from '@assets/arrow-repeat.svg?raw';

export class SyncIcon {
  private errorMsg: string = '';
  readonly el: SVGElement;

  constructor() {
    this.el = svg(arrowRepeatSvg, null, 18);
    this.el.classList.add('sync-indicator');

    // Handle sync icon click (show error details)
    this.el.addEventListener('click', () => {
      if (this.el.classList.contains('error') && this.errorMsg) {
        danger(this.errorMsg);
      } else {
        info(i('workspace.sync-icon-title'));
      }
    });

    store.localGet('settings').then((local) => this.toggle(local.settings.sync));

    browser.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.settings) {
        const newSync = changes.settings.newValue?.sync;
        if (newSync !== undefined) {
          this.toggle(newSync);
        }
      }
    });
  }

  toggle(switcher: Switch) {
    this.el.style.display = switcher === Switch.On ? '' : 'none';
  }

  setStatus(state: SyncState, errorMsg: string = '') {
    this.el.classList.remove(SyncState.Success, SyncState.Error, SyncState.Syncing);
    this.el.classList.add(state);
    this.errorMsg = errorMsg;
  }
}
