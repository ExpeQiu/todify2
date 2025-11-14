import { DatabaseManager, db } from '../config/database';
import { TechCategoryModel } from './TechCategory';
import { TechPointModel } from './TechPoint';
import { CarModelModel } from './CarModel';
import { AgentWorkflowModel, WorkflowExecutionModel, WorkflowTemplateModel } from './AgentWorkflow';
import { AIRoleModel } from './AIRole';
import { PublicPageConfigModel } from './PublicPageConfig';

// 使用已存在的数据库管理器实例
// 创建模型实例
export const techCategoryModel = new TechCategoryModel(db);
export const techPointModel = new TechPointModel(db);
export const carModelModel = new CarModelModel();
export const agentWorkflowModel = new AgentWorkflowModel(db);
export const workflowExecutionModel = new WorkflowExecutionModel(db);
export const workflowTemplateModel = new WorkflowTemplateModel(db);
export const aiRoleModel = new AIRoleModel(db);
export const publicPageConfigModel = new PublicPageConfigModel(db);

// 导出模型类
export { TechCategoryModel } from './TechCategory';
export { TechPointModel } from './TechPoint';
export { CarModelModel } from './CarModel';
export { AgentWorkflowModel, WorkflowExecutionModel, WorkflowTemplateModel } from './AgentWorkflow';
export { AIRoleModel } from './AIRole';
export { PublicPageConfigModel } from './PublicPageConfig';

// 导出数据库管理器
export { DatabaseManager } from '../config/database';