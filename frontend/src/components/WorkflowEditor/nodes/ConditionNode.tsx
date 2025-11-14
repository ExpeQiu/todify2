import React from 'react';
import { Handle, Position } from 'reactflow';
import { GitBranch, Trash2 } from 'lucide-react';
import { ConditionNodeData } from '../../types/agentWorkflow';

export interface ConditionNodeProps {
  data: ConditionNodeData;
  selected?: boolean;
  onDelete?: () => void;
}

/**
 * 条件判断节点组件
 */
const ConditionNode: React.FC<ConditionNodeProps> = ({ data, selected, onDelete }) => {
  const conditionText = data.condition.expression || 
    `${data.condition.left || '?'} ${data.condition.operator || '=='} ${data.condition.right || '?'}`;

  return (
    <div className={`condition-node ${selected ? 'selected' : ''}`}>
      {/* 输入句柄 */}
      <Handle 
        type="target" 
        position={Position.Left} 
        className="workflow-handle"
        id="target"
      />
      
      {/* 节点内容 */}
      <div className="condition-node-content">
        <div className="condition-node-header">
          <GitBranch size={16} className="condition-node-icon" />
          <span className="condition-node-label">{data.label}</span>
        </div>
        
        <div className="condition-node-condition">
          {conditionText}
        </div>
        
        {data.trueLabel && data.falseLabel && (
          <div className="condition-node-branches">
            <div className="condition-branch true-branch">
              <span className="branch-label">{data.trueLabel}</span>
            </div>
            <div className="condition-branch false-branch">
              <span className="branch-label">{data.falseLabel}</span>
            </div>
          </div>
        )}
        
        {onDelete && (
          <button
            className="condition-node-delete"
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
      
      {/* 输出句柄 - true分支 */}
      <Handle 
        type="source" 
        position={Position.Right} 
        className="workflow-handle workflow-handle-true"
        id="true"
        style={{ top: '30%' }}
      />
      
      {/* 输出句柄 - false分支 */}
      <Handle 
        type="source" 
        position={Position.Right} 
        className="workflow-handle workflow-handle-false"
        id="false"
        style={{ top: '70%' }}
      />
      
      <style>{`
        .condition-node {
          min-width: 200px;
          background: white;
          border: 2px solid #10b981;
          border-radius: 8px;
          padding: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
        }
        
        .condition-node.selected {
          border-color: #059669;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }
        
        .condition-node-content {
          position: relative;
        }
        
        .condition-node-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        
        .condition-node-icon {
          color: #10b981;
          flex-shrink: 0;
        }
        
        .condition-node-label {
          font-weight: 600;
          font-size: 14px;
          color: #111827;
          flex: 1;
        }
        
        .condition-node-condition {
          font-size: 12px;
          color: #6b7280;
          background: #f0fdf4;
          padding: 6px 8px;
          border-radius: 4px;
          margin-bottom: 8px;
          font-family: 'Monaco', 'Courier New', monospace;
        }
        
        .condition-node-branches {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }
        
        .condition-branch {
          flex: 1;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          text-align: center;
        }
        
        .true-branch {
          background: #d1fae5;
          color: #065f46;
        }
        
        .false-branch {
          background: #fee2e2;
          color: #991b1b;
        }
        
        .branch-label {
          font-weight: 500;
        }
        
        .condition-node-delete {
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
        
        .condition-node:hover .condition-node-delete {
          opacity: 1;
        }
        
        .condition-node-delete:hover {
          background: #fee2e2;
          border-color: #ef4444;
          color: #dc2626;
        }
        
        .workflow-handle {
          width: 10px;
          height: 10px;
          background: #10b981;
          border: 2px solid white;
        }
        
        .workflow-handle-true {
          background: #10b981;
        }
        
        .workflow-handle-false {
          background: #ef4444;
        }
        
        .workflow-handle:hover {
          background: #059669;
          width: 12px;
          height: 12px;
        }
      `}</style>
    </div>
  );
};

export default ConditionNode;

