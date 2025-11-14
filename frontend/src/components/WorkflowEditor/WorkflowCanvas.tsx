import React, { useCallback, useMemo, useEffect, useRef } from 'react';
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
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      animated: edge.animated,
      label: edge.label,
      style: typeof edge.style === 'string' ? JSON.parse(edge.style) : edge.style,
      // 使用 bezier 类型创建曲线连接
      type: 'bezier',
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
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      animated: edge.animated,
      label: edge.label,
      style: edge.style ? JSON.stringify(edge.style) : undefined,
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

  // 处理连接
  const handleConnect = useCallback(
    (connection: Connection) => {
      if (readOnly) return;
      
      // 验证连接有效性
      if (!connection.source || !connection.target) {
        console.warn('连接无效：缺少源节点或目标节点');
        return;
      }
      
      // 检查是否是自连接
      if (connection.source === connection.target) {
        console.warn('不能连接节点到自身');
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
      
      console.log('添加连接:', newEdge);
      
      // 通知外部
      if (externalOnConnect) {
        externalOnConnect(connection);
      }
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

  return (
    <div className="workflow-canvas">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onNodeClick={handleNodeClick}
        onInit={onInit}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        className="workflow-canvas-reactflow"
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        defaultEdgeOptions={{
          type: 'bezier',
          animated: false,
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <Controls />
        <MiniMap />
      </ReactFlow>
      
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
      `}</style>
    </div>
  );
};

export default WorkflowCanvas;

