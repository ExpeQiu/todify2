import React from 'react';
import { Handle, Position } from 'reactflow';
import { Brain, Trash2 } from 'lucide-react';
import { MemoryNodeData } from '../../../types/agentWorkflow';

export interface MemoryNodeProps {
  data: MemoryNodeData;
  selected?: boolean;
  onDelete?: () => void;
}

const MemoryNode: React.FC<MemoryNodeProps> = ({ data, selected, onDelete }) => {
  const contentPreview = data.content 
    ? (data.content.length > 50 ? data.content.substring(0, 50) + '...' : data.content)
    : '暂无内容';

  return (
    <div className={`memory-node ${selected ? 'selected' : ''}`}>
      <Handle
        type="target"
        position={Position.Left}
        className="workflow-handle"
        id="target"
      />
      
      <div className="memory-node-content">
        <div className="memory-node-header">
          <Brain size={16} className="memory-node-icon" />
          <span className="memory-node-label">{data.label}</span>
        </div>
        
        <div className="memory-node-info">
          <div className="memory-content-preview">
            {contentPreview}
          </div>
          {data.sourceNodeId && (
            <div className="memory-source">
              <span className="source-label">来源:</span>
              <span className="source-value">{data.sourceNodeId}</span>
            </div>
          )}
          {data.editable !== false && (
            <span className="memory-editable">可编辑</span>
          )}
        </div>
      </div>
      
      {onDelete && (
        <button
          className="memory-node-delete"
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.();
          }}
          title="删除节点"
        >
          <Trash2 size={12} />
        </button>
      )}
      
      <Handle
        type="source"
        position={Position.Right}
        className="workflow-handle"
        id="source"
      />
      
      <style>{`
        .memory-node {
          min-width: 180px;
          background: white;
          border: 2px solid #EC4899;
          border-radius: 8px;
          padding: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
        }
        
        .memory-node.selected {
          border-color: #DB2777;
          box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.1);
        }
        
        .memory-node-content {
          position: relative;
        }
        
        .memory-node-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        
        .memory-node-icon {
          color: #EC4899;
          flex-shrink: 0;
        }
        
        .memory-node-label {
          font-weight: 600;
          font-size: 14px;
          color: #111827;
          flex: 1;
        }
        
        .memory-node-info {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 12px;
          background: #FDF2F8;
          padding: 8px;
          border-radius: 4px;
        }
        
        .memory-content-preview {
          color: #6B7280;
          line-height: 1.4;
          word-break: break-word;
          font-style: ${data.content ? 'normal' : 'italic'};
        }
        
        .memory-source {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          margin-top: 4px;
        }
        
        .source-label {
          color: #DB2777;
          font-weight: 500;
        }
        
        .source-value {
          color: #9CA3AF;
          font-family: 'Monaco', 'Courier New', monospace;
        }
        
        .memory-editable {
          font-size: 10px;
          padding: 2px 6px;
          background: #FCE7F3;
          color: #BE185D;
          border-radius: 4px;
          align-self: flex-start;
          margin-top: 4px;
        }
        
        .memory-node-delete {
          position: absolute;
          top: -4px;
          right: -4px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          border: 1px solid #E5E7EB;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          opacity: 0;
          transition: all 0.2s ease;
        }
        
        .memory-node:hover .memory-node-delete {
          opacity: 1;
        }
        
        .memory-node-delete:hover {
          background: #FEE2E2;
          border-color: #EF4444;
          color: #DC2626;
        }
        
        .workflow-handle {
          width: 10px;
          height: 10px;
          background: #EC4899;
          border: 2px solid white;
        }
        
        .workflow-handle:hover {
          background: #DB2777;
          width: 12px;
          height: 12px;
        }
      `}</style>
    </div>
  );
};

export default MemoryNode;

