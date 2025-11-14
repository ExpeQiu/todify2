/**
 * 页面配置系统
 * 用于区分不同页面的配置和行为
 */

export type PageType = 'tech-package' | 'press-release';

export interface ToolItemConfig {
  id: string;
  iconName: string; // 图标名称，用于动态导入
}

export interface PageConfig {
  pageType: PageType;
  pageTitle: string;
  dialogueTitle: string;
  studioTitle: string;
  workflowSelectionKey: string;
  featureLabelMap: Record<string, string>;
  enabledToolIds?: string[]; // 启用的工具ID列表，如果未指定则使用所有工具
}

// 技术包装页面配置
export const techPackageConfig: PageConfig = {
  pageType: 'tech-package',
  pageTitle: '技术包装',
  dialogueTitle: '发布会写稿助手',
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
  ],
};

// 发布会稿页面配置
export const pressReleaseConfig: PageConfig = {
  pageType: 'press-release',
  pageTitle: '发布会稿',
  dialogueTitle: '发布会写稿助手',
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

// 根据页面类型获取配置
export const getPageConfig = (pageType: PageType): PageConfig => {
  return pageType === 'press-release' ? pressReleaseConfig : techPackageConfig;
};

