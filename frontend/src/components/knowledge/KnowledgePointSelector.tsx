import React, { useState, useMemo, useCallback } from "react";
import {
  KnowledgeConfig,
  KnowledgePoint,
  KnowledgePointSelectorProps,
} from "../../types/knowledgeConfig";
import {
  useKnowledgePointFilter,
  useKnowledgePointSort,
  useKnowledgePointSelection,
} from "../../hooks/useKnowledgeConfig";
import "./KnowledgePointSelector.css";

// 筛选器组件
const FilterComponent: React.FC<{
  config: KnowledgeConfig;
  knowledgePoints: KnowledgePoint[];
  filterValues: Record<string, any>;
  onFilterChange: (filterId: string, value: any) => void;
  onClearFilters: () => void;
}> = ({
  config,
  knowledgePoints,
  filterValues,
  onFilterChange,
  onClearFilters,
}) => {
  // 动态生成选项
  const getFilterOptions = useCallback(
    (filterId: string) => {
      const filterConfig = config.filters.find((f) => f.id === filterId);
      if (!filterConfig || filterConfig.options)
        return filterConfig?.options || [];

      // 从知识点数据中提取唯一值
      const values = new Set<string>();
      knowledgePoints.forEach((point) => {
        const value = getNestedValue(point, filterConfig.field);
        if (value !== null && value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach((v) => values.add(String(v)));
          } else {
            values.add(String(value));
          }
        }
      });

      return Array.from(values).map((value) => ({
        label: value,
        value,
        count: knowledgePoints.filter((point) => {
          const pointValue = getNestedValue(point, filterConfig.field);
          return Array.isArray(pointValue)
            ? pointValue.includes(value)
            : String(pointValue) === value;
        }).length,
      }));
    },
    [config.filters, knowledgePoints],
  );

  const visibleFilters = config.filters.filter((filter) => filter.visible);
  const hasActiveFilters = Object.keys(filterValues).length > 0;

  if (visibleFilters.length === 0) return null;

  return (
    <div className="kp-filters" data-oid="sjieajb">
      <div className="kp-filters-header" data-oid="jrrf-pd">
        <h3 data-oid="-i7aicu">筛选条件</h3>
        {hasActiveFilters && (
          <button
            className="kp-clear-filters-btn"
            onClick={onClearFilters}
            data-oid="5qrxom."
          >
            清除所有
          </button>
        )}
      </div>

      <div className="kp-filters-grid" data-oid="0vv9-:x">
        {visibleFilters.map((filter) => (
          <div key={filter.id} className="kp-filter-item" data-oid="68uixrt">
            <label className="kp-filter-label" data-oid="6ns5k38">
              {filter.name}
            </label>

            {filter.type === "search" && (
              <input
                type="text"
                className="kp-filter-input"
                placeholder={filter.placeholder}
                value={filterValues[filter.id] || ""}
                onChange={(e) => onFilterChange(filter.id, e.target.value)}
                data-oid="ykuwgd-"
              />
            )}

            {filter.type === "select" && (
              <select
                className="kp-filter-select"
                value={filterValues[filter.id] || ""}
                onChange={(e) => onFilterChange(filter.id, e.target.value)}
                data-oid="a4sc6.1"
              >
                <option value="" data-oid="61v4ux2">
                  全部
                </option>
                {getFilterOptions(filter.id).map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    data-oid="_wqei3x"
                  >
                    {option.label} {option.count && `(${option.count})`}
                  </option>
                ))}
              </select>
            )}

            {filter.type === "multiselect" && (
              <div className="kp-filter-multiselect" data-oid="_1bh858">
                {getFilterOptions(filter.id).map((option) => (
                  <label
                    key={option.value}
                    className="kp-checkbox-label"
                    data-oid="uhq79r1"
                  >
                    <input
                      type="checkbox"
                      checked={(filterValues[filter.id] || []).includes(
                        option.value,
                      )}
                      onChange={(e) => {
                        const currentValues = filterValues[filter.id] || [];
                        const newValues = e.target.checked
                          ? [...currentValues, option.value]
                          : currentValues.filter(
                              (v: any) => v !== option.value,
                            );
                        onFilterChange(filter.id, newValues);
                      }}
                      data-oid="vq4hbv8"
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
  sortConfig: { field: string; direction: "asc" | "desc" } | null;
  onSort: (field: string) => void;
  onSelect: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
}> = ({
  config,
  knowledgePoints,
  selectedIds,
  sortConfig,
  onSort,
  onSelect,
  onSelectAll,
}) => {
  const visibleColumns = config.columns.filter((col) => col.visible);
  const { layout } = config;

  const allSelected =
    knowledgePoints.length > 0 &&
    knowledgePoints.every((point) => selectedIds.includes(point.id));
  const someSelected = selectedIds.length > 0 && !allSelected;

  return (
    <div className={`kp-table-container ${layout.density}`} data-oid="fisie:s">
      <table className="kp-table" data-oid="02wpd_o">
        {layout.showHeader && (
          <thead data-oid="ugt::mr">
            <tr data-oid="ovk0fbu">
              {layout.selectionMode === "multiple" && (
                <th className="kp-table-checkbox-col" data-oid="avf04of">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = someSelected;
                    }}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onSelectAll(knowledgePoints.map((p) => p.id));
                      } else {
                        onSelectAll([]);
                      }
                    }}
                    data-oid="y8o:fh6"
                  />
                </th>
              )}

              {visibleColumns.map((column) => (
                <th
                  key={column.id}
                  className={`kp-table-header ${column.align || "left"} ${column.sortable ? "sortable" : ""}`}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && onSort(column.field)}
                  data-oid="l5.cvix"
                >
                  <div className="kp-table-header-content" data-oid="kthwp4.">
                    <span data-oid="7:i_5z_">{column.label}</span>
                    {column.sortable && (
                      <span className="kp-sort-indicator" data-oid="poa77gs">
                        {sortConfig?.field === column.field
                          ? sortConfig.direction === "asc"
                            ? "↑"
                            : "↓"
                          : "↕"}
                      </span>
                    )}
                  </div>
                </th>
              ))}

              <th className="kp-table-actions-col" data-oid="3xbwkn:">
                操作
              </th>
            </tr>
          </thead>
        )}

        <tbody data-oid="kq06sum">
          {knowledgePoints.map((point) => (
            <tr
              key={point.id}
              className={`kp-table-row ${selectedIds.includes(point.id) ? "selected" : ""}`}
              data-oid="tx:f8mt"
            >
              {layout.selectionMode === "multiple" && (
                <td className="kp-table-checkbox-col" data-oid="a53dv67">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(point.id)}
                    onChange={() => onSelect(point.id)}
                    data-oid="2_at5y9"
                  />
                </td>
              )}

              {visibleColumns.map((column) => (
                <td
                  key={column.id}
                  className={`kp-table-cell ${column.align || "left"}`}
                  data-oid="-78i24v"
                >
                  {column.formatter
                    ? column.formatter(
                        getNestedValue(point, column.field),
                        point,
                      )
                    : formatCellValue(getNestedValue(point, column.field))}
                </td>
              ))}

              <td className="kp-table-actions-col" data-oid="pr49dgh">
                <div className="kp-table-actions" data-oid="h0_90-p">
                  {config.actions
                    .filter(
                      (action) => action.position === "row" && action.visible,
                    )
                    .map((action) => (
                      <button
                        key={action.id}
                        className={`kp-action-btn ${action.type}`}
                        onClick={() => action.onClick([point])}
                        disabled={action.disabled?.([point])}
                        data-oid="sh8rjhm"
                      >
                        {action.icon && (
                          <span
                            className={`icon ${action.icon}`}
                            data-oid="tqkhi92"
                          />
                        )}
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
        <div className="kp-empty-state" data-oid="cf9z0e-">
          <p data-oid="tp5olet">没有找到匹配的知识点</p>
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
}> = ({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
}) => {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="kp-pagination" data-oid="dx0fp_6">
      <div className="kp-pagination-info" data-oid="n3xs_vv">
        显示 {startItem}-{endItem} 项，共 {totalItems} 项
      </div>

      <div className="kp-pagination-size" data-oid="6b5s1o-">
        <label data-oid="yzbogwt">每页显示：</label>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          data-oid="rl_juy3"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size} data-oid="b7npfu3">
              {size}
            </option>
          ))}
        </select>
      </div>

      <div className="kp-pagination-controls" data-oid="490dwe3">
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          data-oid="ig4i1n-"
        >
          上一页
        </button>

        <span className="kp-pagination-current" data-oid="axgsmks">
          {currentPage} / {totalPages}
        </span>

        <button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          data-oid=".t06svl"
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
  style,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(config.layout.pageSize);

  // 使用hooks管理状态
  const {
    filteredPoints,
    filterValues,
    updateFilter,
    clearFilters,
    hasActiveFilters,
  } = useKnowledgePointFilter(knowledgePoints, config.filters);

  const { sortedPoints, sortConfig, updateSort, clearSort } =
    useKnowledgePointSort(filteredPoints, config.columns);

  const {
    selectedIds,
    selectPoint,
    selectAll,
    clearSelection,
    getSelectedPoints,
    hasSelection,
  } = useKnowledgePointSelection(config.layout.selectionMode);

  // 分页处理
  const totalPages = Math.ceil(sortedPoints.length / pageSize);
  const paginatedPoints = useMemo(() => {
    if (!config.layout.showPagination) return sortedPoints;

    const startIndex = (currentPage - 1) * pageSize;
    return sortedPoints.slice(startIndex, startIndex + pageSize);
  }, [sortedPoints, currentPage, pageSize, config.layout.showPagination]);

  // 处理页面变化
  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    },
    [totalPages],
  );

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
      className={`knowledge-point-selector ${className || ""}`}
      style={style}
      data-oid="ras68_4"
    >
      {/* 头部操作区 */}
      <div className="kp-header" data-oid="tpo-cr4">
        <div className="kp-header-left" data-oid="867w::5">
          <h2 data-oid=":mgk6_c">知识点选择器</h2>
          <span className="kp-count-info" data-oid="0yys7o1">
            共 {knowledgePoints.length} 项
            {hasActiveFilters && ` (筛选后 ${filteredPoints.length} 项)`}
            {hasSelection && ` (已选择 ${selectedIds.length} 项)`}
          </span>
        </div>

        <div className="kp-header-actions" data-oid="jy3xm4l">
          {config.actions
            .filter((action) => action.position === "header" && action.visible)
            .map((action) => (
              <button
                key={action.id}
                className={`kp-action-btn ${action.type}`}
                onClick={() =>
                  action.onClick(getSelectedPoints(knowledgePoints))
                }
                disabled={action.disabled?.(getSelectedPoints(knowledgePoints))}
                data-oid="wqok9xq"
              >
                {action.icon && (
                  <span className={`icon ${action.icon}`} data-oid=":sjtdm3" />
                )}
                {action.label}
              </button>
            ))}

          {hasSelection && onSave && (
            <button
              className="kp-action-btn primary"
              onClick={handleSave}
              data-oid="c6sz.h9"
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
          data-oid="uriye21"
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
        data-oid="8f:ojom"
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
          data-oid="fnmt7fh"
        />
      )}

      {/* 底部操作区 */}
      {config.layout.showFooter && (
        <div className="kp-footer" data-oid="h1bfc_n">
          <div className="kp-footer-info" data-oid="smzy5.l">
            {hasSelection && (
              <span data-oid="_q2:zqw">已选择 {selectedIds.length} 项</span>
            )}
          </div>

          <div className="kp-footer-actions" data-oid="ifeevk5">
            {config.actions
              .filter(
                (action) => action.position === "footer" && action.visible,
              )
              .map((action) => (
                <button
                  key={action.id}
                  className={`kp-action-btn ${action.type}`}
                  onClick={() =>
                    action.onClick(getSelectedPoints(knowledgePoints))
                  }
                  disabled={action.disabled?.(
                    getSelectedPoints(knowledgePoints),
                  )}
                  data-oid="dy3sjg."
                >
                  {action.icon && (
                    <span
                      className={`icon ${action.icon}`}
                      data-oid="-i4l-gs"
                    />
                  )}
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
  return path.split(".").reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
}

function formatCellValue(value: any): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.join(", ");
  if (value instanceof Date) return value.toLocaleDateString();
  return String(value);
}

export default KnowledgePointSelector;
