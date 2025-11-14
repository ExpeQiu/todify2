import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Link as LinkIcon, FileText, Eye } from 'lucide-react';
import { AgentWorkflowNode, AgentWorkflowEdge, InputSourceConfig } from '../../types/agentWorkflow';
import { 
  getNodeOutputFields, 
  generateNodeFieldVariableName,
  NODE_OUTPUT_STRUCTURES 
} from '../../types/nodeFieldVariables';

interface InputSourceSelectorProps {
  currentNodeId: string;
  nodes: AgentWorkflowNode[];
  edges: AgentWorkflowEdge[];
  inputSources?: Record<string, InputSourceConfig>;
  onChange: (inputSources: Record<string, InputSourceConfig>) => void;
}

/**
 * 输入源选择器组件
 * 支持选择上游节点的输出作为当前节点的输入
 */
const InputSourceSelector: React.FC<InputSourceSelectorProps> = ({
  currentNodeId,
  nodes,
  edges,
  inputSources = {},
  onChange,
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [showPreview, setShowPreview] = useState(false);

  // 查找所有上游节点（通过边连接关系）
  const upstreamNodes = useMemo(() => {
    const upstreamNodeIds = new Set<string>();
    
    // 通过边的连接关系找到所有直接连接到当前节点的上游节点
    edges.forEach(edge => {
      if (edge.target === currentNodeId) {
        upstreamNodeIds.add(edge.source);
      }
    });
    
    // 递归查找间接上游节点（处理多层级连接）
    let hasChanges = true;
    const maxDepth = 10; // 防止无限循环
    let depth = 0;
    
    while (hasChanges && depth < maxDepth) {
      hasChanges = false;
      depth++;
      
      nodes.forEach(node => {
        if (!upstreamNodeIds.has(node.id) && node.id !== currentNodeId) {
          // 检查是否有边连接到已找到的上游节点
          const isConnected = edges.some(edge => {
            const isSource = edge.source === node.id;
            const isTarget = upstreamNodeIds.has(edge.target);
            return isSource && isTarget;
          });
          
          if (isConnected) {
            upstreamNodeIds.add(node.id);
            hasChanges = true;
          }
        }
      });
    }
    
    return nodes.filter(node => upstreamNodeIds.has(node.id));
  }, [nodes, edges, currentNodeId]);

  // 切换节点展开/收起状态
  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  // 获取节点的输出字段列表（使用标准化的字段定义）
  const getNodeOutputs = (node: AgentWorkflowNode): Array<{ path: string; name: string; description: string; variableName: string }> => {
    const fields = getNodeOutputFields(node.id, node.type);
    
    // 如果节点有自定义输出配置（如output节点），也包含进去
    if (node.type === 'output' && (node.data as any).outputs) {
      const outputData = (node.data as any).outputs || [];
      outputData.forEach((output: any) => {
        if (output.name) {
          fields.push({
            nodeId: node.id,
            nodeType: node.type,
            fieldPath: `output.outputs.${output.name}`,
            variableName: generateNodeFieldVariableName(node.id, node.type, `output.outputs.${output.name}`),
            description: output.description || `输出参数: ${output.name}`,
          });
        }
      });
    }
    
    return fields.map(f => ({
      path: f.fieldPath,
      name: f.fieldPath.replace(/^output\./, ''),
      description: f.description || '',
      variableName: f.variableName,
    }));
  };

  // 选择上游节点的输出作为输入
  const selectNodeOutput = (nodeId: string, fieldPath: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    // 查找一个未使用的参数名
    let paramName = 'input';
    let counter = 1;
    while (inputSources[paramName]) {
      paramName = `input${counter}`;
      counter++;
    }
    
    // 创建新的输入源配置，使用标准化的字段路径
    const newInputSource: InputSourceConfig = {
      type: 'node_output',
      nodeId,
      outputField: fieldPath, // 使用完整的字段路径，如 output.content
    };
    
    onChange({
      ...inputSources,
      [paramName]: newInputSource,
    });
  };

  // 删除输入源
  const removeInputSource = (paramName: string) => {
    const newInputSources = { ...inputSources };
    delete newInputSources[paramName];
    onChange(newInputSources);
  };

  // 更新静态输入值
  const updateStaticValue = (paramName: string, value: any) => {
    onChange({
      ...inputSources,
      [paramName]: {
        type: 'static',
        value,
      },
    });
  };

  // 获取输入源的显示名称
  const getSourceDisplayName = (config: InputSourceConfig, paramName: string): string => {
    if (config.type === 'static') {
      return `${paramName}: 静态值`;
    }
    
    if (config.type === 'node_output') {
      const node = nodes.find(n => n.id === config.nodeId);
      const nodeName = node?.data.label || config.nodeId;
      const fieldName = config.outputField || 'output';
      return `${paramName}: ${nodeName}.${fieldName}`;
    }
    
    return paramName;
  };

  // 生成输入数据预览
  const previewInput = useMemo(() => {
    const preview: Record<string, any> = {};
    
    Object.entries(inputSources).forEach(([paramName, config]) => {
      if (config.type === 'static') {
        preview[paramName] = config.value;
      } else if (config.type === 'node_output') {
        const node = nodes.find(n => n.id === config.nodeId);
        const placeholder = `[来自: ${node?.data.label || config.nodeId}.${config.outputField || 'output'}]`;
        preview[paramName] = placeholder;
      }
    });
    
    return preview;
  }, [inputSources, nodes]);

  if (upstreamNodes.length === 0) {
    return (
      <div className="empty-input-sources">
        <FileText size={20} className="text-gray-400" />
        <p className="text-gray-500 text-sm mt-2">暂无上游节点</p>
        <p className="text-gray-400 text-xs mt-1">请先连接上游节点</p>
      </div>
    );
  }

  return (
    <div className="input-source-selector">
      {/* 已配置的输入源 */}
      {Object.keys(inputSources).length > 0 && (
        <div className="configured-sources">
          <div className="section-header">
            <h4 className="section-title">已配置的输入</h4>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="preview-toggle"
              title="预览输入数据"
            >
              <Eye size={16} />
              <span>{showPreview ? '隐藏' : '预览'}</span>
            </button>
          </div>
          
          {Object.entries(inputSources).map(([paramName, config]) => (
            <div key={paramName} className="source-item">
              <div className="source-header">
                <LinkIcon size={14} className="text-blue-500" />
                <span className="source-name">{paramName}</span>
                <button
                  onClick={() => removeInputSource(paramName)}
                  className="remove-button"
                  title="删除输入源"
                >
                  ×
                </button>
              </div>
              <div className="source-info">
                {config.type === 'static' ? (
                  <input
                    type="text"
                    className="static-input"
                    value={typeof config.value === 'string' ? config.value : JSON.stringify(config.value)}
                    onChange={(e) => updateStaticValue(paramName, e.target.value)}
                    placeholder="输入静态值"
                  />
                ) : (
                  <div className="source-ref">
                    {nodes.find(n => n.id === config.nodeId)?.data.label || config.nodeId}
                    <span className="field-name">.{config.outputField || 'output'}</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* 预览面板 */}
          {showPreview && Object.keys(inputSources).length > 0 && (
            <div className="preview-panel">
              <div className="preview-title">输入预览</div>
              <pre className="preview-content">
                {JSON.stringify(previewInput, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* 可用的上游节点列表 */}
      <div className="available-sources">
        <h4 className="section-title">可用的上游节点</h4>
        <div className="upstream-nodes-list">
          {upstreamNodes.map((node) => {
            const isExpanded = expandedNodes.has(node.id);
            const outputs = getNodeOutputs(node);
            
            return (
              <div key={node.id} className="upstream-node">
                <div
                  className="upstream-node-header"
                  onClick={() => toggleNode(node.id)}
                >
                  {isExpanded ? (
                    <ChevronDown size={16} className="text-gray-500" />
                  ) : (
                    <ChevronRight size={16} className="text-gray-500" />
                  )}
                  <span className="node-label">{node.data.label}</span>
                </div>
                
                {isExpanded && (
                  <div className="upstream-node-outputs">
                    {outputs.map((outputField) => (
                      <div
                        key={outputField.variableName}
                        className="output-field"
                        onClick={() => selectNodeOutput(node.id, outputField.path)}
                        title={outputField.description || outputField.variableName}
                      >
                        <FileText size={12} className="text-gray-400" />
                        <div className="output-field-info">
                          <span className="output-field-name">{outputField.name}</span>
                          {outputField.description && (
                            <span className="output-field-desc">{outputField.description}</span>
                          )}
                          <span className="output-field-var">{outputField.variableName}</span>
                        </div>
                        <button
                          className="select-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            selectNodeOutput(node.id, outputField.path);
                          }}
                        >
                          选择
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .empty-input-sources {
          text-align: center;
          padding: 24px;
          color: #9ca3af;
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .section-title {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin: 0;
        }

        .preview-toggle {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          background: white;
          cursor: pointer;
          font-size: 12px;
          color: #6b7280;
          transition: all 0.2s;
        }

        .preview-toggle:hover {
          background: #f9fafb;
          border-color: #9ca3af;
        }

        .configured-sources {
          margin-bottom: 20px;
        }

        .source-item {
          padding: 10px;
          background: #f9fafb;
          border-radius: 6px;
          margin-bottom: 8px;
        }

        .source-header {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 6px;
        }

        .source-name {
          font-size: 13px;
          font-weight: 500;
          color: #111827;
          flex: 1;
        }

        .remove-button {
          width: 20px;
          height: 20px;
          border: none;
          background: transparent;
          color: #ef4444;
          cursor: pointer;
          font-size: 18px;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 3px;
          transition: background 0.2s;
        }

        .remove-button:hover {
          background: #fee2e2;
        }

        .source-info {
          padding-left: 20px;
        }

        .static-input {
          width: 100%;
          padding: 6px 8px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 12px;
          background: white;
        }

        .source-ref {
          font-size: 12px;
          color: #6b7280;
        }

        .field-name {
          color: #3b82f6;
          font-weight: 500;
        }

        .preview-panel {
          margin-top: 12px;
          padding: 12px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
        }

        .preview-title {
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          margin-bottom: 8px;
        }

        .preview-content {
          margin: 0;
          padding: 10px;
          background: white;
          border-radius: 4px;
          font-size: 11px;
          font-family: 'Monaco', 'Courier New', monospace;
          color: #111827;
          overflow-x: auto;
          max-height: 200px;
          overflow-y: auto;
        }

        .upstream-nodes-list {
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          overflow: hidden;
        }

        .upstream-node {
          border-bottom: 1px solid #e5e7eb;
        }

        .upstream-node:last-child {
          border-bottom: none;
        }

        .upstream-node-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          background: white;
          cursor: pointer;
          transition: background 0.2s;
        }

        .upstream-node-header:hover {
          background: #f9fafb;
        }

        .node-label {
          font-size: 14px;
          font-weight: 500;
          color: #111827;
        }

        .upstream-node-outputs {
          background: #f9fafb;
          padding: 8px 0;
        }

        .output-field {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 10px 32px;
          cursor: pointer;
          transition: background 0.2s;
          position: relative;
        }

        .output-field:hover {
          background: #f3f4f6;
        }

        .output-field-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
        }

        .output-field-name {
          font-size: 13px;
          font-weight: 500;
          color: #111827;
        }

        .output-field-desc {
          font-size: 11px;
          color: #6b7280;
          line-height: 1.3;
        }

        .output-field-var {
          font-size: 10px;
          color: #9ca3af;
          font-family: 'Monaco', 'Courier New', monospace;
          margin-top: 2px;
        }

        .select-button {
          padding: 4px 12px;
          border: 1px solid #3b82f6;
          border-radius: 4px;
          background: white;
          color: #3b82f6;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
          opacity: 0;
        }

        .output-field:hover .select-button {
          opacity: 1;
        }

        .select-button:hover {
          background: #3b82f6;
          color: white;
        }
      `}</style>
    </div>
  );
};

export default InputSourceSelector;

