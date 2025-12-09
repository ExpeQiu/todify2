import React, { useState, useEffect } from 'react';
import { Search, Filter, X, ChevronDown, List, Grid } from 'lucide-react';
import { AIRoleConfig } from '../types/aiRole';

export type FilterType = 'all' | 'dify' | 'direct-agent';
export type FilterStatus = 'all' | 'enabled' | 'disabled';
export type FilterSource = 'all' | 'smart-workflow' | 'independent-page' | 'custom';
export type SortOption = 'name-asc' | 'name-desc' | 'created-desc' | 'created-asc' | 'updated-desc' | 'updated-asc';
export type ViewMode = 'list' | 'grid';

interface SearchAndFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterType: FilterType;
  onFilterTypeChange: (type: FilterType) => void;
  filterStatus: FilterStatus;
  onFilterStatusChange: (status: FilterStatus) => void;
  filterSource: FilterSource;
  onFilterSourceChange: (source: FilterSource) => void;
  sortOption: SortOption;
  onSortChange: (sort: SortOption) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  resultCount: number;
}

const SearchAndFilterBar: React.FC<SearchAndFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  filterType,
  onFilterTypeChange,
  filterStatus,
  onFilterStatusChange,
  filterSource,
  onFilterSourceChange,
  sortOption,
  onSortChange,
  viewMode,
  onViewModeChange,
  resultCount
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearchQuery, onSearchChange]);

  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  const hasActiveFilters = 
    filterType !== 'all' || 
    filterStatus !== 'all' || 
    filterSource !== 'all' ||
    searchQuery.trim() !== '';

  const clearFilters = () => {
    setLocalSearchQuery('');
    onSearchChange('');
    onFilterTypeChange('all');
    onFilterStatusChange('all');
    onFilterSourceChange('all');
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 space-y-4">
      {/* 搜索栏和视图切换 */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            placeholder="搜索角色名称、描述或ID... (按 / 聚焦)"
            className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base"
          />
          {localSearchQuery && (
            <button
              onClick={() => setLocalSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* 视图切换 */}
        <div className="flex items-center gap-1 border border-gray-300 rounded-lg p-1">
          <button
            onClick={() => onViewModeChange('list')}
            className={`p-2 rounded transition-colors ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="列表视图"
          >
            <List size={18} />
          </button>
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-2 rounded transition-colors ${
              viewMode === 'grid'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="卡片视图"
          >
            <Grid size={18} />
          </button>
        </div>

        {/* 筛选按钮 */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 border-2 rounded-lg transition-colors font-medium ${
            showFilters || hasActiveFilters
              ? 'border-blue-600 bg-blue-50 text-blue-700'
              : 'border-gray-300 text-gray-700 hover:border-gray-400'
          }`}
        >
          <Filter size={18} />
          筛选
          {hasActiveFilters && (
            <span className="ml-1 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
              {[filterType !== 'all' ? 1 : 0, filterStatus !== 'all' ? 1 : 0, filterSource !== 'all' ? 1 : 0, searchQuery ? 1 : 0].reduce((a, b) => a + b, 0)}
            </span>
          )}
        </button>
      </div>

      {/* 筛选面板 */}
      {showFilters && (
        <div className="border-t border-gray-200 pt-4 space-y-4 animate-in slide-in-from-top-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 类型筛选 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                类型
              </label>
              <select
                value={filterType}
                onChange={(e) => onFilterTypeChange(e.target.value as FilterType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="all">全部</option>
                <option value="dify">Dify工作流</option>
                <option value="direct-agent">独立Agent</option>
              </select>
            </div>

            {/* 状态筛选 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                状态
              </label>
              <select
                value={filterStatus}
                onChange={(e) => onFilterStatusChange(e.target.value as FilterStatus)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="all">全部</option>
                <option value="enabled">启用</option>
                <option value="disabled">禁用</option>
              </select>
            </div>

            {/* 来源筛选 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                来源
              </label>
              <select
                value={filterSource}
                onChange={(e) => onFilterSourceChange(e.target.value as FilterSource)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="all">全部</option>
                <option value="smart-workflow">智能工作流</option>
                <option value="independent-page">独立页面</option>
                <option value="custom">自定义</option>
              </select>
            </div>
          </div>

          {/* 排序 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              排序
            </label>
            <select
              value={sortOption}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="name-asc">名称 (A-Z)</option>
              <option value="name-desc">名称 (Z-A)</option>
              <option value="created-desc">创建时间 (新到旧)</option>
              <option value="created-asc">创建时间 (旧到新)</option>
              <option value="updated-desc">更新时间 (新到旧)</option>
              <option value="updated-asc">更新时间 (旧到新)</option>
            </select>
          </div>

          {/* 清除筛选 */}
          {hasActiveFilters && (
            <div className="flex items-center justify-end">
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={16} />
                清除所有筛选
              </button>
            </div>
          )}
        </div>
      )}

      {/* 结果统计 */}
      <div className="text-sm text-gray-600">
        找到 <span className="font-semibold text-gray-900">{resultCount}</span> 个角色
      </div>
    </div>
  );
};

export default SearchAndFilterBar;
