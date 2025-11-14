import React from 'react';
import { Handle, Position } from 'reactflow';
import { Wand2, Trash2 } from 'lucide-react';
import { TransformNodeData } from '../../types/agentWorkflow';

export interface TransformNodeProps {
  data: TransformNodeData;
  selected?: boolean;
  onDelete?: () => void;
}

/**
 * 数据转换节点组件
 */
const TransformNode: React.FC<TransformNodeProps> = ({ data, selected, onDelete }) => {
  const ruleTypeLabels: Record<string, string> = {
    json_path: 'JSON路径',
    format: '格式化',
    parse: '解析',
    stringify: '序列化',
  };

  const ruleDisplay = data.rule.jsonPath || data.rule.format || '未配置';

  return (
    <div className={`transform-node ${selected ? 'selected' : ''}`}>
      {/* 输入句柄 */}
      <Handle 
        type="target" 
        position={Position.Left} 
        className="workflow-handle"
        id="target"
      />
      
      {/* 节点内容 */}
      <div className="transform-node-content">
        <div className="transform-node-header">
          <Wand2 size={16} className="transform-node-icon" />
          <span className="transform-node-label">{data.label}</span>
        </div>
        
        <div className="transform-node-info">
          <span className="transform-type">{ruleTypeLabels[data.ruleType] || data.ruleType}</span>
          {ruleDisplay && (
            <span className="transform-rule">{String(ruleDisplay).substring(0, 20)}</span>
          )}
        </div>
        
        {onDelete && (
          <button
            className="transform-node-delete"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
            title="删除节点"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
      
      {/* 输出句柄 */}
      <Handle 
        type="source" 
        position={Position.Right} 
        className="workflow-handle"
        id="source"
      />
      
      <style>{`
        .transform-node {
          min-width: 180px;
          background: white;
          border: 2px solid #ef4444;
          border-radius: 8px;
          padding: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
        }
        
        .transform-node.selected {
          border-color: #dc2626;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }
        
        .transform-node-content {
          position: relative;
        }
        
        .transform-node-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        
        .transform-node-icon {
          color: #ef4444;
          flex-shrink: 0;
        }
        
        .transform-node-label {
          font-weight: 600;
          font-size: 14px;
          color: #111827;
          flex: 1;
        }
        
        .transform-node-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 12px;
          background: #fef2f2;
          padding: 6px 8px;
          border-radius: 4px;
        }
        
        .transform-type {
          color: #dc2626;
          font-weight: 500;
        }
        
        .transform-rule {
          color: #6b7280;
          font-size: 11px;
          font-family: 'Monaco', 'Courier New', monospace;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .transform-node-delete {
          position: absolute;
          top: -4px;
          right: -4px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          border: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          opacity: 0;
          transition: all 0.2s ease;
        }
        
        .transform-node:hover .transform-node-delete {
          opacity: 1;
        }
        
        .transform-node-delete:hover {
          background: #fee2e2;
          border-color: #ef4444;
          color: #dc2626;
        }
        
        .workflow-handle {
          width: 10px;
          height: 10px;
          background: #ef4444;
          border: 2px solid white;
        }
        
        .workflow-handle:hover {
          background: #dc2626;
          width: 12px;
          height: 12px;
        }
      `}</style>
    </div>
  );
};

export default TransformNode;

