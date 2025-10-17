import React, { useState, useMemo, useCallback } from 'react';
import { 
  KnowledgeConfig, 
  KnowledgePoint, 
  KnowledgePointSelectorProps 
} from '../../types/knowledgeConfig';
import { 
  useKnowledgePointFilter, 
  useKnowledgePointSort, 
  useKnowledgePointSelection 
} from '../../hooks/useKnowledgeConfig';
import './KnowledgePointSelector.css';

// 筛选器组件
const FilterComponent: React.FC<{
  config: KnowledgeConfig;
  knowledgePoints: KnowledgePoint[];
  filterValues: Record<string, any>;
  onFilterChange: (filterId: string, value: any) => void;
  onClearFilters: () => void;
}> = ({ config, knowledgePoints, filterValues, onFilterChange, onClearFilters }) => {
  // 动态生成选项
  const getFilterOptions = useCallback((filterId: string) => {
    const filterConfig = config.filters.find(f => f.id === filterId);
    if (!filterConfig || filterConfig.options) return filterConfig?.options || [];

    // 从知识点数据中提取唯一值
    const values = new Set<string>();
    knowledgePoints.forEach(point => {
      const value = getNestedValue(point, filterConfig.field);
      if (value !== null && value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach(v => values.add(String(v)));
        } else {
          values.add(String(value));
        }
      }
    });

    return Array.from(values).map(value => ({
      label: value,
      value,
      count: knowledgePoints.filter(point => {
        const pointValue = getNestedValue(point, filterConfig.field);
        return Array.isArray(pointValue) ? pointValue.includes(value) : String(pointValue) === value;
      }).length
    }));
  }, [config.filters, knowledgePoints]);

  const visibleFilters = config.filters.filter(filter => filter.visible);
  const hasActiveFilters = Object.keys(filterValues).length > 0;

  if (visibleFilters.length === 0) return null;

  return (
    <div className="kp-filters">
      <div className="kp-filters-header">
        <h3>筛选条件</h3>
        {hasActiveFilters && (
          <button 
            className="kp-clear-filters-btn"
            onClick={onClearFilters}
          >
            清除所有
          </button>
        )}
      </div>
      
      <div className="kp-filters-grid">
        {visibleFilters.map(filter => (
          <div key={filter.id} className="kp-filter-item">
            <label className="kp-filter-label">{filter.name}</label>
            
            {filter.type === 'search' && (
              <input
                type="text"
                className="kp-filter-input"
                placeholder={filter.placeholder}
                value={filterValues[filter.id] || ''}
                onChange={(e) => onFilterChange(filter.id, e.target.value)}
              />
            )}
            
            {filter.type === 'select' && (
              <select
                className="kp-filter-select"
                value={filterValues[filter.id] || ''}
                onChange={(e) => onFilterChange(filter.id, e.target.value)}
              >
                <option value="">全部</option>
                {getFilterOptions(filter.id).map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label} {option.count && `(${option.count})`}
                  </option>
                ))}
              </select>
            )}
            
            {filter.type === 'multiselect' && (
              <div className="kp-filter-multiselect">
                {getFilterOptions(filter.id).map(option => (
                  <label key={option.value} className="kp-checkbox-label">
                    <input
                      type="checkbox"
                      checked={(filterValues[filter.id] || []).includes(option.value)}
                      onChange={(e) => {
                        const currentValues = filterValues[filter.id] || [];
                        const newValues = e.target.checked
                          ? [...currentValues, option.value]
                          : currentValues.filter((v: any) => v !== option.value);
                        onFilterChange(filter.id, newValues);
                      }}
                    />
                    {option.label} {option.count && `(${option.count})`}
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// 表格组件
const TableComponent: React.FC<{
  config: KnowledgeConfig;
  knowledgePoints: KnowledgePoint[];
  selectedIds: string[];
  sortConfig: { field: string; direction: 'asc' | 'desc' } | null;
  onSort: (field: string) => void;
  onSelect: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
}> = ({ config, knowledgePoints, selectedIds, sortConfig, onSort, onSelect, onSelectAll }) => {
  const visibleColumns = config.columns.filter(col => col.visible);
  const { layout } = config;
  
  const allSelected = knowledgePoints.length > 0 && knowledgePoints.every(point => selectedIds.includes(point.id));
  const someSelected = selectedIds.length > 0 && !allSelected;

  return (
    <div className={`kp-table-container ${layout.density}`}>
      <table className="kp-table">
        {layout.showHeader && (
          <thead>
            <tr>
              {layout.selectionMode === 'multiple' && (
                <th className="kp-table-checkbox-col">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={input => {
                      if (input) input.indeterminate = someSelected;
                    }}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onSelectAll(knowledgePoints.map(p => p.id));
                      } else {
                        onSelectAll([]);
                      }
                    }}
                  />
                </th>
              )}
              
              {visibleColumns.map(column => (
                <th 
                  key={column.id}
                  className={`kp-table-header ${column.align || 'left'} ${column.sortable ? 'sortable' : ''}`}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && onSort(column.field)}
                >
                  <div className="kp-table-header-content">
                    <span>{column.label}</span>
                    {column.sortable && (
                      <span className="kp-sort-indicator">
                        {sortConfig?.field === column.field ? (
                          sortConfig.direction === 'asc' ? '↑' : '↓'
                        ) : '↕'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              
              <th className="kp-table-actions-col">操作</th>
            </tr>
          </thead>
        )}
        
        <tbody>
          {knowledgePoints.map(point => (
            <tr 
              key={point.id}
              className={`kp-table-row ${selectedIds.includes(point.id) ? 'selected' : ''}`}
            >
              {layout.selectionMode === 'multiple' && (
                <td className="kp-table-checkbox-col">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(point.id)}
                    onChange={() => onSelect(point.id)}
                  />
                </td>
              )}
              
              {visibleColumns.map(column => (
                <td 
                  key={column.id}
                  className={`kp-table-cell ${column.align || 'left'}`}
                >
                  {column.formatter 
                    ? column.formatter(getNestedValue(point, column.field), point)
                    : formatCellValue(getNestedValue(point, column.field))
                  }
                </td>
              ))}
              
              <td className="kp-table-actions-col">
                <div className="kp-table-actions">
                  {config.actions
                    .filter(action => action.position === 'row' && action.visible)
                    .map(action => (
                      <button
                        key={action.id}
                        className={`kp-action-btn ${action.type}`}
                        onClick={() => action.onClick([point])}
                        disabled={action.disabled?.([point])}
                      >
                        {action.icon && <span className={`icon ${action.icon}`} />}
                        {action.label}
                      </button>
                    ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {knowledgePoints.length === 0 && (
        <div className="kp-empty-state">
          <p>没有找到匹配的知识点</p>
        </div>
      )}
    </div>
  );
};

// 分页组件
const PaginationComponent: React.FC<{
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  pageSizeOptions: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}> = ({ currentPage, totalPages, pageSize, totalItems, pageSizeOptions, onPageChange, onPageSizeChange }) => {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="kp-pagination">
      <div className="kp-pagination-info">
        显示 {startItem}-{endItem} 项，共 {totalItems} 项
      </div>
      
      <div className="kp-pagination-size">
        <label>每页显示：</label>
        <select 
          value={pageSize} 
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
        >
          {pageSizeOptions.map(size => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
      </div>
      
      <div className="kp-pagination-controls">
        <button 
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          上一页
        </button>
        
        <span className="kp-pagination-current">
          {currentPage} / {totalPages}
        </span>
        
        <button 
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          下一页
        </button>
      </div>
    </div>
  );
};

// 主组件
export const KnowledgePointSelector: React.FC<KnowledgePointSelectorProps> = ({
  config,
  knowledgePoints,
  selectedIds: externalSelectedIds,
  onSelectionChange,
  onSave,
  className,
  style
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(config.layout.pageSize);

  // 使用hooks管理状态
  const {
    filteredPoints,
    filterValues,
    updateFilter,
    clearFilters,
    hasActiveFilters
  } = useKnowledgePointFilter(knowledgePoints, config.filters);

  const {
    sortedPoints,
    sortConfig,
    updateSort,
    clearSort
  } = useKnowledgePointSort(filteredPoints, config.columns);

  const {
    selectedIds,
    selectPoint,
    selectAll,
    clearSelection,
    getSelectedPoints,
    hasSelection
  } = useKnowledgePointSelection(config.layout.selectionMode);

  // 分页处理
  const totalPages = Math.ceil(sortedPoints.length / pageSize);
  const paginatedPoints = useMemo(() => {
    if (!config.layout.showPagination) return sortedPoints;
    
    const startIndex = (currentPage - 1) * pageSize;
    return sortedPoints.slice(startIndex, startIndex + pageSize);
  }, [sortedPoints, currentPage, pageSize, config.layout.showPagination]);

  // 处理页面变化
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  // 处理页面大小变化
  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1); // 重置到第一页
  }, []);

  // 处理选择变化
  const handleSelectionChange = useCallback(() => {
    const selected = getSelectedPoints(knowledgePoints);
    onSelectionChange?.(selected);
  }, [getSelectedPoints, knowledgePoints, onSelectionChange]);

  // 监听选择变化
  React.useEffect(() => {
    handleSelectionChange();
  }, [selectedIds, handleSelectionChange]);

  // 处理保存
  const handleSave = useCallback(() => {
    const selected = getSelectedPoints(knowledgePoints);
    onSave?.(selected);
  }, [getSelectedPoints, knowledgePoints, onSave]);

  return (
    <div 
      className={`knowledge-point-selector ${className || ''}`}
      style={style}
    >
      {/* 头部操作区 */}
      <div className="kp-header">
        <div className="kp-header-left">
          <h2>知识点选择器</h2>
          <span className="kp-count-info">
            共 {knowledgePoints.length} 项
            {hasActiveFilters && ` (筛选后 ${filteredPoints.length} 项)`}
            {hasSelection && ` (已选择 ${selectedIds.length} 项)`}
          </span>
        </div>
        
        <div className="kp-header-actions">
          {config.actions
            .filter(action => action.position === 'header' && action.visible)
            .map(action => (
              <button
                key={action.id}
                className={`kp-action-btn ${action.type}`}
                onClick={() => action.onClick(getSelectedPoints(knowledgePoints))}
                disabled={action.disabled?.(getSelectedPoints(knowledgePoints))}
              >
                {action.icon && <span className={`icon ${action.icon}`} />}
                {action.label}
              </button>
            ))}
          
          {hasSelection && onSave && (
            <button 
              className="kp-action-btn primary"
              onClick={handleSave}
            >
              保存选择 ({selectedIds.length})
            </button>
          )}
        </div>
      </div>

      {/* 筛选器 */}
      {config.behavior.enableFilter && (
        <FilterComponent
          config={config}
          knowledgePoints={knowledgePoints}
          filterValues={filterValues}
          onFilterChange={updateFilter}
          onClearFilters={clearFilters}
        />
      )}

      {/* 表格 */}
      <TableComponent
        config={config}
        knowledgePoints={paginatedPoints}
        selectedIds={selectedIds}
        sortConfig={sortConfig}
        onSort={updateSort}
        onSelect={selectPoint}
        onSelectAll={selectAll}
      />

      {/* 分页 */}
      {config.layout.showPagination && (
        <PaginationComponent
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={sortedPoints.length}
          pageSizeOptions={config.layout.pageSizeOptions}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}

      {/* 底部操作区 */}
      {config.layout.showFooter && (
        <div className="kp-footer">
          <div className="kp-footer-info">
            {hasSelection && (
              <span>已选择 {selectedIds.length} 项</span>
            )}
          </div>
          
          <div className="kp-footer-actions">
            {config.actions
              .filter(action => action.position === 'footer' && action.visible)
              .map(action => (
                <button
                  key={action.id}
                  className={`kp-action-btn ${action.type}`}
                  onClick={() => action.onClick(getSelectedPoints(knowledgePoints))}
                  disabled={action.disabled?.(getSelectedPoints(knowledgePoints))}
                >
                  {action.icon && <span className={`icon ${action.icon}`} />}
                  {action.label}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

// 工具函数
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
}

function formatCellValue(value: any): string {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.join(', ');
  if (value instanceof Date) return value.toLocaleDateString();
  return String(value);
}

export default KnowledgePointSelector;