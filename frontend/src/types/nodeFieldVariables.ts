/**
 * 节点字段变量名规范
 * 
 * 为每个节点类型及其输出字段定义唯一的变量名，便于前端进行字段映射配置
 * 格式: {nodeId}.{outputType}.{fieldName}
 * 
 * 例如:
 * - agent节点: node-1.agent.output.content
 * - condition节点: node-2.condition.output.result
 * - assign节点: node-3.assign.output.value
 * - memory节点: node-4.memory.output.content
 */

import { WorkflowNodeType } from './agentWorkflow';

/**
 * 节点输出字段路径定义
 */
export interface NodeOutputFieldPath {
  /** 节点ID */
  nodeId: string;
  /** 节点类型 */
  nodeType: WorkflowNodeType;
  /** 输出字段路径 */
  fieldPath: string;
  /** 完整的变量名 */
  variableName: string;
  /** 字段描述 */
  description?: string;
}

/**
 * 节点输出字段定义
 */
export interface NodeOutputFieldDefinition {
  /** 字段路径（相对于节点输出根） */
  path: string;
  /** 字段名 */
  name: string;
  /** 字段类型 */
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'any';
  /** 字段描述 */
  description: string;
  /** 是否必需 */
  required?: boolean;
}

/**
 * 节点输出结构定义
 */
export interface NodeOutputStructure {
  /** 节点类型 */
  nodeType: WorkflowNodeType;
  /** 输出字段列表 */
  fields: NodeOutputFieldDefinition[];
  /** 默认输出路径 */
  defaultPath?: string;
}

/**
 * 各节点类型的标准输出结构定义
 */
export const NODE_OUTPUT_STRUCTURES: Record<WorkflowNodeType, NodeOutputStructure> = {
  agent: {
    nodeType: 'agent',
    defaultPath: 'output.content',
    fields: [
      {
        path: 'output.content',
        name: 'content',
        type: 'string',
        description: 'Agent返回的主要文本内容',
        required: true,
      },
      {
        path: 'output.data',
        name: 'data',
        type: 'object',
        description: 'Agent返回的完整数据对象',
      },
      {
        path: 'output.metadata',
        name: 'metadata',
        type: 'object',
        description: 'Agent执行的元数据信息',
      },
      {
        path: 'output.success',
        name: 'success',
        type: 'boolean',
        description: 'Agent执行是否成功',
      },
      {
        path: 'output.error',
        name: 'error',
        type: 'string',
        description: '错误信息（如果执行失败）',
      },
    ],
  },
  condition: {
    nodeType: 'condition',
    defaultPath: 'output.result',
    fields: [
      {
        path: 'output.result',
        name: 'result',
        type: 'boolean',
        description: '条件判断结果（true/false）',
        required: true,
      },
      {
        path: 'output.leftValue',
        name: 'leftValue',
        type: 'any',
        description: '左侧比较值',
      },
      {
        path: 'output.rightValue',
        name: 'rightValue',
        type: 'any',
        description: '右侧比较值',
      },
      {
        path: 'output.condition',
        name: 'condition',
        type: 'string',
        description: '使用的条件表达式',
      },
    ],
  },
  assign: {
    nodeType: 'assign',
    defaultPath: 'output.value',
    fields: [
      {
        path: 'output.value',
        name: 'value',
        type: 'any',
        description: '赋值的变量值',
        required: true,
      },
      {
        path: 'output.variable',
        name: 'variable',
        type: 'string',
        description: '变量名',
        required: true,
      },
      {
        path: 'output.valueType',
        name: 'valueType',
        type: 'string',
        description: '值类型',
      },
    ],
  },
  merge: {
    nodeType: 'merge',
    defaultPath: 'output.result',
    fields: [
      {
        path: 'output.result',
        name: 'result',
        type: 'object',
        description: '合并后的数据结果',
        required: true,
      },
      {
        path: 'output.sources',
        name: 'sources',
        type: 'array',
        description: '合并的数据源列表',
      },
      {
        path: 'output.strategy',
        name: 'strategy',
        type: 'string',
        description: '使用的合并策略',
      },
    ],
  },
  transform: {
    nodeType: 'transform',
    defaultPath: 'output.result',
    fields: [
      {
        path: 'output.result',
        name: 'result',
        type: 'any',
        description: '转换后的数据结果',
        required: true,
      },
      {
        path: 'output.sourceField',
        name: 'sourceField',
        type: 'string',
        description: '源字段路径',
      },
      {
        path: 'output.targetField',
        name: 'targetField',
        type: 'string',
        description: '目标字段路径',
      },
      {
        path: 'output.ruleType',
        name: 'ruleType',
        type: 'string',
        description: '转换规则类型',
      },
    ],
  },
  input: {
    nodeType: 'input',
    defaultPath: 'output.inputs',
    fields: [
      {
        path: 'output.inputs',
        name: 'inputs',
        type: 'array',
        description: '输入参数列表',
        required: true,
      },
      {
        path: 'output.count',
        name: 'count',
        type: 'number',
        description: '输入参数数量',
      },
      {
        path: 'output.{paramName}',
        name: '{paramName}',
        type: 'any',
        description: '具体的输入参数值（paramName为参数名）',
      },
    ],
  },
  output: {
    nodeType: 'output',
    defaultPath: 'output.outputs',
    fields: [
      {
        path: 'output.outputs',
        name: 'outputs',
        type: 'object',
        description: '输出参数对象',
        required: true,
      },
      {
        path: 'output.count',
        name: 'count',
        type: 'number',
        description: '输出参数数量',
      },
      {
        path: 'output.{paramName}',
        name: '{paramName}',
        type: 'any',
        description: '具体的输出参数值（paramName为参数名）',
      },
    ],
  },
  memory: {
    nodeType: 'memory',
    defaultPath: 'output.content',
    fields: [
      {
        path: 'output.content',
        name: 'content',
        type: 'string',
        description: '存储的文本内容',
        required: true,
      },
      {
        path: 'output.memoryId',
        name: 'memoryId',
        type: 'string',
        description: '记忆ID',
      },
      {
        path: 'output.editable',
        name: 'editable',
        type: 'boolean',
        description: '是否可编辑',
      },
      {
        path: 'output.autoSave',
        name: 'autoSave',
        type: 'boolean',
        description: '是否自动保存',
      },
      {
        path: 'output.sourceNodeId',
        name: 'sourceNodeId',
        type: 'string',
        description: '数据源节点ID',
      },
      {
        path: 'output.sourceField',
        name: 'sourceField',
        type: 'string',
        description: '数据源字段',
      },
    ],
  },
};

/**
 * 生成节点字段的完整变量名
 * @param nodeId 节点ID
 * @param nodeType 节点类型
 * @param fieldPath 字段路径（相对于output，如 'content' 或 'data.result'）
 * @returns 完整的变量名，格式: {nodeId}.{nodeType}.output.{fieldPath}
 */
export function generateNodeFieldVariableName(
  nodeId: string,
  nodeType: WorkflowNodeType,
  fieldPath: string
): string {
  // 移除字段路径中可能的前缀 'output.'
  const cleanPath = fieldPath.replace(/^output\./, '');
  return `${nodeId}.${nodeType}.output.${cleanPath}`;
}

/**
 * 解析变量名为节点字段信息
 * @param variableName 变量名，格式: {nodeId}.{nodeType}.output.{fieldPath}
 * @returns 解析后的节点字段信息，如果格式不正确返回null
 */
export function parseNodeFieldVariableName(
  variableName: string
): { nodeId: string; nodeType: WorkflowNodeType; fieldPath: string } | null {
  const parts = variableName.split('.');
  if (parts.length < 4 || parts[2] !== 'output') {
    return null;
  }
  
  const nodeId = parts[0];
  const nodeType = parts[1] as WorkflowNodeType;
  const fieldPath = parts.slice(3).join('.');
  
  return { nodeId, nodeType, fieldPath: `output.${fieldPath}` };
}

/**
 * 获取节点的所有可用字段
 * @param nodeId 节点ID
 * @param nodeType 节点类型
 * @returns 节点字段定义列表
 */
export function getNodeOutputFields(
  nodeId: string,
  nodeType: WorkflowNodeType
): NodeOutputFieldPath[] {
  const structure = NODE_OUTPUT_STRUCTURES[nodeType];
  if (!structure) {
    return [];
  }
  
  return structure.fields.map(field => ({
    nodeId,
    nodeType,
    fieldPath: field.path,
    variableName: generateNodeFieldVariableName(nodeId, nodeType, field.path),
    description: field.description,
  }));
}

/**
 * 获取节点的默认输出字段
 * @param nodeId 节点ID
 * @param nodeType 节点类型
 * @returns 默认字段的变量名，如果没有默认字段则返回null
 */
export function getNodeDefaultOutputField(
  nodeId: string,
  nodeType: WorkflowNodeType
): string | null {
  const structure = NODE_OUTPUT_STRUCTURES[nodeType];
  if (!structure || !structure.defaultPath) {
    return null;
  }
  
  return generateNodeFieldVariableName(nodeId, nodeType, structure.defaultPath);
}

/**
 * 验证变量名格式
 * @param variableName 变量名
 * @returns 是否为有效的节点字段变量名
 */
export function isValidNodeFieldVariableName(variableName: string): boolean {
  return parseNodeFieldVariableName(variableName) !== null;
}

/**
 * 简化变量名格式（用于显示）
 * 将完整格式 ${nodeId.nodeType.output.fieldPath} 转换为简化的 ${nodeId.output.fieldPath}
 * @param variableName 完整的变量名
 * @returns 简化后的变量名
 */
export function simplifyVariableName(variableName: string): string {
  const parsed = parseNodeFieldVariableName(variableName);
  if (!parsed) {
    return variableName;
  }
  
  // 简化格式: nodeId.output.fieldPath
  return `${parsed.nodeId}.output.${parsed.fieldPath.replace(/^output\./, '')}`;
}

/**
 * 从简化格式恢复完整格式
 * @param simplifiedName 简化格式的变量名
 * @param nodeType 节点类型（需要从上下文中获取）
 * @returns 完整格式的变量名
 */
export function expandVariableName(simplifiedName: string, nodeType: WorkflowNodeType): string {
  const parts = simplifiedName.split('.');
  if (parts.length < 3 || parts[1] !== 'output') {
    return simplifiedName;
  }
  
  const nodeId = parts[0];
  const fieldPath = parts.slice(2).join('.');
  
  return generateNodeFieldVariableName(nodeId, nodeType, `output.${fieldPath}`);
}

