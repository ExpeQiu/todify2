import { WorkflowContext, NodeState } from './workflow';
import { AIRoleConfig } from './aiRole';

export interface BaseNodeProps {
  nodeState: NodeState | null;
  onExecute: (inputData: any) => Promise<void>;
  canExecute: boolean;
  context: WorkflowContext;
  aiRole?: AIRoleConfig;  // 新增：AI角色配置
  mode?: 'workflow' | 'independent';  // 新增：运行模式
}