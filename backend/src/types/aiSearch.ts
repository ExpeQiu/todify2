/**
 * 字段映射规则
 */
export interface FieldMappingRule {
  workflowInputName: string; // 工作流输入参数名
  sourceType: 'field' | 'expression'; // 映射来源类型
  sourceField?: string; // AI对话字段名（如 'query', 'sources', 'files'）
  expression?: string; // 表达式映射（支持JavaScript表达式）
  defaultValue?: any; // 默认值（当源字段为空时）
}

/**
 * 输出字段映射规则
 */
export interface OutputMappingRule {
  workflowOutputName: string; // 工作流输出参数名
  targetField: string; // 目标字段名（如 'content', 'files', 'metadata'）
  extractExpression: string; // 提取表达式（如 'output.text' 或 'output.files'）
}

/**
 * 字段映射配置
 */
export interface FieldMappingConfig {
  workflowId: string; // 关联的工作流ID
  inputMappings: FieldMappingRule[]; // 输入字段映射规则
  outputMappings: OutputMappingRule[]; // 输出字段映射规则
}




