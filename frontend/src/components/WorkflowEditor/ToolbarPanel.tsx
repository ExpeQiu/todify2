import React, { useState, useRef, useEffect } from 'react';
import { Plus, Save, Play, FileDown, Settings, MessageSquare, Rocket, Bot, ChevronDown } from 'lucide-react';
import { getAllNodeTypes, getNodeTypesByCategory } from '../../config/workflowNodeTypes';
import { WorkflowNodeType } from '../../types/agentWorkflow';

interface ToolbarPanelProps {
  onAddNode?: (nodeType?: WorkflowNodeType) => void;
  onSave?: () => void;
  onRun?: () => void;
  onSaveTemplate?: () => void;
  onPublish?: () => void;
  onSettings?: () => void;
  onOpenMultiChat?: () => void;
  canSave?: boolean;
  canRun?: boolean;
  loading?: boolean;
  isPublished?: boolean;
}

/**
 * 工具栏面板组件
 */
const ToolbarPanel: React.FC<ToolbarPanelProps> = ({
  onAddNode,
  onSave,
  onRun,
  onSaveTemplate,
  onPublish,
  onSettings,
  onOpenMultiChat,
  canSave = false,
  canRun = false,
  loading = false,
  isPublished = false,
}) => {
  const [showNodeMenu, setShowNodeMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNodeMenu(false);
      }
    };

    if (showNodeMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNodeMenu]);

  const handleAddNodeClick = (nodeType: WorkflowNodeType) => {
    setShowNodeMenu(false);
    onAddNode?.(nodeType);
  };

  const agentNodes = getNodeTypesByCategory('agent');
  const logicNodes = getNodeTypesByCategory('logic');
  const dataNodes = getNodeTypesByCategory('data');
  const ioNodes = getNodeTypesByCategory('io');

  return (
    <div className="workflow-toolbar">
      <div className="toolbar-section">
        <div className="toolbar-dropdown" ref={dropdownRef}>
          <button 
            className="toolbar-button" 
            onClick={() => setShowNodeMenu(!showNodeMenu)} 
            title="添加节点"
          >
            <Plus size={16} />
            <span>添加节点</span>
            <ChevronDown size={14} style={{ marginLeft: '4px' }} />
          </button>
          
          {showNodeMenu && (
            <div className="toolbar-dropdown-menu">
              {agentNodes.length > 0 && (
                <div className="dropdown-section">
                  <div className="dropdown-section-title">Agent节点</div>
                  {agentNodes.map((nodeType) => {
                    const Icon = nodeType.icon;
                    return (
                      <button
                        key={nodeType.type}
                        className="dropdown-item"
                        onClick={() => handleAddNodeClick(nodeType.type)}
                        style={{ borderLeftColor: nodeType.color }}
                      >
                        <Icon size={18} style={{ color: nodeType.color, marginTop: '2px', flexShrink: 0 }} />
                        <div className="dropdown-item-content">
                          <div className="dropdown-item-name">{nodeType.name}</div>
                          <div className="dropdown-item-desc">{nodeType.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              
              {logicNodes.length > 0 && (
                <div className="dropdown-section">
                  <div className="dropdown-section-title">逻辑节点</div>
                  {logicNodes.map((nodeType) => {
                    const Icon = nodeType.icon;
                    return (
                      <button
                        key={nodeType.type}
                        className="dropdown-item"
                        onClick={() => handleAddNodeClick(nodeType.type)}
                        style={{ borderLeftColor: nodeType.color }}
                      >
                        <Icon size={18} style={{ color: nodeType.color, marginTop: '2px', flexShrink: 0 }} />
                        <div className="dropdown-item-content">
                          <div className="dropdown-item-name">{nodeType.name}</div>
                          <div className="dropdown-item-desc">{nodeType.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              
              {dataNodes.length > 0 && (
                <div className="dropdown-section">
                  <div className="dropdown-section-title">数据节点</div>
                  {dataNodes.map((nodeType) => {
                    const Icon = nodeType.icon;
                    return (
                      <button
                        key={nodeType.type}
                        className="dropdown-item"
                        onClick={() => handleAddNodeClick(nodeType.type)}
                        style={{ borderLeftColor: nodeType.color }}
                      >
                        <Icon size={18} style={{ color: nodeType.color, marginTop: '2px', flexShrink: 0 }} />
                        <div className="dropdown-item-content">
                          <div className="dropdown-item-name">{nodeType.name}</div>
                          <div className="dropdown-item-desc">{nodeType.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              
              {ioNodes.length > 0 && (
                <div className="dropdown-section">
                  <div className="dropdown-section-title">输入/输出</div>
                  {ioNodes.map((nodeType) => {
                    const Icon = nodeType.icon;
                    return (
                      <button
                        key={nodeType.type}
                        className="dropdown-item"
                        onClick={() => handleAddNodeClick(nodeType.type)}
                        style={{ borderLeftColor: nodeType.color }}
                      >
                        <Icon size={18} style={{ color: nodeType.color, marginTop: '2px', flexShrink: 0 }} />
                        <div className="dropdown-item-content">
                          <div className="dropdown-item-name">{nodeType.name}</div>
                          <div className="dropdown-item-desc">{nodeType.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-section">
        <button 
          className="toolbar-button" 
          onClick={onSave}
          disabled={!canSave || loading}
          title="保存工作流"
        >
          <Save size={16} />
          <span>{loading ? '保存中...' : '保存'}</span>
        </button>
      </div>

      <div className="toolbar-section">
        <button 
          className="toolbar-button toolbar-button-primary" 
          onClick={onRun}
          disabled={!canRun || loading}
          title="运行工作流"
        >
          <Play size={16} />
          <span>{loading ? '运行中...' : '运行'}</span>
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-section" style={{ marginLeft: 'auto', gap: '4px' }}>
        <a
          href="/ai-roles"
          className="toolbar-button"
          title="AI角色管理"
        >
          <Bot size={16} />
        </a>
        {onOpenMultiChat ? (
          <button
            type="button"
            className="toolbar-button"
            title="多窗口对话"
            onClick={onOpenMultiChat}
          >
            <MessageSquare size={16} />
          </button>
        ) : (
          <a
            href="/ai-chat-multi"
            className="toolbar-button"
            title="多窗口对话"
          >
            <MessageSquare size={16} />
          </a>
        )}
      </div>

      <div className="toolbar-section">
        <button 
          className={`toolbar-button ${isPublished ? 'toolbar-button-success' : ''}`}
          onClick={onPublish} 
          title={isPublished ? '已发布 - 点击取消发布' : '发布工作流'}
        >
          <Rocket size={16} />
          <span>{isPublished ? '已发布' : '发布工作流'}</span>
        </button>
        <button className="toolbar-button" onClick={onSaveTemplate} title="保存模版">
          <FileDown size={16} />
          <span>保存模版</span>
        </button>
        <button className="toolbar-button" onClick={onSettings} title="设置">
          <Settings size={16} />
        </button>
      </div>

      <style>{`
        .workflow-toolbar {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: white;
          border-bottom: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        
        .toolbar-section {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .toolbar-divider {
          width: 1px;
          height: 24px;
          background: #e5e7eb;
          margin: 0 4px;
        }
        
        .toolbar-button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: white;
          color: #374151;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
        }
        
        .toolbar-button:hover:not(:disabled) {
          background: #f9fafb;
          border-color: #9ca3af;
        }
        
        .toolbar-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .toolbar-section a.toolbar-button {
          padding: 6px 10px;
        }
        
        .toolbar-button-primary {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }
        
        .toolbar-button-primary:hover:not(:disabled) {
          background: #2563eb;
          border-color: #2563eb;
        }
        
        .toolbar-button-success {
          background: #10b981;
          color: white;
          border-color: #10b981;
        }
        
        .toolbar-button-success:hover:not(:disabled) {
          background: #059669;
          border-color: #059669;
        }
        
        .toolbar-dropdown {
          position: relative;
        }
        
        .toolbar-dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          min-width: 280px;
          max-height: 500px;
          overflow-y: auto;
          z-index: 1000;
        }
        
        .dropdown-section {
          padding: 8px 0;
        }
        
        .dropdown-section:not(:last-child) {
          border-bottom: 1px solid #f3f4f6;
        }
        
        .dropdown-section-title {
          padding: 8px 16px;
          font-size: 11px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .dropdown-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          width: 100%;
          padding: 12px 16px;
          border: none;
          background: white;
          border-left: 3px solid transparent;
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: left;
        }
        
        .dropdown-item:hover {
          background: #f9fafb;
        }
        
        .dropdown-item-content {
          flex: 1;
          min-width: 0;
        }
        
        .dropdown-item-name {
          font-size: 14px;
          font-weight: 500;
          color: #111827;
          margin-bottom: 2px;
        }
        
        .dropdown-item-desc {
          font-size: 12px;
          color: #6b7280;
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
};

export default ToolbarPanel;

