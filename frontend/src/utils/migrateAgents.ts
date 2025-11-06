// Agent配置迁移工具
// 将SmartWorkflowNodeConfig和IndependentPageConfig转换为AIRoleConfig

import { AIRoleConfig } from '../types/aiRole';
import { SmartWorkflowNodeConfig, IndependentPageConfig } from '../services/configService';

/**
 * 将SmartWorkflowNodeConfig转换为AIRoleConfig
 */
export function convertSmartWorkflowToAIRole(
  config: SmartWorkflowNodeConfig
): Omit<AIRoleConfig, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    name: config.name,
    description: config.description,
    avatar: undefined,
    systemPrompt: undefined,
    difyConfig: {
      apiUrl: config.apiUrl,
      apiKey: config.apiKey,
      connectionType: config.connectionType,
      inputFields: []
    },
    enabled: config.enabled,
    source: 'smart-workflow'
  };
}

/**
 * 将IndependentPageConfig转换为AIRoleConfig
 */
export function convertIndependentPageToAIRole(
  config: IndependentPageConfig
): Omit<AIRoleConfig, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    name: config.name,
    description: config.description,
    avatar: undefined,
    systemPrompt: undefined,
    difyConfig: {
      apiUrl: config.apiUrl,
      apiKey: config.apiKey,
      connectionType: config.connectionType,
      inputFields: []
    },
    enabled: config.enabled,
    source: 'independent-page'
  };
}

/**
 * 批量转换SmartWorkflowNodeConfig
 */
export function convertSmartWorkflowConfigs(
  configs: SmartWorkflowNodeConfig[]
): Array<Omit<AIRoleConfig, 'id' | 'createdAt' | 'updatedAt'>> {
  return configs.map(convertSmartWorkflowToAIRole);
}

/**
 * 批量转换IndependentPageConfig
 */
export function convertIndependentPageConfigs(
  configs: IndependentPageConfig[]
): Array<Omit<AIRoleConfig, 'id' | 'createdAt' | 'updatedAt'>> {
  return configs.map(convertIndependentPageToAIRole);
}

/**
 * 生成迁移后的角色ID（基于原始ID，但确保唯一性）
 */
export function generateMigratedRoleId(originalId: string, existingIds: string[]): string {
  // 如果原始ID不存在冲突，直接使用
  if (!existingIds.includes(originalId)) {
    return originalId;
  }
  
  // 如果冲突，添加后缀
  let counter = 1;
  let newId = `${originalId}-migrated-${counter}`;
  while (existingIds.includes(newId)) {
    counter++;
    newId = `${originalId}-migrated-${counter}`;
  }
  return newId;
}

