import React, { useState, useCallback } from "react";
import {
  KnowledgeConfig,
  ConfigPreset,
  FilterConfig,
  ColumnConfig,
  ActionConfig,
  LayoutConfig,
} from "../types/knowledgeConfig";
import { useKnowledgeConfig } from "../hooks/useKnowledgeConfig";
import { knowledgeConfigService } from "../services/knowledgeConfigService";
import "./KnowledgeConfigManager.css";

interface KnowledgeConfigManagerProps {
  onConfigSelect?: (config: KnowledgeConfig) => void;
  onConfigChange?: (config: KnowledgeConfig) => void;
}

export const KnowledgeConfigManager: React.FC<KnowledgeConfigManagerProps> = ({
  onConfigSelect,
  onConfigChange,
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
    validateConfig,
  } = useKnowledgeConfig();

  const [activeTab, setActiveTab] = useState<
    "filters" | "columns" | "actions" | "layout"
  >("filters");
  const [editingConfig, setEditingConfig] = useState<KnowledgeConfig | null>(
    null,
  );
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);

  // 处理配置选择
  const handleConfigSelect = useCallback(
    (config: KnowledgeConfig) => {
      setEditingConfig(config);
      onConfigSelect?.(config);
    },
    [onConfigSelect],
  );

  // 处理配置更新
  const handleConfigUpdate = useCallback(
    async (updates: Partial<KnowledgeConfig>) => {
      if (!editingConfig) return;

      try {
        const updatedConfig = await updateConfig(editingConfig.id, updates);
        if (updatedConfig) {
          setEditingConfig(updatedConfig);
          onConfigChange?.(updatedConfig);
        }
      } catch (error) {
        console.error("更新配置失败:", error);
      }
    },
    [editingConfig, updateConfig, onConfigChange],
  );

  // 处理预设应用
  const handleApplyPreset = useCallback(
    async (preset: ConfigPreset) => {
      if (!editingConfig) return;

      try {
        const updatedConfig = await applyPreset(editingConfig.id, preset);
        if (updatedConfig) {
          setEditingConfig(updatedConfig);
          onConfigChange?.(updatedConfig);
        }
      } catch (error) {
        console.error("应用预设失败:", error);
      }
    },
    [editingConfig, applyPreset, onConfigChange],
  );

  // 处理配置创建
  const handleCreateConfig = useCallback(
    async (
      configData: Omit<KnowledgeConfig, "id" | "createdAt" | "updatedAt">,
    ) => {
      try {
        const newConfig = await createConfig(configData);
        setEditingConfig(newConfig);
        setShowCreateDialog(false);
        onConfigSelect?.(newConfig);
      } catch (error) {
        console.error("创建配置失败:", error);
      }
    },
    [createConfig, onConfigSelect],
  );

  // 处理配置复制
  const handleDuplicateConfig = useCallback(
    async (configId: string, newName?: string) => {
      try {
        const duplicatedConfig = await duplicateConfig(configId, newName);
        if (duplicatedConfig) {
          setEditingConfig(duplicatedConfig);
          onConfigSelect?.(duplicatedConfig);
        }
      } catch (error) {
        console.error("复制配置失败:", error);
      }
    },
    [duplicateConfig, onConfigSelect],
  );

  // 处理配置激活
  const handleActivateConfig = useCallback(
    async (configId: string) => {
      try {
        await activateConfig(configId);
      } catch (error) {
        console.error("激活配置失败:", error);
      }
    },
    [activateConfig],
  );

  // 处理配置删除
  const handleDeleteConfig = useCallback(
    async (configId: string) => {
      if (window.confirm("确定要删除这个配置吗？")) {
        try {
          await deleteConfig(configId);
          if (editingConfig?.id === configId) {
            setEditingConfig(null);
          }
        } catch (error) {
          console.error("删除配置失败:", error);
        }
      }
    },
    [deleteConfig, editingConfig],
  );

  // 处理布局配置更新
  const handleLayoutChange = useCallback(
    (layoutUpdates: Partial<LayoutConfig>) => {
      if (!editingConfig) return;

      handleConfigUpdate({
        layout: {
          ...editingConfig.layout,
          ...layoutUpdates,
        },
      });
    },
    [editingConfig, handleConfigUpdate],
  );

  // 处理导入配置
  const handleImportConfig = useCallback(
    (configJson: string) => {
      try {
        const importedConfig = knowledgeConfigService.importConfig(configJson);
        setEditingConfig(importedConfig);
        setShowImportDialog(false);
        onConfigSelect?.(importedConfig);
      } catch (error) {
        console.error("导入配置失败:", error);
        alert("导入配置失败，请检查文件格式");
      }
    },
    [onConfigSelect],
  );

  // 处理导出配置
  const handleExportConfig = useCallback((configId: string) => {
    try {
      const configJson = knowledgeConfigService.exportConfig(configId);
      const blob = new Blob([configJson], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `knowledge-config-${configId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("导出配置失败:", error);
      alert("导出配置失败");
    }
  }, []);

  if (loading) {
    return (
      <div className="config-manager-loading" data-oid="o9vfoht">
        加载配置中...
      </div>
    );
  }

  if (error) {
    return (
      <div className="config-manager-error" data-oid="2:9wxk3">
        错误: {error}
      </div>
    );
  }

  return (
    <div className="knowledge-config-manager" data-oid="ed6d0lx">
      <div className="config-manager-header" data-oid="ca84p9q">
        <h2 data-oid="xavv0te">知识点配置管理</h2>
        <div className="config-manager-actions" data-oid="yha5ogn">
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateDialog(true)}
            data-oid="a1:kn.g"
          >
            新建配置
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setShowImportDialog(true)}
            data-oid="3v4h3ih"
          >
            导入配置
          </button>
        </div>
      </div>

      <div className="config-manager-content" data-oid="55tcabj">
        {/* 配置列表 */}
        <div className="config-list-panel" data-oid="r9gm40h">
          <h3 data-oid="5ogi4hu">配置列表</h3>
          <div className="config-list" data-oid="48mom5:">
            {configs.map((config) => (
              <div
                key={config.id}
                className={`config-item ${editingConfig?.id === config.id ? "active" : ""} ${config.id === activeConfigId ? "current" : ""}`}
                onClick={() => handleConfigSelect(config)}
                data-oid="4kjtr.."
              >
                <div className="config-item-header" data-oid="xw8w22e">
                  <span className="config-name" data-oid="-oi6b:d">
                    {config.name}
                  </span>
                  {config.id === activeConfigId && (
                    <span className="config-badge active" data-oid="3byoccr">
                      当前
                    </span>
                  )}
                  {config.isDefault && (
                    <span className="config-badge default" data-oid="zf2i_vp">
                      默认
                    </span>
                  )}
                </div>
                <div className="config-item-description" data-oid="t9t:f0n">
                  {config.description}
                </div>
                <div className="config-item-actions" data-oid="ier6i8r">
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleActivateConfig(config.id);
                    }}
                    disabled={config.id === activeConfigId}
                    data-oid="5-t6kdy"
                  >
                    激活
                  </button>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicateConfig(config.id);
                    }}
                    data-oid="anktnyx"
                  >
                    复制
                  </button>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExportConfig(config.id);
                    }}
                    data-oid="2-bo64q"
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
                    data-oid="gea2i-g"
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
          <div className="config-edit-panel" data-oid="ujpq43h">
            <div className="config-edit-header" data-oid="5wwzjw1">
              <h3 data-oid="nk3479t">编辑配置: {editingConfig.name}</h3>
              <div className="preset-actions" data-oid="cgva_9t">
                <select
                  onChange={(e) => {
                    const preset = e.target.value as ConfigPreset;
                    if (preset) {
                      handleApplyPreset(preset);
                    }
                  }}
                  defaultValue=""
                  data-oid="yhfobvp"
                >
                  <option value="" data-oid="cuuxr10">
                    选择预设模板
                  </option>
                  <option value="minimal" data-oid=":6tkb-7">
                    极简配置
                  </option>
                  <option value="standard" data-oid="g-zzu4n">
                    标准配置
                  </option>
                  <option value="advanced" data-oid="dtk:2ij">
                    高级配置
                  </option>
                  <option value="custom" data-oid=":1rpppk">
                    自定义配置
                  </option>
                </select>
              </div>
            </div>

            <div className="config-edit-tabs" data-oid="izq.m_5">
              <button
                className={`tab-button ${activeTab === "filters" ? "active" : ""}`}
                onClick={() => setActiveTab("filters")}
                data-oid="4tqrgph"
              >
                筛选器配置
              </button>
              <button
                className={`tab-button ${activeTab === "columns" ? "active" : ""}`}
                onClick={() => setActiveTab("columns")}
                data-oid="1ueog76"
              >
                列配置
              </button>
              <button
                className={`tab-button ${activeTab === "actions" ? "active" : ""}`}
                onClick={() => setActiveTab("actions")}
                data-oid="9il1zsl"
              >
                操作配置
              </button>
              <button
                className={`tab-button ${activeTab === "layout" ? "active" : ""}`}
                onClick={() => setActiveTab("layout")}
                data-oid="iphq1ef"
              >
                布局配置
              </button>
            </div>

            <div className="config-edit-content" data-oid="c-3hywa">
              {activeTab === "filters" && (
                <FilterConfigPanel
                  filters={editingConfig.filters}
                  onChange={(filters) => handleConfigUpdate({ filters })}
                  data-oid="calh6cj"
                />
              )}
              {activeTab === "columns" && (
                <ColumnConfigPanel
                  columns={editingConfig.columns}
                  onChange={(columns) => handleConfigUpdate({ columns })}
                  data-oid="5l3wxni"
                />
              )}
              {activeTab === "actions" && (
                <ActionConfigPanel
                  actions={editingConfig.actions}
                  onChange={(actions) => handleConfigUpdate({ actions })}
                  data-oid="m2qfer4"
                />
              )}
              {activeTab === "layout" && (
                <LayoutConfigPanel
                  layout={editingConfig.layout}
                  onChange={handleLayoutChange}
                  data-oid="6xd:001"
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
          data-oid="z.p0:4_"
        />
      )}

      {/* 导入配置对话框 */}
      {showImportDialog && (
        <ImportConfigDialog
          onConfirm={handleImportConfig}
          onCancel={() => setShowImportDialog(false)}
          data-oid=":uxbepo"
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

const FilterConfigPanel: React.FC<FilterConfigPanelProps> = ({
  filters,
  onChange,
}) => {
  const handleFilterChange = (
    index: number,
    updates: Partial<FilterConfig>,
  ) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], ...updates };
    onChange(newFilters);
  };

  const handleAddFilter = () => {
    const newFilter: FilterConfig = {
      id: `filter_${Date.now()}`,
      name: "新筛选器",
      type: "search",
      field: "",
      visible: true,
    };
    onChange([...filters, newFilter]);
  };

  const handleRemoveFilter = (index: number) => {
    const newFilters = filters.filter((_, i) => i !== index);
    onChange(newFilters);
  };

  return (
    <div className="filter-config-panel" data-oid=".x1nva.">
      <div className="panel-header" data-oid="8z616im">
        <h4 data-oid="i-k8lzw">筛选器配置</h4>
        <button
          className="btn btn-primary"
          onClick={handleAddFilter}
          data-oid="nc5j1ly"
        >
          添加筛选器
        </button>
      </div>
      <div className="filter-list" data-oid="debcvrn">
        {filters.map((filter, index) => (
          <div key={filter.id} className="filter-item" data-oid="qrq63e-">
            <div className="filter-item-header" data-oid="u68s6pj">
              <input
                type="text"
                value={filter.name}
                onChange={(e) =>
                  handleFilterChange(index, { name: e.target.value })
                }
                className="filter-name-input"
                data-oid="n5s408r"
              />

              <label className="checkbox-label" data-oid="l1a-n2:">
                <input
                  type="checkbox"
                  checked={filter.visible}
                  onChange={(e) =>
                    handleFilterChange(index, { visible: e.target.checked })
                  }
                  data-oid="h4h:d8p"
                />
                显示
              </label>
              <button
                className="btn btn-sm btn-danger"
                onClick={() => handleRemoveFilter(index)}
                data-oid="nbgs8qr"
              >
                删除
              </button>
            </div>
            <div className="filter-item-content" data-oid="_v-mlz5">
              <div className="form-group" data-oid="84p-eif">
                <label data-oid="lwn9ixk">类型:</label>
                <select
                  value={filter.type}
                  onChange={(e) =>
                    handleFilterChange(index, { type: e.target.value as any })
                  }
                  data-oid="l_w5wlr"
                >
                  <option value="search" data-oid="bbe:cdi">
                    搜索
                  </option>
                  <option value="select" data-oid="uqvz_i6">
                    单选
                  </option>
                  <option value="multiselect" data-oid="1ae81:t">
                    多选
                  </option>
                  <option value="date" data-oid="q9-m24:">
                    日期
                  </option>
                  <option value="range" data-oid=".r26-nh">
                    范围
                  </option>
                </select>
              </div>
              <div className="form-group" data-oid="c4.p0m7">
                <label data-oid="pwjxxs7">字段:</label>
                <input
                  type="text"
                  value={filter.field}
                  onChange={(e) =>
                    handleFilterChange(index, { field: e.target.value })
                  }
                  data-oid="7ollgt."
                />
              </div>
              {filter.type === "search" && (
                <div className="form-group" data-oid="rbfv.7z">
                  <label data-oid="-t-6ldi">占位符:</label>
                  <input
                    type="text"
                    value={filter.placeholder || ""}
                    onChange={(e) =>
                      handleFilterChange(index, { placeholder: e.target.value })
                    }
                    data-oid="s5t7z_c"
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

const ColumnConfigPanel: React.FC<ColumnConfigPanelProps> = ({
  columns,
  onChange,
}) => {
  const handleColumnChange = (
    index: number,
    updates: Partial<ColumnConfig>,
  ) => {
    const newColumns = [...columns];
    newColumns[index] = { ...newColumns[index], ...updates };
    onChange(newColumns);
  };

  const handleAddColumn = () => {
    const newColumn: ColumnConfig = {
      id: `column_${Date.now()}`,
      field: "",
      label: "新列",
      sortable: true,
      visible: true,
      align: "left",
    };
    onChange([...columns, newColumn]);
  };

  const handleRemoveColumn = (index: number) => {
    const newColumns = columns.filter((_, i) => i !== index);
    onChange(newColumns);
  };

  return (
    <div className="column-config-panel" data-oid="3j7vy2a">
      <div className="panel-header" data-oid="luv6l-l">
        <h4 data-oid="jg9g5e-">列配置</h4>
        <button
          className="btn btn-primary"
          onClick={handleAddColumn}
          data-oid="2:bo5ne"
        >
          添加列
        </button>
      </div>
      <div className="column-list" data-oid="dpt3idk">
        {columns.map((column, index) => (
          <div key={column.id} className="column-item" data-oid="a-2nmcs">
            <div className="column-item-header" data-oid="ya2mo23">
              <input
                type="text"
                value={column.label}
                onChange={(e) =>
                  handleColumnChange(index, { label: e.target.value })
                }
                className="column-label-input"
                data-oid="-zhqyq8"
              />

              <label className="checkbox-label" data-oid="23kw0pz">
                <input
                  type="checkbox"
                  checked={column.visible}
                  onChange={(e) =>
                    handleColumnChange(index, { visible: e.target.checked })
                  }
                  data-oid="5.vx_h0"
                />
                显示
              </label>
              <button
                className="btn btn-sm btn-danger"
                onClick={() => handleRemoveColumn(index)}
                data-oid="1iwl43i"
              >
                删除
              </button>
            </div>
            <div className="column-item-content" data-oid="3bw2npe">
              <div className="form-group" data-oid="3t3ipdd">
                <label data-oid="1g42vc6">字段:</label>
                <input
                  type="text"
                  value={column.field}
                  onChange={(e) =>
                    handleColumnChange(index, { field: e.target.value })
                  }
                  data-oid="-r77a_1"
                />
              </div>
              <div className="form-group" data-oid="x87umd-">
                <label data-oid="ny8vskt">宽度:</label>
                <input
                  type="text"
                  value={column.width || ""}
                  onChange={(e) =>
                    handleColumnChange(index, { width: e.target.value })
                  }
                  placeholder="如: 100px, 20%, auto"
                  data-oid="i0l7qj7"
                />
              </div>
              <div className="form-group" data-oid="-5sh9dm">
                <label data-oid="2-9alc6">对齐:</label>
                <select
                  value={column.align}
                  onChange={(e) =>
                    handleColumnChange(index, { align: e.target.value as any })
                  }
                  data-oid=".s9zcbz"
                >
                  <option value="left" data-oid="2cjrdui">
                    左对齐
                  </option>
                  <option value="center" data-oid="h5ejrw_">
                    居中
                  </option>
                  <option value="right" data-oid="v0vey4g">
                    右对齐
                  </option>
                </select>
              </div>
              <div className="form-group" data-oid=":2:63:0">
                <label className="checkbox-label" data-oid="1l60dfw">
                  <input
                    type="checkbox"
                    checked={column.sortable}
                    onChange={(e) =>
                      handleColumnChange(index, { sortable: e.target.checked })
                    }
                    data-oid="m6oxbbm"
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

const ActionConfigPanel: React.FC<ActionConfigPanelProps> = ({
  actions,
  onChange,
}) => {
  const handleActionChange = (
    index: number,
    updates: Partial<ActionConfig>,
  ) => {
    const newActions = [...actions];
    newActions[index] = { ...newActions[index], ...updates };
    onChange(newActions);
  };

  const handleAddAction = () => {
    const newAction: ActionConfig = {
      id: `action_${Date.now()}`,
      label: "新操作",
      type: "secondary",
      position: "row",
      visible: true,
      onClick: (selectedItems) => {
        console.log("操作被点击，选中的项目:", selectedItems);
      },
    };
    onChange([...actions, newAction]);
  };

  const handleRemoveAction = (index: number) => {
    const newActions = actions.filter((_, i) => i !== index);
    onChange(newActions);
  };

  return (
    <div className="action-config-panel" data-oid=":zb0s:0">
      <div className="panel-header" data-oid="8gwhmw:">
        <h4 data-oid="axor90e">操作配置</h4>
        <button
          className="btn btn-primary"
          onClick={handleAddAction}
          data-oid="ppj:_:v"
        >
          添加操作
        </button>
      </div>
      <div className="action-list" data-oid="ioq53d1">
        {actions.map((action, index) => (
          <div key={action.id} className="action-item" data-oid="anp3az5">
            <div className="action-item-header" data-oid="d1ypm64">
              <input
                type="text"
                value={action.label}
                onChange={(e) =>
                  handleActionChange(index, { label: e.target.value })
                }
                className="action-label-input"
                data-oid=".9c.9ms"
              />

              <label className="checkbox-label" data-oid="tg_852w">
                <input
                  type="checkbox"
                  checked={action.visible}
                  onChange={(e) =>
                    handleActionChange(index, { visible: e.target.checked })
                  }
                  data-oid=".k32e7t"
                />
                显示
              </label>
              <button
                className="btn btn-sm btn-danger"
                onClick={() => handleRemoveAction(index)}
                data-oid="ugzc72m"
              >
                删除
              </button>
            </div>
            <div className="action-item-content" data-oid="k2xh6de">
              <div className="form-group" data-oid="lyn:1f_">
                <label data-oid="j0i6zi7">类型:</label>
                <select
                  value={action.type}
                  onChange={(e) =>
                    handleActionChange(index, { type: e.target.value as any })
                  }
                  data-oid="oz-8z2v"
                >
                  <option value="primary" data-oid="rur-y1o">
                    主要
                  </option>
                  <option value="secondary" data-oid="50avz31">
                    次要
                  </option>
                  <option value="success" data-oid="efip476">
                    成功
                  </option>
                  <option value="warning" data-oid="u735.qd">
                    警告
                  </option>
                  <option value="danger" data-oid="0t_8ui.">
                    危险
                  </option>
                </select>
              </div>
              <div className="form-group" data-oid="5p4u215">
                <label data-oid="rcdmu9v">位置:</label>
                <select
                  value={action.position}
                  onChange={(e) =>
                    handleActionChange(index, {
                      position: e.target.value as any,
                    })
                  }
                  data-oid="jv2fggp"
                >
                  <option value="header" data-oid="-e5ci18">
                    头部
                  </option>
                  <option value="row" data-oid="z86dmyg">
                    行内
                  </option>
                  <option value="footer" data-oid="-s70wc.">
                    底部
                  </option>
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

const LayoutConfigPanel: React.FC<LayoutConfigPanelProps> = ({
  layout,
  onChange,
}) => {
  return (
    <div className="layout-config-panel" data-oid="rh-84nw">
      <h4 data-oid="p79cd-w">布局配置</h4>
      <div className="layout-config-content" data-oid="ay-bf5q">
        <div className="form-group" data-oid="0m6k400">
          <label data-oid="cqdx:2h">布局类型:</label>
          <select
            value={layout.type}
            onChange={(e) => onChange({ type: e.target.value as any })}
            data-oid="-h.8s--"
          >
            <option value="table" data-oid="988dajw">
              表格
            </option>
            <option value="card" data-oid="dxrzhez">
              卡片
            </option>
            <option value="list" data-oid="xr35fz8">
              列表
            </option>
          </select>
        </div>
        <div className="form-group" data-oid="xuuiq7h">
          <label data-oid="hmkz5:u">密度:</label>
          <select
            value={layout.density}
            onChange={(e) =>
              onChange({
                density: e.target.value as
                  | "compact"
                  | "comfortable"
                  | "spacious",
              })
            }
            data-oid="317p5b:"
          >
            <option value="compact" data-oid="ou9sgy2">
              紧凑
            </option>
            <option value="comfortable" data-oid="37laazg">
              舒适
            </option>
            <option value="spacious" data-oid="idq6k0u">
              宽松
            </option>
          </select>
        </div>
        <div className="form-group" data-oid="godxfsy">
          <label data-oid="1jlu6lu">页面大小:</label>
          <input
            type="number"
            value={layout.pageSize}
            onChange={(e) => onChange({ pageSize: parseInt(e.target.value) })}
            min="1"
            max="200"
            data-oid="wwi_qcm"
          />
        </div>
        <div className="form-group" data-oid="uxs1zvy">
          <label data-oid="rhmyd00">选择模式:</label>
          <select
            value={layout.selectionMode}
            onChange={(e) => onChange({ selectionMode: e.target.value as any })}
            data-oid="h8ell2x"
          >
            <option value="none" data-oid="f.5:kq_">
              无选择
            </option>
            <option value="single" data-oid="d7cyr4w">
              单选
            </option>
            <option value="multiple" data-oid="8m281qq">
              多选
            </option>
          </select>
        </div>
        <div className="form-group checkbox-group" data-oid="jge.g7c">
          <label className="checkbox-label" data-oid="vinmt-p">
            <input
              type="checkbox"
              checked={layout.showHeader}
              onChange={(e) => onChange({ showHeader: e.target.checked })}
              data-oid="blab4--"
            />
            显示头部
          </label>
          <label className="checkbox-label" data-oid="8s1gcvo">
            <input
              type="checkbox"
              checked={layout.showFooter}
              onChange={(e) => onChange({ showFooter: e.target.checked })}
              data-oid="u3ox-4e"
            />
            显示底部
          </label>
          <label className="checkbox-label" data-oid="uqipjxk">
            <input
              type="checkbox"
              checked={layout.showPagination}
              onChange={(e) => onChange({ showPagination: e.target.checked })}
              data-oid=".wi.l2_"
            />
            显示分页
          </label>
          {layout.expandable !== undefined && (
            <label className="checkbox-label" data-oid="d.ke9jg">
              <input
                type="checkbox"
                checked={layout.expandable}
                onChange={(e) => onChange({ expandable: e.target.checked })}
                data-oid="6gq6tbq"
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
  onConfirm: (
    config: Omit<KnowledgeConfig, "id" | "createdAt" | "updatedAt">,
  ) => void;
  onCancel: () => void;
}

const CreateConfigDialog: React.FC<CreateConfigDialogProps> = ({
  onConfirm,
  onCancel,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [preset, setPreset] = useState<ConfigPreset>("standard");

  const handleConfirm = () => {
    if (!name.trim()) {
      alert("请输入配置名称");
      return;
    }

    const template = knowledgeConfigService.getPresetTemplate(preset);
    onConfirm({
      ...template,
      name: name.trim(),
      description: description.trim() || template.description,
    });
  };

  return (
    <div className="dialog-overlay" data-oid="juvo7az">
      <div className="dialog" data-oid="_m1d873">
        <div className="dialog-header" data-oid="_3l3fek">
          <h3 data-oid="c:l41lj">创建新配置</h3>
        </div>
        <div className="dialog-content" data-oid="rnlu7jg">
          <div className="form-group" data-oid="2w3in1b">
            <label data-oid="gv9-ng2">配置名称:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入配置名称"
              autoFocus
              data-oid="69l-d-8"
            />
          </div>
          <div className="form-group" data-oid="xlg.itq">
            <label data-oid="arrkyvl">配置描述:</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="输入配置描述（可选）"
              rows={3}
              data-oid="h21_z_g"
            />
          </div>
          <div className="form-group" data-oid="ea--2::">
            <label data-oid="kuhrg6w">基于预设:</label>
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value as ConfigPreset)}
              data-oid="ufju9om"
            >
              <option value="minimal" data-oid="veekd7z">
                极简配置
              </option>
              <option value="standard" data-oid="gtn2_1a">
                标准配置
              </option>
              <option value="advanced" data-oid="iewkb4w">
                高级配置
              </option>
              <option value="custom" data-oid="yg.25cu">
                自定义配置
              </option>
            </select>
          </div>
        </div>
        <div className="dialog-footer" data-oid="o25f5hu">
          <button
            className="btn btn-secondary"
            onClick={onCancel}
            data-oid="t2s3p1f"
          >
            取消
          </button>
          <button
            className="btn btn-primary"
            onClick={handleConfirm}
            data-oid="kdss17h"
          >
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

const ImportConfigDialog: React.FC<ImportConfigDialogProps> = ({
  onConfirm,
  onCancel,
}) => {
  const [configJson, setConfigJson] = useState("");

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
      alert("请选择配置文件或输入配置JSON");
      return;
    }

    try {
      JSON.parse(configJson); // 验证JSON格式
      onConfirm(configJson);
    } catch (error) {
      alert("配置文件格式错误，请检查JSON格式");
    }
  };

  return (
    <div className="dialog-overlay" data-oid="c3x_z:f">
      <div className="dialog" data-oid="8h.j4-f">
        <div className="dialog-header" data-oid="xbax5lh">
          <h3 data-oid="hhbzuxn">导入配置</h3>
        </div>
        <div className="dialog-content" data-oid="3qhxg4o">
          <div className="form-group" data-oid="3ndpzy0">
            <label data-oid="3sipdew">选择配置文件:</label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              data-oid="nj--obq"
            />
          </div>
          <div className="form-group" data-oid="cq5hu2o">
            <label data-oid="mms778i">或直接输入配置JSON:</label>
            <textarea
              value={configJson}
              onChange={(e) => setConfigJson(e.target.value)}
              placeholder="粘贴配置JSON内容"
              rows={10}
              className="json-textarea"
              data-oid="q4-x-aq"
            />
          </div>
        </div>
        <div className="dialog-footer" data-oid="e:n0:i5">
          <button
            className="btn btn-secondary"
            onClick={onCancel}
            data-oid="s86vjr2"
          >
            取消
          </button>
          <button
            className="btn btn-primary"
            onClick={handleConfirm}
            data-oid="lduwzq3"
          >
            导入
          </button>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeConfigManager;
