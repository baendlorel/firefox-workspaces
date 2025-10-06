# 浏览器API使用报告

本文档列出了Firefox Workspaces扩展中所有TypeScript文件使用的浏览器API。

## 按API命名空间分类

### browser.storage
- **browser.storage.local.get()** - 用于本地存储数据检索
  - Chrome对应: `chrome.storage.local.get()`
- **browser.storage.local.set()** - 用于本地存储数据持久化
  - Chrome对应: `chrome.storage.local.set()`
- **browser.storage.sync.get()** - 用于同步存储数据检索
  - Chrome对应: `chrome.storage.sync.get()`
- **browser.storage.sync.set()** - 用于同步存储数据持久化
  - Chrome对应: `chrome.storage.sync.set()`
- **browser.storage.onChanged.addListener()** - 用于监听存储变化
  - Chrome对应: `chrome.storage.onChanged.addListener()`

### browser.tabs
- **browser.tabs.Tab** - 标签页接口类型
  - Chrome对应: `chrome.tabs.Tab`
- **browser.tabs.TAB_ID_NONE** - 无效标签页ID常量
  - Chrome对应: `chrome.tabs.TAB_ID_NONE`
- **browser.tabs.query()** - 按条件查询标签页
  - Chrome对应: `chrome.tabs.query()`
- **browser.tabs.onCreated.addListener()** - 标签页创建监听器
  - Chrome对应: `chrome.tabs.onCreated.addListener()`
- **browser.tabs.onAttached.addListener()** - 标签页附加监听器
  - Chrome对应: `chrome.tabs.onAttached.addListener()`
- **browser.tabs.onDetached.addListener()** - 标签页分离监听器
  - Chrome对应: `chrome.tabs.onDetached.addListener()`
- **browser.tabs.onMoved.addListener()** - 标签页移动监听器
  - Chrome对应: `chrome.tabs.onMoved.addListener()`
- **browser.tabs.onRemoved.addListener()** - 标签页移除监听器
  - Chrome对应: `chrome.tabs.onRemoved.addListener()`
- **browser.tabs.onUpdated.addListener()** - 标签页更新监听器
  - Chrome对应: `chrome.tabs.onUpdated.addListener()`
- **browser.tabs.onUpdated.removeListener()** - 移除标签页更新监听器
  - Chrome对应: `chrome.tabs.onUpdated.removeListener()`

### browser.windows
- **browser.windows.Window** - 窗口接口类型
  - Chrome对应: `chrome.windows.Window`
- **browser.windows.WINDOW_ID_NONE** - 无效窗口ID常量
  - Chrome对应: `chrome.windows.WINDOW_ID_NONE`
- **browser.windows.create()** - 创建新窗口
  - Chrome对应: `chrome.windows.create()`
- **browser.windows.getCurrent()** - 获取当前窗口
  - Chrome对应: `chrome.windows.getCurrent()`
- **browser.windows.update()** - 更新窗口属性
  - Chrome对应: `chrome.windows.update()`
- **browser.windows.onRemoved.addListener()** - 窗口移除监听器
  - Chrome对应: `chrome.windows.onRemoved.addListener()`

### browser.runtime
- **browser.runtime.onStartup.addListener()** - 扩展启动监听器
  - Chrome对应: `chrome.runtime.onStartup.addListener()`
- **browser.runtime.onInstalled.addListener()** - 扩展安装监听器
  - Chrome对应: `chrome.runtime.onInstalled.addListener()`
- **browser.runtime.onMessage.addListener()** - 消息监听器
  - Chrome对应: `chrome.runtime.onMessage.addListener()`
- **browser.runtime.sendMessage()** - 发送消息
  - Chrome对应: `chrome.runtime.sendMessage()`
- **browser.runtime.getURL()** - 获取扩展资源URL
  - Chrome对应: `chrome.runtime.getURL()`

### browser.action
- **browser.action.setBadgeTextColor()** - 设置徽章文字颜色
  - Chrome对应: `chrome.action.setBadgeTextColor()`
- **browser.action.setBadgeBackgroundColor()** - 设置徽章背景颜色
  - Chrome对应: `chrome.action.setBadgeBackgroundColor()`
- **browser.action.setBadgeText()** - 设置徽章文字
  - Chrome对应: `chrome.action.setBadgeText()`

### browser.notifications
- **browser.notifications.create()** - 创建通知
  - Chrome对应: `chrome.notifications.create()`
- **browser.notifications.clear()** - 清除通知
  - Chrome对应: `chrome.notifications.clear()`

### browser.i18n
- **browser.i18n.getMessage()** - 获取国际化消息
  - Chrome对应: `chrome.i18n.getMessage()`

## Detailed File Usage

### src/background.ts
```typescript
// Type definitions
browser.tabs._OnUpdatedChangeInfo
browser.tabs._OnAttachedAttachInfo
browser.tabs._OnMovedMoveInfo
browser.tabs._OnRemovedRemoveInfo
browser.tabs._OnDetachedDetachInfo

// Runtime events
browser.runtime.onStartup.addListener()
browser.runtime.onInstalled.addListener()
browser.runtime.onMessage.addListener()

// Window events
browser.windows.onRemoved.addListener()

// Tab events
browser.tabs.onCreated.addListener()
browser.tabs.onAttached.addListener()
browser.tabs.onDetached.addListener()
browser.tabs.onMoved.addListener()
browser.tabs.onRemoved.addListener()
browser.tabs.onUpdated.addListener()

// Window operations
browser.windows.create()
browser.windows.WINDOW_ID_NONE

// Data structures
browser.tabs.Tab[]
```

### src/manager.ts
```typescript
// Tab operations
browser.tabs.query()
browser.tabs.Tab
browser.tabs.TAB_ID_NONE

// Window operations
browser.windows.update()
browser.windows.getCurrent()
browser.windows.WINDOW_ID_NONE

// Tab event listeners
browser.tabs.onUpdated.addListener()
browser.tabs.onUpdated.removeListener()

// Action badge operations
browser.action.setBadgeTextColor()
browser.action.setBadgeBackgroundColor()
browser.action.setBadgeText()
```

### src/lib/ext-apis.ts
```typescript
// Message passing
browser.runtime.sendMessage()

// Window operations
browser.windows.create()

// Notification operations
browser.notifications.create()
browser.notifications.clear()

// Internationalization
browser.i18n.getMessage()

// Runtime utilities
browser.runtime.getURL()
```

### src/lib/storage.ts
```typescript
// Local storage
browser.storage.local.get()
browser.storage.local.set()

// Sync storage
browser.storage.sync.get()
browser.storage.sync.set()
```

### src/lib/workspace.ts
```typescript
// Tab operations
browser.tabs.Tab
browser.tabs.TAB_ID_NONE
```

### src/web/main/header.ts
```typescript
// Window operations
browser.windows.getCurrent()

// Tab operations
browser.tabs.query()

// Storage events
browser.storage.onChanged.addListener()
```

### src/web/popup.service.ts
```typescript
// Window operations
browser.windows.getCurrent()
```

### src/web/main/editor.ts
```typescript
// Tab operations
browser.tabs.Tab[]
browser.tabs.TAB_ID_NONE
```

### Type Definitions

**src/global.d.ts**
- `browser.storage.sync` - Sync storage reference
- `browser.windows.Window` - Window type with id

**src/types/storage.d.ts**
- `browser.tabs.Tab[]` - Tab array type

**src/types/web.d.ts**
- `browser.tabs.Tab[]` - Tab array parameter type

## Usage Patterns

1. **Event-Driven Architecture**: Heavy use of `.addListener()` for browser events
2. **Storage Management**: Both local and sync storage APIs used
3. **Tab Management**: Extensive tab querying and event handling
4. **Window Management**: Window creation, querying, and event handling
5. **Extension UI**: Action badges and notifications for user feedback
6. **Internationalization**: Message localization support
7. **Message Passing**: Runtime messaging between extension components