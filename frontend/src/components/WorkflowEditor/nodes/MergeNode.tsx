import React from 'react';
import { Handle, Position } from 'reactflow';
import { Merge, Trash2 } from 'lucide-react';
import { MergeNodeData } from '../../types/agentWorkflow';

export interface MergeNodeProps {
  data: MergeNodeData;
  selected?: boolean;
  onDelete?: () => void;
}

/**
 * 数据合并节点组件
 */
const MergeNode: React.FC<MergeNodeProps> = ({ data, selected, onDelete }) => {
  const strategyLabels: Record<string, string> = {
    override: '覆盖',
    merge: '合并',
    append: '追加',
    concat: '连接',
  };

  return (
    <div className={`merge-node ${selected ? 'selected' : ''}`}>
      {/* 输入句柄 - 可以有多个 */}
      {data.sources && data.sources.length > 0 ? (
        data.sources.map((sourceId, index) => (
          <Handle
            key={`input-${index}`}
            type="target"
            position={Position.Left}
            className="workflow-handle"
            id={`input-${index}`}
            style={{ top: `${(index + 1) * (100 / (data.sources.length + 1))}%` }}
          />
        ))
      ) : (
        <Handle 
          type="target" 
          position={Position.Left} 
          className="workflow-handle"
          id="target"
        />
      )}
      
      {/* 节点内容 */}
      <div className="merge-node-content">
        <div className="merge-node-header">
          <Merge size={16} className="merge-node-icon" />
          <span className="merge-node-label">{data.label}</span>
        </div>
        
        <div className="merge-node-info">
          <span className="merge-strategy">{strategyLabels[data.strategy] || data.strategy}</span>
          {data.sources && data.sources.length > 0 && (
            <span className="merge-count">{data.sources.length} 个源</span>
          )}
        </div>
        
        {onDelete && (
          <button
            className="merge-node-delete"
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
        .merge-node {
          min-width: 180px;
          background: white;
          border: 2px solid #f59e0b;
          border-radius: 8px;
          padding: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
        }
        
        .merge-node.selected {
          border-color: #d97706;
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
        }
        
        .merge-node-content {
          position: relative;
        }
        
        .merge-node-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        
        .merge-node-icon {
          color: #f59e0b;
          flex-shrink: 0;
        }
        
        .merge-node-label {
          font-weight: 600;
          font-size: 14px;
          color: #111827;
          flex: 1;
        }
        
        .merge-node-info {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          background: #fffbeb;
          padding: 6px 8px;
          border-radius: 4px;
        }
        
        .merge-strategy {
          color: #d97706;
          font-weight: 500;
        }
        
        .merge-count {
          color: #6b7280;
          font-size: 11px;
        }
        
        .merge-node-delete {
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
        
        .merge-node:hover .merge-node-delete {
          opacity: 1;
        }
        
        .merge-node-delete:hover {
          background: #fee2e2;
          border-color: #ef4444;
          color: #dc2626;
        }
        
        .workflow-handle {
          width: 10px;
          height: 10px;
          background: #f59e0b;
          border: 2px solid white;
        }
        
        .workflow-handle:hover {
          background: #d97706;
          width: 12px;
          height: 12px;
        }
      `}</style>
    </div>
  );
};

export default MergeNode;

