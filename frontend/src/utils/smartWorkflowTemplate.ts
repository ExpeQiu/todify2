// 智能工作流模板生成工具
// 用于创建默认的5步骤智能工作流

import { AgentWorkflow, AgentWorkflowNode, AgentWorkflowEdge } from '../types/agentWorkflow';
import { AIRoleConfig } from '../types/aiRole';

/**
 * 智能工作流的5个步骤配置
 */
export const SMART_WORKFLOW_STEPS = [
  { id: 'ai-qa', name: 'AI问答', stepKey: 'smartSearch', agentIdPattern: /smart-workflow-ai-qa|ai-qa|ai问答/i },
  { id: 'tech-package', name: '技术包装', stepKey: 'techPackage', agentIdPattern: /smart-workflow-tech-package|tech-package|技术包装/i },
  { id: 'tech-strategy', name: '技术策略', stepKey: 'techStrategy', agentIdPattern: /smart-workflow-tech-strategy|tech-strategy|技术策略/i },
  { id: 'tech-article', name: '技术通稿', stepKey: 'coreDraft', agentIdPattern: /smart-workflow-tech-article|tech-article|技术通稿|coreDraft/i },
  { id: 'speech', name: '发布会演讲稿', stepKey: 'speechGeneration', agentIdPattern: /smart-workflow-speech|speech|发布会|speechGeneration/i },
] as const;

/**
 * 根据Agent列表查找匹配的Agent ID
 */
function findAgentId(
  agents: AIRoleConfig[],
  patterns: RegExp[],
  preferredId?: string
): string | null {
  // 优先使用preferredId（如果存在且匹配）
  if (preferredId) {
    const preferred = agents.find(a => a.id === preferredId);
    if (preferred) return preferred.id;
  }

  // 按模式匹配
  for (const pattern of patterns) {
    const matched = agents.find(a => {
      return pattern.test(a.id) || pattern.test(a.name) || pattern.test(a.description);
    });
    if (matched) return matched.id;
  }

  return null;
}

/**
 * 创建默认智能工作流模板
 */
export function createSmartWorkflowTemplate(
  agents: AIRoleConfig[],
  options?: {
    name?: string;
    description?: string;
    agentMappings?: Record<string, string>; // stepKey -> agentId
  }
): AgentWorkflow {
  const nodeSpacing = { x: 300, y: 150 };
  const startX = 100;
  const startY = 100;

  const nodes: AgentWorkflowNode[] = [];
  const edges: AgentWorkflowEdge[] = [];

  // 创建5个节点
  SMART_WORKFLOW_STEPS.forEach((step, index) => {
    // 查找对应的Agent ID
    let agentId: string | null = null;
    
    if (options?.agentMappings?.[step.stepKey]) {
      agentId = findAgentId(agents, [new RegExp(options.agentMappings[step.stepKey], 'i')]);
    }
    
    if (!agentId) {
      // 尝试匹配源标记
      const sourceMatch = agents.find(a => 
        a.source === 'smart-workflow' && 
        step.agentIdPattern.test(a.id) || step.agentIdPattern.test(a.name)
      );
      if (sourceMatch) {
        agentId = sourceMatch.id;
      }
    }

    if (!agentId) {
      // 最后尝试直接匹配名称
      agentId = findAgentId(agents, [step.agentIdPattern]);
    }

    const agent = agents.find(a => a.id === agentId) || null;

    const node: AgentWorkflowNode = {
      id: `node_${step.id}`,
      type: 'agent',
      agentId: agentId || '',
      agentConfig: agent || undefined,
      position: {
        x: startX,
        y: startY + index * nodeSpacing.y,
      },
      data: {
        label: step.name,
        agentName: agent?.name || step.name,
        inputs: {},
        outputs: [],
      },
    };

    nodes.push(node);

    // 创建边（顺序连接）
    if (index > 0) {
      const edge: AgentWorkflowEdge = {
        id: `edge_${SMART_WORKFLOW_STEPS[index - 1].id}_${step.id}`,
        source: `node_${SMART_WORKFLOW_STEPS[index - 1].id}`,
        target: `node_${step.id}`,
        animated: true,
      };
      edges.push(edge);
    }
  });

  return {
    id: `smart-workflow-${Date.now()}`,
    name: options?.name || '智能工作流',
    description: options?.description || '从AI问答到演讲稿生成的完整工作流程',
    version: '1.0.0',
    nodes,
    edges,
    metadata: {
      category: 'content-generation',
      tags: ['智能工作流', '内容生成', '默认模板'],
      author: 'system',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * 检查Agent列表是否包含智能工作流所需的Agent
 */
export function validateSmartWorkflowAgents(agents: AIRoleConfig[]): {
  isValid: boolean;
  missing: string[];
  found: string[];
} {
  const found: string[] = [];
  const missing: string[] = [];

  SMART_WORKFLOW_STEPS.forEach(step => {
    const matched = agents.find(a => {
      if (a.source !== 'smart-workflow') return false;
      return step.agentIdPattern.test(a.id) || 
             step.agentIdPattern.test(a.name) || 
             step.agentIdPattern.test(a.description);
    });

    if (matched) {
      found.push(step.name);
    } else {
      missing.push(step.name);
    }
  });

  return {
    isValid: missing.length === 0,
    missing,
    found,
  };
}

