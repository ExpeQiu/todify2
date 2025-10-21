### 滚动需求
任务1:
优化前端UI设计

任务2:
确认后端服务与dify API的对接

任务3:
前端与后端集成测试，包括API调用，数据一致性，性能测试

任务4:
确认数据的有效性

任务5:
流程可以脱钩，可以从任意节点页面进入
为每个节点页面分配独立的http入口



### 核心功能

#### 独立访问地址：

- ✅ 智能搜索节点 : http://localhost:3000/node/ai-search
- ✅ 技术包装节点 : http://localhost:3000/node/tech-package
- ✅ 推广策略节点 : http://localhost:3000/node/promotion-strategy
- ✅ 核心稿件节点 : http://localhost:3000/node/core-draft
- ✅ 演讲稿节点 : http://localhost:3000/node/speech


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


#### 知识点管理
技术点管理页：http://localhost:3000/tech-points
知识点关联：原AI知识信息，技术包装、技术推广、技术通稿、技术发布会


#### 车型-车系
车型与车系管理页：http://localhost:3000/car-series
车系关联：知识点、核心卖点、技术通稿、技术发布会，



### API

#### dify-API
1. 技术问答
2. 技术包装：app-GgD3uUNDWOFu7DlBgSVkIrIt
