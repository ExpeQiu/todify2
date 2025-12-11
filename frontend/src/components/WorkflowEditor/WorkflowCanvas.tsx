import React, { useCallback, useMemo, useEffect, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  ReactFlowInstance,
  ConnectionLineType,
  ConnectionMode,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import AgentNode from './AgentNode';
import ConditionNode from './nodes/ConditionNode';
import AssignNode from './nodes/AssignNode';
import MergeNode from './nodes/MergeNode';
import TransformNode from './nodes/TransformNode';
import InputNode from './nodes/InputNode';
import OutputNode from './nodes/OutputNode';
import MemoryNode from './nodes/MemoryNode';
import { AgentWorkflowNode, AgentWorkflowEdge } from '../../types/agentWorkflow';

const nodeTypes = {
  agent: AgentNode,
  condition: ConditionNode,
  assign: AssignNode,
  merge: MergeNode,
  transform: TransformNode,
  input: InputNode,
  output: OutputNode,
  memory: MemoryNode,
};

interface WorkflowCanvasProps {
  nodes: AgentWorkflowNode[];
  edges: AgentWorkflowEdge[];
  onNodesChange?: (nodes: Node[]) => void;
  onEdgesChange?: (edges: Edge[]) => void;
  onConnect?: (connection: Connection) => void;
  onNodeClick?: (node: Node) => void;
  onNodeDelete?: (nodeId: string) => void;
  readOnly?: boolean;
}

/**
 * 工作流画布组件
 */
const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  nodes: initialNodes,
  edges: initialEdges,
  onNodesChange: externalNodesChange,
  onEdgesChange: externalEdgesChange,
  onConnect: externalOnConnect,
  onNodeClick,
  onNodeDelete,
  readOnly = false,
}) => {
  // 转换内部节点格式为ReactFlow格式
  const convertToReactFlowNodes = useCallback((nodes: AgentWorkflowNode[]): Node[] => {
    return nodes.map((node) => {
      // 确保节点位置有效，如果无效或为负数则设置为默认值
      const defaultX = 100;
      const defaultY = 100;
      
      let positionX = defaultX;
      let positionY = defaultY;
      
      if (node.position) {
        // 验证x坐标
        if (typeof node.position.x === 'number' && !isNaN(node.position.x) && node.position.x >= 0) {
          positionX = node.position.x;
        }
        // 验证y坐标
        if (typeof node.position.y === 'number' && !isNaN(node.position.y) && node.position.y >= 0) {
          positionY = node.position.y;
        }
      }
      
      const position = {
        x: positionX,
        y: positionY,
      };
      
      return {
        id: node.id,
        type: node.type || 'agent',
        position,
        data: {
          ...node.data,
          agentId: node.agentId, // 确保 agentId 传递到节点数据
          agentName: (node.data as any).agentName,
          // 只有非agent类型的节点才传递onDelete
          ...(node.type !== 'agent' && { onDelete: () => onNodeDelete?.(node.id) }),
        },
      };
    });
  }, [onNodeDelete]);

  // 转换内部边格式为ReactFlow格式
  const convertToReactFlowEdges = useCallback((edges: AgentWorkflowEdge[]): Edge[] => {
    return edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle || undefined,
      targetHandle: edge.targetHandle || undefined,
      animated: edge.animated,
      label: typeof edge.label === 'string' ? edge.label : undefined,
      style: typeof edge.style === 'string' ? JSON.parse(edge.style) : edge.style,
      // 使用默认类型（Bezier）创建柔和曲线连接
      type: 'default',
    }));
  }, []);

  // 转换ReactFlow节点格式为内部格式
  const convertFromReactFlowNodes = useCallback((nodes: Node[], originalNodes: AgentWorkflowNode[]): AgentWorkflowNode[] => {
    const nodeMap = new Map(originalNodes.map(n => [n.id, n]));
    return nodes.map((node) => {
      const { onDelete, ...data } = node.data as any;
      const originalNode = nodeMap.get(node.id);
      
      // 从原始节点保留 agentId
      const agentId = originalNode?.agentId || (node.data as any).agentId;
      
      return {
        id: node.id,
        type: (node.type as any) || 'agent',
        position: node.position,
        agentId: agentId, // 明确保留 agentId
        data: {
          ...originalNode?.data,
          ...data,
        },
      };
    });
  }, []);

  // 转换ReactFlow边格式为内部格式
  const convertFromReactFlowEdges = useCallback((edges: Edge[]): AgentWorkflowEdge[] => {
    return edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle || undefined,
      targetHandle: edge.targetHandle || undefined,
      animated: edge.animated,
      label: typeof edge.label === 'string' ? edge.label : undefined,
      style: edge.style,
    }));
  }, []);

  // 初始化节点和边
  const [nodes, setNodes, onNodesChange] = useNodesState(
    useMemo(() => convertToReactFlowNodes(initialNodes), [initialNodes, convertToReactFlowNodes])
  );
  
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    useMemo(() => convertToReactFlowEdges(initialEdges), [initialEdges, convertToReactFlowEdges])
  );

  // 保存ReactFlow实例引用
  const reactFlowInstanceRef = useRef<ReactFlowInstance | null>(null);
  
  // 连接引导状态
  const [connectingNodeId, setConnectingNodeId] = useState<string | null>(null);
  const [connectionStartNode, setConnectionStartNode] = useState<Node | null>(null);
  
  // 右键菜单状态
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    nodeId: string | null;
  } | null>(null);
  
  // 处理ReactFlow实例初始化
  const onInit = useCallback((instance: ReactFlowInstance) => {
    reactFlowInstanceRef.current = instance;
    // 初始化时自动调整视图，确保所有节点都在视口内
    setTimeout(() => {
      if (nodes.length > 0) {
        instance.fitView({ 
          padding: 0.2, 
          duration: 400,
          includeHiddenNodes: false,
          minZoom: 0.1,
          maxZoom: 2
        });
      }
    }, 400);
  }, [nodes.length]);

  // 使用ref保存原始节点信息和更新标志
  const originalNodesRef = useRef<AgentWorkflowNode[]>(initialNodes);
  const isInternalUpdateRef = useRef(false);
  const shouldNotifyRef = useRef(false);
  
  // 同步外部节点和边变化到内部状态
  useEffect(() => {
    // 检查节点是否真的发生了变化（包括数据变化）
    // 使用 JSON.stringify 来深度比较节点数据
    const currentNodesStr = JSON.stringify(nodes.map(n => ({
      id: n.id,
      type: n.type,
      data: n.data,
      position: n.position,
    })));
    const incomingNodesStr = JSON.stringify(initialNodes.map(n => ({
      id: n.id,
      type: n.type,
      data: n.data,
      position: n.position,
      agentId: n.agentId,
    })));
    
    const nodesChanged = currentNodesStr !== incomingNodesStr;
    
    // 只在非内部更新且节点确实变化时同步外部变化
    if (!isInternalUpdateRef.current && nodesChanged) {
      originalNodesRef.current = initialNodes;
      const newNodes = convertToReactFlowNodes(initialNodes);
      setNodes(newNodes);
      shouldNotifyRef.current = false; // 外部更新不需要通知回去
      
      // 延迟执行fitView以确保DOM已更新，并确保所有节点都在视口内
      setTimeout(() => {
        if (reactFlowInstanceRef.current && newNodes.length > 0) {
          reactFlowInstanceRef.current.fitView({ 
            padding: 0.2, 
            duration: 400,
            includeHiddenNodes: false,
            minZoom: 0.1,
            maxZoom: 2
          });
        }
      }, 200);
    }
    isInternalUpdateRef.current = false;
  }, [initialNodes, convertToReactFlowNodes, setNodes, nodes]);

  useEffect(() => {
    // 检查边是否真的发生了变化
    const currentEdgeIds = new Set(edges.map(e => e.id));
    const incomingEdgeIds = new Set(initialEdges.map(e => e.id));
    const edgesChanged = 
      edges.length !== initialEdges.length ||
      !initialEdges.every(e => currentEdgeIds.has(e.id)) ||
      !edges.every(e => incomingEdgeIds.has(e.id));
    
    // 只在非内部更新且边确实变化时同步外部变化
    if (!isInternalUpdateRef.current && edgesChanged) {
      const newEdges = convertToReactFlowEdges(initialEdges);
      setEdges(newEdges);
      shouldNotifyRef.current = false; // 外部更新不需要通知回去
    }
    isInternalUpdateRef.current = false;
  }, [initialEdges, convertToReactFlowEdges, setEdges, edges]);

  // 监听内部节点状态变化并同步到外部（仅当是用户操作时）
  useEffect(() => {
    if (shouldNotifyRef.current && externalNodesChange) {
      const updatedNodes = convertFromReactFlowNodes(nodes, originalNodesRef.current);
      externalNodesChange(updatedNodes);
      // 更新ref以保持同步
      originalNodesRef.current = updatedNodes;
      shouldNotifyRef.current = false;
    }
  }, [nodes, externalNodesChange, convertFromReactFlowNodes]);

  // 监听内部边状态变化并同步到外部（仅当是用户操作时）
  useEffect(() => {
    if (shouldNotifyRef.current && externalEdgesChange) {
      const updatedEdges = convertFromReactFlowEdges(edges);
      externalEdgesChange(updatedEdges);
      shouldNotifyRef.current = false;
    }
  }, [edges, externalEdgesChange, convertFromReactFlowEdges]);

  // 处理节点变化（仅更新内部状态）
  const handleNodesChange = useCallback(
    (changes: any) => {
      isInternalUpdateRef.current = true;
      shouldNotifyRef.current = true;
      onNodesChange(changes);
    },
    [onNodesChange]
  );

  // 处理边变化（仅更新内部状态）
  const handleEdgesChange = useCallback(
    (changes: any) => {
      isInternalUpdateRef.current = true;
      shouldNotifyRef.current = true;
      onEdgesChange(changes);
    },
    [onEdgesChange]
  );

  // 处理连接开始
  const handleConnectStart = useCallback(
    (_event: any, { nodeId }: { nodeId: string | null }) => {
      if (readOnly) return;
      setConnectingNodeId(nodeId);
      if (nodeId) {
        const node = nodes.find(n => n.id === nodeId);
        setConnectionStartNode(node || null);
      }
    },
    [readOnly, nodes]
  );

  // 处理连接结束
  const handleConnectEnd = useCallback(() => {
    setConnectingNodeId(null);
    setConnectionStartNode(null);
  }, []);

  // 处理连接
  const handleConnect = useCallback(
    (connection: Connection) => {
      if (readOnly) return;
      
      // 验证连接有效性
      if (!connection.source || !connection.target) {
        return;
      }
      
      // 检查是否是自连接
      if (connection.source === connection.target) {
        return;
      }
      
      // 检查是否已存在相同的连接
      const edgeExists = edges.some(
        e => e.source === connection.source && e.target === connection.target
      );
      
      if (edgeExists) {
        return;
      }
      
      const newEdge: AgentWorkflowEdge = {
        id: `edge-${connection.source}-${connection.target}-${Date.now()}`,
        source: connection.source || '',
        target: connection.target || '',
        sourceHandle: connection.sourceHandle || undefined,
        targetHandle: connection.targetHandle || undefined,
      };
      
      const newEdges = addEdge(connection, edges);
      setEdges(newEdges);
      shouldNotifyRef.current = true;
      
      // 通知外部
      if (externalOnConnect) {
        externalOnConnect(connection);
      }
      
      // 重置连接状态
      setConnectingNodeId(null);
      setConnectionStartNode(null);
    },
    [readOnly, edges, setEdges, externalOnConnect]
  );

  // 处理节点点击
  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (onNodeClick) {
        onNodeClick(node);
      }
    },
    [onNodeClick]
  );

  // 处理画布点击（取消选择）
  const handlePaneClick = useCallback(() => {
    setContextMenu(null);
  }, []);

  // 处理节点右键点击
  const handleNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (readOnly) return;
      event.preventDefault();
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        nodeId: node.id,
      });
    },
    [readOnly]
  );

  // 处理删除节点
  const handleDeleteNode = useCallback(() => {
    if (!contextMenu?.nodeId || !onNodeDelete) return;
    onNodeDelete(contextMenu.nodeId);
    setContextMenu(null);
  }, [contextMenu, onNodeDelete]);

  // 处理复制节点
  const handleDuplicateNode = useCallback(() => {
    if (!contextMenu?.nodeId) return;
    const nodeToDuplicate = nodes.find(n => n.id === contextMenu.nodeId);
    if (!nodeToDuplicate) return;
    
    const newNode: Node = {
      ...nodeToDuplicate,
      id: `node_${Date.now()}`,
      position: {
        x: nodeToDuplicate.position.x + 50,
        y: nodeToDuplicate.position.y + 50,
      },
      selected: false,
    };
    
    const updatedNodes = [...nodes, newNode];
    setNodes(updatedNodes);
    shouldNotifyRef.current = true;
    
    if (externalNodesChange) {
      const convertedNodes = convertFromReactFlowNodes(updatedNodes, originalNodesRef.current);
      externalNodesChange(convertedNodes);
      originalNodesRef.current = convertedNodes;
    }
    
    setContextMenu(null);
  }, [contextMenu, nodes, setNodes, externalNodesChange, convertFromReactFlowNodes]);

  // 关闭右键菜单
  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // 更新节点样式以显示连接引导
  const nodesWithConnectionGuide = useMemo(() => {
    if (!connectingNodeId) return nodes;
    
    return nodes.map(node => {
      if (node.id === connectingNodeId) {
        return {
          ...node,
          style: {
            ...node.style,
            border: '2px solid #3b82f6',
            boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.2)',
          },
        };
      }
      // 高亮可连接的节点
      return {
        ...node,
        style: {
          ...node.style,
          opacity: 0.7,
          border: '2px solid #e5e7eb',
        },
      };
    });
  }, [nodes, connectingNodeId]);

  return (
    <div className="workflow-canvas">
      <ReactFlow
        nodes={nodesWithConnectionGuide}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onConnectStart={handleConnectStart}
        onConnectEnd={handleConnectEnd}
        onNodeClick={handleNodeClick}
        onNodeContextMenu={handleNodeContextMenu}
        onPaneClick={handlePaneClick}
        onInit={onInit}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        className="workflow-canvas-reactflow"
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        defaultEdgeOptions={{
          type: 'default',
          animated: false,
          style: { strokeWidth: 2, stroke: '#6366f1' },
        }}
        connectionLineType={ConnectionLineType.Bezier}
        connectionMode={ConnectionMode.Loose}
        snapToGrid
        snapGrid={[20, 20]}
        selectionOnDrag
        deleteKeyCode={['Delete', 'Backspace']}
        multiSelectionKeyCode={['Meta', 'Control']}
        connectionLineStyle={{
          strokeWidth: 2,
          stroke: '#3b82f6',
          strokeDasharray: '5,5',
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <Controls />
        <MiniMap />
        {connectingNodeId && (
          <Panel position="top-center" className="connection-guide-panel">
            <div className="connection-guide-text">
              拖拽到目标节点以创建连接
            </div>
          </Panel>
        )}
      </ReactFlow>

      {contextMenu && (
        <div
          className="context-menu"
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            zIndex: 1000,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="context-menu-item"
            onClick={handleDuplicateNode}
            disabled={readOnly}
          >
            <span>复制节点</span>
            <span className="context-menu-shortcut">Ctrl+D</span>
          </button>
          <button
            className="context-menu-item context-menu-item-danger"
            onClick={handleDeleteNode}
            disabled={readOnly}
          >
            <span>删除节点</span>
            <span className="context-menu-shortcut">Del</span>
          </button>
          <div className="context-menu-divider" />
          <button
            className="context-menu-item"
            onClick={closeContextMenu}
          >
            取消
          </button>
        </div>
      )}

      {contextMenu && (
        <div
          className="context-menu-overlay"
          onClick={closeContextMenu}
        />
      )}
      
      <style>{`
        .workflow-canvas {
          width: 100%;
          height: 100%;
          background: #f9fafb;
        }
        
        .workflow-canvas-reactflow {
          width: 100%;
          height: 100%;
        }

        .connection-guide-panel {
          pointer-events: none;
          z-index: 10;
        }

        .connection-guide-text {
          background: rgba(59, 130, 246, 0.9);
          color: white;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          animation: fadeIn 0.2s ease-in;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .react-flow__node.selected {
          box-shadow: 0 0 0 2px #3b82f6 !important;
        }

        .react-flow__handle {
          width: 8px;
          height: 8px;
          background: #6366f1;
          border: 2px solid white;
          transition: all 0.2s;
        }

        .react-flow__handle:hover {
          width: 12px;
          height: 12px;
          background: #3b82f6;
        }

        .react-flow__edge.selected .react-flow__edge-path {
          stroke: #3b82f6;
          strokeWidth: 3;
        }

        .context-menu-overlay {
          position: fixed;
          inset: 0;
          z-index: 999;
        }

        .context-menu {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          padding: 4px;
          min-width: 180px;
          z-index: 1000;
        }

        .context-menu-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 8px 12px;
          border: none;
          background: white;
          color: #374151;
          font-size: 14px;
          text-align: left;
          cursor: pointer;
          border-radius: 4px;
          transition: background 0.15s;
        }

        .context-menu-item:hover:not(:disabled) {
          background: #f3f4f6;
        }

        .context-menu-item:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .context-menu-item-danger {
          color: #dc2626;
        }

        .context-menu-item-danger:hover:not(:disabled) {
          background: #fee2e2;
        }

        .context-menu-shortcut {
          font-size: 12px;
          color: #9ca3af;
          margin-left: 16px;
        }

        .context-menu-divider {
          height: 1px;
          background: #e5e7eb;
          margin: 4px 0;
        }
      `}</style>
    </div>
  );
};

export default WorkflowCanvas;

