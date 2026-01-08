import { DatabaseManager, db } from '../config/database';
import { TechCategoryModel } from './TechCategory';
import { TechPointModel } from './TechPoint';
import { AIRoleModel } from './AIRole';
import { ProjectModel } from './Project';
import { TechPackagingMaterialModel } from './TechPackagingMaterial';
import { TechPromotionStrategyModel } from './TechPromotionStrategy';
import { TechPressReleaseModel } from './TechPressRelease';
import { PublicKnowledgeModel } from './PublicKnowledge';
import { BrainstormSessionModel, BrainstormParticipantModel, BrainstormMessageModel } from './Brainstorm';
import { ArticleTypeModel } from './ArticleType';
import { AgentWorkflowModel, WorkflowExecutionModel } from './AgentWorkflow';
import { ExecutionTraceModel } from './ExecutionTrace';
import { PerformanceMetricModel } from './PerformanceMetrics';

// 使用已存在的数据库管理器实例
// 创建模型实例
export const techCategoryModel = new TechCategoryModel(db);
export const techPointModel = new TechPointModel(db);
export const aiRoleModel = new AIRoleModel(db);
export const projectModel = new ProjectModel(db);
export const techPackagingMaterialModel = new TechPackagingMaterialModel(db);
export const techPromotionStrategyModel = new TechPromotionStrategyModel(db);
export const techPressReleaseModel = new TechPressReleaseModel(db);
export const publicKnowledgeModel = new PublicKnowledgeModel(db);
export const brainstormSessionModel = new BrainstormSessionModel(db);
export const brainstormParticipantModel = new BrainstormParticipantModel(db);
export const brainstormMessageModel = new BrainstormMessageModel(db);
export const articleTypeModel = new ArticleTypeModel(db);
export const agentWorkflowModel = new AgentWorkflowModel(db);
export const workflowExecutionModel = new WorkflowExecutionModel(db);
export const executionTraceModel = new ExecutionTraceModel(db);
export const performanceMetricModel = new PerformanceMetricModel(db);

// 导出模型类
export { TechCategoryModel } from './TechCategory';
export { TechPointModel } from './TechPoint';
export { AIRoleModel } from './AIRole';
export { ProjectModel } from './Project';
export { TechPackagingMaterialModel } from './TechPackagingMaterial';
export { TechPromotionStrategyModel } from './TechPromotionStrategy';
export { TechPressReleaseModel } from './TechPressRelease';
export { PublicKnowledgeModel } from './PublicKnowledge';
export { BrainstormSessionModel, BrainstormParticipantModel, BrainstormMessageModel } from './Brainstorm';
export { ArticleTypeModel } from './ArticleType';
export { AgentWorkflowModel, WorkflowExecutionModel } from './AgentWorkflow';
export { ExecutionTraceModel } from './ExecutionTrace';
export { PerformanceMetricModel } from './PerformanceMetrics';

// 导出数据库管理器
export { DatabaseManager } from '../config/database';