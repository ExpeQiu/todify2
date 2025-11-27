## 数据库表完整列表（20个）

数据库文件: ./data/todify2.db

### 核心配置表 (6个):
agent_workflows - Agent工作流 [模型✅ 路由✅]
ai_roles - AI角色配置 [模型✅ 路由✅]
workflow_executions - 工作流执行记录 [模型✅ 路由✅]
workflow_templates - 工作流模板 [模型✅ 路由✅]
public_page_configs - 公开页面配置 [模型✅ 路由✅]
page_tool_configs - 页面工具配置 [模型✅ 路由✅]


### AI搜索相关表 (4个):
ai_search_conversations - AI搜索对话 [服务✅]
ai_search_messages - AI搜索消息 [服务✅]
ai_search_outputs - AI搜索输出 [服务✅]
ai_search_field_mappings - AI搜索字段映射 [服务✅]

### 聊天对话表 (4个):
conversations - 对话会话 [服务✅ 路由✅]
chat_messages - 聊天消息 [服务✅ 路由✅]
knowledge_usage_logs - 知识使用日志 [服务✅]
workflow_executions - 工作流执行记录 [服务✅ 路由✅] (与第3项重复)


### 业务数据表 (5个):
brands - 品牌 [模型✅ 路由✅]
car_models - 车型 [模型✅ 路由✅]
car_series - 车系 [模型✅ 路由✅]
tech_categories - 技术分类 [模型✅ 路由✅]
tech_points - 技术点 [模型✅ 路由✅]

### 文件和服务表 (2个):
files - 文件存储 [服务✅]
workflow_stats_summary - 工作流统计 [模型✅ 路由✅]

### 来源信息表 (1个):
source_information - 来源信息 [模型✅ 路由✅]