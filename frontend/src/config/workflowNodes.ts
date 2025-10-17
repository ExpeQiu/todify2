import { Search, Package, Target, FileText, Mic, MessageCircle } from 'lucide-react';
import { WorkflowNode, NodeConfig } from '../types/workflow';

// 节点配置定义
export const nodeConfigs: Record<string, NodeConfig> = {
  ai_search: {
    canStartIndependently: true,
    requiredInputs: ['query'],
    defaultValues: {
      query: ''
    }
  },

  tech_package: {
    canStartIndependently: true,
    requiredInputs: [],
    optionalInputs: ['aiSearchData', 'template'],
    defaultValues: {
      template: 'default'
    }
  },
  promotion_strategy: {
    canStartIndependently: true,
    requiredInputs: [],
    optionalInputs: ['techPackageData', 'targetAudience']
  },
  core_draft: {
    canStartIndependently: true,
    requiredInputs: [],
    optionalInputs: ['promotionStrategyData', 'contentType']
  },
  speech: {
    canStartIndependently: true,
    requiredInputs: [],
    optionalInputs: ['coreDraftData', 'speechType', 'duration']
  }
};

// 工作流节点定义
export const workflowNodes: WorkflowNode[] = [
  {
    id: 'ai_search',
    name: 'AI问答',
    type: 'ai_search',
    description: '向AI助手提问获取专业解答',
    icon: MessageCircle,
    path: '/node/ai-search',
    nextSteps: ['tech_package', 'promotion_strategy']
  },

  {
    id: 'tech_package',
    name: '技术包装',
    type: 'tech_package',
    description: '对搜索结果进行技术包装',
    icon: Package,
    path: '/node/tech-package',
    dependencies: ['ai_search'],
    nextSteps: ['promotion_strategy', 'core_draft']
  },
  {
    id: 'promotion_strategy',
    name: '推广策略',
    type: 'promotion_strategy',
    description: '生成推广策略方案',
    icon: Target,
    path: '/node/promotion-strategy',
    dependencies: ['tech_package'],
    nextSteps: ['core_draft']
  },
  {
    id: 'core_draft',
    name: '核心稿件',
    type: 'core_draft',
    description: '生成核心文档稿件',
    icon: FileText,
    path: '/node/core-draft',
    dependencies: ['promotion_strategy'],
    nextSteps: ['speech']
  },
  {
    id: 'speech',
    name: '演讲稿',
    type: 'speech',
    description: '生成演讲稿内容',
    icon: Mic,
    path: '/node/speech',
    dependencies: ['core_draft'],
    nextSteps: []
  }
];

// 根据节点ID获取节点配置
export const getNodeById = (nodeId: string): WorkflowNode | undefined => {
  return workflowNodes.find(node => node.id === nodeId);
};

// 获取可以独立启动的节点
export const getIndependentNodes = (): WorkflowNode[] => {
  return workflowNodes.filter(node => 
    nodeConfigs[node.id]?.canStartIndependently
  );
};

// 根据当前节点推导下一步可能的节点
export const getNextStepRecommendations = (
  currentNodeId: string,
  completedNodes: string[]
): string[] => {
  const currentNode = getNodeById(currentNodeId);
  if (!currentNode) return [];

  // 获取当前节点定义的下一步
  const nextSteps = currentNode.nextSteps || [];
  
  // 过滤掉已完成的节点
  const availableSteps = nextSteps.filter(stepId => 
    !completedNodes.includes(stepId)
  );

  return availableSteps;
};