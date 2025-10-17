// 工作流节点类型定义
export interface WorkflowNode {
  id: string;
  name: string;
  type: NodeType;
  description: string;
  icon: React.ComponentType;
  path: string;
  dependencies?: string[]; // 依赖的前置节点
  outputs?: string[]; // 可能的输出类型
  nextSteps?: string[]; // 可能的下一步节点
}

export type NodeType = 
  | 'ai_search'
  | 'smart_search'
  | 'tech_package' 
  | 'promotion_strategy'
  | 'core_draft'
  | 'speech';

export interface NodeState {
  nodeId: string;
  status: 'idle' | 'loading' | 'completed' | 'error';
  data?: any;
  error?: string;
  timestamp?: Date;
}

export interface WorkflowContext {
  nodes: Record<string, NodeState>;
  currentNode?: string;
  completedNodes: string[];
  availableNextSteps: string[];
}

export interface NextStepRecommendation {
  nodeId: string;
  confidence: number;
  reason: string;
  requiredData?: string[];
}

// 节点配置接口
export interface NodeConfig {
  canStartIndependently: boolean; // 是否可以独立启动
  requiredInputs?: string[]; // 必需的输入数据
  optionalInputs?: string[]; // 可选的输入数据
  defaultValues?: Record<string, any>; // 默认值
}

// Dify工作流字段定义 - 基于robot1-技术包装.yml
export interface DifyWorkflowFields {
  // 输入字段
  inputs: {
    // input1: 上游信息 (必填, 最大5000字符)
    input1: {
      value: string;
      label: '上游信息';
      placeholder: '请输入需要处理的上游信息内容';
      required: true;
      maxLength: 5000;
      type: 'textarea';
    };
    // input2: 附件上传 (可选, 最多5个文件)
    input2: {
      value: File[];
      label: '附件上传';
      placeholder: '支持上传图片和文档文件';
      required: false;
      maxFiles: 5;
      allowedTypes: string[];
      type: 'file-upload';
    };
    // input3: 优化建议 (可选, 最大1000字符)
    input3: {
      value: string;
      label: '优化建议';
      placeholder: '提供优化建议或特殊要求';
      required: false;
      maxLength: 1000;
      type: 'textarea';
    };
  };
  // 输出字段
  outputs: {
    // text: 处理结果文本
    text: {
      value: string;
      label: '处理结果';
      type: 'text';
    };
  };
}

// 表单验证规则
export interface FieldValidationRule {
  required?: boolean;
  maxLength?: number;
  maxFiles?: number;
  allowedTypes?: string[];
  pattern?: RegExp;
  customValidator?: (value: any) => string | null;
}

// 字段配置
export interface FieldConfig {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'file-upload' | 'select' | 'checkbox';
  placeholder?: string;
  validation: FieldValidationRule;
  helpText?: string;
}