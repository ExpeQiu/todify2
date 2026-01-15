import { FileText, FileCode, Brain, Package, Target, Newspaper, Globe } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

/**
 * 来源分类类型
 */
export type SourceCategory = 
  | 'file'                    // 上传的文件
  | 'web-search'              // Web检索结果
  | 'internet-search'         // 互联网搜索信息（兼容旧值）
  | 'knowledge-base'          // 知识库来源
  | 'technical-translation'   // 技术转译
  | 'ai-qa-summary'          // AI问答总结（通用）
  | 'tech-package-qa'        // 技术包装问答
  | 'tech-strategy-qa'       // 技术策略问答
  | 'tech-article-qa'        // 技术通稿问答
  | 'external';              // 外部来源（默认）

/**
 * 来源分组类型
 */
export type SourceGroup = 'ai-created' | 'tech-resource' | 'file' | 'web-search' | 'external';

/**
 * 分类配置项
 */
export interface CategoryConfig {
  label: string;
  icon: LucideIcon;
  color: string;
  iconColor: string;
  group: SourceGroup;
}

/**
 * 来源分类配置映射
 */
export const SOURCE_CATEGORY_CONFIG: Record<SourceCategory, CategoryConfig> = {
  'file': {
    label: '文件',
    icon: FileText,
    color: 'bg-blue-100 text-blue-700',
    iconColor: 'text-blue-600',
    group: 'file',
  },
  'web-search': {
    label: 'Web检索',
    icon: Globe,
    color: 'bg-orange-100 text-orange-700',
    iconColor: 'text-orange-600',
    group: 'web-search',
  },
  'internet-search': {
    label: '互联网信息',
    icon: Globe,
    color: 'bg-orange-100 text-orange-700',
    iconColor: 'text-orange-600',
    group: 'web-search',
  },
  'knowledge-base': {
    label: '知识点',
    icon: Brain,
    color: 'bg-purple-100 text-purple-700',
    iconColor: 'text-purple-600',
    group: 'tech-resource',
  },
  'technical-translation': {
    label: '技术转译',
    icon: FileCode,
    color: 'bg-blue-100 text-blue-700',
    iconColor: 'text-blue-600',
    group: 'tech-resource',
  },
  'ai-qa-summary': {
    label: 'AI问答总结',
    icon: Brain,
    color: 'bg-purple-100 text-purple-700',
    iconColor: 'text-purple-600',
    group: 'ai-created',
  },
  'tech-package-qa': {
    label: '技术包装问答',
    icon: Package,
    color: 'bg-orange-100 text-orange-700',
    iconColor: 'text-orange-600',
    group: 'ai-created',
  },
  'tech-strategy-qa': {
    label: '技术策略问答',
    icon: Target,
    color: 'bg-green-100 text-green-700',
    iconColor: 'text-green-600',
    group: 'ai-created',
  },
  'tech-article-qa': {
    label: '技术通稿问答',
    icon: Newspaper,
    color: 'bg-indigo-100 text-indigo-700',
    iconColor: 'text-indigo-600',
    group: 'ai-created',
  },
  'external': {
    label: '外部来源',
    icon: FileText,
    color: 'bg-gray-100 text-gray-700',
    iconColor: 'text-gray-600',
    group: 'external',
  },
};

/**
 * 获取分类配置
 */
export function getCategoryConfig(category?: SourceCategory): CategoryConfig {
  if (!category) {
    return SOURCE_CATEGORY_CONFIG['external'];
  }
  return SOURCE_CATEGORY_CONFIG[category] || SOURCE_CATEGORY_CONFIG['external'];
}

/**
 * AI共创信息分类列表
 */
export const AI_CREATED_CATEGORIES: SourceCategory[] = [
  'ai-qa-summary',
  'tech-package-qa',
  'tech-strategy-qa',
  'tech-article-qa',
];

/**
 * 技术资源分类列表
 */
export const TECH_RESOURCE_CATEGORIES: SourceCategory[] = [
  'technical-translation',
  'knowledge-base',
];

/**
 * Web搜索分类列表
 */
export const WEB_SEARCH_CATEGORIES: SourceCategory[] = [
  'web-search',
  'internet-search',
];
