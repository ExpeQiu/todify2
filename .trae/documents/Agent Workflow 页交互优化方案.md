## 目标
- 将阻塞式弹窗替换为一致的非阻塞通知与确认，提升操作流畅度
- 用 React 组件重构输入对话框和确认对话框，消除直接 DOM 操作
- 增强节点配置的即时校验与可视化提示，减少保存失败与误操作
- 增加高频操作的键盘快捷键，优化工作流编辑效率
- 改善画布编辑反馈（吸附、连接引导、批量选择），降低学习成本
- 优化工作流列表的重命名、搜索与状态持久化，提升管理体验

## 现状与痛点（代码位置）
- 使用浏览器 `alert/confirm` 造成阻塞与不一致的体验：
  - 切换/删除/发布等均为同步确认 `frontend/src/pages/AgentWorkflowPage.tsx:161`, `172`, `817`
  - 执行失败与保存失败使用 `alert` `frontend/src/pages/AgentWorkflowPage.tsx:316`, `571`
- 执行输入参数对话框通过动态 DOM 拼装，不可复用且难维护：
  - 直接 `document.createElement` 构建弹层与表单 `frontend/src/pages/AgentWorkflowPage.tsx:378`
- 节点配置保存缺少细粒度校验与错误就地提示：
  - 主要通过 `console` 与 `alert` 反馈 `frontend/src/components/WorkflowEditor/NodeConfigPanel.tsx:186`
- 工具栏无键盘快捷键指引，需频繁鼠标操作：
  - `frontend/src/components/WorkflowEditor/ToolbarPanel.tsx`
- 画布反馈有限：无连接引导、无吸附、多选支持弱：
  - `frontend/src/components/WorkflowEditor/WorkflowCanvas.tsx`

## 交互改造项
1) 通知与确认统一组件
- 引入已在项目中使用的 `sonner` toast（参考 `frontend/src/features/workflow/api/documentMutations.ts:30`）
- 新增 `ConfirmDialog` 与 `FormModal` 通用组件，统一风格与可访问性（ESC/Enter 支持）
- 替换以下位置的 `alert/confirm`：
  - 未保存变更切换 `frontend/src/pages/AgentWorkflowPage.tsx:161`
  - 删除工作流 `frontend/src/pages/AgentWorkflowPage.tsx:172`
  - 发布/取消发布 `frontend/src/pages/AgentWorkflowPage.tsx:817`
  - 保存/执行失败提示 `frontend/src/pages/AgentWorkflowPage.tsx:316`, `571`
  - 仍要创建智能工作流的确认 `frontend/src/pages/AgentWorkflowPage.tsx:121`

2) 执行输入对话框重构为 React 组件
- 用 `FormModal` 管理输入参数表单与校验，移除直接 DOM 操作 `frontend/src/pages/AgentWorkflowPage.tsx:378`
- 支持参数类型（string/number/boolean/object/array/file）对应的表单控件与校验
- 显示校验错误的就地提示（必填、JSON 解析、文件类型/大小）
- 保留预填默认值与一键预览输入

3) 节点配置即时校验与提示
- 在 `NodeConfigPanel` 为关键字段加校验状态与错误文案：
  - Agent 选择必填、输入/输出参数的名称唯一与类型合法
  - 条件、赋值、转换等节点的字段格式与必填校验
- 禁用“保存”按钮直至校验通过；错误聚焦便于修正 `frontend/src/components/WorkflowEditor/NodeConfigPanel.tsx:1290`

4) 工具栏快捷键与可发现性
- 在 `AgentWorkflowPage` 顶层注册快捷键：
  - 保存 `Cmd/Ctrl + S`
  - 运行 `Cmd/Ctrl + Enter`
  - 添加节点菜单 `A`
  - 重命名当前工作流 `F2`
  - 切换侧边栏显示 `Cmd/Ctrl + B`
- 在 `ToolbarPanel` 的按钮 `title` 中展示快捷键提示 `frontend/src/components/WorkflowEditor/ToolbarPanel.tsx`

5) 画布交互增强
- 吸附到网格与智能对齐线，减少节点摆放成本
- 连接引导（高亮可连接目标、禁止自连接即时提示）
- 框选与批量移动/删除，提升复杂场景编辑效率
- 连接重复检测与就地提醒（现有 `console.warn` 改为 UI 提示） `frontend/src/pages/AgentWorkflowPage.tsx:690`

6) 工作流列表与侧边栏体验
- 重命名交互优化：回车保存、ESC 取消，失败用 toast 提示 `frontend/src/pages/AgentWorkflowPage.tsx:958`
- 列表支持搜索过滤与排序（按更新时间/节点数）
- 侧边栏折叠状态与选中工作流持久化到 `localStorage`

7) 自动保存与离线容错
- 当后端不可用（已在服务层识别 `ERR_NETWORK`）时，将工作流草稿保存到 `localStorage`，并在恢复后提示同步
- 在标题区显示“已保存/上次保存时间”，保存成功与失败用 toast 提示

8) 发布与模板相关交互
- 发布/取消发布使用 `ConfirmDialog`，并在列表项加“已发布”徽标（已部分存在）
- 模板保存成功用 toast，失败用错误说明 `frontend/src/pages/AgentWorkflowPage.tsx:1123`

## 实施步骤
- 第 1 阶段：搭建 `ConfirmDialog`/`FormModal` 与 toast 替换（范围最广，收益最高）
- 第 2 阶段：重构执行输入对话框为 React（去除直接 DOM）
- 第 3 阶段：节点配置校验与错误就地提示
- 第 4 阶段：快捷键接入与按钮提示
- 第 5 阶段：画布交互（吸附/引导/多选）
- 第 6 阶段：工作流列表搜索与状态持久化
- 第 7 阶段：自动保存与离线容错

## 验证与回归
- 用真实流程（创建→编辑→保存→执行→发布）走查主要路径
- 后端关闭情况下的离线草稿保存与恢复核验
- 画布复杂连接与批量编辑的交互一致性验证
- 无障碍检查（键盘可达、焦点管理、ARIA 标签）

## 交付物
- 通用交互组件（确认/表单/Toast 集成）与替换落地
- 页面与画布交互优化代码及单元/行为测试用例
- 变更说明与快捷键速查（嵌入 UI 的 `title` 文案）