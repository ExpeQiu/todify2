import { AIRoleConfig } from '../types/aiRole';
import { FilterType, FilterStatus, FilterSource, SortOption } from '../components/SearchAndFilterBar';

/**
 * 筛选角色列表
 */
export function filterRoles(
  roles: AIRoleConfig[],
  searchQuery: string,
  filterType: FilterType,
  filterStatus: FilterStatus,
  filterSource: FilterSource
): AIRoleConfig[] {
  let filtered = [...roles];

  // 搜索筛选
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(role => {
      return (
        role.name.toLowerCase().includes(query) ||
        role.description?.toLowerCase().includes(query) ||
        role.id.toLowerCase().includes(query)
      );
    });
  }

  // 类型筛选
  if (filterType !== 'all') {
    filtered = filtered.filter(role => {
      if (filterType === 'dify') {
        return role.provider === 'dify' || !role.provider;
      } else if (filterType === 'direct-agent') {
        return role.provider === 'direct-agent';
      }
      return true;
    });
  }

  // 状态筛选
  if (filterStatus !== 'all') {
    filtered = filtered.filter(role => {
      if (filterStatus === 'enabled') {
        return role.enabled === true;
      } else if (filterStatus === 'disabled') {
        return role.enabled === false;
      }
      return true;
    });
  }

  // 来源筛选
  if (filterSource !== 'all') {
    filtered = filtered.filter(role => {
      if (filterSource === 'smart-workflow') {
        return role.source === 'smart-workflow';
      } else if (filterSource === 'independent-page') {
        return role.source === 'independent-page';
      } else if (filterSource === 'agent-workflow') {
        return role.source === 'agent-workflow';
      } else if (filterSource === 'custom') {
        return !role.source || role.source === 'custom';
      }
      return true;
    });
  }

  return filtered;
}

/**
 * 排序角色列表
 */
export function sortRoles(roles: AIRoleConfig[], sortOption: SortOption): AIRoleConfig[] {
  const sorted = [...roles];

  switch (sortOption) {
    case 'name-asc':
      return sorted.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
    case 'name-desc':
      return sorted.sort((a, b) => b.name.localeCompare(a.name, 'zh-CN'));
    case 'created-desc':
      return sorted.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
    case 'created-asc':
      return sorted.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
        return dateA.getTime() - dateB.getTime();
      });
    case 'updated-desc':
      return sorted.sort((a, b) => {
        const dateA = a.updatedAt instanceof Date ? a.updatedAt : new Date(a.updatedAt);
        const dateB = b.updatedAt instanceof Date ? b.updatedAt : new Date(b.updatedAt);
        return dateB.getTime() - dateA.getTime();
      });
    case 'updated-asc':
      return sorted.sort((a, b) => {
        const dateA = a.updatedAt instanceof Date ? a.updatedAt : new Date(a.updatedAt);
        const dateB = b.updatedAt instanceof Date ? b.updatedAt : new Date(b.updatedAt);
        return dateA.getTime() - dateB.getTime();
      });
    default:
      return sorted;
  }
}

/**
 * 高亮搜索关键词
 */
export function highlightSearchText(text: string, query: string): string {
  if (!query.trim()) return text;
  
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
}
