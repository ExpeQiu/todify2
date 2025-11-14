// AI角色使用情况分析工具
// 用于分析AI角色在哪些功能页面中被使用

import { AIRoleConfig } from '../types/aiRole';
import { INDEPENDENT_NODE_CONFIGS } from './nodeRoleMapping';

/**
 * AI角色使用位置
 */
export interface AIRoleUsageLocation {
  type: 'independent-page' | 'agent-workflow' | 'multi-chat' | 'workflow-editor';
  name: string;  // 位置名称（如 "AI问答"、"智能工作流"）
  path?: string;  // 页面路径（如 "/node/ai-search"）
  description?: string;  // 描述信息
  nodeId?: string;  // 节点ID（如果是工作流节点）
}

/**
 * AI角色使用情况
 */
export interface AIRoleUsage {
  roleId: string;
  roleName: string;
  locations: AIRoleUsageLocation[];
  totalUsageCount: number;
}

/**
 * 分析AI角色在独立页面中的使用情况
 */
function analyzeIndependentPageUsage(
  role: AIRoleConfig,
  allRoles: AIRoleConfig[]
): AIRoleUsageLocation[] {
  const locations: AIRoleUsageLocation[] = [];

  // 检查每个独立页面节点配置
  for (const nodeConfig of INDEPENDENT_NODE_CONFIGS) {
    // 检查角色是否匹配该节点
    const matches = nodeConfig.patterns.some(pattern => 
      pattern.test(role.id) || 
      pattern.test(role.name) || 
      pattern.test(role.description || '')
    );

    if (matches && (role.source === 'independent-page' || !role.source)) {
      // 确定页面路径
      let pagePath = '';
      switch (nodeConfig.nodeType) {
        case 'ai-search':
          pagePath = '/node/ai-search';
          break;
        case 'tech-package':
          pagePath = '/node/tech-package';
          break;
        case 'promotion-strategy':
          pagePath = '/node/promotion-strategy';
          break;
        case 'core-draft':
          pagePath = '/node/core-draft';
          break;
        case 'speech':
          pagePath = '/node/speech';
          break;
      }

      locations.push({
        type: 'independent-page',
        name: nodeConfig.name,
        path: pagePath,
        description: nodeConfig.description,
      });
    }
  }

  return locations;
}

/**
 * 分析AI角色在Agent工作流中的使用情况
 * 需要检查所有工作流中是否使用了该角色
 */
async function analyzeAgentWorkflowUsage(
  role: AIRoleConfig,
  allRoles: AIRoleConfig[]
): Promise<AIRoleUsageLocation[]> {
  const locations: AIRoleUsageLocation[] = [];

  try {
    // 动态导入以避免循环依赖
    const { agentWorkflowService } = await import('../services/agentWorkflowService');
    const workflows = await agentWorkflowService.getAllWorkflows();

    for (const workflow of workflows) {
      // 检查工作流的节点中是否使用了该角色
      const nodesUsingRole = workflow.nodes.filter(
        node => node.agentId === role.id
      );

      if (nodesUsingRole.length > 0) {
        locations.push({
          type: 'agent-workflow',
          name: workflow.name || '未命名工作流',
          path: `/agent-workflow`,
          description: `${nodesUsingRole.length}个节点使用此角色`,
          nodeId: nodesUsingRole.map(n => n.id).join(', '),
        });
      }
    }
  } catch (error) {
    console.warn('分析Agent工作流使用情况失败:', error);
  }

  return locations;
}

/**
 * 分析AI角色在所有功能中的使用情况
 */
export async function analyzeAIRoleUsage(
  role: AIRoleConfig,
  allRoles: AIRoleConfig[] = []
): Promise<AIRoleUsage> {
  const locations: AIRoleUsageLocation[] = [];

  // 1. 分析独立页面使用情况
  const independentPageLocations = analyzeIndependentPageUsage(role, allRoles);
  locations.push(...independentPageLocations);

  // 2. 分析Agent工作流使用情况
  const agentWorkflowLocations = await analyzeAgentWorkflowUsage(role, allRoles);
  locations.push(...agentWorkflowLocations);

  // 3. 检查是否在智能工作流模板中使用（通过source判断）
  if (role.source === 'smart-workflow') {
    const alreadyInWorkflow = locations.some(
      loc => loc.type === 'agent-workflow'
    );
    if (!alreadyInWorkflow) {
      locations.push({
        type: 'agent-workflow',
        name: '智能工作流',
        path: '/agent-workflow',
        description: '标记为智能工作流角色，可能在工作流中使用',
      });
    }
  }

  // 4. 检查是否可以在多窗口对话中使用（所有启用的角色都可以）
  if (role.enabled) {
    locations.push({
      type: 'multi-chat',
      name: '多窗口对话',
      path: '/multi-chat',
      description: '可以在多窗口对话功能中使用',
    });
  }

  return {
    roleId: role.id,
    roleName: role.name,
    locations,
    totalUsageCount: locations.length,
  };
}

/**
 * 批量分析多个AI角色的使用情况
 */
export async function analyzeMultipleAIRoleUsage(
  roles: AIRoleConfig[]
): Promise<AIRoleUsage[]> {
  const results: AIRoleUsage[] = [];

  for (const role of roles) {
    try {
      const usage = await analyzeAIRoleUsage(role, roles);
      results.push(usage);
    } catch (error) {
      console.error(`分析角色 ${role.name} 使用情况失败:`, error);
      // 即使分析失败，也添加一个空结果
      results.push({
        roleId: role.id,
        roleName: role.name,
        locations: [],
        totalUsageCount: 0,
      });
    }
  }

  return results;
}

/**
 * 获取使用情况描述文本
 */
export function getUsageDescription(usage: AIRoleUsage): string {
  if (usage.totalUsageCount === 0) {
    return '未在任何功能中使用';
  }

  const locationNames = usage.locations.map(loc => loc.name).join('、');
  return `在 ${usage.totalUsageCount} 个位置使用：${locationNames}`;
}

/**
 * 获取使用情况简短的标签文本（用于UI显示）
 */
export function getUsageBadges(usage: AIRoleUsage): string[] {
  const badges: string[] = [];
  const types = new Set(usage.locations.map(loc => loc.type));

  if (types.has('independent-page')) {
    badges.push('独立页面');
  }
  if (types.has('agent-workflow')) {
    badges.push('工作流');
  }
  if (types.has('multi-chat')) {
    badges.push('多窗口对话');
  }

  return badges;
}


