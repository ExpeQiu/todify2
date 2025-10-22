import React, { useState, useCallback } from "react";
import { KnowledgeConfigManager } from "../KnowledgeConfigManager";
import { KnowledgeConfig } from "../../types/knowledgeConfig";
import "./KnowledgePointConfigManager.css";

interface KnowledgePointConfigManagerProps {
  className?: string;
}

export const KnowledgePointConfigManager: React.FC<
  KnowledgePointConfigManagerProps
> = ({ className }) => {
  const [selectedConfig, setSelectedConfig] = useState<KnowledgeConfig | null>(
    null,
  );

  const handleConfigSelect = useCallback((config: KnowledgeConfig) => {
    setSelectedConfig(config);
    console.log("选择配置:", config.name);
  }, []);

  const handleConfigChange = useCallback((config: KnowledgeConfig) => {
    setSelectedConfig(config);
    console.log("配置已更新:", config.name);
  }, []);

  return (
    <div
      className={`knowledge-point-config-manager ${className || ""}`}
      data-oid="qxcn_yp"
    >
      <div className="config-manager-header" data-oid="evcv15o">
        <h1 data-oid="0eogih5">知识点配置管理</h1>
        <p data-oid=".o75rc8">管理和配置知识点的显示方式、筛选器和操作</p>
      </div>

      <KnowledgeConfigManager
        onConfigSelect={handleConfigSelect}
        onConfigChange={handleConfigChange}
        data-oid="xht5qsn"
      />

      {selectedConfig && (
        <div className="selected-config-info" data-oid="q.e8jef">
          <h3 data-oid="-0jfq7a">当前选择的配置</h3>
          <p data-oid=":dmq4do">
            <strong data-oid="j7-2t8l">名称:</strong> {selectedConfig.name}
          </p>
          <p data-oid="enzjn6q">
            <strong data-oid="-iwvl_6">描述:</strong>{" "}
            {selectedConfig.description || "无描述"}
          </p>
          <p data-oid="u0uitgm">
            <strong data-oid="r8l8taa">版本:</strong> {selectedConfig.version}
          </p>
          <p data-oid="_pxl324">
            <strong data-oid="en8ty5:">筛选器数量:</strong>{" "}
            {selectedConfig.filters.length}
          </p>
          <p data-oid="epzb53y">
            <strong data-oid="40ec7.r">显示列数量:</strong>{" "}
            {selectedConfig.columns.length}
          </p>
          <p data-oid="t6v47t6">
            <strong data-oid="vvw3sq3">操作数量:</strong>{" "}
            {selectedConfig.actions.length}
          </p>
        </div>
      )}
    </div>
  );
};

export default KnowledgePointConfigManager;
