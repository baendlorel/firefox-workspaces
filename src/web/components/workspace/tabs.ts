import { h, div, btn } from '@/lib/dom.js';
import { $escapeHtml, $truncate } from '@/lib/utils.js';
import { EventBus } from '../../event-bus.js';

export default (bus: EventBus<WorkspaceEventMap>) => {
  const renderTab = (workspace: Workspace, tab: TabInfo, pinned: boolean) => {
    const img = h('img', {
      src: tab.favIconUrl || 'icons/default-favicon.png',
      class: 'tab-favicon',
      onerror:
        'this.src=\'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><rect width="16" height="16" fill="%23f0f0f0"/><text x="8" y="12" text-anchor="middle" font-size="12" fill="%23666">?</text></svg>\'',
    });

    const btnPin = btn('btn-small', pinned ? '📌' : '📍');
    const btnRemove = btn('btn-small', '✕');

    const tabItem = div(
      { class: 'tab-item', 'data-tab-id': String(tab.id), 'data-tab-url': tab.url },
      [
        img,
        div('tab-info', [
          div('tab-title', $escapeHtml(tab.title)),
          div('tab-url', $escapeHtml($truncate(tab.url))),
        ]),
        div('tab-actions', [btnPin, btnRemove]),
      ]
    );

    btnPin.title = pinned ? 'Unpin tab' : 'Pin tab';
    btnRemove.title = 'Remove from workspace';
    btnPin.addEventListener('click', () => {
      bus.emit('toggle-tab-pin', workspace.id, tab.id);
      btnPin.textContent = btnPin.textContent.includes('📌') ? '📍' : '📌';
    });
    btnRemove.addEventListener('click', () => bus.emit('remove-tab', workspace.id, tab.id));
    return tabItem;
  };

  bus.on('render-tab', (workspace) => {
    const pinnedTabs = workspace.pinnedTabs;
    const regularTabs = workspace.tabs;

    const elements: HTMLDivElement[] = [];

    for (let i = 0; i < pinnedTabs.length; i++) {
      elements.push(renderTab(workspace, pinnedTabs[i], true));
    }

    for (let i = 0; i < regularTabs.length; i++) {
      elements.push(renderTab(workspace, regularTabs[i], false));
    }

    if (elements.length === 0) {
      elements.push(
        div({ style: 'text-align: center; color: #666; padding: 20px;' }, 'No tabs in this group')
      );
    }

    return elements;
  });
};
