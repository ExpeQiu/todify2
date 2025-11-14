import React from 'react';
import { Handle, Position } from 'reactflow';
import { LogIn, Trash2 } from 'lucide-react';
import { InputNodeData, InputParameter } from '../../types/agentWorkflow';

export interface InputNodeProps {
  data: InputNodeData;
  selected?: boolean;
  onDelete?: () => void;
}

/**
 * 输入节点组件
 */
const InputNode: React.FC<InputNodeProps> = ({ data, selected, onDelete }) => {
  // 向后兼容：如果没有inputs数组，使用旧字段创建单个参数
  const inputs: InputParameter[] = data.inputs || (data.inputName ? [{
    name: data.inputName,
    type: data.inputType,
    defaultValue: data.defaultValue,
    description: data.description,
    required: data.required,
  }] : []);

  return (
    <div className={`input-node ${selected ? 'selected' : ''}`}>
      {/* 节点内容 */}
      <div className="input-node-content">
        <div className="input-node-header">
          <LogIn size={16} className="input-node-icon" />
          <span className="input-node-label">{data.label}</span>
        </div>
        
        <div className="input-node-info">
          {inputs.length === 0 ? (
            <div className="input-empty">暂无输入参数</div>
          ) : (
            inputs.map((input, index) => (
              <div key={index} className="input-parameter-item">
                <div className="input-parameter-header">
                  <div className="input-name">
                    <span className="input-label">参数:</span>
                    <span className="input-value">{input.name || '未设置'}</span>
                  </div>
                </div>
                 {input.type && (
                   <div className="input-type">
                     <span className="type-label">类型:</span>
                     <span className="type-value">
                       {input.type === 'file' ? '📄 文件' : input.type}
                     </span>
                   </div>
                 )}
                 {input.accept && input.type === 'file' && (
                   <div className="input-accept">
                     <span className="accept-label">接受:</span>
                     <span className="accept-value">{input.accept}</span>
                   </div>
                 )}
                {input.required && (
                  <span className="input-required">必需</span>
                )}
                <Handle 
                  type="source" 
                  position={Position.Right} 
                  className="workflow-handle"
                  id={`output_${index}`}
                  style={{ top: '50%', transform: 'translateY(-50%)' }}
                />
              </div>
            ))
          )}
        </div>
        
        {onDelete && (
          <button
            className="input-node-delete"
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
        .input-node {
          min-width: 180px;
          background: white;
          border: 2px solid #06b6d4;
          border-radius: 8px;
          padding: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
        }
        
        .input-node.selected {
          border-color: #0891b2;
          box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.1);
        }
        
        .input-node-content {
          position: relative;
        }
        
        .input-node-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        
        .input-node-icon {
          color: #06b6d4;
          flex-shrink: 0;
        }
        
        .input-node-label {
          font-weight: 600;
          font-size: 14px;
          color: #111827;
          flex: 1;
        }
        
        .input-node-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 12px;
          background: #ecfeff;
          padding: 8px;
          border-radius: 4px;
        }
        
        .input-parameter-item {
          position: relative;
          padding: 6px;
          background: white;
          border-radius: 4px;
          border-left: 3px solid #06b6d4;
        }
        
        .input-parameter-header {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .input-name,
        .input-type {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .input-label,
        .type-label {
          color: #0891b2;
          font-weight: 500;
        }
        
        .input-value,
        .type-value {
          color: #6b7280;
          font-family: 'Monaco', 'Courier New', monospace;
        }
        
        .input-required {
          display: inline-block;
          padding: 2px 6px;
          background: #dc2626;
          color: white;
          border-radius: 3px;
          font-size: 10px;
          font-weight: 600;
          margin-top: 4px;
        }
        
        .input-accept {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          margin-top: 4px;
        }
        
        .accept-label {
          color: #0891b2;
          font-weight: 500;
        }
        
        .accept-value {
          color: #6b7280;
          font-family: 'Monaco', 'Courier New', monospace;
        }
        
        .input-empty {
          color: #9ca3af;
          font-style: italic;
          text-align: center;
          padding: 8px;
        }
        
        .input-node-delete {
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
        
        .input-node:hover .input-node-delete {
          opacity: 1;
        }
        
        .input-node-delete:hover {
          background: #fee2e2;
          border-color: #ef4444;
          color: #dc2626;
        }
        
        .workflow-handle {
          width: 10px;
          height: 10px;
          background: #06b6d4;
          border: 2px solid white;
        }
        
        .workflow-handle:hover {
          background: #0891b2;
          width: 12px;
          height: 12px;
        }
      `}</style>
    </div>
  );
};

export default InputNode;

