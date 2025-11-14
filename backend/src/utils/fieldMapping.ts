/**
 * 字段映射引擎
 * 负责将AI对话数据映射到工作流输入，并从工作流输出提取字段
 */

import { FieldMappingConfig, FieldMappingRule, OutputMappingRule } from '../types/aiSearch';
import { evaluateExpression, extractOutputValue } from './expressionEvaluator';

/**
 * 对话数据接口
 */
export interface ConversationData {
  query: string;
  sources?: any[];
  files?: any[];
  history?: any[];
  lastAssistantMessage?: any;
  lastUserMessage?: any;
  conversationId?: string;
  featureType?: string;
}

/**
 * 工作流输出数据接口
 */
export interface WorkflowOutputData {
  [key: string]: any;
}

/**
 * 提取的输出字段
 */
export interface ExtractedOutputFields {
  content?: string;
  files?: any[];
  metadata?: any;
  [key: string]: any;
}

/**
 * 字段映射引擎
 */
export class FieldMappingEngine {
  /**
   * 将对话数据转换为工作流输入
   * @param conversationData 对话数据
   * @param mappingRules 字段映射规则
   * @returns 工作流输入对象
   */
  mapInputFields(
    conversationData: ConversationData,
    mappingRules: FieldMappingRule[]
  ): Record<string, any> {
    const workflowInput: Record<string, any> = {};

    for (const rule of mappingRules) {
      let value: any;

      if (rule.sourceType === 'field') {
        // 字段映射：直接从对话数据提取字段
        if (rule.sourceField === 'query') {
          value = conversationData.query;
        } else if (rule.sourceField === 'sources') {
          value = conversationData.sources || [];
        } else if (rule.sourceField === 'files') {
          value = conversationData.files || [];
        } else if (rule.sourceField === 'history') {
          value = conversationData.history || [];
        } else if (rule.sourceField === 'lastAssistantMessage') {
          value = conversationData.lastAssistantMessage;
        } else if (rule.sourceField === 'lastUserMessage') {
          value = conversationData.lastUserMessage;
        } else if (rule.sourceField === 'conversationId') {
          value = conversationData.conversationId;
        } else if (rule.sourceField === 'featureType') {
          value = conversationData.featureType;
        } else {
          value = undefined;
        }

        // 如果值为空且提供了默认值，使用默认值
        if ((value === undefined || value === null || value === '') && rule.defaultValue !== undefined) {
          value = rule.defaultValue;
        }
      } else if (rule.sourceType === 'expression') {
        // 表达式映射：执行JavaScript表达式
        try {
          value = evaluateExpression(rule.expression || '', {
            query: conversationData.query,
            sources: conversationData.sources || [],
            files: conversationData.files || [],
            history: conversationData.history || [],
            lastAssistantMessage: conversationData.lastAssistantMessage,
            lastUserMessage: conversationData.lastUserMessage,
            conversationId: conversationData.conversationId,
            featureType: conversationData.featureType,
          });

          // 如果表达式结果为空且提供了默认值，使用默认值
          if ((value === undefined || value === null || value === '') && rule.defaultValue !== undefined) {
            value = rule.defaultValue;
          }
        } catch (error) {
          console.error(`表达式执行失败 (${rule.workflowInputName}):`, error);
          // 如果表达式执行失败，使用默认值
          value = rule.defaultValue;
        }
      }

      // 设置工作流输入值
      workflowInput[rule.workflowInputName] = value;
    }

    return workflowInput;
  }

  /**
   * 从工作流输出提取字段
   * @param workflowOutput 工作流输出数据
   * @param mappingRules 输出字段映射规则
   * @returns 提取的输出字段
   */
  extractOutputFields(
    workflowOutput: WorkflowOutputData,
    mappingRules: OutputMappingRule[]
  ): ExtractedOutputFields {
    const extracted: ExtractedOutputFields = {};

    for (const rule of mappingRules) {
      try {
        // 使用提取表达式提取值
        const value = extractOutputValue(rule.extractExpression, workflowOutput);

        // 根据目标字段类型设置值
        if (rule.targetField === 'content') {
          // 如果是字符串，直接设置；如果是对象，转换为JSON字符串
          extracted.content = typeof value === 'string' ? value : JSON.stringify(value);
        } else if (rule.targetField === 'files') {
          // 确保是数组格式
          extracted.files = Array.isArray(value) ? value : (value ? [value] : []);
        } else if (rule.targetField === 'metadata') {
          // 元数据保持为对象格式
          extracted.metadata = value;
        } else {
          // 其他自定义字段
          extracted[rule.targetField] = value;
        }
      } catch (error) {
        console.error(`提取输出字段失败 (${rule.workflowOutputName}):`, error);
        // 继续处理其他字段，不中断
      }
    }

    return extracted;
  }

  /**
   * 应用字段映射配置
   * @param conversationData 对话数据
   * @param workflowOutput 工作流输出数据
   * @param config 字段映射配置
   * @returns 映射后的输入和提取的输出
   */
  applyMapping(
    conversationData: ConversationData,
    workflowOutput: WorkflowOutputData,
    config: FieldMappingConfig
  ): {
    workflowInput: Record<string, any>;
    extractedOutput: ExtractedOutputFields;
  } {
    const workflowInput = this.mapInputFields(
      conversationData,
      config.inputMappings
    );

    const extractedOutput = this.extractOutputFields(
      workflowOutput,
      config.outputMappings
    );

    return {
      workflowInput,
      extractedOutput,
    };
  }
}

// 导出单例实例
export const fieldMappingEngine = new FieldMappingEngine();

