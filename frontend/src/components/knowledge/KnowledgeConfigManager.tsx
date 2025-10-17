import React, { useState, useCallback, useEffect } from 'react';
import { 
  KnowledgeConfig, 
  ConfigPreset, 
  FilterConfig, 
  ColumnConfig, 
  ActionConfig 
} from '../../types/knowledgeConfig';
import { useKnowledgeConfig } from '../../hooks/useKnowledgeConfig';
import './KnowledgeConfigManager.css';

// 筛选器配置组件
const FilterConfigComponent: React.FC<{
  filters: FilterConfig[];
  onChange: (filters: FilterConfig[]) => void;
}> = ({ filters, onChange }) => {
  const addFilter = useCallback(() => {
    const newFilter: FilterConfig = {
      id: `filter_${Date.now()}`,
      name: '新筛选器',
      field: '',
      type: 'search',
      visible: true,
      placeholder: '请输入...'
    };
    onChange([...filters, newFilter]);
  }, [filters, onChange]);

  const updateFilter = useCallback((index: number, updates: Partial<FilterConfig>) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], ...updates };
    onChange(newFilters);
  }, [filters, onChange]);

  const removeFilter = useCallback((index: number) => {
    onChange(filters.filter((_, i) => i !== index));
  }, [filters, onChange]);

  return (
    <div className="config-section">
      <div className="config-section-header">
        <h3>筛选器配置</h3>
        <button className="add-btn" onClick={addFilter}>
          + 添加筛选器
        </button>
      </div>
      
      <div className="filter-configs">
        {filters.map((filter, index) => (
          <div key={filter.id} className="filter-config-item">
            <div className="config-row">
              <div className="config-field">
                <label>名称</label>
                <input
                  type="text"
                  value={filter.name}
                  onChange={(e) => updateFilter(index, { name: e.target.value })}
                />
              </div>
              
              <div className="config-field">
                <label>字段</label>
                <input
                  type="text"
                  value={filter.field}
                  placeholder="如: name, category.type"
                  onChange={(e) => updateFilter(index, { field: e.target.value })}
                />
              </div>
              
              <div className="config-field">
                <label>类型</label>
                <select
                  value={filter.type}
                  onChange={(e) => updateFilter(index, { type: e.target.value as FilterConfig['type'] })}
                >
                  <option value="search">搜索框</option>
                  <option value="select">下拉选择</option>
                  <option value="multiselect">多选</option>
                </select>
              </div>
              
              <div className="config-field">
                <label>
                  <input
                    type="checkbox"
                    checked={filter.visible}
                    onChange={(e) => updateFilter(index, { visible: e.target.checked })}
                  />
                  显示
                </label>
              </div>
              
              <button 
                className="remove-btn"
                onClick={() => removeFilter(index)}
              >
                删除
              </button>
            </div>
            
            {filter.type === 'search' && (
              <div className="config-row">
                <div className="config-field">
                  <label>占位符</label>
                  <input
                    type="text"
                    value={filter.placeholder || ''}
                    onChange={(e) => updateFilter(index, { placeholder: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// 列配置组件
const ColumnConfigComponent: React.FC<{
  columns: ColumnConfig[];
  onChange: (columns: ColumnConfig[]) => void;
}> = ({ columns, onChange }) => {
  const addColumn = useCallback(() => {
    const newColumn: ColumnConfig = {
      id: `column_${Date.now()}`,
      label: '新列',
      field: '',
      visible: true,
      sortable: false,
      align: 'left'
    };
    onChange([...columns, newColumn]);
  }, [columns, onChange]);

  const updateColumn = useCallback((index: number, updates: Partial<ColumnConfig>) => {
    const newColumns = [...columns];
    newColumns[index] = { ...newColumns[index], ...updates };
    onChange(newColumns);
  }, [columns, onChange]);

  const removeColumn = useCallback((index: number) => {
    onChange(columns.filter((_, i) => i !== index));
  }, [columns, onChange]);

  const moveColumn = useCallback((fromIndex: number, toIndex: number) => {
    const newColumns = [...columns];
    const [movedColumn] = newColumns.splice(fromIndex, 1);
    newColumns.splice(toIndex, 0, movedColumn);
    onChange(newColumns);
  }, [columns, onChange]);

  return (
    <div className="config-section">
      <div className="config-section-header">
        <h3>列配置</h3>
        <button className="add-btn" onClick={addColumn}>
          + 添加列
        </button>
      </div>
      
      <div className="column-configs">
        {columns.map((column, index) => (
          <div key={column.id} className="column-config-item">
            <div className="config-row">
              <div className="column-order">
                <button 
                  disabled={index === 0}
                  onClick={() => moveColumn(index, index - 1)}
                >
                  ↑
                </button>
                <span>{index + 1}</span>
                <button 
                  disabled={index === columns.length - 1}
                  onClick={() => moveColumn(index, index + 1)}
                >
                  ↓
                </button>
              </div>
              
              <div className="config-field">
                <label>标题</label>
                <input
                  type="text"
                  value={column.label}
                  onChange={(e) => updateColumn(index, { label: e.target.value })}
                />
              </div>
              
              <div className="config-field">
                <label>字段</label>
                <input
                  type="text"
                  value={column.field}
                  placeholder="如: name, category.type"
                  onChange={(e) => updateColumn(index, { field: e.target.value })}
                />
              </div>
              
              <div className="config-field">
                <label>宽度</label>
                <input
                  type="text"
                  value={column.width || ''}
                  placeholder="如: 100px, 20%"
                  onChange={(e) => updateColumn(index, { width: e.target.value })}
                />
              </div>
              
              <div className="config-field">
                <label>对齐</label>
                <select
                  value={column.align || 'left'}
                  onChange={(e) => updateColumn(index, { align: e.target.value as ColumnConfig['align'] })}
                >
                  <option value="left">左对齐</option>
                  <option value="center">居中</option>
                  <option value="right">右对齐</option>
                </select>
              </div>
              
              <div className="config-checkboxes">
                <label>
                  <input
                    type="checkbox"
                    checked={column.visible}
                    onChange={(e) => updateColumn(index, { visible: e.target.checked })}
                  />
                  显示
                </label>
                
                <label>
                  <input
                    type="checkbox"
                    checked={column.sortable}
                    onChange={(e) => updateColumn(index, { sortable: e.target.checked })}
                  />
                  可排序
                </label>
              </div>
              
              <button 
                className="remove-btn"
                onClick={() => removeColumn(index)}
              >
                删除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 操作配置组件
const ActionConfigComponent: React.FC<{
  actions: ActionConfig[];
  onChange: (actions: ActionConfig[]) => void;
}> = ({ actions, onChange }) => {
  const addAction = useCallback(() => {
    const newAction: ActionConfig = {
      id: `action_${Date.now()}`,
      label: '新操作',
      type: 'secondary',
      position: 'row',
      visible: true,
      onClick: () => console.log('Action clicked')
    };
    onChange([...actions, newAction]);
  }, [actions, onChange]);

  const updateAction = useCallback((index: number, updates: Partial<ActionConfig>) => {
    const newActions = [...actions];
    newActions[index] = { ...newActions[index], ...updates };
    onChange(newActions);
  }, [actions, onChange]);

  const removeAction = useCallback((index: number) => {
    onChange(actions.filter((_, i) => i !== index));
  }, [actions, onChange]);

  return (
    <div className="config-section">
      <div className="config-section-header">
        <h3>操作配置</h3>
        <button className="add-btn" onClick={addAction}>
          + 添加操作
        </button>
      </div>
      
      <div className="action-configs">
        {actions.map((action, index) => (
          <div key={action.id} className="action-config-item">
            <div className="config-row">
              <div className="config-field">
                <label>标签</label>
                <input
                  type="text"
                  value={action.label}
                  onChange={(e) => updateAction(index, { label: e.target.value })}
                />
              </div>
              
              <div className="config-field">
                <label>类型</label>
                <select
                  value={action.type}
                  onChange={(e) => updateAction(index, { type: e.target.value as ActionConfig['type'] })}
                >
                  <option value="primary">主要</option>
                  <option value="secondary">次要</option>
                  <option value="success">成功</option>
                  <option value="warning">警告</option>
                  <option value="danger">危险</option>
                </select>
              </div>
              
              <div className="config-field">
                <label>位置</label>
                <select
                  value={action.position}
                  onChange={(e) => updateAction(index, { position: e.target.value as ActionConfig['position'] })}
                >
                  <option value="header">头部</option>
                  <option value="row">行内</option>
                  <option value="footer">底部</option>
                </select>
              </div>
              
              <div className="config-field">
                <label>图标</label>
                <input
                  type="text"
                  value={action.icon || ''}
                  placeholder="如: edit, delete"
                  onChange={(e) => updateAction(index, { icon: e.target.value })}
                />
              </div>
              
              <div className="config-field">
                <label>
                  <input
                    type="checkbox"
                    checked={action.visible}
                    onChange={(e) => updateAction(index, { visible: e.target.checked })}
                  />
                  显示
                </label>
              </div>
              
              <button 
                className="remove-btn"
                onClick={() => removeAction(index)}
              >
                删除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 主配置管理器组件
export const KnowledgeConfigManager: React.FC<{
  onConfigChange?: (config: KnowledgeConfig) => void;
  onClose?: () => void;
}> = ({ onConfigChange, onClose }) => {
  const {
    configs,
    presets,
    activeConfigId,
    createConfig,
    updateConfig,
    deleteConfig,
    activateConfig,
    applyPreset,
    exportConfig,
    importConfig,
    validateConfig
  } = useKnowledgeConfig();

  const [currentConfig, setCurrentConfig] = useState<KnowledgeConfig | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'filters' | 'columns' | 'actions' | 'layout'>('basic');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // 获取当前激活的配置
  useEffect(() => {
    const activeConfig = configs.find(c => c.id === activeConfigId);
    if (activeConfig) {
      setCurrentConfig({ ...activeConfig });
    }
  }, [configs, activeConfigId]);

  // 保存配置
  const handleSave = useCallback(async () => {
    if (!currentConfig) return;

    const validation = validateConfig(currentConfig);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    setValidationErrors([]);
    await updateConfig(currentConfig.id, currentConfig);
    onConfigChange?.(currentConfig);
  }, [currentConfig, updateConfig, validateConfig, onConfigChange]);

  // 应用预设
  const handleApplyPreset = useCallback(async (presetId: string) => {
    if (!currentConfig) return;
    
    const updatedConfig = await applyPreset(currentConfig.id, presetId);
    if (updatedConfig) {
      setCurrentConfig({ ...updatedConfig });
    }
  }, [currentConfig, applyPreset]);

  // 导出配置
  const handleExport = useCallback(() => {
    if (!currentConfig) return;
    
    const exported = exportConfig(currentConfig.id);
    if (exported) {
      const blob = new Blob([exported], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `knowledge-config-${currentConfig.name}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [currentConfig, exportConfig]);

  // 导入配置
  const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const imported = await importConfig(content);
        if (imported) {
          setCurrentConfig({ ...imported });
        }
      } catch (error) {
        console.error('导入配置失败:', error);
        alert('导入配置失败，请检查文件格式');
      }
    };
    reader.readAsText(file);
  }, [importConfig]);

  if (!currentConfig) {
    return <div className="config-manager-loading">加载配置中...</div>;
  }

  return (
    <div className="knowledge-config-manager">
      <div className="config-manager-header">
        <div className="config-manager-title">
          <h2>知识点配置管理器</h2>
          <span className="config-name">当前配置: {currentConfig.name}</span>
        </div>
        
        <div className="config-manager-actions">
          <div className="preset-actions">
            <label>应用预设:</label>
            <select onChange={(e) => e.target.value && handleApplyPreset(e.target.value)}>
              <option value="">选择预设</option>
              {presets.map(preset => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </select>
          </div>
          
          <button className="export-btn" onClick={handleExport}>
            导出配置
          </button>
          
          <label className="import-btn">
            导入配置
            <input
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleImport}
            />
          </label>
          
          <button className="save-btn primary" onClick={handleSave}>
            保存配置
          </button>
          
          {onClose && (
            <button className="close-btn" onClick={onClose}>
              关闭
            </button>
          )}
        </div>
      </div>

      {validationErrors.length > 0 && (
        <div className="validation-errors">
          <h4>配置验证错误:</h4>
          <ul>
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="config-manager-content">
        <div className="config-tabs">
          <button 
            className={`tab-btn ${activeTab === 'basic' ? 'active' : ''}`}
            onClick={() => setActiveTab('basic')}
          >
            基本设置
          </button>
          <button 
            className={`tab-btn ${activeTab === 'filters' ? 'active' : ''}`}
            onClick={() => setActiveTab('filters')}
          >
            筛选器
          </button>
          <button 
            className={`tab-btn ${activeTab === 'columns' ? 'active' : ''}`}
            onClick={() => setActiveTab('columns')}
          >
            列配置
          </button>
          <button 
            className={`tab-btn ${activeTab === 'actions' ? 'active' : ''}`}
            onClick={() => setActiveTab('actions')}
          >
            操作配置
          </button>
          <button 
            className={`tab-btn ${activeTab === 'layout' ? 'active' : ''}`}
            onClick={() => setActiveTab('layout')}
          >
            布局设置
          </button>
        </div>

        <div className="config-tab-content">
          {activeTab === 'basic' && (
            <div className="config-section">
              <h3>基本设置</h3>
              <div className="config-row">
                <div className="config-field">
                  <label>配置名称</label>
                  <input
                    type="text"
                    value={currentConfig.name}
                    onChange={(e) => setCurrentConfig({
                      ...currentConfig,
                      name: e.target.value
                    })}
                  />
                </div>
                
                <div className="config-field">
                  <label>描述</label>
                  <textarea
                    value={currentConfig.description || ''}
                    onChange={(e) => setCurrentConfig({
                      ...currentConfig,
                      description: e.target.value
                    })}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'filters' && (
            <FilterConfigComponent
              filters={currentConfig.filters}
              onChange={(filters) => setCurrentConfig({
                ...currentConfig,
                filters
              })}
            />
          )}

          {activeTab === 'columns' && (
            <ColumnConfigComponent
              columns={currentConfig.columns}
              onChange={(columns) => setCurrentConfig({
                ...currentConfig,
                columns
              })}
            />
          )}

          {activeTab === 'actions' && (
            <ActionConfigComponent
              actions={currentConfig.actions}
              onChange={(actions) => setCurrentConfig({
                ...currentConfig,
                actions
              })}
            />
          )}

          {activeTab === 'layout' && (
            <div className="config-section">
              <h3>布局设置</h3>
              
              <div className="config-row">
                <div className="config-field">
                  <label>选择模式</label>
                  <select
                    value={currentConfig.layout.selectionMode}
                    onChange={(e) => setCurrentConfig({
                      ...currentConfig,
                      layout: {
                        ...currentConfig.layout,
                        selectionMode: e.target.value as 'single' | 'multiple' | 'none'
                      }
                    })}
                  >
                    <option value="none">无选择</option>
                    <option value="single">单选</option>
                    <option value="multiple">多选</option>
                  </select>
                </div>
                
                <div className="config-field">
                  <label>密度</label>
                  <select
                    value={currentConfig.layout.density}
                    onChange={(e) => setCurrentConfig({
                      ...currentConfig,
                      layout: {
                        ...currentConfig.layout,
                        density: e.target.value as 'compact' | 'standard' | 'comfortable'
                      }
                    })}
                  >
                    <option value="compact">紧凑</option>
                    <option value="standard">标准</option>
                    <option value="comfortable">舒适</option>
                  </select>
                </div>
                
                <div className="config-field">
                  <label>每页显示</label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={currentConfig.layout.pageSize}
                    onChange={(e) => setCurrentConfig({
                      ...currentConfig,
                      layout: {
                        ...currentConfig.layout,
                        pageSize: Number(e.target.value)
                      }
                    })}
                  />
                </div>
              </div>
              
              <div className="config-row">
                <div className="config-checkboxes">
                  <label>
                    <input
                      type="checkbox"
                      checked={currentConfig.layout.showHeader}
                      onChange={(e) => setCurrentConfig({
                        ...currentConfig,
                        layout: {
                          ...currentConfig.layout,
                          showHeader: e.target.checked
                        }
                      })}
                    />
                    显示表头
                  </label>
                  
                  <label>
                    <input
                      type="checkbox"
                      checked={currentConfig.layout.showFooter}
                      onChange={(e) => setCurrentConfig({
                        ...currentConfig,
                        layout: {
                          ...currentConfig.layout,
                          showFooter: e.target.checked
                        }
                      })}
                    />
                    显示底部
                  </label>
                  
                  <label>
                    <input
                      type="checkbox"
                      checked={currentConfig.layout.showPagination}
                      onChange={(e) => setCurrentConfig({
                        ...currentConfig,
                        layout: {
                          ...currentConfig.layout,
                          showPagination: e.target.checked
                        }
                      })}
                    />
                    显示分页
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeConfigManager;