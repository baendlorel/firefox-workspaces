import { h, div } from '@/lib/dom.js';
import { $escapeHtml, $truncate } from '@/lib/utils.js';

export default (args: TabArgs) => (workspace: Workspace) => {
  const { onToggleTabPin, onRemoveTab } = args;

  const pinnedTabs = workspace.pinnedTabs;
  const regularTabs = workspace.tabs;

  const renderTab = (tab: TabInfo, pinned: boolean) => {
    const img = h('img', {
      src: tab.favIconUrl || 'icons/default-favicon.png',
      class: 'tab-favicon',
      onerror:
        'this.src=\'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><rect width="16" height="16" fill="%23f0f0f0"/><text x="8" y="12" text-anchor="middle" font-size="12" fill="%23666">?</text></svg>\'',
    });

    let btnPin: HTMLButtonElement;
    let btnRemove: HTMLButtonElement;

    const tabItem = div(
      { class: 'tab-item', 'data-tab-id': String(tab.id), 'data-tab-url': tab.url },
      [
        img,
        div('tab-info', [
          div('tab-title', $escapeHtml(tab.title)),
          div('tab-url', $escapeHtml($truncate(tab.url))),
        ]),
        pinned ? div('pinned-indicator', '📌') : '',
        div('tab-actions', [
          (btnPin = h('button', 'btn-small')),
          (btnRemove = h('button', 'btn-small')),
        ]),
      ]
    );

    btnPin.title = pinned ? 'Unpin tab' : 'Pin tab';
    btnRemove.title = 'Remove from workspace';
    btnPin.addEventListener('click', () => onToggleTabPin(workspace.id, tab.id));
    btnRemove.addEventListener('click', () => onRemoveTab(workspace.id, tab.id));

    const _ = `
      <div class="tab-item" data-tab-id="${tab.id}" data-tab-url="${tab.url}">
        <img class="tab-favicon" src="${tab.favIconUrl || 'icons/default-favicon.png'}" 
             onerror="this.src='data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><rect width="16" height="16" fill="%23f0f0f0"/><text x="8" y="12" text-anchor="middle" font-size="12" fill="%23666">?</text></svg>'">
        <div class="tab-info">
          <div class="tab-title">${$escapeHtml(tab.title || 'Untitled')}</div>
          <div class="tab-url">${$escapeHtml($truncate(tab.url))}</div>
        </div>
        ${pinned ? '<div class="pinned-indicator" title="Pinned tab">📌</div>' : ''}
        <div class="tab-actions">
          <button class="btn-small" onclick="workspacesPopup.toggleTabPin('${workspace.id}', '${
            tab.id
          }')" 
                  title="${pinned ? 'Unpin tab' : 'Pin tab'}">
            ${pinned ? '📌' : '📍'}
          </button>
          <button class="btn-small" onclick="workspacesPopup.removeTab('${workspace.id}', '${tab.id}')" 
                  title="Remove from group">
            ✕
          </button>
        </div>
      </div>
    `;

    return tabItem;
  };

  const elements: HTMLDivElement[] = [];

  for (let i = 0; i < pinnedTabs.length; i++) {
    elements.push(renderTab(pinnedTabs[i], true));
  }

  for (let i = 0; i < regularTabs.length; i++) {
    elements.push(renderTab(regularTabs[i], false));
  }

  if (elements.length === 0) {
    elements.push(
      div({ style: 'text-align: center; color: #666; padding: 20px;' }, 'No tabs in this group')
    );
  }

  return elements;
};
