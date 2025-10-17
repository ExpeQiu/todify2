import React, { useState, useCallback } from 'react';
import { KnowledgeConfigManager } from '../KnowledgeConfigManager';
import { KnowledgeConfig } from '../../types/knowledgeConfig';
import './KnowledgePointConfigManager.css';

interface KnowledgePointConfigManagerProps {
  className?: string;
}

export const KnowledgePointConfigManager: React.FC<KnowledgePointConfigManagerProps> = ({
  className
}) => {
  const [selectedConfig, setSelectedConfig] = useState<KnowledgeConfig | null>(null);

  const handleConfigSelect = useCallback((config: KnowledgeConfig) => {
    setSelectedConfig(config);
    console.log('选择配置:', config.name);
  }, []);

  const handleConfigChange = useCallback((config: KnowledgeConfig) => {
    setSelectedConfig(config);
    console.log('配置已更新:', config.name);
  }, []);

  return (
    <div className={`knowledge-point-config-manager ${className || ''}`}>
      <div className="config-manager-header">
        <h1>知识点配置管理</h1>
        <p>管理和配置知识点的显示方式、筛选器和操作</p>
      </div>
      
      <KnowledgeConfigManager
        onConfigSelect={handleConfigSelect}
        onConfigChange={handleConfigChange}
      />
      
      {selectedConfig && (
        <div className="selected-config-info">
          <h3>当前选择的配置</h3>
          <p><strong>名称:</strong> {selectedConfig.name}</p>
          <p><strong>描述:</strong> {selectedConfig.description || '无描述'}</p>
          <p><strong>版本:</strong> {selectedConfig.version}</p>
          <p><strong>筛选器数量:</strong> {selectedConfig.filters.length}</p>
          <p><strong>显示列数量:</strong> {selectedConfig.columns.length}</p>
          <p><strong>操作数量:</strong> {selectedConfig.actions.length}</p>
        </div>
      )}
    </div>
  );
};

export default KnowledgePointConfigManager;