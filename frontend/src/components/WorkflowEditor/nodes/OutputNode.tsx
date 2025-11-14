import React from 'react';
import { Handle, Position } from 'reactflow';
import { LogOut, Trash2 } from 'lucide-react';
import { OutputNodeData, OutputParameter } from '../../types/agentWorkflow';

export interface OutputNodeProps {
  data: OutputNodeData;
  selected?: boolean;
  onDelete?: () => void;
}

/**
 * 输出节点组件
 */
const OutputNode: React.FC<OutputNodeProps> = ({ data, selected, onDelete }) => {
  // 向后兼容：如果没有outputs数组，使用旧字段创建单个参数
  const outputs: OutputParameter[] = data.outputs || (data.outputName ? [{
    name: data.outputName,
    sourceNodeId: data.sourceNodeId,
    sourceField: data.sourceField,
    type: data.outputType,
    description: data.description,
  }] : []);

  return (
    <div className={`output-node ${selected ? 'selected' : ''}`}>
      {/* 节点内容 */}
      <div className="output-node-content">
        <div className="output-node-header">
          <LogOut size={16} className="output-node-icon" />
          <span className="output-node-label">{data.label}</span>
        </div>
        
        <div className="output-node-info">
          {outputs.length === 0 ? (
            <div className="output-empty">暂无输出参数</div>
          ) : (
            outputs.map((output, index) => (
              <div key={index} className="output-parameter-item">
                <Handle 
                  type="target" 
                  position={Position.Left} 
                  className="workflow-handle"
                  id={`input_${index}`}
                  style={{ top: '50%', transform: 'translateY(-50%)' }}
                />
                <div className="output-parameter-content">
                  <div className="output-name">
                    <span className="output-label">参数:</span>
                    <span className="output-value">{output.name || '未设置'}</span>
                  </div>
                   {output.type && (
                     <div className="output-type">
                       <span className="type-label">类型:</span>
                       <span className="type-value">
                         {output.type === 'file' ? '📄 文件' : output.type}
                       </span>
                     </div>
                   )}
                   {output.downloadFileName && output.type === 'file' && (
                     <div className="output-filename">
                       <span className="filename-label">文件名:</span>
                       <span className="filename-value">{output.downloadFileName}</span>
                     </div>
                   )}
                  {output.sourceNodeId && (
                    <div className="output-source">
                      <span className="source-label">来源:</span>
                      <span className="source-value">{output.sourceNodeId}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        
        {onDelete && (
          <button
            className="output-node-delete"
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
      
      <style>{`
        .output-node {
          min-width: 180px;
          background: white;
          border: 2px solid #6366f1;
          border-radius: 8px;
          padding: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
        }
        
        .output-node.selected {
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }
        
        .output-node-content {
          position: relative;
        }
        
        .output-node-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        
        .output-node-icon {
          color: #6366f1;
          flex-shrink: 0;
        }
        
        .output-node-label {
          font-weight: 600;
          font-size: 14px;
          color: #111827;
          flex: 1;
        }
        
        .output-node-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 12px;
          background: #eef2ff;
          padding: 8px;
          border-radius: 4px;
        }
        
        .output-parameter-item {
          position: relative;
          padding: 6px;
          background: white;
          border-radius: 4px;
          border-left: 3px solid #6366f1;
        }
        
        .output-parameter-content {
          margin-left: 12px;
        }
        
        .output-name,
        .output-type,
        .output-source {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .output-label,
        .type-label,
        .source-label {
          color: #4f46e5;
          font-weight: 500;
        }
        
        .output-value,
        .type-value,
        .source-value {
          color: #6b7280;
          font-family: 'Monaco', 'Courier New', monospace;
        }
        
        .output-filename {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          margin-top: 4px;
        }
        
        .filename-label {
          color: #4f46e5;
          font-weight: 500;
        }
        
        .filename-value {
          color: #6b7280;
          font-family: 'Monaco', 'Courier New', monospace;
        }
        
        .output-empty {
          color: #9ca3af;
          font-style: italic;
          text-align: center;
          padding: 8px;
        }
        
        .output-node-delete {
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
        
        .output-node:hover .output-node-delete {
          opacity: 1;
        }
        
        .output-node-delete:hover {
          background: #fee2e2;
          border-color: #ef4444;
          color: #dc2626;
        }
        
        .workflow-handle {
          width: 10px;
          height: 10px;
          background: #6366f1;
          border: 2px solid white;
        }
        
        .workflow-handle:hover {
          background: #4f46e5;
          width: 12px;
          height: 12px;
        }
      `}</style>
    </div>
  );
};

export default OutputNode;

