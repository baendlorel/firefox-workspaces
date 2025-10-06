# 国际化键名规范化总结

## 概述

本次更新统一了 `_locales` 文件中的所有键名，采用 `xxx.aaa-bbb-ccc.xxx-yyy` 格式，提高了可读性和可维护性。

## 键名分类规范

### 1. 扩展基本信息 (`extension.*`)

- `extension.name` - 扩展名称
- `extension.description` - 扩展描述

### 2. 工作区相关 (`workspace.*`)

- `workspace.title` - 工作区标题
- `workspace.new` - 新建工作区
- `workspace.create-with-current-tabs` - 用当前标签页创建
- `workspace.field.name` - 名称字段
- `workspace.field.color` - 颜色字段
- `workspace.random-name.part1` - 随机名称第一部分
- `workspace.random-name.part2` - 随机名称第二部分
- `workspace.empty.no-workspaces` - 空状态提示
- `workspace.empty.get-started` - 空状态行动号召

### 3. 对话框相关 (`dialog.*`)

- `dialog.workspace.edit` - 编辑工作区对话框
- `dialog.workspace.new-with-tabs` - 包含标签的新工作区对话框
- `dialog.settings.title` - 设置对话框标题
- `dialog.settings.close` - 关闭设置对话框
- `dialog.settings.reset` - 重置设置
- `dialog.import.title` - 导入对话框标题
- `dialog.import.intro` - 导入说明
- `dialog.import.choose-file` - 选择文件按钮
- `dialog.type.information` - 信息对话框
- `dialog.type.warning` - 警告对话框
- `dialog.type.danger` - 危险对话框
- `dialog.type.confirm` - 确认对话框

### 4. 按钮相关 (`button.*`)

- `button.more-actions` - 更多操作
- `button.new` - 新建
- `button.random` - 随机
- `button.generate-random-name` - 生成随机名称
- `button.delete` - 删除
- `button.delete-workspace` - 删除工作区
- `button.cancel` - 取消
- `button.cancel-and-close` - 取消并关闭
- `button.save` - 保存
- `button.save-workspace` - 保存工作区
- `button.reset` - 重置
- `button.yes` - 是
- `button.no` - 否
- `button.confirm-selection` - 确认选择

### 5. 消息提示 (`message.*`)

- `message.validation.enter-group-name` - 输入组名称验证
- `message.confirm.delete-workspace` - 删除工作区确认
- `message.confirm.are-you-sure` - 通用确认
- `message.import.success` - 导入成功
- `message.import.summary` - 导入摘要
- `message.import.summary-skipped` - 导入跳过摘要
- `message.import.invalid-hash` - Hash验证失败
- `message.import.invalid-workspaces` - 工作区数据验证失败
- `message.import.invalid-settings` - 设置数据验证失败
- `message.export.failed` - 导出失败
- `message.error.parse-file` - 文件解析错误
- `message.error.load-workgroups` - 加载工作组错误
- `message.error.save-workspace` - 保存工作区错误
- `message.error.delete-workspace` - 删除工作区错误
- `message.error.initialize` - 初始化错误
- `message.error.load-state` - 加载状态错误

### 6. 菜单项 (`menu.*`)

- `menu.import` - 导入数据
- `menu.export` - 导出数据
- `menu.debug-info` - 调试信息
- `menu.settings` - 设置
- `menu.add-to-workspaces` - 添加到工作区
- `menu.about` - 关于

### 7. 时间相关 (`time.*`)

- `time.just-now` - 刚刚
- `time.minutes-ago` - X分钟前
- `time.last-updated-at` - 最近更新于

### 8. 设置相关 (`settings.*`)

- `settings.theme.label` - 主题标签
- `settings.theme.auto` - 自动主题
- `settings.theme.light` - 浅色主题
- `settings.theme.dark` - 深色主题
- `settings.sync.label` - 同步标签
- `settings.sync.description` - 同步描述
- `settings.toggle.on` - 开启
- `settings.toggle.off` - 关闭

### 9. 调试相关 (`debug.*`)

- `debug.clear-cache` - 清除缓存
- `debug.clear-all-mock-data` - 清除所有模拟数据
- `debug.random-workspaces` - 随机工作区
- `debug.set-current` - 设为当前
- `debug.success` - 成功

### 10. 关于页面 (`about.*`)

- `about.title` - 关于标题
- `about.name` - 应用名称
- `about.tagline` - 标语
- `about.subtitle` - 副标题
- `about.homepage` - 访问主页
- `about.feature.fast` - 快速切换特性
- `about.feature.color` - 颜色编码特性
- `about.feature.import-export` - 导入导出特性
- `about.feature.create-from-tabs` - 从标签创建特性
- `about.link.repository` - 代码仓库链接
- `about.link.report-issues` - 报告问题链接
- `about.link.changelog` - 更新日志链接
- `about.copyright` - 版权信息
- `about.contact` - 联系方式

### 11. 捐赠相关 (`donate.*`)

- `donate.title` - 捐赠标题
- `donate.message` - 捐赠消息
- `donate.welcome` - 欢迎信息
- `donate.click-here` - 点此访问

## 更新的文件

### 国际化文件

- `_locales/en/messages.json` - 英文翻译文件
- `_locales/zh_CN/messages.json` - 中文翻译文件

### TypeScript 源代码

- `src/background.ts` - 后台脚本
- `src/manager.ts` - 工作区管理器
- `src/lib/ext-apis.ts` - 扩展API封装
- `src/web/components/settings.ts` - 设置组件
- `src/web/components/dialog/select-dialog.ts` - 选择对话框
- `src/web/components/dialog/alerts.ts` - 警告对话框
- `src/web/main/version.ts` - 版本信息
- `src/web/main/header.ts` - 页头组件
- `src/web/main/empty-state.ts` - 空状态组件
- `src/web/main/editor.ts` - 编辑器组件

### HTML 页面

- `pages/about.html` - 关于页面
- `pages/donate.html` - 捐赠页面
- `pages/import.html` - 导入页面

## 键名命名规则

1. **使用小写字母**：所有键名使用小写字母
2. **使用连字符分隔**：单词之间使用连字符 `-` 分隔
3. **使用点号分层**：使用 `.` 进行分类层次划分
4. **语义清晰**：键名应该清楚地表达其用途
5. **保持一致**：同类型的键使用相同的命名模式

### 示例对比

**旧格式（不规范）：**

```
extensionName
newWorkspace
createWithCurrentTabs
noWorkspacesYet
firefoxWorkspacesSettings
about.features.fast
about.links.repository
```

**新格式（规范）：**

```
extension.name
workspace.new
workspace.create-with-current-tabs
workspace.empty.no-workspaces
dialog.settings.title
about.feature.fast
about.link.repository
```

## 优势

1. **可读性强**：层次清晰，一眼就能看出键的分类和用途
2. **易于维护**：相关的键聚集在一起，便于查找和修改
3. **避免冲突**：通过命名空间降低键名冲突的可能性
4. **扩展性好**：便于添加新的分类和键
5. **IDE 支持**：更好的自动补全和提示

## 验证

所有更改已通过 TypeScript 类型检查和 Vite 构建验证，确保：

- 英文和中文键名完全一致
- 所有代码引用已更新
- 类型定义自动生成正确
- 编译无错误
