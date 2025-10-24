### 滚动需求
任务6:优化内容编辑框 markdown渲染效果


任务5:
流程可以脱钩，可以从任意节点页面进入
为每个节点页面分配独立的http入口



任务1:
优化前端UI设计

任务2:
确认后端服务与dify API的对接

任务3:
前端与后端集成测试，包括API调用，数据一致性，性能测试

任务4:
确认数据的有效性




### 核心功能



#### 🎯 核心工作流
1. 多技术点关联 : 一篇技术稿件可以关联多个技术点
2. 稿件类型管理 : 支持不同类型的技术稿件（技术通稿、产品介绍稿、技术解析稿等）
3. 内容生成流程 : 基于选定的多个技术点，通过Dify API生成技术稿件
4. 版本管理 : 支持稿件的修订、保存和版本控制
5. 导出功能 : 支持PDF格式导出


### 数据库设计

#### 数据存储
./data/todify2.db

#### 关键信息链路梳理：
- 维护技术点信息，需维护其技术分类，及对应的车型-车系信息
- 以 技术点 为单位，关联技术分类，技术点下可包含多个 知识点
- 技术点 又与 车型-车系 相关联，一个技术点可关联多个车型-车系
- 基于1个技术点 ，dify-AI，生成技术包装材料
- 基于多个技术点-技术包装材料，dify-AI，生成技术推广策略材料
- 基于多个技术点，dify-AI，生成技术通稿材料
- 基于多个技术点，dify-AI，生成发布会演讲稿



#### 组件：
知识点选择组件：KnowledgePointSelector：http://localhost:3000/tech-points

AI检索与编辑组件：AiSearchComponent，独立测试页面：http://localhost:3000/ai-search-test

AI对话：/Users/expeqiu/Library/Mobile Documents/com~apple~CloudDocs/git/JLwork/todify2/frontend/src/components/AIInterArea.tsx


聊天测试页面：http://localhost:3000/ai-chat

#### 知识点管理
技术点管理页：http://localhost:3000/tech-points
知识点关联：原AI知识信息，技术包装、技术推广、技术通稿、技术发布会


#### 车型-车系
车型与车系管理页：http://localhost:3000/car-series
车系关联：知识点、核心卖点、技术通稿、技术发布会，


### API





## 智能工作流：WorkflowPage


#### 智能工作流页 对接的dify API key信息：


1. 智能工作流配置 (SmartWorkflowNodeConfig)
- AI问答 : app-t1X4eu8B4eucyO6IfrTbw1t2 (chatflow方式)
- 技术包装 : app-YDVb91faDHwTqIei4WWSNaTM (workflow方式)
- 技术策略 : app-awRZf7tKfvC73DEVANAGGNr8 (workflow方式)
- 技术通稿 : app-3TK9U2F3WwFP7vOoq0Ut84KA (workflow方式)
- 发布会稿 : app-WcV5IDjuNKbOKIBDPWdb7HF4 (workflow方式) 



步骤	API端点	状态	响应时间	输出字段
AI问答	/workflow/ai-search	✅ 正常	~3秒	answer
技术包装	/workflow/tech-package	✅ 正常	~2秒	text1
技术策略	/workflow/tech-strategy	✅ 正常	~28秒	text2
技术通稿	/workflow/core-draft	✅ 正常	~18秒	text3
技术发布	/workflow/tech-publish	✅ 正常	~26秒	text4



http://localhost:3000/的完整 工作流：
1. 用户通过 AI问答，提出问题，传递给dify-API，dify-API 调用 技术问答模型，返回答案，用户在前端页面查看答案
2. 用户采纳答案，点击下一步，传递给 技术包装的dify-API，继续生成技术包装材料，展示在 技术包装节点页面的 编辑区
3. 用户可以编辑 技术包装节点的编辑区内容，然后保存，然后点击下一步，传递给 技术推广策略 dify-API，继续生成技术推广策略材料，展示在 推广策略节点页面的 编辑区
4. 用户可以编辑 技术推广策略的编辑区内容，然后保存，然后点击下一步，传递给 技术通稿dify-API，继续生成技术通稿材料，展示在 技术通稿节点页面的 编辑区
5. 用户可以编辑 技术通稿节点的编辑区内容，然后保存，然后点击下一步，传递给 发布会演讲稿dify-API，继续生成发布会演讲稿材料，展示在 演讲稿节点页面的 编辑区





🎯 工作流完整性验证
整个智能工作流现在可以完整运行：
用户输入 → AI问答生成回答
点击下一步 → 自动调用技术包装API，生成技术包装内容
点击下一步 → 自动调用技术策略API，生成技术策略内容
点击下一步 → 自动调用技术通稿API，生成技术通稿内容
点击下一步 → 自动调用技术发布API，生成演讲稿内容


AI问答 (id: 0, key: "smartSearch")
技术包装 (id: 1, key: "techPackage")
技术策略 (id: 2, key: "techStrategy")
技术通稿 (id: 3, key: "coreDraft")
发布会演讲稿 (id: 4, key: "speechGeneration")


## 独立功能

http://localhost:3000/ 各节点对应的dify- API
与 
- ✅ 智能搜索节点 : http://localhost:3000/node/ai-search
- ✅ 技术包装节点 : http://localhost:3000/node/tech-package
- ✅ 推广策略节点 : http://localhost:3000/node/promotion-strategy
- ✅ 核心稿件节点 : http://localhost:3000/node/core-draft
- ✅ 演讲稿节点 : http://localhost:3000/node/speech
不同的，需单独配置


#### 独立访问地址：

- ✅ 智能搜索节点 : http://localhost:3000/node/ai-search
- ✅ 技术包装节点 : http://localhost:3000/node/tech-package
- ✅ 推广策略节点 : http://localhost:3000/node/promotion-strategy
- ✅ 核心稿件节点 : http://localhost:3000/node/core-draft
- ✅ 演讲稿节点 : http://localhost:3000/node/speech



2. 独立页面配置 (IndependentPageConfig)

- AI问答 : app-HC8dx24idIWm1uva66VmHXsm (chatflow方式)
- 技术包装 : app-GgD3uUNDWOFu7DlBgSVkIrIt (chatflow方式)
- 技术策略 : app-DesVds4LQch6k7Unu7KpBCS4 (chatflow方式)
- 技术通稿 : app-c7HLp8OGiTgnpvg5cIYqQCYZ (chatflow方式)
- 技术发布 : app-iAiKRQ7h8zCwkz2TBkezgtGs (chatflow方式)



访问统计页面:
http://localhost:3001/workflow-stats
http://localhost:3001/enhanced-workflow-stats



✅ Dify API 配置验证完成
📋 配置概览
Dify API 基础URL: http://47.113.225.93:9999/v1 ✅
代理服务地址: http://47.113.225.93:8088/api/dify ✅
🔑 API Key 配置状态
智能工作流配置 (SmartWorkflowNodeConfig)
功能	API Key	连接类型	状态
AI问答	app-t1X4eu8B4eucyO6IfrTbw1t2	chatflow	✅ 正常
技术包装	app-YDVb91faDHwTqIei4WWSNaTM	workflow	✅ 正常
技术策略	app-awRZf7tKfvC73DEVANAGGNr8	workflow	✅ 正常
技术通稿	app-3TK9U2F3WwFP7vOoq0Ut84KA	workflow	✅ 正常
发布会稿	app-WcV5IDjuNKbOKIBDPWdb7HF4	workflow	✅ 正常
独立页面配置 (IndependentPageConfig)
功能	API Key	连接类型	状态
AI问答	app-HC8dx24idIWm1uva66VmHXsm	chatflow	✅ 正常
技术包装	app-GgD3uUNDWOFu7DlBgSVkIrIt	chatflow	✅ 正常
技术策略	app-DesVds4LQch6k7Unu7KpBCS4	chatflow	✅ 正常
技术通稿	app-c7HLp8OGiTgnpvg5cIYqQCYZ	chatflow	✅ 正常
技术发布	app-iAiKRQ7h8zCwkz2TBkezgtGs	chatflow	✅ 正常




所有工作流API接口都已正确配置数据库保存功能：

- /ai-search : 使用 ChatMessageService.saveDifyChatResponse
- /tech-package : 使用 ChatMessageService.saveDifyWorkflowResponse
- /tech-strategy : 使用 ChatMessageService.saveDifyWorkflowResponse
- /tech-article : 使用 ChatMessageService.saveDifyWorkflowResponse（删除）
- /core-draft : 使用 ChatMessageService.saveDifyWorkflowResponse
- /tech-publish : 使用 ChatMessageService.saveDifyWorkflowResponse



- AI问答 ( /api/v1/workflow/ai-search ) - 使用 saveDifyChatResponse 保存对话
- 技术包装 ( /api/v1/workflow/tech-package ) - 使用 saveDifyWorkflowResponse 保存工作流执行
- 技术策略 ( /api/v1/workflow/tech-strategy ) - 使用 saveDifyWorkflowResponse 保存工作流执行
- 技术通稿 ( /api/v1/workflow/tech-article ) - 使用 saveDifyWorkflowResponse 保存工作流执行（删除）
- 技术通稿 ( /api/v1/workflow/core-draft ) - 使用 saveDifyWorkflowResponse 保存工作流执行
- 发布会稿 ( /api/v1/workflow/tech-publish ) - 使用 saveDifyWorkflowResponse 保存工作流执行