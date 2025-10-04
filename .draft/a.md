# 源码静态扫描报告 — src（最终复评）

对你最近的大量精简我做了最终复评（移除 `flat-pair`、规范存储访问、强化 tab id 的校验等）。下面是当前代码的精要结论、风险点、以及可以进一步精简或改进的具体建议（按成本/收益排序）。

## 本次重点观察的变化

- 移除 `flat-pair` 并改用原生对象及 `Object.entries` 的实现，减少外部依赖。
- `initLocalWith` 已把 `_workspaceWindows` / `_windowTabs` 初始化为 `{}`。
- `createWorkspaceTab` 在 `src/lib/workspace.ts` 中现在严格检查 `tab.id`：如果 `id` 为 `undefined` 或 `TAB_ID_NONE` 会直接抛错；这使得 tab 的数据在进入 store 前是干净且可靠的。
- `WorkspaceManager`、`background`、`popup.service` 中已去除若干不必要的中间库调用与局部副作用（例如不再对传入 `workspace.tabs` 做原地排序）。

## 当前风险点与注意事项

1. `createWorkspaceTab` 的严格抛错策略
   - 优点：保证持久化的数据一定有合法 tab id，比较安全。
   - 风险：在某些 runtime 场景下（例如 tab 尚未分配 id 的 onCreated 回调），抛错可能导致事件处理链中断。
   - 建议：
     - 如果你能保证只在有 id 的时机调用 `createWorkspaceTab`（目前 `getWindowTabs` 使用 `browser.tabs.query` 返回的 tabs 通常会有 id），则保留当前行为。
     - 否则可以改为返回 `null` 或 `undefined` 表示暂时不可用，然后在上层过滤（更稳健）。

2. 仍有全局 Promise 扩展（可选择移除）
   - 当前项目仍有 `Promise.prototype.fallback` / `fallbackWithDialog` / `Promise.create`。这些为代码带来便利，但也引入全局副作用。
   - 建议：逐步替换为导出工具函数（不会一次性破坏代码）：在合适的阶段替换 `promise.fallback(...)` 为 `withFallback(promise, ...)`。

3. 定时器策略（目前采用按分钟对齐的 `setTimeout`）
   - 现状：`startSyncTask` 使用按分钟对齐的 `launcher()` 来调度。优点是更精确地每 N 分钟触发（例如在 0/5/10 分钟触发）。缺点是逻辑较复杂且不便于取消/测试。
   - 建议：如果你需要精确对齐，可以保留并添加 `stopSync()`；如果不需要精确对齐，改成 `setInterval` 并保存 interval id 会更简单易测。

4. 存储层接口仍可进一步收敛
   - 现在 `$lget/$lset/$lpset/$lsset` 已比较清晰，但项目中对它们的使用模式仍然分散。
   - 建议：提供一套更语义化的存储 wrapper（读、写、快照写、无时间戳写等），并在项目中逐步替换，可减少误用。

## 可进一步精简的逻辑（按优先级）

1. 把 `Promise` 的全局扩展替换为工具函数（中高收益，分步改动）
   - 影响范围：代码中使用 `.fallback()` 的位置都可以被 `withFallback(promise, ...)` 替代。
   - 好处：消除全局副作用、单元测试更容易、对外部库无影响。
   - 可行步骤：
     1. 在 `src/lib/promise-ext.ts` 新增并导出 `withFallback`、`withFallbackWithDialog`、`createPromise` 等函数（保留现有实现）。
     2. 在代码中逐个替换 `.fallback(...)` 调用为 `await withFallback(promise, ...)`（可在多次提交中完成）。
     3. 最后删除 `Promise.prototype` 的改写。

2. 统一存储写入/读取 wrapper（高收益、低改动）
   - 目标：把 timestamp 管理与键名约束集中到一处，避免忘记用 `lpset` 导致 timestamp 未更新等问题。
   - 实现示例：增加 `src/lib/storage.ts`，导出 `readLocal(keys?)`、`writeLocal(data, opts?)`。

3. 把 `_workspaceWindows` 的读写封装（中等收益、低改动）
   - 现在在多个地方通过 `Object.entries` 或 `_workspaceWindows[id]` 查找/写入 windowId。封装后可更改内部实现（例如改为 Map）而不影响调用方。

4. 去除冗余日志或把日志等级分级（低成本）
   - 某些 `logger.debug/info` 调用在生产分支可能噪音较多。把日志等级集中管理，或使用环境变量控制日志级别，会更清晰。

## 建议的执行计划（短期 1-2 天内可完成）

1. 优先：根据项目需求决定是否保留 `createWorkspaceTab` 的严格抛错，或改为返回 `null` 并在上层过滤（预计 0.5 天）。
2. 优先：把 `startSyncTask` 的 launcher 改为支持 `stopSync()`（0.25 天），或者改成 `setInterval`（0.25 天）。
3. 中期：新增 `storage` wrapper（`readLocal` / `writeLocal`）并逐步替换调用点（0.5–1 天）。
4. 中期：分阶段替换 Promise 全局扩展为工具函数（1–2 天，按文件分批替换）。

## 结论

你已完成大量且高质量的精简工作：移除不必要依赖、修正类型/语义不符、强化输入校验，并减少了副作用。接下来的改动可以以提升可测试性和可维护性为目标，逐步消除全局扩展并统一存储接口。

我可以立刻帮你完成下面任一项（并在完成后运行类型检查与测试）：

- 把 `startSyncTask` 改为可停止的 `setInterval` 实现并添加 `stopSync()`；或
- 把 `Promise.prototype.fallback` 调用替换为导出函数 `withFallback`（并保留原有实现以便回退）。

你想我现在先做哪一项？
