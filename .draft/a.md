# 源码静态扫描报告 — 最新复评（精简后）

我已基于你最新的一轮删改（移除 `flat-pair`、去掉 `fallback`、用原生判定、强化 tabs 过滤、增加 waitForWindowReady 等）做了再次梳理。下面把关键发现、优先级建议和最小修补点整理出来，便于你快速定位与修复。

## 本次高优先级问题（建议立即修复）

1. `_workspaceWindows` 访问语义不一致（严重）
   - 位置：`src/manager.ts` 中的 `addWindowTab`
   - 现象：`openIniter` 将 `_workspaceWindows[workspace.id] = window.id`（即 map: workspaceId -> windowId），但 `addWindowTab` 中却用 `_workspaceWindows[windowId]` 直接索引（把键当成 windowId）。这会导致 `workspaceId` 始终为 undefined，后续逻辑不会把新 tab 关联到 workspace。
   - 修复建议：把 `addWindowTab` 中对 workspaceId 的查找改为基于值的查找，例如：
     ```ts
     const entry = Object.entries(_workspaceWindows).find(([, wid]) => wid === windowId);
     if (!entry) return;
     const workspaceId = entry[0];
     ```
     或者维护一个反向索引（windowId -> workspaceId）并在 `openIniter` 中同时写入，这样读写更高效且语义清晰。

2. `startSyncTask` 时间单位错误（严重）
   - 位置：`src/background.ts` 的 `startSyncTask` -> `launcher`
   - 现象：代码计算 `delta` 为分钟数（0..EVERY_X_MINUTES-1），但直接传入 `setTimeout(task, delta)`。`setTimeout` 的单位是毫秒，导致同步几乎立即触发而不是按分钟间隔。
   - 修复建议：将 setTimeout 的延迟改为毫秒：`setTimeout(task, delta * 60 * 1000)`。并考虑改用 `setInterval` 或在 `launcher` 中计算精确的毫秒延迟以保证对齐。

3. `waitForWindowReady` 没有超时，会导致 promise 永远挂起（高）
   - 位置：`src/manager.ts` 的 `waitForWindowReady`
   - 现象：该函数通过 `browser.tabs.onUpdated` 添加监听并在满足条件时 resolve，但若条件永远不满足（例如环境差异或浏览器事件未触发），则 promise 永不结束，影响 `open` 的执行流。
   - 修复建议：把等待封装为带 timeout 的 Promise：
     ```ts
     return Promise.race([
       new Promise((resolve) => {
         /* listener resolves */
       }),
       new Promise((_, reject) => setTimeout(() => reject(new Error('wait timeout')), TIMEOUT_MS)),
     ]);
     ```
     并在超时后移除监听器，或在超时情况下回退到 `await $sleep(n)` 的短等待并继续。

## 中等优先级问题与改进点

1. `createWorkspaceTab` 抛错策略（注意）
   - 位置：`src/lib/workspace.ts`
   - 现状：严格抛错（tab.id undefined 或 TAB_ID_NONE 时抛 TypeError）。你已经在 `getWindowTabs` 中增加了 `.filter` 来避免传入非法 tab，当前行为是安全的。
   - 建议：保留严格策略，但在能接收到未分配 id 的调用点（例如 onCreated）使用过滤或延后处理，避免事件链断裂。

2. `startSyncTask` 的调度策略复杂（优化建议）
   - 现状：你使用分钟对齐逻辑（每 5 分钟对齐触发），这有其合理性，但实现复杂且难以测试。
   - 建议：若不需要精确对齐，使用 `setInterval(task, EVERY_X_MINUTES * 60 * 1000)` 并保存 interval id；若需要对齐，则保留当前逻辑但加入清理接口 `stopSync()` 并把单位修正为毫秒。

3. 事件监听添加/移除需保证幂等（改进）
   - 场景：`waitForWindowReady` 中每次都 `addListener`，并在满足条件时 `removeListener`，这很好。但在异常/超时路径也必须确保移除监听，避免内存泄露或重复触发。

4. 存储键与类型一致性（小问题）
   - 说明：`_workspaceWindows` 的 key 是 workspaceId（string），value 是 windowId（number），而 `_windowTabs` 使用 windowId 作为 key。通过 `browser.storage.local` 持久化时 numeric keys 会变为字符串；目前代码使用 `[]` 访问（JS 会做类型转换），但建议在所有位置统一以 string key 操作以避免隐性转换带来的困惑。

## 可进一步精简或重构的建议（按收益）

1. 增设 `_workspaceWindows` 的读写封装（高收益、低改动）
   - 增加两个 helper：`getWorkspaceIdByWindowId(windowId)` 与 `setWorkspaceWindow(workspaceId, windowId)`，把 `Object.entries` 的细节隐藏。好处：更少重复代码、便于改内部实现为 Map。

2. 抽象存储 wrapper（中高收益）
   - 把 `$lget/$lset/$lpset/$lsset` 的常用模式收拢到 `src/lib/storage.ts`，给出明确 API（读、写、快照写、读带 timestamp 等），避免不同地方以不同方式误用 timestamp。

3. 把 `waitForWindowReady` 的实现替换为事件+超时封装（中收益）
   - 这样既可以避免长时间挂起，又能用较少的代码保证鲁棒性。

4. 把 `startSyncTask` 的调度改为可停止且易测试的实现（低成本）
   - 如 `this._syncTimer = setInterval(task, EVERY_X_MINUTES * 60 * 1000);` 并提供 `stopSync()`。

## 最小修补清单（可自动化提交）

我建议按下面顺序逐一修补（每项都是低风险改动，方便逐步验证）：

1. 修复 `addWindowTab` 中查找 workspaceId 的代码（把直接索引改为基于 value 的查找），或同时维护反向索引。
2. 修复 `startSyncTask` 中 `setTimeout` 的单位问题（乘以 60\*1000），并添加 `stopSync()` 或改用 `setInterval`。
3. 给 `waitForWindowReady` 添加超时并确保在超时或异常路径中移除 listener。

我可以帮你直接把这三项最小补丁逐个应用并在每次变更后运行 `pnpm run check`（TypeScript 检查）与 `pnpm test`（若可用）来验证。你要我现在就按上面顺序开始修补吗？如果是，请确认我先修哪一项（建议先修第 1 项以保证 tab 与 window 的关联逻辑正确）。
