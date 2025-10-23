import React, { useState, useCallback, useEffect } from "react";
import {
  KnowledgeConfig,
  ConfigPreset,
  FilterConfig,
  ColumnConfig,
  ActionConfig,
} from "../../types/knowledgeConfig";
import { useKnowledgeConfig } from "../../hooks/useKnowledgeConfig";
import "./KnowledgeConfigManager.css";

// 筛选器配置组件
const FilterConfigComponent: React.FC<{
  filters: FilterConfig[];
  onChange: (filters: FilterConfig[]) => void;
}> = ({ filters, onChange }) => {
  const addFilter = useCallback(() => {
    const newFilter: FilterConfig = {
      id: `filter_${Date.now()}`,
      name: "新筛选器",
      field: "",
      type: "search",
      visible: true,
      placeholder: "请输入...",
    };
    onChange([...filters, newFilter]);
  }, [filters, onChange]);

  const updateFilter = useCallback(
    (index: number, updates: Partial<FilterConfig>) => {
      const newFilters = [...filters];
      newFilters[index] = { ...newFilters[index], ...updates };
      onChange(newFilters);
    },
    [filters, onChange],
  );

  const removeFilter = useCallback(
    (index: number) => {
      onChange(filters.filter((_, i) => i !== index));
    },
    [filters, onChange],
  );

  return (
    <div className="config-section" data-oid="oa0od2x">
      <div className="config-section-header" data-oid="8idqbpn">
        <h3 data-oid="1_2j1:a">筛选器配置</h3>
        <button className="add-btn" onClick={addFilter} data-oid="xq5-ssk">
          + 添加筛选器
        </button>
      </div>

      <div className="filter-configs" data-oid="zhh2l1u">
        {filters.map((filter, index) => (
          <div
            key={filter.id}
            className="filter-config-item"
            data-oid="ybfl4qh"
          >
            <div className="config-row" data-oid="kpg9vz.">
              <div className="config-field" data-oid="wk:l:.k">
                <label data-oid="jhl.6ji">名称</label>
                <input
                  type="text"
                  value={filter.name}
                  onChange={(e) =>
                    updateFilter(index, { name: e.target.value })
                  }
                  data-oid="qft60:i"
                />
              </div>

              <div className="config-field" data-oid="w327lfb">
                <label data-oid="9upuf1z">字段</label>
                <input
                  type="text"
                  value={filter.field}
                  placeholder="如: name, category.type"
                  onChange={(e) =>
                    updateFilter(index, { field: e.target.value })
                  }
                  data-oid="s03t.ts"
                />
              </div>

              <div className="config-field" data-oid="61s31vd">
                <label data-oid="c6ur5i1">类型</label>
                <select
                  value={filter.type}
                  onChange={(e) =>
                    updateFilter(index, {
                      type: e.target.value as FilterConfig["type"],
                    })
                  }
                  data-oid="z3-rb4."
                >
                  <option value="search" data-oid="d69e1ex">
                    搜索框
                  </option>
                  <option value="select" data-oid="hfcbb8b">
                    下拉选择
                  </option>
                  <option value="multiselect" data-oid="2y8salz">
                    多选
                  </option>
                </select>
              </div>

              <div className="config-field" data-oid="094gnft">
                <label data-oid=".n2k--c">
                  <input
                    type="checkbox"
                    checked={filter.visible}
                    onChange={(e) =>
                      updateFilter(index, { visible: e.target.checked })
                    }
                    data-oid="rzd5btc"
                  />
                  显示
                </label>
              </div>

              <button
                className="remove-btn"
                onClick={() => removeFilter(index)}
                data-oid="qrqmryh"
              >
                删除
              </button>
            </div>

            {filter.type === "search" && (
              <div className="config-row" data-oid="785ymjt">
                <div className="config-field" data-oid="vdfb9sg">
                  <label data-oid="r8aph5p">占位符</label>
                  <input
                    type="text"
                    value={filter.placeholder || ""}
                    onChange={(e) =>
                      updateFilter(index, { placeholder: e.target.value })
                    }
                    data-oid="irlx0ee"
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
      label: "新列",
      field: "",
      visible: true,
      sortable: false,
      align: "left",
    };
    onChange([...columns, newColumn]);
  }, [columns, onChange]);

  const updateColumn = useCallback(
    (index: number, updates: Partial<ColumnConfig>) => {
      const newColumns = [...columns];
      newColumns[index] = { ...newColumns[index], ...updates };
      onChange(newColumns);
    },
    [columns, onChange],
  );

  const removeColumn = useCallback(
    (index: number) => {
      onChange(columns.filter((_, i) => i !== index));
    },
    [columns, onChange],
  );

  const moveColumn = useCallback(
    (fromIndex: number, toIndex: number) => {
      const newColumns = [...columns];
      const [movedColumn] = newColumns.splice(fromIndex, 1);
      newColumns.splice(toIndex, 0, movedColumn);
      onChange(newColumns);
    },
    [columns, onChange],
  );

  return (
    <div className="config-section" data-oid="u21j1pm">
      <div className="config-section-header" data-oid=".mgg0j1">
        <h3 data-oid="sxymg.v">列配置</h3>
        <button className="add-btn" onClick={addColumn} data-oid=".qlmt5k">
          + 添加列
        </button>
      </div>

      <div className="column-configs" data-oid="v9emrk:">
        {columns.map((column, index) => (
          <div
            key={column.id}
            className="column-config-item"
            data-oid="hf5p2ve"
          >
            <div className="config-row" data-oid="7exhkd1">
              <div className="column-order" data-oid="2ij9hnc">
                <button
                  disabled={index === 0}
                  onClick={() => moveColumn(index, index - 1)}
                  data-oid="7nm2li4"
                >
                  ↑
                </button>
                <span data-oid=".q8d1je">{index + 1}</span>
                <button
                  disabled={index === columns.length - 1}
                  onClick={() => moveColumn(index, index + 1)}
                  data-oid="ekp44aw"
                >
                  ↓
                </button>
              </div>

              <div className="config-field" data-oid="9h9ls6t">
                <label data-oid="khbnr-z">标题</label>
                <input
                  type="text"
                  value={column.label}
                  onChange={(e) =>
                    updateColumn(index, { label: e.target.value })
                  }
                  data-oid="zfei2:w"
                />
              </div>

              <div className="config-field" data-oid="bccr.5t">
                <label data-oid="kkn3dck">字段</label>
                <input
                  type="text"
                  value={column.field}
                  placeholder="如: name, category.type"
                  onChange={(e) =>
                    updateColumn(index, { field: e.target.value })
                  }
                  data-oid="31wgusf"
                />
              </div>

              <div className="config-field" data-oid="ch4e_xq">
                <label data-oid="vccguml">宽度</label>
                <input
                  type="text"
                  value={column.width || ""}
                  placeholder="如: 100px, 20%"
                  onChange={(e) =>
                    updateColumn(index, { width: e.target.value })
                  }
                  data-oid="fny4xgg"
                />
              </div>

              <div className="config-field" data-oid="h1rop-j">
                <label data-oid="37.ea83">对齐</label>
                <select
                  value={column.align || "left"}
                  onChange={(e) =>
                    updateColumn(index, {
                      align: e.target.value as ColumnConfig["align"],
                    })
                  }
                  data-oid="oka6cjf"
                >
                  <option value="left" data-oid="u6rraaj">
                    左对齐
                  </option>
                  <option value="center" data-oid="5j-g3si">
                    居中
                  </option>
                  <option value="right" data-oid="jswnu77">
                    右对齐
                  </option>
                </select>
              </div>

              <div className="config-checkboxes" data-oid="lcme.-y">
                <label data-oid="0eu8rtc">
                  <input
                    type="checkbox"
                    checked={column.visible}
                    onChange={(e) =>
                      updateColumn(index, { visible: e.target.checked })
                    }
                    data-oid="68g7z-p"
                  />
                  显示
                </label>

                <label data-oid="b475_za">
                  <input
                    type="checkbox"
                    checked={column.sortable}
                    onChange={(e) =>
                      updateColumn(index, { sortable: e.target.checked })
                    }
                    data-oid="vqgr-2-"
                  />
                  可排序
                </label>
              </div>

              <button
                className="remove-btn"
                onClick={() => removeColumn(index)}
                data-oid="-93az2."
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
      label: "新操作",
      type: "secondary",
      position: "row",
      visible: true,
      onClick: () => console.log("Action clicked"),
    };
    onChange([...actions, newAction]);
  }, [actions, onChange]);

  const updateAction = useCallback(
    (index: number, updates: Partial<ActionConfig>) => {
      const newActions = [...actions];
      newActions[index] = { ...newActions[index], ...updates };
      onChange(newActions);
    },
    [actions, onChange],
  );

  const removeAction = useCallback(
    (index: number) => {
      onChange(actions.filter((_, i) => i !== index));
    },
    [actions, onChange],
  );

  return (
    <div className="config-section" data-oid="p8uywqo">
      <div className="config-section-header" data-oid="pl3yv7_">
        <h3 data-oid="vj_.ghr">操作配置</h3>
        <button className="add-btn" onClick={addAction} data-oid="jf0rfl0">
          + 添加操作
        </button>
      </div>

      <div className="action-configs" data-oid=".-onq54">
        {actions.map((action, index) => (
          <div
            key={action.id}
            className="action-config-item"
            data-oid="oodv66x"
          >
            <div className="config-row" data-oid="1hun77i">
              <div className="config-field" data-oid="yma6_fp">
                <label data-oid="v7-ulae">标签</label>
                <input
                  type="text"
                  value={action.label}
                  onChange={(e) =>
                    updateAction(index, { label: e.target.value })
                  }
                  data-oid="y-z0ivl"
                />
              </div>

              <div className="config-field" data-oid="_q8l.ap">
                <label data-oid="xpztwug">类型</label>
                <select
                  value={action.type}
                  onChange={(e) =>
                    updateAction(index, {
                      type: e.target.value as ActionConfig["type"],
                    })
                  }
                  data-oid="all.q9f"
                >
                  <option value="primary" data-oid="_ur2gvm">
                    主要
                  </option>
                  <option value="secondary" data-oid="hst8q:i">
                    次要
                  </option>
                  <option value="success" data-oid="35ot9r6">
                    成功
                  </option>
                  <option value="warning" data-oid="h9qw9_i">
                    警告
                  </option>
                  <option value="danger" data-oid="m5d35ml">
                    危险
                  </option>
                </select>
              </div>

              <div className="config-field" data-oid="wx596ie">
                <label data-oid="aa91pz:">位置</label>
                <select
                  value={action.position}
                  onChange={(e) =>
                    updateAction(index, {
                      position: e.target.value as ActionConfig["position"],
                    })
                  }
                  data-oid="qj-b-a-"
                >
                  <option value="header" data-oid="14dls_g">
                    头部
                  </option>
                  <option value="row" data-oid="k117p0z">
                    行内
                  </option>
                  <option value="footer" data-oid="e8_l.m:">
                    底部
                  </option>
                </select>
              </div>

              <div className="config-field" data-oid="0x_np1k">
                <label data-oid="373h0r8">图标</label>
                <input
                  type="text"
                  value={action.icon || ""}
                  placeholder="如: edit, delete"
                  onChange={(e) =>
                    updateAction(index, { icon: e.target.value })
                  }
                  data-oid="zlpdx:."
                />
              </div>

              <div className="config-field" data-oid="d0s9v11">
                <label data-oid="vqcmk83">
                  <input
                    type="checkbox"
                    checked={action.visible}
                    onChange={(e) =>
                      updateAction(index, { visible: e.target.checked })
                    }
                    data-oid="dfk4lzq"
                  />
                  显示
                </label>
              </div>

              <button
                className="remove-btn"
                onClick={() => removeAction(index)}
                data-oid="9xwwp.r"
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
    validateConfig,
  } = useKnowledgeConfig();

  const [currentConfig, setCurrentConfig] = useState<KnowledgeConfig | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<
    "basic" | "filters" | "columns" | "actions" | "layout"
  >("basic");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // 获取当前激活的配置
  useEffect(() => {
    const activeConfig = configs.find((c) => c.id === activeConfigId);
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
  const handleApplyPreset = useCallback(
    async (presetId: string) => {
      if (!currentConfig) return;

      const updatedConfig = await applyPreset(currentConfig.id, presetId);
      if (updatedConfig) {
        setCurrentConfig({ ...updatedConfig });
      }
    },
    [currentConfig, applyPreset],
  );

  // 导出配置
  const handleExport = useCallback(() => {
    if (!currentConfig) return;

    const exported = exportConfig(currentConfig.id);
    if (exported) {
      const blob = new Blob([exported], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `knowledge-config-${currentConfig.name}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [currentConfig, exportConfig]);

  // 导入配置
  const handleImport = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
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
          console.error("导入配置失败:", error);
          alert("导入配置失败，请检查文件格式");
        }
      };
      reader.readAsText(file);
    },
    [importConfig],
  );

  if (!currentConfig) {
    return (
      <div className="config-manager-loading" data-oid="s0glex_">
        加载配置中...
      </div>
    );
  }

  return (
    <div className="knowledge-config-manager" data-oid=".o77xg_">
      <div className="config-manager-header" data-oid="r:610m.">
        <div className="config-manager-title" data-oid="qq494nx">
          <h2 data-oid="hrxmj3k">知识点配置管理器</h2>
          <span className="config-name" data-oid="8tqe9s4">
            当前配置: {currentConfig.name}
          </span>
        </div>

        <div className="config-manager-actions" data-oid="4n.ew5_">
          <div className="preset-actions" data-oid="mais07h">
            <label data-oid="4btfylx">应用预设:</label>
            <select
              onChange={(e) =>
                e.target.value && handleApplyPreset(e.target.value)
              }
              data-oid="4:4ulla"
            >
              <option value="" data-oid="p01u-ks">
                选择预设
              </option>
              {presets.map((preset) => (
                <option key={preset.id} value={preset.id} data-oid="-fc5wpy">
                  {preset.name}
                </option>
              ))}
            </select>
          </div>

          <button
            className="export-btn"
            onClick={handleExport}
            data-oid="7:sn7n8"
          >
            导出配置
          </button>

          <label className="import-btn" data-oid="s6z:8_e">
            导入配置
            <input
              type="file"
              accept=".json"
              style={{ display: "none" }}
              onChange={handleImport}
              data-oid="edqcfmt"
            />
          </label>

          <button
            className="save-btn primary"
            onClick={handleSave}
            data-oid="4q9g0ul"
          >
            保存配置
          </button>

          {onClose && (
            <button className="close-btn" onClick={onClose} data-oid=":l-6zb2">
              关闭
            </button>
          )}
        </div>
      </div>

      {validationErrors.length > 0 && (
        <div className="validation-errors" data-oid="qy9loij">
          <h4 data-oid="ya1.3ov">配置验证错误:</h4>
          <ul data-oid="dla0tj4">
            {validationErrors.map((error, index) => (
              <li key={index} data-oid="-:w7rzp">
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="config-manager-content" data-oid="2a7od_e">
        <div className="config-tabs" data-oid="hggzmu2">
          <button
            className={`tab-btn ${activeTab === "basic" ? "active" : ""}`}
            onClick={() => setActiveTab("basic")}
            data-oid="wkwmya5"
          >
            基本设置
          </button>
          <button
            className={`tab-btn ${activeTab === "filters" ? "active" : ""}`}
            onClick={() => setActiveTab("filters")}
            data-oid="mhgvo2o"
          >
            筛选器
          </button>
          <button
            className={`tab-btn ${activeTab === "columns" ? "active" : ""}`}
            onClick={() => setActiveTab("columns")}
            data-oid="lsw2itm"
          >
            列配置
          </button>
          <button
            className={`tab-btn ${activeTab === "actions" ? "active" : ""}`}
            onClick={() => setActiveTab("actions")}
            data-oid="7gwjcqt"
          >
            操作配置
          </button>
          <button
            className={`tab-btn ${activeTab === "layout" ? "active" : ""}`}
            onClick={() => setActiveTab("layout")}
            data-oid="nmgl2ag"
          >
            布局设置
          </button>
        </div>

        <div className="config-tab-content" data-oid="5z8dway">
          {activeTab === "basic" && (
            <div className="config-section" data-oid="8kvx8z_">
              <h3 data-oid="k7pmvv:">基本设置</h3>
              <div className="config-row" data-oid="0:1x87k">
                <div className="config-field" data-oid="drvt6fo">
                  <label data-oid="oz-.ltl">配置名称</label>
                  <input
                    type="text"
                    value={currentConfig.name}
                    onChange={(e) =>
                      setCurrentConfig({
                        ...currentConfig,
                        name: e.target.value,
                      })
                    }
                    data-oid="i7l8c15"
                  />
                </div>

                <div className="config-field" data-oid="udrxtyt">
                  <label data-oid="b3jxy3p">描述</label>
                  <textarea
                    value={currentConfig.description || ""}
                    onChange={(e) =>
                      setCurrentConfig({
                        ...currentConfig,
                        description: e.target.value,
                      })
                    }
                    data-oid="m81qq42"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "filters" && (
            <FilterConfigComponent
              filters={currentConfig.filters}
              onChange={(filters) =>
                setCurrentConfig({
                  ...currentConfig,
                  filters,
                })
              }
              data-oid="nyilr8i"
            />
          )}

          {activeTab === "columns" && (
            <ColumnConfigComponent
              columns={currentConfig.columns}
              onChange={(columns) =>
                setCurrentConfig({
                  ...currentConfig,
                  columns,
                })
              }
              data-oid="dp.kzpi"
            />
          )}

          {activeTab === "actions" && (
            <ActionConfigComponent
              actions={currentConfig.actions}
              onChange={(actions) =>
                setCurrentConfig({
                  ...currentConfig,
                  actions,
                })
              }
              data-oid="_7mpyf6"
            />
          )}

          {activeTab === "layout" && (
            <div className="config-section" data-oid="av6dy6n">
              <h3 data-oid="z.z3vi4">布局设置</h3>

              <div className="config-row" data-oid="7d_y87y">
                <div className="config-field" data-oid="0n6w_cx">
                  <label data-oid="1.4-aep">选择模式</label>
                  <select
                    value={currentConfig.layout.selectionMode}
                    onChange={(e) =>
                      setCurrentConfig({
                        ...currentConfig,
                        layout: {
                          ...currentConfig.layout,
                          selectionMode: e.target.value as
                            | "single"
                            | "multiple"
                            | "none",
                        },
                      })
                    }
                    data-oid="ydzn:6z"
                  >
                    <option value="none" data-oid="yl7ila-">
                      无选择
                    </option>
                    <option value="single" data-oid="wr45usx">
                      单选
                    </option>
                    <option value="multiple" data-oid="lcejfvg">
                      多选
                    </option>
                  </select>
                </div>

                <div className="config-field" data-oid="8cui_in">
                  <label data-oid="jt34sra">密度</label>
                  <select
                    value={currentConfig.layout.density}
                    onChange={(e) =>
                      setCurrentConfig({
                        ...currentConfig,
                        layout: {
                          ...currentConfig.layout,
                          density: e.target.value as
                            | "compact"
                            | "standard"
                            | "comfortable",
                        },
                      })
                    }
                    data-oid="imroyg7"
                  >
                    <option value="compact" data-oid="u9j6wgd">
                      紧凑
                    </option>
                    <option value="standard" data-oid="nt-mtad">
                      标准
                    </option>
                    <option value="comfortable" data-oid="_gr7des">
                      舒适
                    </option>
                  </select>
                </div>

                <div className="config-field" data-oid="2q2t24j">
                  <label data-oid="adf.zy8">每页显示</label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={currentConfig.layout.pageSize}
                    onChange={(e) =>
                      setCurrentConfig({
                        ...currentConfig,
                        layout: {
                          ...currentConfig.layout,
                          pageSize: Number(e.target.value),
                        },
                      })
                    }
                    data-oid="lroelpl"
                  />
                </div>
              </div>

              <div className="config-row" data-oid="p66zcvj">
                <div className="config-checkboxes" data-oid="7wrdc7w">
                  <label data-oid="09pbyyz">
                    <input
                      type="checkbox"
                      checked={currentConfig.layout.showHeader}
                      onChange={(e) =>
                        setCurrentConfig({
                          ...currentConfig,
                          layout: {
                            ...currentConfig.layout,
                            showHeader: e.target.checked,
                          },
                        })
                      }
                      data-oid="_pasbfu"
                    />
                    显示表头
                  </label>

                  <label data-oid="6ywlwbw">
                    <input
                      type="checkbox"
                      checked={currentConfig.layout.showFooter}
                      onChange={(e) =>
                        setCurrentConfig({
                          ...currentConfig,
                          layout: {
                            ...currentConfig.layout,
                            showFooter: e.target.checked,
                          },
                        })
                      }
                      data-oid=":xl2.sv"
                    />
                    显示底部
                  </label>

                  <label data-oid="bjhn9dp">
                    <input
                      type="checkbox"
                      checked={currentConfig.layout.showPagination}
                      onChange={(e) =>
                        setCurrentConfig({
                          ...currentConfig,
                          layout: {
                            ...currentConfig.layout,
                            showPagination: e.target.checked,
                          },
                        })
                      }
                      data-oid="k5ec2i_"
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
