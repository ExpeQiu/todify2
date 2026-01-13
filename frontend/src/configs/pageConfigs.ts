/**
 * 页面配置系统
 * 用于区分不同页面的配置和行为
 */

export type PageType = 'tech-package' | 'press-release' | 'tech-strategy' | 'tech-article' | 'ai-qa';

export interface ToolItemConfig {
  id: string;
  iconName: string; // 图标名称，用于动态导入
}

export interface AgentRoleConfig {
  id: string;
  name: string;
  description: string;
  toolIds: string[];
}

export interface PageConfig {
  pageType: PageType;
  pageTitle: string;
  dialogueTitle: string;
  studioTitle: string;
  workflowSelectionKey: string;
  featureLabelMap: Record<string, string>;
  enabledToolIds?: string[]; // 启用的工具ID列表，如果未指定则使用所有工具
  agentRoles?: AgentRoleConfig[]; // 角色配置，用于工具分组
}

// 技术包装页面配置
export const techPackageConfig: PageConfig = {
  pageType: 'tech-package',
  pageTitle: '技术包装',
  dialogueTitle: 'AI内容助手',
  studioTitle: '更多工具箱',
  workflowSelectionKey: 'ai-search.workflows.selection.tech-package',
  featureLabelMap: {
    "five-view-analysis": "五看",
    "three-fix-analysis": "三定",
    "tech-matrix": "技术矩阵",
    "propagation-strategy": "传播",
    "exhibition-video": "展具与视频",
    translation: "翻译",
    "ppt-outline": "技术讲稿",
    script: "脚本",
    "user-scene": "用户场景", // 自定义模块
  },
  // 技术包装页面保留所有工具
  enabledToolIds: [
    'five-view-analysis',
    'three-fix-analysis',
    'tech-matrix',
    'propagation-strategy',
    'exhibition-video',
    'translation',
    'ppt-outline',
    'script',
    'user-scene', // 自定义模块
  ],
  agentRoles: [
    {
      id: 'tech-fundamentalist',
      name: '技术原教旨',
      description: '深度解析技术原理与核心价值',
      toolIds: ['five-view-analysis', 'three-fix-analysis']
    },
    {
      id: 'scene-alchemist',
      name: '场景炼金术',
      description: '挖掘用户场景与技术结合点',
      toolIds: ['tech-matrix', 'user-scene']
    },
    {
      id: 'market-sniper',
      name: '市场狙击手',
      description: '制定精准的市场传播策略',
      toolIds: ['propagation-strategy']
    },
    {
      id: 'content-director',
      name: '内容大导演',
      description: '生成多样化的内容输出',
      toolIds: ['ppt-outline', 'script', 'exhibition-video', 'translation']
    }
  ]
};

// 发布会稿页面配置
export const pressReleaseConfig: PageConfig = {
  pageType: 'press-release',
  pageTitle: '发布会稿',
  dialogueTitle: 'AI内容助手',
  studioTitle: '更多工具箱',
  workflowSelectionKey: 'ai-search.workflows.selection.press-release',
  featureLabelMap: {
    "five-view-analysis": "技术转译",
    "three-fix-analysis": "用户场景挖掘",
    "tech-matrix": "发布会场景化",
    "propagation-strategy": "领导人口语化",
    "exhibition-video": "展具与视频",
    translation: "翻译",
    "ppt-outline": "技术讲稿",
    script: "脚本",
  },
  // 发布会稿页面移除展具与视频和脚本
  enabledToolIds: [
    'five-view-analysis',
    'three-fix-analysis',
    'tech-matrix',
    'propagation-strategy',
    'translation',
    'ppt-outline',
  ],
};

export const techStrategyConfig: PageConfig = {
  pageType: 'tech-strategy',
  pageTitle: '技术策略',
  dialogueTitle: 'AI内容助手',
  studioTitle: '更多工具箱',
  workflowSelectionKey: 'ai-search.workflows.selection.tech-strategy',
  featureLabelMap: {
    "five-view-analysis": "技术转译",
    "three-fix-analysis": "用户场景挖掘",
    "tech-matrix": "技术矩阵",
    "propagation-strategy": "传播策略",
    "exhibition-video": "展具与视频",
    translation: "翻译",
    "ppt-outline": "技术讲稿",
    script: "脚本",
  },
  enabledToolIds: [
    'propagation-strategy',
    'five-view-analysis',
    'three-fix-analysis',
    'translation',
  ],
};

export const techArticleConfig: PageConfig = {
  pageType: 'tech-article',
  pageTitle: '技术通稿',
  dialogueTitle: 'AI内容助手',
  studioTitle: '更多工具箱',
  workflowSelectionKey: 'ai-search.workflows.selection.tech-article',
  featureLabelMap: {
    "five-view-analysis": "技术转译",
    "three-fix-analysis": "用户场景挖掘",
    "tech-matrix": "技术矩阵",
    "propagation-strategy": "传播策略",
    "exhibition-video": "展具与视频",
    translation: "翻译",
    "ppt-outline": "技术讲稿",
    script: "脚本",
  },
  enabledToolIds: [
    'ppt-outline',
    'translation',
  ],
};

// AI问答页面配置（独立页面，复用tech-package系统但可定制化）
export const aiQaConfig: PageConfig = {
  pageType: 'ai-qa',
  pageTitle: 'AI问答',
  dialogueTitle: 'AI问答助手',
  studioTitle: '更多工具箱',
  workflowSelectionKey: 'ai-search.workflows.selection.ai-qa',
  featureLabelMap: {
    "five-view-analysis": "五看",
    "three-fix-analysis": "三定",
    "tech-matrix": "技术矩阵",
    "propagation-strategy": "传播",
    "exhibition-video": "展具与视频",
    translation: "翻译",
    "ppt-outline": "技术讲稿",
    script: "脚本",
  },
  // AI问答页面保留所有工具，可根据需要定制
  enabledToolIds: [
    'five-view-analysis',
    'three-fix-analysis',
    'tech-matrix',
    'propagation-strategy',
    'exhibition-video',
    'translation',
    'ppt-outline',
    'script',
  ],
};

// 根据页面类型获取配置
export const getPageConfig = (pageType: PageType): PageConfig => {
  switch (pageType) {
    case 'press-release':
      return pressReleaseConfig;
    case 'tech-strategy':
      return techStrategyConfig;
    case 'tech-article':
      return techArticleConfig;
    case 'ai-qa':
      return aiQaConfig;
    case 'tech-package':
    default:
      return techPackageConfig;
  }
};

