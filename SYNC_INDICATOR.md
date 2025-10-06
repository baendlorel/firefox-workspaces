# Sync Indicator Usage

同步指示器已经集成到 header 中，用于显示数据同步状态。通过事件总线（EventBus）来控制状态变化。

## Features

1. **Three States**:
   - `SyncState.Syncing`: 旋转动画，默认颜色（继承自 header 的颜色）
   - `SyncState.Success`: 绿色，8秒后自动淡出为透明
   - `SyncState.Error`: 红色，保持可见，可点击查看错误详情

2. **Minimum Syncing Duration**:
   - 同步图标至少会旋转 1.2 秒，即使实际同步操作更快完成
   - 这样可以让用户清楚地看到同步正在进行

3. **Auto-hide**:
   - 默认状态：透明（不可见）
   - 成功状态：8秒后自动淡出为透明
   - 错误状态：保持可见直到问题解决

4. **Settings Integration**:
   - 当 `settings.sync = off` 时自动隐藏
   - 监听 storage 变化并自动更新可见性

## Usage from Background Script

### 1. Get Popup Views

```typescript
// In background.ts
const views = browser.extension.getViews({ type: 'popup' });
if (views.length > 0) {
  const popupWindow = views[0] as any;
  const { emit } = popupWindow.app; // Assuming you expose app globally

  // Trigger sync state change
  emit('change-sync-state', SyncState.Syncing);
}
```

### 2. Complete Sync Example

```typescript
// In background.ts
async function performSync() {
  const views = browser.extension.getViews({ type: 'popup' });

  if (views.length > 0) {
    const popupWindow = views[0] as any;
    const { emit } = popupWindow.app;

    // Start syncing
    emit('change-sync-state', SyncState.Syncing);

    try {
      // Perform sync operation
      const localData = await browser.storage.local.get();
      await browser.storage.sync.set(localData);

      // Success
      emit('change-sync-state', SyncState.Success);
    } catch (err) {
      // Error
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      emit('change-sync-state', SyncState.Error, errorMsg);
    }
  }
}
```

### 3. Expose EventBus in popup.ts

```typescript
// In popup.ts
import { createView } from '@web/view.js';

const { emit, on } = createView();

// Expose to window for background script access
(window as any).app = { emit, on };
```

## Event API

### Event: `'change-sync-state'`

触发同步状态变化。

**Parameters:**

- `state`: `SyncState.Syncing | SyncState.Success | SyncState.Error`
- `errorMsg` (optional): 错误消息，点击错误图标时显示（仅用于 Error 状态）

**Examples:**

```typescript
// 开始同步
emit('change-sync-state', SyncState.Syncing);

// 同步成功
emit('change-sync-state', SyncState.Success);

// 同步失败
emit('change-sync-state', SyncState.Error, 'Network timeout');
```

## SyncState Enum

在 `src/lib/consts.ts` 中定义：

```typescript
const enum SyncState {
  Syncing = 'syncing',
  Success = 'success',
  Error = 'error',
}
```

## Implementation Details

### Minimum Duration Logic

同步图标至少会旋转 1.2 秒：

1. 当收到 `SyncState.Syncing` 时，记录开始时间
2. 当收到 `Success` 或 `Error` 时，计算已经过的时间
3. 如果不足 1.2 秒，延迟到 1.2 秒后再切换状态
4. 如果已经超过 1.2 秒，立即切换状态

### CSS Classes

- `.sync-indicator`: 基础样式，透明色，opacity 0.6
- `.sync-indicator.syncing`: 旋转动画（1s 无限循环）
- `.sync-indicator.success`: 绿色，0.8s 过渡动画
- `.sync-indicator.error`: 红色，可点击的指针

### 样式定制

在 `workspace.css` 中可以自定义：

```css
.sync-indicator {
  opacity: 0.6;
  color: transparent;
  transition:
    color 0.8s ease,
    opacity 0.3s ease;
}

.sync-indicator.syncing {
  color: currentColor;
  animation: sync-rotate 1s linear infinite;
}

.sync-indicator.success {
  color: #10b981; /* green-500 */
}

.sync-indicator.error {
  color: #ef4444; /* red-500 */
  cursor: pointer;
}
```

## Complete Integration Example

### 1. popup.ts

```typescript
import { createView } from '@web/view.js';

const { emit, on } = createView();

// Expose for background script
(window as any).app = { emit, on };
```

### 2. background.ts

```typescript
// Listen for storage changes and sync
browser.storage.onChanged.addListener(async (changes, areaName) => {
  if (areaName === 'local') {
    const { settings } = await browser.storage.local.get('settings');

    if (settings.sync === Switch.On) {
      await syncToCloud(changes);
    }
  }
});

async function syncToCloud(data: any) {
  const views = browser.extension.getViews({ type: 'popup' });

  if (views.length > 0) {
    const { emit } = (views[0] as any).app;

    emit('change-sync-state', SyncState.Syncing);

    try {
      await browser.storage.sync.set(data);
      emit('change-sync-state', SyncState.Success);
    } catch (err) {
      emit('change-sync-state', SyncState.Error, `Sync failed: ${err.message}`);
    }
  }
}
```

## Design Decisions

1. **事件驱动**: 使用 EventBus 而不是导出对象，保持架构的一致性
2. **最小旋转时间**: 1.2 秒的最小旋转时间确保用户能看到同步正在进行
3. **透明度 0.6**: 使图标不太显眼，符合低调的设计要求
4. **0.8s 过渡**: 平滑的淡入淡出效果
5. **8秒自动隐藏**: 足够长的时间让用户注意到成功状态
6. **错误可点击**: 方便用户查看详细错误信息
7. **settings.sync 集成**: 当同步功能关闭时，指示器完全隐藏
