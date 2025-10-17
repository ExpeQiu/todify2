import React, { useState, useCallback } from 'react';
import { 
  KnowledgeConfig, 
  ConfigPreset, 
  FilterConfig, 
  ColumnConfig, 
  ActionConfig,
  LayoutConfig 
} from '../types/knowledgeConfig';
import { useKnowledgeConfig } from '../hooks/useKnowledgeConfig';
import { knowledgeConfigService } from '../services/knowledgeConfigService';
import './KnowledgeConfigManager.css';

interface KnowledgeConfigManagerProps {
  onConfigSelect?: (config: KnowledgeConfig) => void;
  onConfigChange?: (config: KnowledgeConfig) => void;
}

export const KnowledgeConfigManager: React.FC<KnowledgeConfigManagerProps> = ({
  onConfigSelect,
  onConfigChange
}) => {
  const {
    configs,
    currentConfig,
    activeConfigId,
    presets,
    loading,
    error,
    createConfig,
    updateConfig,
    deleteConfig,
    duplicateConfig,
    activateConfig,
    applyPreset,
    exportConfig,
    importConfig,
    validateConfig
  } = useKnowledgeConfig();

  const [activeTab, setActiveTab] = useState<'filters' | 'columns' | 'actions' | 'layout'>('filters');
  const [editingConfig, setEditingConfig] = useState<KnowledgeConfig | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);

  // 处理配置选择
  const handleConfigSelect = useCallback((config: KnowledgeConfig) => {
    setEditingConfig(config);
    onConfigSelect?.(config);
  }, [onConfigSelect]);

  // 处理配置更新
  const handleConfigUpdate = useCallback(async (updates: Partial<KnowledgeConfig>) => {
    if (!editingConfig) return;
    
    try {
      const updatedConfig = await updateConfig(editingConfig.id, updates);
      if (updatedConfig) {
        setEditingConfig(updatedConfig);
        onConfigChange?.(updatedConfig);
      }
    } catch (error) {
      console.error('更新配置失败:', error);
    }
  }, [editingConfig, updateConfig, onConfigChange]);

  // 处理预设应用
  const handleApplyPreset = useCallback(async (preset: ConfigPreset) => {
    if (!editingConfig) return;
    
    try {
      const updatedConfig = await applyPreset(editingConfig.id, preset);
      if (updatedConfig) {
        setEditingConfig(updatedConfig);
        onConfigChange?.(updatedConfig);
      }
    } catch (error) {
      console.error('应用预设失败:', error);
    }
  }, [editingConfig, applyPreset, onConfigChange]);

  // 处理配置创建
  const handleCreateConfig = useCallback(async (configData: Omit<KnowledgeConfig, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newConfig = await createConfig(configData);
      setEditingConfig(newConfig);
      setShowCreateDialog(false);
      onConfigSelect?.(newConfig);
    } catch (error) {
      console.error('创建配置失败:', error);
    }
  }, [createConfig, onConfigSelect]);

  // 处理配置复制
  const handleDuplicateConfig = useCallback(async (configId: string, newName?: string) => {
    try {
      const duplicatedConfig = await duplicateConfig(configId, newName);
      if (duplicatedConfig) {
        setEditingConfig(duplicatedConfig);
        onConfigSelect?.(duplicatedConfig);
      }
    } catch (error) {
      console.error('复制配置失败:', error);
    }
  }, [duplicateConfig, onConfigSelect]);

  // 处理配置激活
  const handleActivateConfig = useCallback(async (configId: string) => {
    try {
      await activateConfig(configId);
    } catch (error) {
      console.error('激活配置失败:', error);
    }
  }, [activateConfig]);

  // 处理配置删除
  const handleDeleteConfig = useCallback(async (configId: string) => {
    if (window.confirm('确定要删除这个配置吗？')) {
      try {
        await deleteConfig(configId);
        if (editingConfig?.id === configId) {
          setEditingConfig(null);
        }
      } catch (error) {
        console.error('删除配置失败:', error);
      }
    }
  }, [deleteConfig, editingConfig]);

  // 处理布局配置更新
  const handleLayoutChange = useCallback((layoutUpdates: Partial<LayoutConfig>) => {
    if (!editingConfig) return;
    
    handleConfigUpdate({
      layout: {
        ...editingConfig.layout,
        ...layoutUpdates
      }
    });
  }, [editingConfig, handleConfigUpdate]);

  // 处理导入配置
  const handleImportConfig = useCallback((configJson: string) => {
    try {
      const importedConfig = knowledgeConfigService.importConfig(configJson);
      setEditingConfig(importedConfig);
      setShowImportDialog(false);
      onConfigSelect?.(importedConfig);
    } catch (error) {
      console.error('导入配置失败:', error);
      alert('导入配置失败，请检查文件格式');
    }
  }, [onConfigSelect]);

  // 处理导出配置
  const handleExportConfig = useCallback((configId: string) => {
    try {
      const configJson = knowledgeConfigService.exportConfig(configId);
      const blob = new Blob([configJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `knowledge-config-${configId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('导出配置失败:', error);
      alert('导出配置失败');
    }
  }, []);

  if (loading) {
    return <div className="config-manager-loading">加载配置中...</div>;
  }

  if (error) {
    return <div className="config-manager-error">错误: {error}</div>;
  }

  return (
    <div className="knowledge-config-manager">
      <div className="config-manager-header">
        <h2>知识点配置管理</h2>
        <div className="config-manager-actions">
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateDialog(true)}
          >
            新建配置
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => setShowImportDialog(true)}
          >
            导入配置
          </button>
        </div>
      </div>

      <div className="config-manager-content">
        {/* 配置列表 */}
        <div className="config-list-panel">
          <h3>配置列表</h3>
          <div className="config-list">
            {configs.map(config => (
              <div 
                key={config.id}
                className={`config-item ${editingConfig?.id === config.id ? 'active' : ''} ${config.id === activeConfigId ? 'current' : ''}`}
                onClick={() => handleConfigSelect(config)}
              >
                <div className="config-item-header">
                  <span className="config-name">{config.name}</span>
                  {config.id === activeConfigId && (
                    <span className="config-badge active">当前</span>
                  )}
                  {config.isDefault && (
                    <span className="config-badge default">默认</span>
                  )}
                </div>
                <div className="config-item-description">
                  {config.description}
                </div>
                <div className="config-item-actions">
                  <button 
                    className="btn btn-sm btn-secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleActivateConfig(config.id);
                    }}
                    disabled={config.id === activeConfigId}
                  >
                    激活
                  </button>
                  <button 
                    className="btn btn-sm btn-secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicateConfig(config.id);
                    }}
                  >
                    复制
                  </button>
                  <button 
                    className="btn btn-sm btn-secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExportConfig(config.id);
                    }}
                  >
                    导出
                  </button>
                  <button 
                    className="btn btn-sm btn-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConfig(config.id);
                    }}
                    disabled={config.isDefault}
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 配置编辑面板 */}
        {editingConfig && (
          <div className="config-edit-panel">
            <div className="config-edit-header">
              <h3>编辑配置: {editingConfig.name}</h3>
              <div className="preset-actions">
                <select 
                  onChange={(e) => {
                    const preset = e.target.value as ConfigPreset;
                    if (preset) {
                      handleApplyPreset(preset);
                    }
                  }}
                  defaultValue=""
                >
                  <option value="">选择预设模板</option>
                  <option value="minimal">极简配置</option>
                  <option value="standard">标准配置</option>
                  <option value="advanced">高级配置</option>
                  <option value="custom">自定义配置</option>
                </select>
              </div>
            </div>

            <div className="config-edit-tabs">
              <button 
                className={`tab-button ${activeTab === 'filters' ? 'active' : ''}`}
                onClick={() => setActiveTab('filters')}
              >
                筛选器配置
              </button>
              <button 
                className={`tab-button ${activeTab === 'columns' ? 'active' : ''}`}
                onClick={() => setActiveTab('columns')}
              >
                列配置
              </button>
              <button 
                className={`tab-button ${activeTab === 'actions' ? 'active' : ''}`}
                onClick={() => setActiveTab('actions')}
              >
                操作配置
              </button>
              <button 
                className={`tab-button ${activeTab === 'layout' ? 'active' : ''}`}
                onClick={() => setActiveTab('layout')}
              >
                布局配置
              </button>
            </div>

            <div className="config-edit-content">
              {activeTab === 'filters' && (
                <FilterConfigPanel 
                  filters={editingConfig.filters}
                  onChange={(filters) => handleConfigUpdate({ filters })}
                />
              )}
              {activeTab === 'columns' && (
                <ColumnConfigPanel 
                  columns={editingConfig.columns}
                  onChange={(columns) => handleConfigUpdate({ columns })}
                />
              )}
              {activeTab === 'actions' && (
                <ActionConfigPanel 
                  actions={editingConfig.actions}
                  onChange={(actions) => handleConfigUpdate({ actions })}
                />
              )}
              {activeTab === 'layout' && (
                <LayoutConfigPanel 
                  layout={editingConfig.layout}
                  onChange={handleLayoutChange}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* 创建配置对话框 */}
      {showCreateDialog && (
        <CreateConfigDialog 
          onConfirm={handleCreateConfig}
          onCancel={() => setShowCreateDialog(false)}
        />
      )}

      {/* 导入配置对话框 */}
      {showImportDialog && (
        <ImportConfigDialog 
          onConfirm={handleImportConfig}
          onCancel={() => setShowImportDialog(false)}
        />
      )}
    </div>
  );
};

// 筛选器配置面板
interface FilterConfigPanelProps {
  filters: FilterConfig[];
  onChange: (filters: FilterConfig[]) => void;
}

const FilterConfigPanel: React.FC<FilterConfigPanelProps> = ({ filters, onChange }) => {
  const handleFilterChange = (index: number, updates: Partial<FilterConfig>) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], ...updates };
    onChange(newFilters);
  };

  const handleAddFilter = () => {
    const newFilter: FilterConfig = {
      id: `filter_${Date.now()}`,
      name: '新筛选器',
      type: 'search',
      field: '',
      visible: true
    };
    onChange([...filters, newFilter]);
  };

  const handleRemoveFilter = (index: number) => {
    const newFilters = filters.filter((_, i) => i !== index);
    onChange(newFilters);
  };

  return (
    <div className="filter-config-panel">
      <div className="panel-header">
        <h4>筛选器配置</h4>
        <button className="btn btn-primary" onClick={handleAddFilter}>
          添加筛选器
        </button>
      </div>
      <div className="filter-list">
        {filters.map((filter, index) => (
          <div key={filter.id} className="filter-item">
            <div className="filter-item-header">
              <input 
                type="text"
                value={filter.name}
                onChange={(e) => handleFilterChange(index, { name: e.target.value })}
                className="filter-name-input"
              />
              <label className="checkbox-label">
                <input 
                  type="checkbox"
                  checked={filter.visible}
                  onChange={(e) => handleFilterChange(index, { visible: e.target.checked })}
                />
                显示
              </label>
              <button 
                className="btn btn-sm btn-danger"
                onClick={() => handleRemoveFilter(index)}
              >
                删除
              </button>
            </div>
            <div className="filter-item-content">
              <div className="form-group">
                <label>类型:</label>
                <select 
                  value={filter.type}
                  onChange={(e) => handleFilterChange(index, { type: e.target.value as any })}
                >
                  <option value="search">搜索</option>
                  <option value="select">单选</option>
                  <option value="multiselect">多选</option>
                  <option value="date">日期</option>
                  <option value="range">范围</option>
                </select>
              </div>
              <div className="form-group">
                <label>字段:</label>
                <input 
                  type="text"
                  value={filter.field}
                  onChange={(e) => handleFilterChange(index, { field: e.target.value })}
                />
              </div>
              {filter.type === 'search' && (
                <div className="form-group">
                  <label>占位符:</label>
                  <input 
                    type="text"
                    value={filter.placeholder || ''}
                    onChange={(e) => handleFilterChange(index, { placeholder: e.target.value })}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 列配置面板
interface ColumnConfigPanelProps {
  columns: ColumnConfig[];
  onChange: (columns: ColumnConfig[]) => void;
}

const ColumnConfigPanel: React.FC<ColumnConfigPanelProps> = ({ columns, onChange }) => {
  const handleColumnChange = (index: number, updates: Partial<ColumnConfig>) => {
    const newColumns = [...columns];
    newColumns[index] = { ...newColumns[index], ...updates };
    onChange(newColumns);
  };

  const handleAddColumn = () => {
    const newColumn: ColumnConfig = {
      id: `column_${Date.now()}`,
      field: '',
      label: '新列',
      sortable: true,
      visible: true,
      align: 'left'
    };
    onChange([...columns, newColumn]);
  };

  const handleRemoveColumn = (index: number) => {
    const newColumns = columns.filter((_, i) => i !== index);
    onChange(newColumns);
  };

  return (
    <div className="column-config-panel">
      <div className="panel-header">
        <h4>列配置</h4>
        <button className="btn btn-primary" onClick={handleAddColumn}>
          添加列
        </button>
      </div>
      <div className="column-list">
        {columns.map((column, index) => (
          <div key={column.id} className="column-item">
            <div className="column-item-header">
              <input 
                type="text"
                value={column.label}
                onChange={(e) => handleColumnChange(index, { label: e.target.value })}
                className="column-label-input"
              />
              <label className="checkbox-label">
                <input 
                  type="checkbox"
                  checked={column.visible}
                  onChange={(e) => handleColumnChange(index, { visible: e.target.checked })}
                />
                显示
              </label>
              <button 
                className="btn btn-sm btn-danger"
                onClick={() => handleRemoveColumn(index)}
              >
                删除
              </button>
            </div>
            <div className="column-item-content">
              <div className="form-group">
                <label>字段:</label>
                <input 
                  type="text"
                  value={column.field}
                  onChange={(e) => handleColumnChange(index, { field: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>宽度:</label>
                <input 
                  type="text"
                  value={column.width || ''}
                  onChange={(e) => handleColumnChange(index, { width: e.target.value })}
                  placeholder="如: 100px, 20%, auto"
                />
              </div>
              <div className="form-group">
                <label>对齐:</label>
                <select 
                  value={column.align}
                  onChange={(e) => handleColumnChange(index, { align: e.target.value as any })}
                >
                  <option value="left">左对齐</option>
                  <option value="center">居中</option>
                  <option value="right">右对齐</option>
                </select>
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input 
                    type="checkbox"
                    checked={column.sortable}
                    onChange={(e) => handleColumnChange(index, { sortable: e.target.checked })}
                  />
                  可排序
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 操作配置面板
interface ActionConfigPanelProps {
  actions: ActionConfig[];
  onChange: (actions: ActionConfig[]) => void;
}

const ActionConfigPanel: React.FC<ActionConfigPanelProps> = ({ actions, onChange }) => {
  const handleActionChange = (index: number, updates: Partial<ActionConfig>) => {
    const newActions = [...actions];
    newActions[index] = { ...newActions[index], ...updates };
    onChange(newActions);
  };

  const handleAddAction = () => {
    const newAction: ActionConfig = {
      id: `action_${Date.now()}`,
      label: '新操作',
      type: 'secondary',
      position: 'row',
      visible: true,
      onClick: (selectedItems) => {
        console.log('操作被点击，选中的项目:', selectedItems);
      }
    };
    onChange([...actions, newAction]);
  };

  const handleRemoveAction = (index: number) => {
    const newActions = actions.filter((_, i) => i !== index);
    onChange(newActions);
  };

  return (
    <div className="action-config-panel">
      <div className="panel-header">
        <h4>操作配置</h4>
        <button className="btn btn-primary" onClick={handleAddAction}>
          添加操作
        </button>
      </div>
      <div className="action-list">
        {actions.map((action, index) => (
          <div key={action.id} className="action-item">
            <div className="action-item-header">
              <input 
                type="text"
                value={action.label}
                onChange={(e) => handleActionChange(index, { label: e.target.value })}
                className="action-label-input"
              />
              <label className="checkbox-label">
                <input 
                  type="checkbox"
                  checked={action.visible}
                  onChange={(e) => handleActionChange(index, { visible: e.target.checked })}
                />
                显示
              </label>
              <button 
                className="btn btn-sm btn-danger"
                onClick={() => handleRemoveAction(index)}
              >
                删除
              </button>
            </div>
            <div className="action-item-content">
              <div className="form-group">
                <label>类型:</label>
                <select 
                  value={action.type}
                  onChange={(e) => handleActionChange(index, { type: e.target.value as any })}
                >
                  <option value="primary">主要</option>
                  <option value="secondary">次要</option>
                  <option value="success">成功</option>
                  <option value="warning">警告</option>
                  <option value="danger">危险</option>
                </select>
              </div>
              <div className="form-group">
                <label>位置:</label>
                <select 
                  value={action.position}
                  onChange={(e) => handleActionChange(index, { position: e.target.value as any })}
                >
                  <option value="header">头部</option>
                  <option value="row">行内</option>
                  <option value="footer">底部</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 布局配置面板
interface LayoutConfigPanelProps {
  layout: LayoutConfig;
  onChange: (layout: Partial<LayoutConfig>) => void;
}

const LayoutConfigPanel: React.FC<LayoutConfigPanelProps> = ({ layout, onChange }) => {
  return (
    <div className="layout-config-panel">
      <h4>布局配置</h4>
      <div className="layout-config-content">
        <div className="form-group">
          <label>布局类型:</label>
          <select 
            value={layout.type}
            onChange={(e) => onChange({ type: e.target.value as any })}
          >
            <option value="table">表格</option>
            <option value="card">卡片</option>
            <option value="list">列表</option>
          </select>
        </div>
        <div className="form-group">
          <label>密度:</label>
          <select 
            value={layout.density}
            onChange={(e) => onChange({ density: e.target.value as 'compact' | 'comfortable' | 'spacious' })}
          >
            <option value="compact">紧凑</option>
            <option value="comfortable">舒适</option>
            <option value="spacious">宽松</option>
          </select>
        </div>
        <div className="form-group">
          <label>页面大小:</label>
          <input 
            type="number"
            value={layout.pageSize}
            onChange={(e) => onChange({ pageSize: parseInt(e.target.value) })}
            min="1"
            max="200"
          />
        </div>
        <div className="form-group">
          <label>选择模式:</label>
          <select 
            value={layout.selectionMode}
            onChange={(e) => onChange({ selectionMode: e.target.value as any })}
          >
            <option value="none">无选择</option>
            <option value="single">单选</option>
            <option value="multiple">多选</option>
          </select>
        </div>
        <div className="form-group checkbox-group">
          <label className="checkbox-label">
            <input 
              type="checkbox"
              checked={layout.showHeader}
              onChange={(e) => onChange({ showHeader: e.target.checked })}
            />
            显示头部
          </label>
          <label className="checkbox-label">
            <input 
              type="checkbox"
              checked={layout.showFooter}
              onChange={(e) => onChange({ showFooter: e.target.checked })}
            />
            显示底部
          </label>
          <label className="checkbox-label">
            <input 
              type="checkbox"
              checked={layout.showPagination}
              onChange={(e) => onChange({ showPagination: e.target.checked })}
            />
            显示分页
          </label>
          {layout.expandable !== undefined && (
            <label className="checkbox-label">
              <input 
                type="checkbox"
                checked={layout.expandable}
                onChange={(e) => onChange({ expandable: e.target.checked })}
              />
              可展开
            </label>
          )}
        </div>
      </div>
    </div>
  );
};

// 创建配置对话框
interface CreateConfigDialogProps {
  onConfirm: (config: Omit<KnowledgeConfig, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

const CreateConfigDialog: React.FC<CreateConfigDialogProps> = ({ onConfirm, onCancel }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [preset, setPreset] = useState<ConfigPreset>('standard');

  const handleConfirm = () => {
    if (!name.trim()) {
      alert('请输入配置名称');
      return;
    }

    const template = knowledgeConfigService.getPresetTemplate(preset);
    onConfirm({
      ...template,
      name: name.trim(),
      description: description.trim() || template.description
    });
  };

  return (
    <div className="dialog-overlay">
      <div className="dialog">
        <div className="dialog-header">
          <h3>创建新配置</h3>
        </div>
        <div className="dialog-content">
          <div className="form-group">
            <label>配置名称:</label>
            <input 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入配置名称"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>配置描述:</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="输入配置描述（可选）"
              rows={3}
            />
          </div>
          <div className="form-group">
            <label>基于预设:</label>
            <select 
              value={preset}
              onChange={(e) => setPreset(e.target.value as ConfigPreset)}
            >
              <option value="minimal">极简配置</option>
              <option value="standard">标准配置</option>
              <option value="advanced">高级配置</option>
              <option value="custom">自定义配置</option>
            </select>
          </div>
        </div>
        <div className="dialog-footer">
          <button className="btn btn-secondary" onClick={onCancel}>
            取消
          </button>
          <button className="btn btn-primary" onClick={handleConfirm}>
            创建
          </button>
        </div>
      </div>
    </div>
  );
};

// 导入配置对话框
interface ImportConfigDialogProps {
  onConfirm: (configJson: string) => void;
  onCancel: () => void;
}

const ImportConfigDialog: React.FC<ImportConfigDialogProps> = ({ onConfirm, onCancel }) => {
  const [configJson, setConfigJson] = useState('');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setConfigJson(content);
      };
      reader.readAsText(file);
    }
  };

  const handleConfirm = () => {
    if (!configJson.trim()) {
      alert('请选择配置文件或输入配置JSON');
      return;
    }

    try {
      JSON.parse(configJson); // 验证JSON格式
      onConfirm(configJson);
    } catch (error) {
      alert('配置文件格式错误，请检查JSON格式');
    }
  };

  return (
    <div className="dialog-overlay">
      <div className="dialog">
        <div className="dialog-header">
          <h3>导入配置</h3>
        </div>
        <div className="dialog-content">
          <div className="form-group">
            <label>选择配置文件:</label>
            <input 
              type="file"
              accept=".json"
              onChange={handleFileUpload}
            />
          </div>
          <div className="form-group">
            <label>或直接输入配置JSON:</label>
            <textarea 
              value={configJson}
              onChange={(e) => setConfigJson(e.target.value)}
              placeholder="粘贴配置JSON内容"
              rows={10}
              className="json-textarea"
            />
          </div>
        </div>
        <div className="dialog-footer">
          <button className="btn btn-secondary" onClick={onCancel}>
            取消
          </button>
          <button className="btn btn-primary" onClick={handleConfirm}>
            导入
          </button>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeConfigManager;