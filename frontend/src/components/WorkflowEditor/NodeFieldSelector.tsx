import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
import { AgentWorkflowNode } from '../types/agentWorkflow';
import { 
  getNodeOutputFields, 
  generateNodeFieldVariableName,
  parseNodeFieldVariableName,
  isValidNodeFieldVariableName 
} from '../types/nodeFieldVariables';

interface NodeFieldSelectorProps {
  /** 当前节点ID（用于排除自己） */
  currentNodeId?: string;
  /** 所有节点列表 */
  nodes: AgentWorkflowNode[];
  /** 选中的字段变量名 */
  value?: string;
  /** 变更回调 */
  onChange?: (variableName: string) => void;
  /** 是否显示完整变量名 */
  showFullVariable?: boolean;
  /** 占位符 */
  placeholder?: string;
}

/**
 * 节点字段选择器组件
 * 用于选择上游节点的输出字段，并生成标准化的变量名
 */
const NodeFieldSelector: React.FC<NodeFieldSelectorProps> = ({
  currentNodeId,
  nodes,
  value,
  onChange,
  showFullVariable = false,
  placeholder = '选择字段或输入变量名...',
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const [copied, setCopied] = useState(false);

  // 解析当前值
  const parsedValue = useMemo(() => {
    if (!value) return null;
    return parseNodeFieldVariableName(value);
  }, [value]);

  // 获取可用节点（排除当前节点）
  const availableNodes = useMemo(() => {
    return nodes.filter(node => node.id !== currentNodeId);
  }, [nodes, currentNodeId]);

  // 切换节点展开状态
  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  // 选择字段
  const selectField = (nodeId: string, fieldPath: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    const variableName = generateNodeFieldVariableName(nodeId, node.type, fieldPath);
    onChange?.(variableName);
    setIsEditing(false);
  };

  // 手动输入变量名
  const handleInputChange = (inputValue: string) => {
    setEditValue(inputValue);
    if (isValidNodeFieldVariableName(inputValue)) {
      onChange?.(inputValue);
    }
  };

  // 复制变量名
  const copyVariableName = () => {
    if (value) {
      navigator.clipboard.writeText(`\${${value}}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 显示文本
  const displayText = useMemo(() => {
    if (!value) return '';
    
    if (parsedValue) {
      const node = nodes.find(n => n.id === parsedValue.nodeId);
      const nodeName = node?.data.label || parsedValue.nodeId;
      const fieldName = parsedValue.fieldPath.replace(/^output\./, '');
      
      if (showFullVariable) {
        return `${nodeName}.${parsedValue.nodeType}.output.${fieldName}`;
      }
      return `${nodeName}.output.${fieldName}`;
    }
    
    return value;
  }, [value, parsedValue, nodes, showFullVariable]);

  return (
    <div className="node-field-selector">
      {/* 输入/显示区域 */}
      <div className="field-input-container">
        {isEditing ? (
          <input
            type="text"
            className="field-input"
            value={editValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onBlur={() => setIsEditing(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setIsEditing(false);
              }
              if (e.key === 'Escape') {
                setEditValue(value || '');
                setIsEditing(false);
              }
            }}
            placeholder={placeholder}
            autoFocus
          />
        ) : (
          <div 
            className="field-display"
            onClick={() => {
              setIsEditing(true);
              setEditValue(value || '');
            }}
          >
            <span className={value ? 'field-value' : 'field-placeholder'}>
              {value ? displayText : placeholder}
            </span>
            {value && (
              <button
                className="copy-button"
                onClick={(e) => {
                  e.stopPropagation();
                  copyVariableName();
                }}
                title="复制变量名"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            )}
          </div>
        )}
      </div>

      {/* 节点字段列表 */}
      {availableNodes.length > 0 && (
        <div className="field-selector-panel">
          <div className="panel-header">选择上游节点字段</div>
          <div className="nodes-list">
            {availableNodes.map((node) => {
              const isExpanded = expandedNodes.has(node.id);
              const fields = getNodeOutputFields(node.id, node.type);
              
              return (
                <div key={node.id} className="node-item">
                  <div
                    className="node-header"
                    onClick={() => toggleNode(node.id)}
                  >
                    {isExpanded ? (
                      <ChevronDown size={14} className="text-gray-500" />
                    ) : (
                      <ChevronRight size={14} className="text-gray-500" />
                    )}
                    <span className="node-name">{node.data.label || node.id}</span>
                    <span className="node-type">{node.type}</span>
                  </div>
                  
                  {isExpanded && (
                    <div className="fields-list">
                      {fields.map((field) => {
                        const isSelected = field.variableName === value;
                        return (
                          <div
                            key={field.variableName}
                            className={`field-item ${isSelected ? 'selected' : ''}`}
                            onClick={() => selectField(node.id, field.fieldPath)}
                            title={field.description || field.variableName}
                          >
                            <div className="field-info">
                              <span className="field-name">{field.fieldPath.replace(/^output\./, '')}</span>
                              {field.description && (
                                <span className="field-desc">{field.description}</span>
                              )}
                            </div>
                            {showFullVariable && (
                              <span className="field-var">{field.variableName}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        .node-field-selector {
          width: 100%;
        }

        .field-input-container {
          margin-bottom: 8px;
        }

        .field-input {
          width: 100%;
          padding: 6px 8px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 13px;
        }

        .field-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .field-display {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 8px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          background: white;
          cursor: text;
          min-height: 32px;
        }

        .field-display:hover {
          border-color: #9ca3af;
        }

        .field-value {
          font-size: 13px;
          color: #111827;
          flex: 1;
        }

        .field-placeholder {
          font-size: 13px;
          color: #9ca3af;
          font-style: italic;
        }

        .copy-button {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          border: none;
          background: transparent;
          color: #6b7280;
          cursor: pointer;
          border-radius: 3px;
          transition: all 0.2s;
        }

        .copy-button:hover {
          background: #f3f4f6;
          color: #3b82f6;
        }

        .field-selector-panel {
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          overflow: hidden;
          max-height: 300px;
          overflow-y: auto;
        }

        .panel-header {
          padding: 8px 12px;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
          font-size: 12px;
          font-weight: 600;
          color: #374151;
        }

        .nodes-list {
          background: white;
        }

        .node-item {
          border-bottom: 1px solid #e5e7eb;
        }

        .node-item:last-child {
          border-bottom: none;
        }

        .node-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .node-header:hover {
          background: #f9fafb;
        }

        .node-name {
          font-size: 13px;
          font-weight: 500;
          color: #111827;
          flex: 1;
        }

        .node-type {
          font-size: 11px;
          color: #6b7280;
          padding: 2px 6px;
          background: #f3f4f6;
          border-radius: 3px;
        }

        .fields-list {
          background: #f9fafb;
          padding: 4px 0;
        }

        .field-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 32px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .field-item:hover {
          background: #f3f4f6;
        }

        .field-item.selected {
          background: #eff6ff;
          border-left: 3px solid #3b82f6;
        }

        .field-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
        }

        .field-name {
          font-size: 12px;
          font-weight: 500;
          color: #111827;
        }

        .field-desc {
          font-size: 11px;
          color: #6b7280;
        }

        .field-var {
          font-size: 10px;
          color: #9ca3af;
          font-family: 'Monaco', 'Courier New', monospace;
        }
      `}</style>
    </div>
  );
};

export default NodeFieldSelector;

