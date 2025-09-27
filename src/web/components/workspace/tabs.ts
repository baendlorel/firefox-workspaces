import { EventBus } from 'minimal-event-bus';
import { h, div, btn } from '@/lib/dom.js';
import { $escapeHtml, $truncate } from '@/lib/utils.js';

export default (bus: EventBus<WorkspaceEditorEventMap>) => {
  // #from popup.setupDragAndDrop
  const registerDragAndDrop = (tab: HTMLDivElement) => {
    tab.draggable = true;
    tab.addEventListener('dragstart', (e) => {
      if (!e.dataTransfer) {
        throw new Error('[__NAME__: __func__]setupDragAndDrop e.dataTransfer is null');
      }

      const tabId = tab.dataset.tabId;
      const workspaceId = (tab.closest('.wb') as HTMLDivElement)?.dataset.workspaceId;
      const tabUrl = tab.dataset.tabUrl;

      if (workspaceId === undefined) {
        throw new Error(`[__NAME__: __func__]setupDragAndDrop tab.closest('.wb') is undefined.`);
      }

      e.dataTransfer.setData(
        'text/plain',
        `{"tabId":${tabId},"workspaceId":"${workspaceId}","tabUrl":"${tabUrl}"}`
      );
      tab.classList.add('dragging');
    });

    tab.addEventListener('dragend', () => {
      tab.classList.remove('dragging');
    });
  };

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

    registerDragAndDrop(tabItem);
    return tabItem;
  };

  bus.on('render-tab', (workspace) => {
    const pinnedTabs = workspace.pinnedTabs;
    const regularTabs = workspace.tabs;

    const tabItems: HTMLDivElement[] = [];

    for (let i = 0; i < pinnedTabs.length; i++) {
      tabItems.push(renderTab(workspace, pinnedTabs[i], true));
    }

    for (let i = 0; i < regularTabs.length; i++) {
      tabItems.push(renderTab(workspace, regularTabs[i], false));
    }

    if (tabItems.length === 0) {
      tabItems.push(
        div({ style: 'text-align: center; color: #666; padding: 20px;' }, 'No tabs in this group')
      );
    }

    return tabItems;
  });
};
