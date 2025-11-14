// 节点类型与AI角色映射工具
// 用于在独立页面模式下自动匹配对应的AI角色配置

import { AIRoleConfig } from '../types/aiRole';

/**
 * 独立页面节点类型定义
 */
export type IndependentNodeType = 
  | 'ai-search' 
  | 'tech-package' 
  | 'promotion-strategy' 
  | 'core-draft' 
  | 'speech';

/**
 * 节点类型配置
 * 定义了5个独立页面的匹配规则
 */
export interface NodeTypeConfig {
  nodeType: IndependentNodeType;
  name: string;
  description: string;
  patterns: RegExp[];  // 用于匹配AI角色的正则表达式模式
}

/**
 * 5个独立页面节点的配置
 */
export const INDEPENDENT_NODE_CONFIGS: NodeTypeConfig[] = [
  {
    nodeType: 'ai-search',
    name: 'AI问答',
    description: '智能问答和搜索功能',
    patterns: [
      /ai-search/i,
      /ai问答/i,
      /智能搜索/i,
      /smart-search/i,
    ],
  },
  {
    nodeType: 'tech-package',
    name: '技术包装',
    description: '技术内容包装工作流',
    patterns: [
      /tech-package/i,
      /技术包装/i,
    ],
  },
  {
    nodeType: 'promotion-strategy',
    name: '技术策略',
    description: '技术策略生成工作流',
    patterns: [
      /promotion-strategy/i,
      /tech-strategy/i,
      /技术策略/i,
      /推广策略/i,
    ],
  },
  {
    nodeType: 'core-draft',
    name: '技术通稿',
    description: '核心内容生成工作流',
    patterns: [
      /core-draft/i,
      /tech-article/i,
      /技术通稿/i,
      /核心稿件/i,
    ],
  },
  {
    nodeType: 'speech',
    name: '发布会演讲稿',
    description: '技术发布内容生成工作流',
    patterns: [
      /speech/i,
      /发布会/i,
      /演讲稿/i,
      /tech-publish/i,
    ],
  },
];

/**
 * 根据节点类型查找匹配的AI角色
 * 优先匹配 source === 'independent-page' 的角色
 * 
 * @param nodeType - 节点类型（如 'ai-search'）
 * @param roles - AI角色列表
 * @returns 匹配的AI角色，如果未找到返回null
 */
export function findAIRoleForNode(
  nodeType: IndependentNodeType,
  roles: AIRoleConfig[]
): AIRoleConfig | null {
  // 查找节点配置
  const nodeConfig = INDEPENDENT_NODE_CONFIGS.find(config => config.nodeType === nodeType);
  
  if (!nodeConfig) {
    console.warn(`未找到节点类型配置: ${nodeType}`);
    return null;
  }

  // 优先级1: 查找 source === 'independent-page' 且ID精确匹配的角色
  for (const role of roles) {
    if (role.source === 'independent-page' && role.enabled) {
      if (nodeConfig.patterns.some(pattern => pattern.test(role.id))) {
        console.log(`找到独立页面AI角色 (ID精确匹配): ${role.name}`);
        return role;
      }
    }
  }

  // 优先级2: 查找 source === 'independent-page' 且名称匹配的角色
  for (const role of roles) {
    if (role.source === 'independent-page' && role.enabled) {
      if (nodeConfig.patterns.some(pattern => pattern.test(role.name))) {
        console.log(`找到独立页面AI角色 (名称匹配): ${role.name}`);
        return role;
      }
    }
  }

  // 优先级3: 查找 source === 'independent-page' 且描述匹配的角色
  for (const role of roles) {
    if (role.source === 'independent-page' && role.enabled) {
      if (nodeConfig.patterns.some(pattern => pattern.test(role.description))) {
        console.log(`找到独立页面AI角色 (描述匹配): ${role.name}`);
        return role;
      }
    }
  }

  // 优先级4: 回退到任意source的匹配（用于兼容性）
  for (const role of roles) {
    if (role.enabled) {
      if (nodeConfig.patterns.some(pattern => 
        pattern.test(role.id) || 
        pattern.test(role.name) || 
        pattern.test(role.description)
      )) {
        console.warn(`找到AI角色但source不匹配 (回退匹配): ${role.name}, source: ${role.source}`);
        return role;
      }
    }
  }

  console.warn(`未找到匹配的AI角色: ${nodeType}`);
  return null;
}

/**
 * 获取节点类型配置
 * 
 * @param nodeType - 节点类型
 * @returns 节点配置，如果未找到返回null
 */
export function getNodeTypeConfig(nodeType: IndependentNodeType): NodeTypeConfig | null {
  return INDEPENDENT_NODE_CONFIGS.find(config => config.nodeType === nodeType) || null;
}

/**
 * 获取所有独立页面节点类型配置
 */
export function getAllNodeTypeConfigs(): NodeTypeConfig[] {
  return INDEPENDENT_NODE_CONFIGS;
}

/**
 * 检查是否为有效的独立页面节点类型
 * 
 * @param nodeType - 节点类型字符串
 * @returns 是否为有效的独立页面节点类型
 */
export function isValidIndependentNodeType(nodeType: string): nodeType is IndependentNodeType {
  return INDEPENDENT_NODE_CONFIGS.some(config => config.nodeType === nodeType);
}

/**
 * 获取独立页面所有可用的AI角色
 * 返回所有 source === 'independent-page' 且 enabled === true 的角色
 * 
 * @param roles - AI角色列表
 * @returns 独立页面AI角色列表
 */
export function getIndependentPageRoles(roles: AIRoleConfig[]): AIRoleConfig[] {
  return roles.filter(role => 
    role.source === 'independent-page' && 
    role.enabled
  );
}

/**
 * 获取智能工作流所有可用的AI角色
 * 返回所有 source === 'smart-workflow' 且 enabled === true 的角色
 * 
 * @param roles - AI角色列表
 * @returns 智能工作流AI角色列表
 */
export function getSmartWorkflowRoles(roles: AIRoleConfig[]): AIRoleConfig[] {
  return roles.filter(role => 
    role.source === 'smart-workflow' && 
    role.enabled
  );
}
