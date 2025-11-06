// Agent工作流类型定义

import { AIRoleConfig } from './aiRole';

// ==================== Agent类型 ====================

/**
 * Agent配置 - 基于AI角色配置
 */
export type Agent = AIRoleConfig;

// ==================== 工作流节点类型 ====================

/**
 * 输入源引用类型
 */
export type InputSourceType = 
  | 'static'                          // 静态输入值
  | 'node_output';                    // 引用上游节点输出

/**
 * 输入源配置 - 定义节点输入的来源
 */
export interface InputSourceConfig {
  type: InputSourceType;              // 输入源类型
  value?: any;                        // 静态输入值（当type为'static'时使用）
  nodeId?: string;                    // 上游节点ID（当type为'node_output'时使用）
  outputField?: string;               // 上游节点的输出字段名
  mapping?: string;                   // 字段映射表达式
}

/**
 * 节点输入配置
 */
export interface NodeInputConfig {
  [key: string]: any;                 // 键为输入参数名
  // 支持两种格式：
  // 1. 简单值：{ query: "直接值" }
  // 2. 引用上游节点：{ query: { $ref: "node-1.output.content" } }
}

// ==================== 工作流节点类型 ====================

/**
 * 工作流节点类型
 */
export type WorkflowNodeType = 
  | 'agent'      // Agent节点（调用AI）
  | 'condition'  // 条件判断节点
  | 'assign'     // 变量赋值节点
  | 'merge'      // 数据合并节点
  | 'transform'  // 数据转换节点
  | 'input'      // 输入节点（定义工作流输入）
  | 'output'     // 输出节点（定义工作流输出）
  | 'memory';    // 文本记忆节点（存储和编辑文本）

/**
 * 比较操作符
 */
export type ComparisonOperator = 
  | '==' | '!=' | '>' | '<' | '>=' | '<=' 
  | 'contains' | 'not_contains' | 'startsWith' | 'endsWith'
  | 'exists' | 'not_exists';

/**
 * 条件节点数据配置
 */
export interface ConditionNodeData {
  label: string;                      // 节点显示名称
  condition: {                        // 条件配置
    left: string;                     // 左侧值（表达式或变量引用）
    operator: ComparisonOperator;      // 比较操作符
    right: string | number | boolean; // 右侧值
    expression?: string;               // 完整的条件表达式（可选）
  };
  trueLabel?: string;                 // true分支标签
  falseLabel?: string;                // false分支标签
}

/**
 * 赋值节点数据配置
 */
export interface AssignNodeData {
  label: string;                      // 节点显示名称
  variable: string;                   // 变量名
  value?: string;                     // 值（表达式或变量引用）
  expression?: string;                 // 赋值表达式（支持JS表达式）
  valueType?: 'string' | 'number' | 'boolean' | 'object' | 'auto'; // 值类型
}

/**
 * 合并策略
 */
export type MergeStrategy = 
  | 'override'   // 覆盖（后面的覆盖前面的）
  | 'merge'      // 合并（深度合并对象）
  | 'append'     // 追加（数组追加）
  | 'concat';    // 连接（字符串或数组连接）

/**
 * 合并节点数据配置
 */
export interface MergeNodeData {
  label: string;                      // 节点显示名称
  strategy: MergeStrategy;             // 合并策略
  sources: string[];                   // 上游节点ID列表
  fieldMapping?: Record<string, string>; // 字段映射（可选）
}

/**
 * 转换规则类型
 */
export type TransformRuleType = 
  | 'json_path'      // JSON路径提取
  | 'format'         // 格式化
  | 'parse'          // 解析
  | 'stringify';     // 序列化

/**
 * 转换节点数据配置
 */
export interface TransformNodeData {
  label: string;                      // 节点显示名称
  ruleType: TransformRuleType;        // 转换规则类型
  sourceField?: string;               // 源字段（JSON路径或字段名）
  targetField?: string;               // 目标字段名
  rule: {                             // 转换规则配置
    jsonPath?: string;                // JSON路径（当ruleType为json_path时）
    format?: string;                  // 格式字符串（当ruleType为format时）
    parseAs?: 'json' | 'number' | 'boolean' | 'date'; // 解析类型
  };
}

/**
 * 参数类型
 */
export type ParameterType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'file';

/**
 * 输入参数配置
 */
export interface InputParameter {
  name: string;                          // 参数名
  type?: ParameterType;                  // 参数类型
  defaultValue?: any;                    // 默认值
  description?: string;                  // 参数描述
  required?: boolean;                    // 是否必需
  accept?: string;                       // 文件类型（当type为file时使用，如 "image/*", ".pdf,.doc"）
  maxSize?: number;                      // 文件最大大小（字节，当type为file时使用）
}

/**
 * 输入节点数据配置
 */
export interface InputNodeData {
  label: string;                        // 节点显示名称
  inputs: InputParameter[];             // 输入参数列表
  // 向后兼容：保留旧字段
  inputName?: string;                   // 单个输入参数名（已废弃）
  inputType?: 'string' | 'number' | 'boolean' | 'object' | 'array'; // 输入类型（已废弃）
  defaultValue?: any;                   // 默认值（已废弃）
  description?: string;                  // 输入描述（已废弃）
  required?: boolean;                   // 是否必需（已废弃）
}

/**
 * 文本记忆节点数据配置
 */
export interface MemoryNodeData {
  label: string;                      // 节点显示名称
  sourceNodeId?: string;             // 数据源节点ID（可选）
  sourceField?: string;              // 数据源字段（可选，如 "output.content"）
  memoryId?: string;                  // 记忆ID（用于持久化存储）
  content?: string;                   // 存储的文本内容
  editable?: boolean;                 // 是否可编辑（默认true）
  autoSave?: boolean;                 // 是否自动保存（默认false）
}

/**
 * 输出参数配置
 */
export interface OutputParameter {
  name: string;                         // 参数名
  sourceNodeId?: string;                // 数据源节点ID
  sourceField?: string;                 // 数据源字段（可选）
  type?: ParameterType;                 // 输出类型
  description?: string;                  // 参数描述
  downloadFileName?: string;            // 下载文件名（当type为file时使用）
}

/**
 * 输出节点数据配置
 */
export interface OutputNodeData {
  label: string;                        // 节点显示名称
  outputs: OutputParameter[];           // 输出参数列表
  // 向后兼容：保留旧字段
  outputName?: string;                  // 单个输出参数名（已废弃）
  sourceNodeId?: string;                // 数据源节点ID（已废弃）
  sourceField?: string;                  // 数据源字段（已废弃）
  outputType?: 'string' | 'number' | 'boolean' | 'object' | 'array'; // 输出类型（已废弃）
  description?: string;                  // 输出描述（已废弃）
}

/**
 * Agent节点数据配置（保留原有结构）
 */
export interface AgentNodeData {
  label: string;                      // 节点显示名称
  agentName?: string;                  // Agent名称（冗余字段，便于显示）
  inputs?: NodeInputConfig;           // 节点输入参数配置
  outputs?: string[];                  // 节点输出字段映射
  inputSources?: Record<string, InputSourceConfig>; // 输入源配置
}

/**
 * 工作流节点数据联合类型
 */
export type WorkflowNodeData = 
  | AgentNodeData
  | ConditionNodeData
  | AssignNodeData
  | MergeNodeData
  | TransformNodeData
  | InputNodeData
  | OutputNodeData
  | MemoryNodeData;

/**
 * 工作流节点 - 支持多种节点类型
 */
export interface AgentWorkflowNode {
  id: string;                         // 节点唯一ID
  type: WorkflowNodeType;             // 节点类型
  agentId?: string;                   // 关联的Agent ID（仅agent类型需要）
  agentConfig?: Agent;                // Agent配置快照（仅agent类型，可选）
  position: {                         // 节点在画布上的位置
    x: number;
    y: number;
  };
  data: WorkflowNodeData;             // 节点数据（根据类型不同）
}

/**
 * 条件表达式类型
 */
export type ConditionExpression = 
  | string                            // 简单的JavaScript表达式字符串
  | {
      type: 'js_expression';
      expression: string;
    }
  | {
      type: 'always';                 // 总是执行
    };

/**
 * 工作流连接边 - 支持条件判断
 */
export interface AgentWorkflowEdge {
  id: string;                         // 边唯一ID
  source: string;                     // 源节点ID
  target: string;                     // 目标节点ID
  sourceHandle?: string;              // 源节点输出句柄
  targetHandle?: string;              // 目标节点输入句柄
  condition?: ConditionExpression;    // 条件表达式（可选）
  animated?: boolean;                 // 是否显示动画
  label?: string;                     // 边标签
  style?: Record<string, any>;        // 自定义样式
}

/**
 * 工作流执行方式
 */
export type WorkflowExecutionMode = 
  | 'auto'      // 自动触发：全过程自动执行
  | 'manual';   // 单点触发：需要手动触发每个节点

/**
 * Agent工作流定义
 */
export interface AgentWorkflow {
  id: string;                         // 工作流唯一ID
  name: string;                       // 工作流名称
  description?: string;               // 工作流描述
  version: string;                    // 版本号
  nodes: AgentWorkflowNode[];         // 节点列表
  edges: AgentWorkflowEdge[];         // 连接边列表
  executionMode?: WorkflowExecutionMode; // 执行方式：自动触发或单点触发（默认：auto）
  published?: boolean;                // 是否已发布（只有发布的工作流才能被前端页面绑定）
  metadata?: {                        // 元数据
    author?: string;
    tags?: string[];
    category?: string;
    thumbnail?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// ==================== 执行相关类型 ====================

/**
 * 共享数据上下文 - 所有Agent可访问
 */
export interface SharedContext {
  [key: string]: any;                 // 任意数据类型
  // 常用字段
  workflowInput?: any;                // 工作流初始输入
  nodeOutputs?: Record<string, any>;  // 各节点输出（按节点ID索引）
}

/**
 * 节点执行状态
 */
export type NodeExecutionStatus = 
  | 'pending'                          // 等待执行
  | 'running'                          // 执行中
  | 'completed'                        // 执行完成
  | 'failed'                           // 执行失败
  | 'skipped';                         // 跳过

/**
 * 单个节点执行结果
 */
export interface NodeExecutionResult {
  nodeId: string;                     // 节点ID
  status: NodeExecutionStatus;        // 状态
  startTime: Date;                    // 开始时间
  endTime?: Date;                     // 结束时间
  duration?: number;                  // 持续时间（毫秒）
  input?: any;                        // 输入数据
  output?: any;                       // 输出数据
  error?: {                           // 错误信息
    message: string;
    stack?: string;
    code?: string;
  };
  logs?: string[];                    // 日志列表
  retryCount?: number;                // 重试次数
}

/**
 * 工作流执行实例
 */
export interface WorkflowExecution {
  id: string;                         // 执行实例ID
  workflowId: string;                 // 关联的工作流ID
  workflowName?: string;              // 工作流名称（冗余字段）
  status: WorkflowExecutionStatus;    // 整体状态
  sharedContext: SharedContext;       // 共享上下文
  nodeResults: NodeExecutionResult[]; // 各节点执行结果
  startTime: Date;                    // 开始时间
  endTime?: Date;                     // 结束时间
  duration?: number;                  // 总持续时间（毫秒）
  error?: {                           // 整体错误
    message: string;
    nodeId?: string;
  };
  metadata?: Record<string, any>;     // 额外元数据
}

/**
 * 工作流执行状态
 */
export type WorkflowExecutionStatus =
  | 'pending'                         // 等待开始
  | 'running'                         // 执行中
  | 'completed'                       // 完成
  | 'failed'                          // 失败
  | 'cancelled'                       // 已取消
  | 'paused';                         // 已暂停

/**
 * 工作流执行选项
 */
export interface WorkflowExecutionOptions {
  input?: any;                        // 初始输入数据
  maxConcurrentNodes?: number;        // 最大并发节点数（默认3）
  timeout?: number;                   // 超时时间（毫秒）
  retryOnFailure?: boolean;           // 失败后是否重试
  maxRetries?: number;                // 最大重试次数
  continueOnError?: boolean;          // 节点失败后是否继续执行
  logging?: boolean;                  // 是否启用日志
}

// ==================== 模板类型 ====================

/**
 * 工作流模板 - 预定义的工作流结构
 */
export interface WorkflowTemplate {
  id: string;                         // 模板ID
  name: string;                       // 模板名称
  description: string;                // 模板描述
  category: string;                   // 分类
  thumbnail?: string;                 // 缩略图URL
  workflowStructure: {                // 工作流结构（简化的节点和边定义）
    nodes: Array<{
      id: string;
      agentId: string;
      position: { x: number; y: number };
      data: any;
    }>;
    edges: Array<{
      id: string;
      source: string;
      target: string;
      condition?: ConditionExpression;
    }>;
  };
  metadata?: {                        // 元数据
    author?: string;
    tags?: string[];
    complexity?: 'simple' | 'medium' | 'complex';
    estimatedDuration?: number;       // 预计执行时间（秒）
  };
  isPublic?: boolean;                 // 是否公开
  usageCount?: number;                // 使用次数
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 模板实例化选项
 */
export interface TemplateInstantiationOptions {
  name: string;                       // 新工作流名称
  description?: string;               // 新工作流描述
  agentMappings?: Record<string, string>; // Agent ID映射（从模板agentId到实际agentId）
  customizations?: {                  // 自定义配置
    nodeData?: Record<string, any>;   // 节点数据覆盖
    edges?: Array<Partial<AgentWorkflowEdge>>; // 边的修改
  };
}

// ==================== React Flow相关类型 ====================

/**
 * React Flow节点类型（基于reactflow）
 */
export interface FlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: any;
}

/**
 * React Flow边类型（基于reactflow）
 */
export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: string;
  animated?: boolean;
  style?: Record<string, any>;
}

// ==================== UI状态类型 ====================

/**
 * 工作流编辑器模式
 */
export type WorkflowEditorMode = 
  | 'edit'                            // 编辑模式
  | 'execute'                         // 执行模式
  | 'view';                           // 查看模式

/**
 * 编辑器状态
 */
export interface WorkflowEditorState {
  mode: WorkflowEditorMode;
  selectedNodeId?: string;            // 当前选中的节点
  selectedEdgeId?: string;            // 当前选中的边
  isDirty: boolean;                   // 是否有未保存的更改
  isExecuting: boolean;               // 是否正在执行
  executionId?: string;               // 当前执行的ID
}

/**
 * 验证错误
 */
export interface ValidationError {
  type: 'error' | 'warning';
  message: string;
  nodeId?: string;
  edgeId?: string;
  field?: string;
}

/**
 * 工作流验证结果
 */
export interface WorkflowValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

// ==================== 常量定义 ====================

/**
 * 预定义的工作流模板分类
 */
export const WORKFLOW_TEMPLATE_CATEGORIES = {
  CONTENT_GENERATION: 'content-generation',      // 内容生成
  ANALYSIS: 'analysis',                          // 分析
  CONVERSATION: 'conversation',                  // 对话
  OPTIMIZATION: 'optimization',                  // 优化
  CUSTOM: 'custom',                              // 自定义
} as const;

export type WorkflowTemplateCategory = 
  typeof WORKFLOW_TEMPLATE_CATEGORIES[keyof typeof WORKFLOW_TEMPLATE_CATEGORIES];

/**
 * 默认执行选项
 */
export const DEFAULT_EXECUTION_OPTIONS: Required<WorkflowExecutionOptions> = {
  input: {},
  maxConcurrentNodes: 3,
  timeout: 300000,                  // 5分钟
  retryOnFailure: false,
  maxRetries: 0,
  continueOnError: false,
  logging: true,
};

