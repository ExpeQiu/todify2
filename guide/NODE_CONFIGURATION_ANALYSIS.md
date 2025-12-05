# 项目节点配置需求与有效节点分析

本文档详细分析了项目中需要配置的节点类型，以及前端页面中实际使用的有效节点。

## 一、需要配置的节点类型

### 1. 独立页面节点（5个）

这些节点对应独立的页面路由，需要配置AI角色（source: 'independent-page'）：

| 节点ID | 节点名称 | 路由路径 | 页面组件 | 状态 |
|--------|---------|---------|---------|------|
| `ai-search` | AI问答 | `/node/ai-search` | AiSearchNode | ✅ 有效 |
| `tech-package` | 技术包装 | `/node/tech-package` | TechPackageNode | ✅ 有效 |
| `promotion-strategy` | 技术策略 | `/node/promotion-strategy` | PromotionStrategyNode | ✅ 有效 |
| `core-draft` | 核心稿件 | `/node/core-draft` | CoreDraftNode | ✅ 有效 |
| `speech` | 演讲稿 | `/node/speech` | PressReleasePage | ✅ 有效（映射到press-release） |

**配置要求：**
- 需要在AI角色管理系统中创建对应的AI角色
- source必须设置为 `'independent-page'`
- 角色ID或名称需要匹配节点类型（通过正则表达式匹配）
- 支持Dify类型和Direct Agent类型

**匹配规则（见 `nodeRoleMapping.ts`）：**
```typescript
// ai-search 匹配模式
/ai-search/i, /ai问答/i, /智能搜索/i, /smart-search/i

// tech-package 匹配模式
/tech-package/i, /技术包装/i

// promotion-strategy 匹配模式
/promotion-strategy/i, /tech-strategy/i, /技术策略/i, /推广策略/i

// core-draft 匹配模式
/core-draft/i, /tech-article/i, /技术通稿/i, /核心稿件/i

// speech 匹配模式
/speech/i, /发布会/i, /演讲稿/i, /tech-publish/i
```

### 2. 标准页面节点（5个）

这些是标准化的独立页面，使用BaseAISearchPage组件：

| 页面类型 | 页面名称 | 路由路径 | 配置文件 | 状态 |
|---------|---------|---------|---------|------|
| `tech-package` | 技术包装 | `/tech-package` | techPackageConfig | ✅ 有效 |
| `tech-strategy` | 技术策略 | `/tech-strategy` | techStrategyConfig | ✅ 有效 |
| `tech-article` | 技术通稿 | `/tech-article` | techArticleConfig | ✅ 有效 |
| `press-release` | 发布会稿 | `/press-release` | pressReleaseConfig | ✅ 有效 |
| `ai-qa` | AI问答 | `/ai-qa` | aiQaConfig | ✅ 有效 |

**配置要求：**
- 需要配置工作流（通过字段映射配置）
- 需要配置功能Agent（五看、三定等）
- 每个页面可以配置不同的工具集（enabledToolIds）

**页面配置位置：** `frontend/src/configs/pageConfigs.ts`

### 3. 工作流编辑器节点（8个）

这些节点用于工作流编辑器，支持可视化编排：

| 节点类型 | 节点名称 | 分类 | 配置要求 | 状态 |
|---------|---------|------|---------|------|
| `agent` | Agent节点 | agent | 需要配置agentId（AI角色ID） | ✅ 有效 |
| `input` | 输入节点 | io | 定义工作流输入参数 | ✅ 有效 |
| `output` | 输出节点 | io | 定义工作流输出参数 | ✅ 有效 |
| `condition` | 条件判断 | logic | 配置条件表达式 | ✅ 有效 |
| `assign` | 变量赋值 | data | 配置变量名和值 | ✅ 有效 |
| `merge` | 数据合并 | data | 配置合并策略 | ✅ 有效 |
| `transform` | 数据转换 | data | 配置转换规则 | ✅ 有效 |
| `memory` | 文本记忆 | data | 配置文本存储 | ✅ 有效 |

**配置要求：**
- Agent节点：必须配置agentId，关联AI角色（source: 'agent-workflow'）
- 其他节点：根据节点类型配置相应的参数

**节点类型定义位置：** `frontend/src/config/workflowNodeTypes.ts`

### 4. 功能Agent节点（8个）

这些是子Agent，通过字段映射配置关联到工作流或AI角色：

| 功能类型 | 功能名称 | 使用页面 | 配置方式 | 状态 |
|---------|---------|---------|---------|------|
| `five-view-analysis` | 五看/技术转译 | tech-package, tech-strategy, press-release | 字段映射配置 | ✅ 有效 |
| `three-fix-analysis` | 三定/用户场景挖掘 | tech-package, tech-strategy, press-release | 字段映射配置 | ✅ 有效 |
| `tech-matrix` | 技术矩阵 | tech-package, tech-strategy, press-release | 字段映射配置 | ✅ 有效 |
| `propagation-strategy` | 传播策略 | tech-package, tech-strategy | 字段映射配置 | ✅ 有效 |
| `exhibition-video` | 展具与视频 | tech-package, press-release | 字段映射配置 | ✅ 有效 |
| `translation` | 翻译 | 所有页面 | 字段映射配置 | ✅ 有效 |
| `ppt-outline` | 技术讲稿 | tech-package, tech-strategy, tech-article | 字段映射配置 | ✅ 有效 |
| `script` | 脚本 | tech-package, press-release | 字段映射配置 | ✅ 有效 |

**配置要求：**
- 在字段映射管理页面配置
- 每个功能可以关联工作流ID或AI角色ID
- 支持按pageType区分配置（tech-package, tech-strategy, tech-article, press-release）
- 需要配置输入输出字段映射

**配置位置：** 字段映射管理页面 (`/field-mapping-management`)

## 二、前端页面中实际使用的有效节点

### 1. 路由配置分析

根据 `App.tsx` 的路由配置，以下页面是有效的：

#### 标准独立页面路由（5个）
```typescript
/tech-package      → TechPackagePage
/tech-strategy     → TechStrategyPage
/tech-article      → TechArticlePage
/press-release     → PressReleasePage
/ai-qa             → AIQAPage
```

#### 节点页面路由（动态）
```typescript
/node/:nodeType     → NodePage
```
支持的nodeType：
- `ai-search` → AiSearchNode
- `ai-qa` → AiSearchNode（复用）
- `tech-package` → TechPackageNode
- `promotion-strategy` → PromotionStrategyNode
- `core-draft` → CoreDraftNode
- `speech` → PressReleasePage（映射）

#### 向后兼容路由
```typescript
/ai-search          → 重定向到 /tech-package
/tech-publish       → 重定向到 /press-release
```

### 2. 页面组件映射

| 页面路由 | 页面组件 | 使用的节点组件 | 配置来源 |
|---------|---------|--------------|---------|
| `/tech-package` | TechPackagePage | BaseAISearchPage | techPackageConfig |
| `/tech-strategy` | TechStrategyPage | BaseAISearchPage | techStrategyConfig |
| `/tech-article` | TechArticlePage | BaseAISearchPage | techArticleConfig |
| `/press-release` | PressReleasePage | BaseAISearchPage | pressReleaseConfig |
| `/ai-qa` | AIQAPage | BaseAISearchPage | aiQaConfig |
| `/node/ai-search` | NodePage | AiSearchNode | 公开页面配置或AI角色 |
| `/node/ai-qa` | NodePage | AiSearchNode | 公开页面配置或AI角色 |
| `/node/tech-package` | NodePage | TechPackageNode | 公开页面配置或AI角色 |
| `/node/promotion-strategy` | NodePage | PromotionStrategyNode | 公开页面配置或AI角色 |
| `/node/core-draft` | NodePage | CoreDraftNode | 公开页面配置或AI角色 |
| `/node/speech` | NodePage | PressReleasePage | 公开页面配置或AI角色 |

### 3. 工作流编辑器节点

工作流编辑器（`/agent-workflow`）中可用的节点类型：

| 节点类型 | 是否有效 | 使用场景 |
|---------|---------|---------|
| `agent` | ✅ 是 | 调用AI角色执行任务 |
| `input` | ✅ 是 | 定义工作流输入 |
| `output` | ✅ 是 | 定义工作流输出 |
| `condition` | ✅ 是 | 条件分支判断 |
| `assign` | ✅ 是 | 变量赋值 |
| `merge` | ✅ 是 | 数据合并 |
| `transform` | ✅ 是 | 数据转换 |
| `memory` | ✅ 是 | 文本存储 |

## 三、节点配置依赖关系

### 1. 独立页面节点配置流程

```
1. 创建AI角色
   ├─ source: 'independent-page'
   ├─ provider: 'dify' 或 'direct-agent'
   └─ 名称/ID匹配节点类型

2. 配置Dify连接（如果provider为dify）
   ├─ connectionType: 'chatflow' 或 'workflow'
   ├─ apiKey: Dify API密钥
   └─ apiUrl: Dify服务器地址

3. 配置Direct Agent（如果provider为direct-agent）
   ├─ LLM配置（apiKey, apiBaseUrl, model）
   ├─ Prompt配置（systemPrompt, variables）
   ├─ 上下文策略
   └─ 工具配置（可选）

4. 节点页面自动匹配AI角色
   └─ 通过nodeRoleMapping.ts中的匹配规则
```

### 2. 标准页面配置流程

```
1. 配置工作流（可选）
   └─ 在字段映射管理页面配置

2. 配置功能Agent
   ├─ 在字段映射管理页面配置
   ├─ 关联工作流ID或AI角色ID
   ├─ 配置输入输出字段映射
   └─ 按pageType区分配置

3. 页面自动加载配置
   ├─ 从字段映射配置加载工作流
   ├─ 从字段映射配置加载功能Agent
   └─ 根据pageConfig显示可用工具
```

### 3. 工作流节点配置流程

```
1. 创建AI角色（用于Agent节点）
   ├─ source: 'agent-workflow'
   └─ provider: 'dify'（工作流中只支持Dify类型）

2. 创建工作流
   ├─ 添加Input节点（定义输入）
   ├─ 添加Agent节点（配置agentId）
   ├─ 添加其他逻辑节点（condition, assign等）
   └─ 添加Output节点（定义输出）

3. 执行工作流
   └─ 通过AgentWorkflowService.executeWorkflow()
```

## 四、配置检查清单

### ✅ 独立页面节点配置检查

- [ ] ai-search节点：已创建source='independent-page'的AI角色
- [ ] tech-package节点：已创建source='independent-page'的AI角色
- [ ] promotion-strategy节点：已创建source='independent-page'的AI角色
- [ ] core-draft节点：已创建source='independent-page'的AI角色
- [ ] speech节点：已创建source='independent-page'的AI角色（或使用press-release配置）

### ✅ 标准页面配置检查

- [ ] tech-package页面：已配置工作流和功能Agent
- [ ] tech-strategy页面：已配置工作流和功能Agent
- [ ] tech-article页面：已配置工作流和功能Agent
- [ ] press-release页面：已配置工作流和功能Agent
- [ ] ai-qa页面：已配置工作流和功能Agent

### ✅ 功能Agent配置检查

- [ ] five-view-analysis：已配置字段映射
- [ ] three-fix-analysis：已配置字段映射
- [ ] tech-matrix：已配置字段映射
- [ ] propagation-strategy：已配置字段映射
- [ ] exhibition-video：已配置字段映射
- [ ] translation：已配置字段映射
- [ ] ppt-outline：已配置字段映射
- [ ] script：已配置字段映射

### ✅ 工作流节点配置检查

- [ ] Agent节点：已创建source='agent-workflow'的AI角色
- [ ] 工作流：已创建并配置节点连接
- [ ] 字段映射：已配置输入输出映射（如需要）

## 五、节点有效性总结

### 完全有效的节点（21个）

#### 独立页面节点（5个）
1. ✅ ai-search
2. ✅ tech-package
3. ✅ promotion-strategy
4. ✅ core-draft
5. ✅ speech

#### 标准页面节点（5个）
1. ✅ tech-package（页面）
2. ✅ tech-strategy（页面）
3. ✅ tech-article（页面）
4. ✅ press-release（页面）
5. ✅ ai-qa（页面）

#### 工作流编辑器节点（8个）
1. ✅ agent
2. ✅ input
3. ✅ output
4. ✅ condition
5. ✅ assign
6. ✅ merge
7. ✅ transform
8. ✅ memory

#### 功能Agent节点（8个）
1. ✅ five-view-analysis
2. ✅ three-fix-analysis
3. ✅ tech-matrix
4. ✅ propagation-strategy
5. ✅ exhibition-video
6. ✅ translation
7. ✅ ppt-outline
8. ✅ script

### 已废弃/重定向的节点

- ❌ `/ai-search` → 重定向到 `/tech-package`
- ❌ `/tech-publish` → 重定向到 `/press-release`

## 六、配置优先级

### 1. 独立页面节点配置优先级

```
优先级1: 公开页面配置（PublicPageConfig）
  └─ 如果存在address匹配的公开配置，使用配置中的角色

优先级2: AI角色匹配（nodeRoleMapping）
  └─ 通过正则表达式匹配source='independent-page'的角色

优先级3: 默认配置
  └─ 使用系统默认配置（如果存在）
```

### 2. 标准页面配置优先级

```
优先级1: 字段映射配置中的工作流
  └─ 从字段映射配置加载该pageType的工作流

优先级2: 用户选择的工作流
  └─ 从localStorage加载用户上次选择的工作流

优先级3: 默认工作流
  └─ 使用系统默认工作流
```

### 3. 功能Agent配置优先级

```
优先级1: 字段映射配置中的agentId
  └─ 如果featureObject配置了agentId，直接调用AI角色

优先级2: 字段映射配置中的workflowId
  └─ 如果featureObject配置了workflowId，调用工作流

优先级3: 当前页面的默认工作流
  └─ 使用当前页面配置的工作流
```

## 七、配置建议

### 1. 独立页面节点配置建议

- 为每个独立页面节点创建专门的AI角色
- 使用清晰的命名规则，便于自动匹配
- 建议命名格式：`{节点类型}-independent-page`
- 例如：`ai-search-independent-page`, `tech-package-independent-page`

### 2. 标准页面配置建议

- 为每个页面类型配置专门的工作流
- 功能Agent按页面类型区分配置
- 使用字段映射管理页面统一管理
- 建议工作流命名格式：`{页面类型}-workflow`
- 例如：`tech-package-workflow`, `tech-strategy-workflow`

### 3. 工作流节点配置建议

- Agent节点使用source='agent-workflow'的AI角色
- 工作流中只支持Dify类型的AI角色
- 合理使用逻辑节点（condition, assign等）构建复杂流程
- 使用Output节点明确定义输出结构

## 八、总结

### 需要配置的节点总数：21个

- **独立页面节点**：5个
- **标准页面节点**：5个（通过页面配置）
- **工作流编辑器节点**：8个
- **功能Agent节点**：8个

### 所有节点都是有效的

项目中定义的所有节点类型都在前端页面中有实际使用，没有废弃的节点。

### 配置管理位置

1. **AI角色配置**：`/ai-roles` - AI角色管理页面
2. **字段映射配置**：`/field-mapping-management` - 字段映射管理页面
3. **工作流配置**：`/agent-workflow` - 工作流编辑器
4. **公开页面配置**：`/public-page-configs` - 公开页面配置管理

### 配置依赖关系

```
AI角色系统（基础）
  ├─ 独立页面节点配置
  ├─ 工作流Agent节点配置
  └─ 功能Agent配置（可选）

字段映射系统
  ├─ 标准页面工作流配置
  ├─ 功能Agent配置
  └─ 输入输出字段映射

工作流系统
  └─ 工作流节点编排
```
