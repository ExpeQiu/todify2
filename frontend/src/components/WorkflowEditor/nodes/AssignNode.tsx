import React from 'react';
import { Handle, Position } from 'reactflow';
import { Variable, Trash2 } from 'lucide-react';
import { AssignNodeData } from '../../types/agentWorkflow';

export interface AssignNodeProps {
  data: AssignNodeData;
  selected?: boolean;
  onDelete?: () => void;
}

/**
 * 变量赋值节点组件
 */
const AssignNode: React.FC<AssignNodeProps> = ({ data, selected, onDelete }) => {
  const valueDisplay = data.expression || data.value || '未设置';

  return (
    <div className={`assign-node ${selected ? 'selected' : ''}`}>
      {/* 输入句柄 */}
      <Handle 
        type="target" 
        position={Position.Left} 
        className="workflow-handle"
        id="target"
      />
      
      {/* 节点内容 */}
      <div className="assign-node-content">
        <div className="assign-node-header">
          <Variable size={16} className="assign-node-icon" />
          <span className="assign-node-label">{data.label}</span>
        </div>
        
        <div className="assign-node-variable">
          <span className="variable-name">{data.variable}</span>
          <span className="variable-arrow">=</span>
          <span className="variable-value">{String(valueDisplay).substring(0, 30)}</span>
        </div>
        
        {onDelete && (
          <button
            className="assign-node-delete"
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
        .assign-node {
          min-width: 180px;
          background: white;
          border: 2px solid #8b5cf6;
          border-radius: 8px;
          padding: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
        }
        
        .assign-node.selected {
          border-color: #7c3aed;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
        }
        
        .assign-node-content {
          position: relative;
        }
        
        .assign-node-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        
        .assign-node-icon {
          color: #8b5cf6;
          flex-shrink: 0;
        }
        
        .assign-node-label {
          font-weight: 600;
          font-size: 14px;
          color: #111827;
          flex: 1;
        }
        
        .assign-node-variable {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          background: #f5f3ff;
          padding: 6px 8px;
          border-radius: 4px;
          font-family: 'Monaco', 'Courier New', monospace;
        }
        
        .variable-name {
          color: #7c3aed;
          font-weight: 600;
        }
        
        .variable-arrow {
          color: #a78bfa;
        }
        
        .variable-value {
          color: #6b7280;
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .assign-node-delete {
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
        
        .assign-node:hover .assign-node-delete {
          opacity: 1;
        }
        
        .assign-node-delete:hover {
          background: #fee2e2;
          border-color: #ef4444;
          color: #dc2626;
        }
        
        .workflow-handle {
          width: 10px;
          height: 10px;
          background: #8b5cf6;
          border: 2px solid white;
        }
        
        .workflow-handle:hover {
          background: #7c3aed;
          width: 12px;
          height: 12px;
        }
      `}</style>
    </div>
  );
};

export default AssignNode;

