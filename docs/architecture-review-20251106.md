# Todify3 架构梳理与规划报告（2025-11-06）

## 1. 项目全景梳理

### 1.1 后端结构（`backend/src`）
| 模块/目录 | 主要职责 | 关键依赖 |
| --- | --- | --- |
| `index.ts` | Express 启动入口，加载环境变量、中间件、API、健康检查、静态资源、数据库初始化 | `config/database`, `models`, `routes` |
| `config/database.ts` | 封装 SQLite/PostgreSQL 双模式连接、事务、查询工具 | `sqlite3`, `pg`, 环境变量 |
| `routes/` | 以 REST 路由为主，直接处理请求、业务逻辑、Dify 调用、数据库交互 | `services`, `models`, `utils/validation`, `multer` |
| `controllers/` | 传统 CRUD 控制器，部分路由仍绕过控制器直接访问模型 | `models`, `types/database` |
| `services/` | Dify 访问、内容拼接、聊天记录、Agent 工作流、AI 搜索等业务逻辑 | `axios`, `config/database`, `utils` |
| `models/` | 基于自定义 SQL 的数据访问层，封装表结构操作 | `config/database`, `types/database` |
| `scripts/` | 数据库迁移、初始化、性能优化脚本（TypeScript + SQL） | CLI 环境、`ts-node` |
| `utils/` | 字段映射、校验、表达式求值等通用工具 | `ajv`/自定义逻辑 |

### 1.2 前端结构（`frontend/src`）
| 层级 | 主要内容 | 特点 |
| --- | --- | --- |
| 根入口 | `main.tsx`, `App.tsx`, 全局样式 | Router 位于 App，所有页面加载在单一 Router 中 |
| `pages/` | 20+ 个页面（工作流、配置、AI 搜索、角色管理等） | `WorkflowPage.tsx` 超 1700 行，承担流程、状态、渲染与业务逻辑 |
| `components/` | 80+ 个复合组件，包含工作流编辑器、AI 搜索 UI、文档编辑器等 | 组件与业务强耦合，部分承担数据获取与状态管理 |
| `services/` | Axios 请求封装、Dify 代理调用、工作流引擎、统计收集 | `workflowEngine.ts` > 1000 行，实现自定义流程执行器 |
| `hooks/` | 自定义数据/状态钩子 | 复用度有限，多与大型组件双向耦合 |
| `types/` | 数据模型定义（Workflow、AI 角色、知识点等） | 主要用于服务与组件间类型共享 |
| `styles/` | CSS 与设计 token | 无统一主题系统 |

### 1.3 基础设施与外部依赖
- **数据库**：默认 SQLite（`backend/data/todify3.db`），支持 PostgreSQL；脚本目录包含多套迁移/初始化方案。
- **AI 集成**：`services/DifyClient.ts` 与 `routes/dify-proxy.ts` 直接调用 Dify REST API（`/chat-messages`, `/workflows/run`），API Key 由环境变量管理。
- **工作流执行**：前端通过 `workflowEngine.ts` 解析 Agent Workflow JSON，后端 `AgentWorkflowService` 负责落库与执行记录。
- **构建与部署**：
  - 前端：Vite + Tailwind；脚本 `quick-deploy.sh`, `deploy.sh`, `frontend/todify2-deploy.tar.gz`。
  - 后端：`npm run build`（tsc），`start.sh`、`prepare-deploy.sh`, `deploy-to-aliyun.sh`。
- **其他辅助**：`guide/` 目录含大量历史诊断/部署文档，为人员交接提供背景资料。

## 2. 过重模块诊断

### 2.1 后端热点文件
- `routes/workflow.ts`（454 行）
  - 集成请求验证、Dify 输入格式转换、调用、失败降级、消息持久化、进度日志，缺乏 Controller/Service 分层。
  - 多处 `console.log` 与 JSON stringify，生产环境噪音大且阻塞 I/O。
  - 依赖 `db`, `ChatMessageService`, `ContentConcatenationService` 等，耦合链长，扩展困难。
- `routes/aiSearch.ts`（609 行）
  - 同时负责文件上传、AI 对话、工作流执行、字段映射、数据库延迟初始化，职责极度膨胀。
  - 多处同步文件系统操作与 JSON 解析，缺乏错误恢复与限流。
  - 与 `AgentWorkflowService`, `FieldMappingService`, `aiSearchService` 双向调用，逻辑路径复杂。
- `services/DifyClient.ts`（441 行）
  - 将聊天应用、工作流应用、模拟数据、API Key 解析全部混合在单文件。
  - 缺乏统一的错误模型与重试策略；不同方法返回结构不一致（`DifyWorkflowResponse` / `DifyChatResponse`）。
  - `axios` 调用散落在方法内部，难以集中配置超时/重试/监控。
- 其他问题
  - 路由直接访问 `models` 或 `services`，缺乏统一的 Controller 层，导致重复的业务校验。
  - 数据校验分散在 `utils/validation.ts` 与各路由内的手写逻辑，不利于维护。

### 2.2 前端热点文件
- `pages/WorkflowPage.tsx`（1781 行）
  - 集成路由跳转、工作流步骤管理、Dify 交互、聊天、文档编辑、自动保存、统计上报等复杂职责。
  - 维护 20+ `useState`，跨步骤数据流通过对象合并完成，调试成本高。
  - 与 `workflowEngine`, `configService`, `agentWorkflowService`, `aiRoleService` 等多个服务耦合，缺乏中间层。
- `services/api.ts`（567 行）
  - 将 Axios 实例、Dify 调用、fallback 逻辑、输入输出转换全部堆叠在单文件。
  - 大量 `console.log`，返回结构不一致（有的返回 `{ success, data }`，有的直接返回 `response.data`）。
  - 缺少缓存/重试策略，难以复用或单测。
- `services/workflowEngine.ts`（1060 行）
  - 自定义执行引擎承担拓扑排序、并发控制、节点类型解析、Agent 调用、错误处理等，耦合 `aiRoleService` 与前端状态。
  - 与真实后端执行模型不同，后续迁移/联调成本高。
- 交叉问题
  - 服务层与组件层混用（组件直接调用 `services/*`），状态提升困难。
  - API 基础设施缺乏统一错误边界；请求重试、Loading、Toast 在各组件重复实现。

## 3. 目标架构设计

### 3.1 后端模块化分层
```
backend/src/
  app/               # 应用入口、全局中间件、错误处理、日志
  modules/
    workflow/
      api/           # Express router + Controller 组合
      application/   # 用例服务，封装业务流程（调用 integration、domain）
      domain/        # DTO、领域服务、校验规则
      infrastructure/
        repositories/  # SQL/ORM 实现
        integrations/  # Dify、文件存储等外部接口
    ai-search/
    catalog/          # 品牌/车型/技术点
    ai-config/        # AI 角色、公开页配置
  shared/
    config/          # 单一配置中心（数据库、Dify、缓存）
    libs/            # 日志、事件、队列、结果包装
    validation/      # Zod/Ajv schema，供 api/application 引用
```
- **接口层**：路由仅负责请求绑定与响应转换，业务交给 UseCase（应用层）。
- **应用层**：聚焦流程编排，如“执行技术包装工作流”，内部调用 `DifyGateway` 与 `ChatRepository` 等。
- **领域模型**：定义 `WorkflowStep`, `AISearchConversation`, `RoleConfig` 等实体/值对象，确保类型清晰。
- **基础设施层**：
  - 数据访问：统一 Repository 接口，考虑引入 Prisma/Drizzle 提升 SQL 可维护性。
  - Dify 集成：拆分 `DifyClient` 为 `ChatGateway`, `WorkflowGateway`，置于 `shared/integrations/dify`，集中处理重试/超时/日志。
- **横切关注点**：
  - 日志：接入 `pino` 或 `winston`，提供结构化日志。
  - 配置：使用 `@fastify/env` 或自定义 `config/index.ts` 统一管理。
  - 校验：引入 `zod`/`superstruct`，在接口层进行 DTO 校验与类型推断。

### 3.2 前端 Feature-Sliced 结构
```
src/
  app/                # Router, Layout, Providers (QueryClient, Theme)
  shared/
    ui/               # 原子组件、样式系统、icons
    lib/              # axios 实例、error boundary、hooks
    config/           # 常量、环境变量读写
  entities/
    workflow/
    ai-role/
    tech-point/
    conversation/
  features/
    workflow-runner/  # 工作流执行逻辑（调度、步骤控制）
    ai-search/
    document-editor/
    public-share/
  pages/
    workflow/
    ai-search/
    admin/
  widgets/
    workflow-dashboard/
    ai-search-console/
```
- **状态管理**：
  - 引入 TanStack Query 处理服务端数据，统一缓存/错误重试。
  - 将跨组件状态（步骤进度、会话、文档）封装为 `features/*` 下的 store（可选 Zustand/Jotai），减少 `useState` 嵌套。
- **UI 组合**：页面只负责组合 `widgets + features`，避免巨石组件。
- **工作流执行**：
  - 将 `workflowEngine` 拆分为后端驱动与前端模拟两种策略，抽象为 `features/workflow-runner/libs`。
  - 与后端用例接口对齐，减少重复逻辑。

### 3.3 数据与集成治理
- **Dify 调用链统一**：
  - 后端引入 `DifyGateway`，对外暴露统一的 `executeChat`, `executeWorkflow` 方法，返回标准 `Result<T>`。
  - 前端仅调用后端 API，不再直接处理 Dify 接口细节；若需直连，封装在 `shared/lib/difyClient`。
- **DTO 与校验**：
  - 后端：所有入参/出参使用 Schema 生成类型（Zod/Typebox），并在 Controller 层验证。
  - 前端：`types/` 迁移为 `entities/*/model/types.ts`，与后端 DTO 对齐，通过生成（OpenAPI 或 tRPC）保持一致。
- **数据库策略**：
  - 定义迁移流程：`scripts/migrations` 下维护版本化 SQL/Prisma migration。
  - 本地默认 SQLite，生产 PostgreSQL，使用统一的 `DATABASE_URL` 配置。
- **环境划分**：
  - `.env.{env}` 模板区分 dev/staging/prod。
  - 部署脚本调用统一的 `config` 输出，避免脚本内硬编码。

## 4. 渐进式落地路线

| 阶段 | 目标 | 主要任务 | 交付物 | 风险与应对 |
| --- | --- | --- | --- | --- |
| Phase 0（准备，1 周） | 建立基础工具链、统一规范 | - 引入 ESLint/Prettier/TypeScript 路径别名<br>- 搭建日志与配置骨架<br>- 设计 DTO/Schema 模板 | 规范文档、基础库目录、脚手架示例 | 规范落地阻力 → 召开共享会 + 示例 PR |
| Phase 1（后端拆分，2-3 周） | 抽离 Dify 集成 & Workflow 模块 | - 实现 `shared/integrations/dify`<br>- 拆分 `routes/workflow.ts` 为 Controller + Service + Repository<br>- 补充单元测试 & 合同测试 | 新的 workflow 模块、Dify 统一客户端、测试报告 | 拆分影响线上 → 先创建 feature flag / Beta 接口 |
| Phase 2（前端模块化，3-4 周） | 重新组织工作流页面与服务层 | - 建立 `app/shared/features/entities` 目录骨架<br>- 拆分 `WorkflowPage` 至 `features/workflow-runner` 与 `widgets/workflow-dashboard`<br>- 接入 TanStack Query，统一 API 层 | 分层后的前端目录、QueryClient provider、分模块测试 | UI 回归复杂 → 引入 Storybook/Playwright 做关键流回归 |
| Phase 3（数据/流程对齐，2 周） | 后端-前端契约统一 & 观测增强 | - 建立 DTO 发布流程（OpenAPI/typed client）<br>- 工作流执行迁移至后端用例，前端调用简化接口<br>- 接入指标 & tracing（例如 Prometheus + Grafana 或 Log aggregation） | OpenAPI 文档、客户端 SDK、监控仪表板 | Dify 不稳定 → 在 Gateway 增加重试/熔断，监控错误率 |
| Phase 4（优化与扩展，持续） | 优化性能与可扩展性 | - 引入队列/异步任务处理 AI 长任务<br>- 拆分 AI Search 独立微服务或模块<br>- 评估多租户/角色权限、审计需求 | 性能报告、扩展设计文档 | 需求变动 → 与产品对齐优先级，保持架构冗余度 |

### 里程碑与验收
- **M1**：Dify 客户端统一、Workflow 模块完成拆分，旧 API 行为一致；CI 中新增单元/集成测试。
- **M2**：前端完成工作流页面拆分，关键用户流（AI 搜索→技术包装→发布稿）通过自动化测试。
- **M3**：OpenAPI 契约与监控平台上线，错误率和平均响应时间指标可视化。
- **M4**：AI Search 模块具备独立扩展能力，支持队列化执行和回溯查询。

### 风险列表
- **人员熟悉成本**：架构调整需要团队理解新目录与职责划分 → 提供培训 + 代码示例。
- **历史数据迁移**：SQLite→PostgreSQL 切换需迁移脚本 → 建立双写/回放策略。
- **Dify 依赖稳定性**：外部服务波动影响主流程 → Gateway 内置熔断、缓存、降级文本。
- **开发节奏**：大型拆分需避免“停摆” → 采用垂直切分 strategy（先新模块承载新功能，再迁移旧功能）。


