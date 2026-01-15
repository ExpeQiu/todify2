import { SourceInformation } from './sourceService';
import { SourceCategory, SourceGroup, getCategoryConfig, AI_CREATED_CATEGORIES, TECH_RESOURCE_CATEGORIES, WEB_SEARCH_CATEGORIES } from '../types/sourceCategory';

/**
 * 判断 URL 是否为文件路径
 */
export function isFileUrl(url: string): boolean {
  const urlStr = url.trim();
  return (
    urlStr.startsWith('/uploads/') ||
    urlStr.startsWith('uploads/') ||
    urlStr.startsWith('/api/ai-search/files/') ||
    urlStr.startsWith('/api/v1/public-knowledge/files/') ||
    /\.(pdf|doc|docx|txt|md|jpg|jpeg|png|gif|webp|ppt|pptx)$/i.test(urlStr)
  );
}

/**
 * 判断是否为互联网信息 URL
 */
export function isInternetUrl(url: string): boolean {
  const urlStr = url.trim();
  const isHttpUrl = urlStr.startsWith('http://') || urlStr.startsWith('https://');
  const isFile = isFileUrl(urlStr);
  return isHttpUrl && !isFile;
}

/**
 * 分类单个来源
 * @param source 来源信息
 * @returns 分组名称
 */
export function classifySource(source: SourceInformation): SourceGroup {
  const category = source.category || parseCategoryFromMetadata(source.metadata);
  
  // 如果已有明确的 category，直接判断
  if (category) {
    if (AI_CREATED_CATEGORIES.includes(category as SourceCategory)) {
      return 'ai-created';
    }
    if (TECH_RESOURCE_CATEGORIES.includes(category as SourceCategory)) {
      return 'tech-resource';
    }
    if (WEB_SEARCH_CATEGORIES.includes(category as SourceCategory)) {
      return 'web-search';
    }
    if (category === 'file') {
      return 'file';
    }
  }
  
  // 通过 URL 判断文件类型
  if (source.url) {
    if (isFileUrl(source.url)) {
      return 'file';
    }
    if (isInternetUrl(source.url)) {
      return 'web-search';
    }
  }
  
  // 通过 type 字段判断
  if (source.type === 'knowledge_base') {
    return 'tech-resource';
  }
  
  // 默认返回外部来源
  return 'external';
}

/**
 * 从 metadata 中解析 category
 */
function parseCategoryFromMetadata(metadata: any): SourceCategory | undefined {
  if (!metadata) return undefined;
  
  if (typeof metadata === 'object') {
    return metadata.category || metadata.sourceCategory;
  } else if (typeof metadata === 'string') {
    try {
      const parsed = JSON.parse(metadata);
      return parsed.category || parsed.sourceCategory;
    } catch (e) {
      return undefined;
    }
  }
  
  return undefined;
}

/**
 * 按分组组织来源列表
 */
export function groupSourcesByCategory(
  sources: SourceInformation[]
): Record<SourceGroup, SourceInformation[]> {
  const groups: Record<SourceGroup, SourceInformation[]> = {
    'ai-created': [],
    'tech-resource': [],
    'file': [],
    'web-search': [],
    'external': [],
  };
  
  for (const source of sources) {
    const group = classifySource(source);
    groups[group].push(source);
  }
  
  return groups;
}

/**
 * 获取来源的分类配置
 */
export function getSourceCategoryConfig(source: SourceInformation) {
  const category = source.category || parseCategoryFromMetadata(source.metadata);
  return getCategoryConfig(category);
}
