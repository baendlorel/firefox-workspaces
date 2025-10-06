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

## 详细文件使用情况

### src/background.ts
```typescript
// 类型定义
browser.tabs._OnUpdatedChangeInfo
browser.tabs._OnAttachedAttachInfo
browser.tabs._OnMovedMoveInfo
browser.tabs._OnRemovedRemoveInfo
browser.tabs._OnDetachedDetachInfo

// 运行时事件
browser.runtime.onStartup.addListener()
browser.runtime.onInstalled.addListener()
browser.runtime.onMessage.addListener()

// 窗口事件
browser.windows.onRemoved.addListener()

// 标签页事件
browser.tabs.onCreated.addListener()
browser.tabs.onAttached.addListener()
browser.tabs.onDetached.addListener()
browser.tabs.onMoved.addListener()
browser.tabs.onRemoved.addListener()
browser.tabs.onUpdated.addListener()

// 窗口操作
browser.windows.create()
browser.windows.WINDOW_ID_NONE

// 数据结构
browser.tabs.Tab[]
```

### src/manager.ts
```typescript
// 标签页操作
browser.tabs.query()
browser.tabs.Tab
browser.tabs.TAB_ID_NONE

// 窗口操作
browser.windows.update()
browser.windows.getCurrent()
browser.windows.WINDOW_ID_NONE

// 标签页事件监听器
browser.tabs.onUpdated.addListener()
browser.tabs.onUpdated.removeListener()

// 操作徽章操作
browser.action.setBadgeTextColor()
browser.action.setBadgeBackgroundColor()
browser.action.setBadgeText()
```

### src/lib/ext-apis.ts
```typescript
// 消息传递
browser.runtime.sendMessage()

// 窗口操作
browser.windows.create()

// 通知操作
browser.notifications.create()
browser.notifications.clear()

// 国际化
browser.i18n.getMessage()

// 运行时工具
browser.runtime.getURL()
```

### src/lib/storage.ts
```typescript
// 本地存储
browser.storage.local.get()
browser.storage.local.set()

// 同步存储
browser.storage.sync.get()
browser.storage.sync.set()
```

### src/lib/workspace.ts
```typescript
// 标签页操作
browser.tabs.Tab
browser.tabs.TAB_ID_NONE
```

### src/web/main/header.ts
```typescript
// 窗口操作
browser.windows.getCurrent()

// 标签页操作
browser.tabs.query()

// 存储事件
browser.storage.onChanged.addListener()
```

### src/web/popup.service.ts
```typescript
// 窗口操作
browser.windows.getCurrent()
```

### src/web/main/editor.ts
```typescript
// 标签页操作
browser.tabs.Tab[]
browser.tabs.TAB_ID_NONE
```

### 类型定义

**src/global.d.ts**
- `browser.storage.sync` - 同步存储引用
- `browser.windows.Window` - 带ID的窗口类型

**src/types/storage.d.ts**
- `browser.tabs.Tab[]` - 标签页数组类型

**src/types/web.d.ts**
- `browser.tabs.Tab[]` - 标签页数组参数类型

## 使用模式

1. **事件驱动架构**: 大量使用 `.addListener()` 监听浏览器事件
2. **存储管理**: 同时使用本地和同步存储API
3. **标签页管理**: 广泛的标签页查询和事件处理
4. **窗口管理**: 窗口创建、查询和事件处理
5. **扩展UI**: 使用操作徽章和通知提供用户反馈
6. **国际化**: 支持消息本地化
7. **消息传递**: 扩展组件间的运行时消息传递

## 浏览器兼容性说明

- 所有 `browser.*` API 在Firefox扩展中可直接使用
- 对应的 `chrome.*` API 在Chrome扩展中功能相同，可直接替换
- 大部分API在两个浏览器中行为一致，少数API可能有细微差异
- 建议在跨浏览器扩展中使用 `browser.*` 前缀以保持兼容性