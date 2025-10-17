import { WorkflowContext, NodeState } from './workflow';

export interface BaseNodeProps {
  nodeState: NodeState | null;
  onExecute: (inputData: any) => Promise<void>;
  canExecute: boolean;
  context: WorkflowContext;
}