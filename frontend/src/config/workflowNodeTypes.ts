import { Bot, GitBranch, Variable, Merge, Wand2, LogIn, LogOut, Brain } from 'lucide-react';
import { WorkflowNodeType, ConditionNodeData, AssignNodeData, MergeNodeData, TransformNodeData, AgentNodeData, InputNodeData, OutputNodeData, MemoryNodeData } from '../types/agentWorkflow';
import React from 'react';

/**
 * 节点类型元数据
 */
export interface NodeTypeMetadata {
  type: WorkflowNodeType;
  name: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  category: 'agent' | 'logic' | 'data' | 'io';
  defaultData: ConditionNodeData | AssignNodeData | MergeNodeData | TransformNodeData | AgentNodeData | InputNodeData | OutputNodeData | MemoryNodeData;
}

/**
 * 节点类型配置
 */
export const WORKFLOW_NODE_TYPES: Record<WorkflowNodeType, NodeTypeMetadata> = {
  agent: {
    type: 'agent',
    name: 'Agent节点',
    description: '调用AI Agent执行任务',
    icon: Bot,
    color: '#3B82F6',
    category: 'agent',
    defaultData: {
      label: 'Agent节点',
      agentName: '',
      inputs: {},
      outputs: [],
      inputSources: {},
    } as AgentNodeData,
  },
  condition: {
    type: 'condition',
    name: '条件判断',
    description: '根据条件进行分支判断',
    icon: GitBranch,
    color: '#10B981',
    category: 'logic',
    defaultData: {
      label: '条件判断',
      condition: {
        left: '',
        operator: '==',
        right: '',
      },
      trueLabel: '是',
      falseLabel: '否',
    } as ConditionNodeData,
  },
  assign: {
    type: 'assign',
    name: '变量赋值',
    description: '设置变量或更新数据',
    icon: Variable,
    color: '#8B5CF6',
    category: 'data',
    defaultData: {
      label: '变量赋值',
      variable: 'result',
      value: '',
      valueType: 'auto',
    } as AssignNodeData,
  },
  merge: {
    type: 'merge',
    name: '数据合并',
    description: '合并多个数据源',
    icon: Merge,
    color: '#F59E0B',
    category: 'data',
    defaultData: {
      label: '数据合并',
      strategy: 'override',
      sources: [],
    } as MergeNodeData,
  },
  transform: {
    type: 'transform',
    name: '数据转换',
    description: '转换数据格式或提取字段',
    icon: Wand2,
    color: '#EF4444',
    category: 'data',
    defaultData: {
      label: '数据转换',
      ruleType: 'json_path',
      sourceField: '',
      targetField: '',
      rule: {
        jsonPath: '',
      },
    } as TransformNodeData,
  },
  input: {
    type: 'input',
    name: '输入节点',
    description: '定义工作流的输入参数',
    icon: LogIn,
    color: '#06B6D4',
    category: 'io',
    defaultData: {
      label: '输入节点',
      inputs: [
        {
          name: 'input',
          type: 'string',
          required: true,
        },
      ],
    } as InputNodeData,
  },
  output: {
    type: 'output',
    name: '输出节点',
    description: '定义工作流的输出结果',
    icon: LogOut,
    color: '#6366F1',
    category: 'io',
    defaultData: {
      label: '输出节点',
      outputs: [
        {
          name: 'output',
          type: 'object',
        },
      ],
    } as OutputNodeData,
  },
  memory: {
    type: 'memory',
    name: '文本记忆',
    description: '存储和编辑上游节点的文本内容',
    icon: Brain,
    color: '#EC4899',
    category: 'data',
    defaultData: {
      label: '文本记忆',
      content: '',
      editable: true,
      autoSave: false,
    } as MemoryNodeData,
  },
};

/**
 * 按分类获取节点类型
 */
export function getNodeTypesByCategory(category: 'agent' | 'logic' | 'data' | 'io'): NodeTypeMetadata[] {
  return Object.values(WORKFLOW_NODE_TYPES).filter(nodeType => nodeType.category === category);
}

/**
 * 根据类型获取节点元数据
 */
export function getNodeTypeMetadata(type: WorkflowNodeType): NodeTypeMetadata {
  return WORKFLOW_NODE_TYPES[type];
}

/**
 * 获取所有节点类型
 */
export function getAllNodeTypes(): NodeTypeMetadata[] {
  return Object.values(WORKFLOW_NODE_TYPES);
}

