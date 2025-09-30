# Logger Analysis and Optimization Plan

## Current Logger Implementation

你当前的logger实现位于 `src/lib/logger.ts`，提供了以下功能：

```typescript
export const logger = {
  warn(func: string, message: string) {
    console.warn(`[__NAME__] ${func}: ${message}`);
  },
  WorkspaceNotFound(func: string, id: string) {
    console.warn(`[__NAME__] ${func}: Workspace with id ${id} not found`);
  },
  TabNotFoundInWorkspace(func: string, id: string, tabId: number) {
    console.warn(`[__NAME__] ${func}: Tab ${tabId} not found in workspace ${id}`);
  },
};
```

## Code Analysis Results

### 1. 现有日志模式分析

通过扫描代码库，发现了以下日志使用模式：

#### A. 直接使用console.\*的地方（需要替换为logger）

**背景脚本 (background.ts):**

- `console.log('__NAME__ initialized in background')` - 初始化日志
- `console.log(\`Workspace window closed: ${workspace.name}\`)` - 窗口关闭
- `console.log(\`Workspace ${workspace.name} is being deleted...\`)` - 删除状态
- `console.error('[__NAME__] onMessage: Error handling message', error)` - 错误处理
- `console.log('Saving workspace sessions before browser shutdown')` - 关闭保存
- `console.log('Periodic save of active workspace sessions')` - 定期保存

**管理器 (manager.ts):**

- `console.log('__NAME__ initialized. Updated at __DATE_TIME__')` - 初始化
- `console.log(\`Closed window ${target.windowId} for workspace: ${target.name}\`)` - 窗口关闭
- `console.error(\`[__NAME__] :**func**:addTab Workspace with id ${id} not found\`)` - **已可用logger.WorkspaceNotFound**
- `console.warn('[__NAME__] __func__: Workspace not found, id: ' + id)` - **已可用logger.WorkspaceNotFound**
- `console.warn(\`[__NAME__] **func**: Tab ${tabId} not found in workspace ${fromId}\`)` - **已可用logger.TabNotFoundInWorkspace**
- `console.log('[__NAME__] __func__: Not setting badge, no windowId')` - 徽章设置
- `console.error(\`[__NAME__:__func__] failed: ${workspace.name}(${workspace.id})\`)` - 失败错误
- `console.log('Cleared stale window associations and active workspaces on startup')` - 启动清理
- `console.error(\`[__NAME__] **func**: data.workspaceses must be Workspace[]\`)` - 数据验证错误

**Web界面 (header.ts):**

- `console.log('create')`, `console.log('Import')`, `console.log('Export')`, `console.log('Settings')` - 占位符日志

#### B. 使用fallback机制的地方（可增强日志）

**Promise fallback调用:**

- `fallback('__func__: Saving failed', false)` - 保存失败
- `fallback(__func__, \`Window ${target.windowId} was already closed...\`)` - 窗口操作失败
- `fallback('__func__: Window update failed')` - 窗口更新失败
- `fallback('__func__: Fallback to about:blank because', $aboutBlank())` - 页面加载回退
- `fallback(\`**func**: Failed to create tab for URL: ${tabs[i].url}\`, null)` - 标签页创建失败
- `fallbackWithDialog('Failed to load work groups', {...})` - 工作组加载失败
- `fallbackWithDialog('__func__: Failed saving workspace', Sym.Reject)` - 工作区保存失败

#### C. 抛出错误的地方（可增强日志）

**DOM操作 (dom.ts):**

- `throw new Error(\`[__NAME__] **func**: Element with id "${id}" not found\`)` - 元素未找到

**拖拽操作 (list.ts):**

- `throw new Error('[__NAME__] :__func__:setupDragAndDrop e.dataTransfer is null')` - 拖拽数据传输错误
- `throw new Error('[__NAME__] :__func__:setupDragAndDrop workspaceId is undefined.')` - 工作区ID未定义

### 2. 建议的Logger扩展

基于分析，建议扩展logger以包含以下方法：

```typescript
export const logger = {
  // 基础日志方法
  info(func: string, message: string) {
    console.log(`[__NAME__] ${func}: ${message}`);
  },
  warn(func: string, message: string) {
    console.warn(`[__NAME__] ${func}: ${message}`);
  },
  error(func: string, message: string, error?: unknown) {
    if (error) {
      console.error(`[__NAME__] ${func}: ${message}`, error);
    } else {
      console.error(`[__NAME__] ${func}: ${message}`);
    }
  },
  debug(func: string, message: string) {
    console.debug(`[__NAME__] ${func}: ${message}`);
  },

  // 特定业务场景
  WorkspaceNotFound(func: string, id: string) {
    console.warn(`[__NAME__] ${func}: Workspace with id ${id} not found`);
  },
  TabNotFoundInWorkspace(func: string, id: string, tabId: number) {
    console.warn(`[__NAME__] ${func}: Tab ${tabId} not found in workspace ${id}`);
  },

  // 新增的特定业务场景
  WorkspaceInitialized(func: string, details?: string) {
    console.log(`[__NAME__] ${func}: Workspace initialized${details ? '. ' + details : ''}`);
  },
  WorkspaceWindowClosed(func: string, workspaceName: string) {
    console.log(`[__NAME__] ${func}: Workspace window closed: ${workspaceName}`);
  },
  WorkspaceSaved(func: string, workspaceName?: string) {
    console.log(`[__NAME__] ${func}: Workspace saved${workspaceName ? ': ' + workspaceName : ''}`);
  },
  WorkspaceFailed(func: string, workspaceName: string, workspaceId: string) {
    console.error(`[__NAME__] ${func}: Failed for workspace: ${workspaceName}(${workspaceId})`);
  },
  ElementNotFound(func: string, elementId: string) {
    console.error(`[__NAME__] ${func}: Element with id "${elementId}" not found`);
  },
  DataValidationError(func: string, expectedType: string, actualData?: unknown) {
    console.error(
      `[__NAME__] ${func}: Data validation failed, expected ${expectedType}`,
      actualData
    );
  },
  FallbackTriggered(func: string, reason: string, fallbackValue?: unknown) {
    console.debug(`[__NAME__] ${func}: Fallback triggered - ${reason}`, fallbackValue);
  },
};
```

### 3. 立即可应用logger的地方

#### A. 直接替换（已有对应logger方法）

**manager.ts:**

```typescript
// 第159行
console.error(`[__NAME__] :__func__:addTab Workspace with id ${id} not found`);
// 替换为:
logger.WorkspaceNotFound('addTab', id);

// 第174行
console.warn('[__NAME__] __func__: Workspace not found, id: ' + id);
// 替换为:
logger.WorkspaceNotFound('removeTab', id);

// 第194行
console.warn(`[__NAME__] __func__: Tab ${tabId} not found in workspace ${fromId}`);
// 替换为:
logger.TabNotFoundInWorkspace('moveTabBetweenWorkspaces', fromId, tabId);
```

#### B. 需要扩展logger后再替换

**background.ts:**

```typescript
// 第20行
console.log('__NAME__ initialized in background');
// 替换为:
logger.WorkspaceInitialized('init', 'in background');

// 第37行
console.log(`Workspace window closed: ${workspace.name}`);
// 替换为:
logger.WorkspaceWindowClosed('onRemoved', workspace.name);

// 第156行
console.error('[__NAME__] onMessage: Error handling message', error);
// 替换为:
logger.error('onMessage', 'Error handling message', error);
```

**manager.ts:**

```typescript
// 第31行
console.log('__NAME__ initialized. Updated at __DATE_TIME__');
// 替换为:
logger.WorkspaceInitialized('constructor', 'Updated at __DATE_TIME__');

// 第382行
console.error(`[__NAME__:__func__] failed: ${workspace.name}(${workspace.id})`);
// 替换为:
logger.WorkspaceFailed('restoreSessions', workspace.name, workspace.id);
```

### 4. 与fallback机制整合

当前的fallback机制在promise-ext.ts中使用console.debug。建议修改为使用logger：

```typescript
// 在promise-ext.ts中
return Promise.prototype.catch.call(this, (error: unknown) => {
  if (message) {
    // 使用logger替代console.debug
    logger.FallbackTriggered('fallback', message, error);
  } else {
    console.debug(error);
  }
  return value;
});
```

### 5. 优先级实施计划

#### 高优先级（立即可做）

1. **扩展logger方法** - 添加info, error, debug等基础方法
2. **替换已匹配的logger调用** - WorkspaceNotFound, TabNotFoundInWorkspace
3. **替换header.ts中的占位符日志** - 改为适当的logger调用

#### 中优先级（需要设计）

1. **添加业务特定的logger方法** - WorkspaceInitialized, WorkspaceWindowClosed等
2. **替换manager.ts和background.ts中的console调用**
3. **整合fallback机制与logger**

#### 低优先级（可选优化）

1. **添加日志级别控制** - 根据环境变量控制日志输出
2. **添加日志聚合和过滤** - 避免重复日志
3. **添加结构化日志** - 便于调试和监控

### 6. 具体实施建议

1. **先扩展logger.ts**，添加基础的info, error, debug方法
2. **逐个文件替换**，从manager.ts开始（因为已有匹配的方法）
3. **测试替换效果**，确保日志输出格式一致
4. **逐步添加业务特定方法**，避免一次性改动过大
5. **最后整合fallback机制**，统一错误处理日志

通过这种渐进式的方法，可以确保代码库日志的一致性，同时提高代码的可维护性和调试便利性。
