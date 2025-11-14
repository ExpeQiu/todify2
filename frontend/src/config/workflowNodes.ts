import { Search, Package, Target, FileText, Mic, MessageCircle, Lightbulb, Newspaper, Megaphone } from 'lucide-react';
import { WorkflowNode, NodeConfig } from '../types/workflow';

// 节点配置
export const NODE_CONFIGS = {
  ai_qa: {
    title: 'AI问答',
    description: '智能问答助手',
    icon: 'Brain',
    color: '#3B82F6',
    category: 'ai'
  },
  ai_search: {
    title: 'AI搜索',
    description: 'AI智能搜索助手',
    icon: 'Search',
    color: '#3B82F6',
    category: 'ai'
  },
  tech_package: {
    title: '技术包装',
    description: '技术内容包装',
    icon: 'Package',
    color: '#F59E0B',
    category: 'content'
  },
  promotion_strategy: {
    title: '技术策略',
    description: '技术策略生成',
    icon: 'Target',
    color: '#8B5CF6',
    category: 'content'
  },
  core_draft: {
    title: '核心稿件',
    description: '核心稿件撰写',
    icon: 'FileText',
    color: '#10B981',
    category: 'content'
  },
  speech: {
    title: '演讲稿',
    description: '演讲稿撰写',
    icon: 'Megaphone',
    color: '#EF4444',
    category: 'content'
  }
};

// 节点配置定义
export const nodeConfigs: Record<string, NodeConfig> = {
  ai_qa: {
    canStartIndependently: true,
    requiredInputs: ['query'],
    defaultValues: {
      query: ''
    }
  },

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
    optionalInputs: ['techPackageData']
  },

  core_draft: {
    canStartIndependently: true,
    requiredInputs: [],
    optionalInputs: ['techPackageData', 'contentType']
  },
  speech: {
    canStartIndependently: true,
    requiredInputs: [],
    optionalInputs: ['coreDraftData', 'speechType', 'duration']
  }
}

// 工作流节点定义
export const workflowNodes: WorkflowNode[] = [
  {
    id: 'ai_qa',
    name: 'AI问答',
    type: 'ai_qa',
    description: '向AI助手提问获取专业解答',
    icon: MessageCircle,
    path: '/node/ai-qa',
    nextSteps: ['tech_package', 'core_draft', 'speech']
  },

  {
    id: 'ai_search',
    name: 'AI搜索',
    type: 'ai_search',
    description: 'AI智能搜索助手',
    icon: Search,
    path: '/node/ai-search',
    nextSteps: ['tech_package', 'core_draft', 'speech']
  },

  {
    id: 'tech_package',
    name: '技术包装',
    type: 'tech_package',
    description: '对搜索结果进行技术包装',
    icon: Package,
    path: '/node/tech-package',
    dependencies: ['ai_qa'],
    nextSteps: ['promotion_strategy', 'core_draft', 'speech']
  },

  {
    id: 'promotion_strategy',
    name: '技术策略',
    type: 'promotion_strategy',
    description: '生成技术策略内容',
    icon: Target,
    path: '/node/promotion-strategy',
    dependencies: ['tech_package'],
    nextSteps: ['core_draft', 'speech']
  },

  {
    id: 'core_draft',
    name: '核心稿件',
    type: 'core_draft',
    description: '生成核心文档稿件',
    icon: FileText,
    path: '/node/core-draft',
    dependencies: ['tech_package', 'promotion_strategy'],
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