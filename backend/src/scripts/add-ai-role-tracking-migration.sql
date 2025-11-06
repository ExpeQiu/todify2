-- 添加AI角色和工作流追踪字段的迁移脚本
-- 创建日期: 2025-11-01
-- 目的: 为统计表添加AI角色ID和工作流执行ID字段，建立关联关系

-- ==============================================
-- 1. 为工作流节点使用统计表添加字段
-- ==============================================

-- 添加ai_role_id字段（关联AI角色配置）
ALTER TABLE workflow_node_usage ADD COLUMN ai_role_id TEXT;

-- 添加workflow_execution_id字段（关联工作流执行实例）
ALTER TABLE workflow_node_usage ADD COLUMN workflow_execution_id TEXT;

-- ==============================================
-- 2. 为AI问答评价表添加字段
-- ==============================================

-- 添加ai_role_id字段（关联AI角色配置）
ALTER TABLE ai_qa_feedback ADD COLUMN ai_role_id TEXT;

-- 添加workflow_execution_id字段（关联工作流执行实例）
ALTER TABLE ai_qa_feedback ADD COLUMN workflow_execution_id TEXT;

-- ==============================================
-- 3. 为节点内容处理统计表添加字段
-- ==============================================

-- 添加ai_role_id字段（关联AI角色配置）
ALTER TABLE node_content_processing ADD COLUMN ai_role_id TEXT;

-- 添加workflow_execution_id字段（关联工作流执行实例）
ALTER TABLE node_content_processing ADD COLUMN workflow_execution_id TEXT;

-- ==============================================
-- 4. 创建索引以提高查询性能
-- ==============================================

-- 工作流节点使用统计索引
CREATE INDEX IF NOT EXISTS idx_workflow_node_usage_ai_role_id ON workflow_node_usage(ai_role_id);
CREATE INDEX IF NOT EXISTS idx_workflow_node_usage_workflow_execution_id ON workflow_node_usage(workflow_execution_id);

-- AI问答评价索引
CREATE INDEX IF NOT EXISTS idx_ai_qa_feedback_ai_role_id ON ai_qa_feedback(ai_role_id);
CREATE INDEX IF NOT EXISTS idx_ai_qa_feedback_workflow_execution_id ON ai_qa_feedback(workflow_execution_id);

-- 节点内容处理索引
CREATE INDEX IF NOT EXISTS idx_node_content_processing_ai_role_id ON node_content_processing(ai_role_id);
CREATE INDEX IF NOT EXISTS idx_node_content_processing_workflow_execution_id ON node_content_processing(workflow_execution_id);

-- ==============================================
-- 5. 添加注释说明
-- ==============================================

-- SQLite不支持添加列注释，但可以通过文档说明：
-- ai_role_id: 关联到ai_roles表的id字段，记录本次节点执行使用的AI角色配置
-- workflow_execution_id: 关联到workflow_executions表的id字段，记录所属的工作流执行实例（仅在工作流模式下有效）

-- ==============================================
-- 完成
-- ==============================================






