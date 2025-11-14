import React from 'react';
import { Handle, Position } from 'reactflow';
import { Bot } from 'lucide-react';

export interface AgentNodeData {
  label: string;
  agentName?: string;
  agentId?: string;
}

interface AgentNodeProps {
  data: AgentNodeData;
  selected?: boolean;
}

/**
 * Agent节点组件
 */
const AgentNode: React.FC<AgentNodeProps> = ({ data, selected }) => {
  return (
    <div className={`agent-node ${selected ? 'selected' : ''}`}>
      {/* 输入句柄 */}
      <Handle 
        type="target" 
        position={Position.Left} 
        className="workflow-handle"
        id="target"
      />
      
      {/* 节点内容 */}
      <div className="agent-node-content">
        <div className="agent-node-header">
          <Bot size={16} className="agent-node-icon" />
          <span className="agent-node-label">{data.label}</span>
        </div>
        
        {data.agentName && (
          <div className="agent-node-subtitle">{data.agentName}</div>
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
        .agent-node {
          min-width: 180px;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          padding: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
        }
        
        .agent-node.selected {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        .agent-node-content {
          position: relative;
        }
        
        .agent-node-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }
        
        .agent-node-icon {
          color: #3b82f6;
          flex-shrink: 0;
        }
        
        .agent-node-label {
          font-weight: 600;
          font-size: 14px;
          color: #111827;
          flex: 1;
        }
        
        .agent-node-subtitle {
          font-size: 12px;
          color: #6b7280;
          margin-left: 24px;
        }
        
        .workflow-handle {
          width: 10px;
          height: 10px;
          background: #3b82f6;
          border: 2px solid white;
        }
        
        .workflow-handle:hover {
          background: #2563eb;
          width: 12px;
          height: 12px;
        }
      `}</style>
    </div>
  );
};

export default AgentNode;

