import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, FileText, Sparkles, ChevronRight, Loader } from 'lucide-react';
import { Connection } from 'reactflow';
import TopNavigation from '../components/TopNavigation';
import WorkflowCanvas from '../components/WorkflowEditor/WorkflowCanvas';
import ToolbarPanel from '../components/WorkflowEditor/ToolbarPanel';
import NodeConfigPanel from '../components/WorkflowEditor/NodeConfigPanel';
import WorkflowSettingsModal from '../components/WorkflowEditor/WorkflowSettingsModal';
import SaveTemplateModal from '../components/WorkflowEditor/SaveTemplateModal';
import MultiChatContainer from '../components/MultiChatContainer';
import ConfirmDialog from '../components/common/ConfirmDialog';
import WorkflowRunInputModal from '../components/WorkflowEditor/WorkflowRunInputModal';
import { AgentWorkflow, AgentWorkflowNode, AgentWorkflowEdge, InputParameter, WorkflowExecutionMode } from '../types/agentWorkflow';
import { WorkflowNodeType } from '../types/agentWorkflow';
import { AIRoleConfig } from '../types/aiRole';
import { agentWorkflowService } from '../services/agentWorkflowService';
import { aiRoleService } from '../services/aiRoleService';
import { WorkflowEngine } from '../services/workflowEngine';
import { createSmartWorkflowTemplate, validateSmartWorkflowAgents } from '../utils/smartWorkflowTemplate';
import { getNodeTypeMetadata } from '../config/workflowNodeTypes';
import { toast } from 'sonner';

/**
 * Agent工作流主页面
 */
const AgentWorkflowPage: React.FC = () => {
  const [workflows, setWorkflows] = useState<AgentWorkflow[]>([]);
  const [currentWorkflow, setCurrentWorkflow] = useState<AgentWorkflow | null>(null);
  const [agents, setAgents] = useState<AIRoleConfig[]>([]);
  const [selectedNode, setSelectedNode] = useState<AgentWorkflowNode | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [creatingSmartWorkflow, setCreatingSmartWorkflow] = useState(false);
  const [editingWorkflowId, setEditingWorkflowId] = useState<string | null>(null);
  const [editingWorkflowName, setEditingWorkflowName] = useState<string>('');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [showMultiChatModal, setShowMultiChatModal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmSwitchOpen, setConfirmSwitchOpen] = useState(false);
  const [pendingSwitchWorkflow, setPendingSwitchWorkflow] = useState<AgentWorkflow | null>(null);
  const [confirmPublishOpen, setConfirmPublishOpen] = useState(false);
  const [pendingPublishStatus, setPendingPublishStatus] = useState<boolean | null>(null);
  const [runModalOpen, setRunModalOpen] = useState(false);
  const [runParams, setRunParams] = useState<InputParameter[]>([]);
  const [confirmCreateNewOpen, setConfirmCreateNewOpen] = useState(false);
  const [workflowSearch, setWorkflowSearch] = useState('');
  const [workflowSort, setWorkflowSort] = useState<'updated' | 'nodes'>('updated');
  const [confirmRestoreOpen, setConfirmRestoreOpen] = useState(false);
  const [draftWorkflow, setDraftWorkflow] = useState<AgentWorkflow | null>(null);
  const [confirmCreateSmartWorkflowOpen, setConfirmCreateSmartWorkflowOpen] = useState(false);
  const [confirmRunWithUnconfiguredNodesOpen, setConfirmRunWithUnconfiguredNodesOpen] = useState(false);
  const [unconfiguredNodeNames, setUnconfiguredNodeNames] = useState<string>('');
  const [confirmEditNameOpen, setConfirmEditNameOpen] = useState(false);
  const [pendingEditWorkflow, setPendingEditWorkflow] = useState<AgentWorkflow | null>(null);
  const [compiling, setCompiling] = useState(false);
  const [compileResult, setCompileResult] = useState<{ isValid: boolean; errors: string[] } | null>(null);

  // 加载数据
  useEffect(() => {
    loadWorkflows();
    loadAgents();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const tag = target?.tagName?.toLowerCase();
      const isInput = tag === 'input' || tag === 'textarea' || target?.isContentEditable;
      const isMac = navigator.platform.toLowerCase().includes('mac');
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
      
      // 如果正在编辑工作流名称，只处理 ESC 和 Enter
      if (editingWorkflowId) {
        if (e.key === 'Escape') {
          handleCancelEditWorkflowName();
        }
        return;
      }
      
      // 如果焦点在输入框，只处理全局快捷键
      if (isInput) {
        // Ctrl+F 聚焦搜索框
        if (cmdOrCtrl && e.key.toLowerCase() === 'f') {
          e.preventDefault();
          const searchInput = document.querySelector('.workflow-search-input') as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
            searchInput.select();
          }
        }
        return;
      }
      
      // 全局快捷键
      if (cmdOrCtrl && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (isDirty) handleSave();
      } else if (cmdOrCtrl && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      } else if (cmdOrCtrl && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setShowSidebar(s => !s);
      } else if (cmdOrCtrl && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        const searchInput = document.querySelector('.workflow-search-input') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      } else if (cmdOrCtrl && e.key.toLowerCase() === 'd' && selectedNode) {
        e.preventDefault();
        handleDuplicateNode();
      } else if (e.key === 'F2') {
        if (currentWorkflow) {
          setEditingWorkflowId(currentWorkflow.id);
          setEditingWorkflowName(currentWorkflow.name);
        }
      } else if (e.key === 'Escape') {
        // ESC 关闭配置面板
        if (selectedNode) {
          setSelectedNode(null);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isDirty, currentWorkflow, selectedNode, editingWorkflowId]);

  useEffect(() => {
    try {
      localStorage.setItem('agent-workflow-sidebar-open', JSON.stringify(showSidebar));
    } catch {}
  }, [showSidebar]);

  useEffect(() => {
    if (currentWorkflow?.id) {
      try {
        localStorage.setItem('agent-workflow-selected-id', currentWorkflow.id);
      } catch {}
    }
  }, [currentWorkflow?.id]);

  useEffect(() => {
    try {
      localStorage.setItem('agent-workflow-search', workflowSearch);
      localStorage.setItem('agent-workflow-sort', workflowSort);
    } catch {}
  }, [workflowSearch, workflowSort]);

  useEffect(() => {
    const savedSidebar = localStorage.getItem('agent-workflow-sidebar-open');
    const savedSearch = localStorage.getItem('agent-workflow-search');
    const savedSort = localStorage.getItem('agent-workflow-sort');
    if (savedSidebar) setShowSidebar(JSON.parse(savedSidebar));
    if (savedSearch) setWorkflowSearch(savedSearch);
    if (savedSort) setWorkflowSort(savedSort as any);
    const draft = localStorage.getItem('agent-workflow-autosave');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setDraftWorkflow(parsed);
        setConfirmRestoreOpen(true);
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (isDirty && currentWorkflow) {
      const timer = setTimeout(() => {
        try {
          localStorage.setItem('agent-workflow-autosave', JSON.stringify(currentWorkflow));
        } catch {}
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isDirty, currentWorkflow]);

  const loadWorkflows = async () => {
    try {
      const data = await agentWorkflowService.getAllWorkflows();
      // 去重：基于ID去除重复的工作流
      const uniqueWorkflows = Array.from(
        new Map(data.map(workflow => [workflow.id, workflow])).values()
      );
      setWorkflows(uniqueWorkflows);
      
      // 如果存在"智能工作流"，优先选择它
      const smartWorkflow = uniqueWorkflows.find(w => w.name === '智能工作流');
      if (smartWorkflow) {
        setCurrentWorkflow(smartWorkflow);
      } else if (uniqueWorkflows.length > 0) {
        setCurrentWorkflow(uniqueWorkflows[0]);
      } else {
        // 如果没有工作流，尝试创建默认智能工作流
        await createDefaultSmartWorkflow();
      }
    } catch (error: any) {
      // 对于后端未运行的情况，静默处理，不输出错误日志
      const errorStatus = error?.response?.status || 'N/A';
      const errorCode = error?.code;
      if (errorStatus === 500 || errorCode === 'ECONNREFUSED' || errorCode === 'ERR_NETWORK') {
        // 静默失败，保持当前状态
        return;
      }
      console.error('加载工作流失败:', error);
    }
  };

  // 创建默认智能工作流
  const createDefaultSmartWorkflow = async () => {
    try {
      // 确保agents已经加载
      if (agents.length === 0) {
        await loadAgents();
      }
      
      const validation = validateSmartWorkflowAgents(agents);
      if (!validation.isValid) {
        // 完全静默处理，不输出任何日志
        // 仍然创建，但使用可用的Agent
      }

      const smartWorkflow = createSmartWorkflowTemplate(agents, {
        name: '智能工作流',
        description: '从AI问答到演讲稿生成的完整工作流程',
      });

      // 保存到后端
      const created = await agentWorkflowService.createWorkflow(smartWorkflow);
      setWorkflows([created]);
      setCurrentWorkflow(created);
      return created;
    } catch (error: any) {
      // 对于后端未运行的情况，完全静默处理，不输出任何日志
      const errorStatus = error?.response?.status || 'N/A';
      const errorCode = error?.code;
      if (errorStatus === 500 || errorCode === 'ECONNREFUSED' || errorCode === 'ERR_NETWORK') {
        // 静默失败，不阻止页面加载
        return null;
      }
      // 其他错误才输出日志
      console.error('创建默认智能工作流失败:', error);
      return null;
    }
  };

  // 从模板创建智能工作流
  const handleCreateSmartWorkflow = async () => {
    setCreatingSmartWorkflow(true);
    try {
      const validation = validateSmartWorkflowAgents(agents);
      
      if (!validation.isValid && validation.missing.length > 0) {
        setConfirmCreateSmartWorkflowOpen(true);
        setCreatingSmartWorkflow(false);
        return;
      }

      await executeCreateSmartWorkflow();
    } catch (error: any) {
      const errorStatus = error?.response?.status || 'N/A';
      const errorCode = error?.code;
      
      // 对于后端未运行的情况，只显示警告，不输出错误日志
      if (errorStatus === 500 || errorCode === 'ECONNREFUSED' || errorCode === 'ERR_NETWORK') {
        console.warn('创建智能工作流失败: 后端服务器未运行');
        toast.error('创建失败', { 
          description: '后端服务器未运行，请确保后端服务器正在运行（端口 3003）' 
        });
      } else {
        console.error('创建智能工作流失败:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        toast.error('创建失败', { 
          description: errorMessage || '请确保后端服务器正在运行（端口 3003）' 
        });
      }
      setCreatingSmartWorkflow(false);
    }
  };

  // 执行创建智能工作流
  const executeCreateSmartWorkflow = async () => {
    try {
      const smartWorkflow = createSmartWorkflowTemplate(agents, {
        name: '智能工作流',
        description: '从AI问答到演讲稿生成的完整工作流程',
      });

      const created = await agentWorkflowService.createWorkflow(smartWorkflow);
      await loadWorkflows();
      setCurrentWorkflow(created);
      setIsDirty(false);
      toast.success('智能工作流创建成功');
    } catch (error: any) {
      throw error;
    } finally {
      setCreatingSmartWorkflow(false);
    }
  };

  // 切换工作流
  const handleSwitchWorkflow = (workflow: AgentWorkflow, skipCheck?: boolean) => {
    // 如果正在编辑名称，不允许切换
    if (editingWorkflowId) {
      return;
    }
    
    if (!skipCheck && isDirty && currentWorkflow) {
      setPendingSwitchWorkflow(workflow);
      setConfirmSwitchOpen(true);
      return;
    }
    setCurrentWorkflow(workflow);
    setSelectedNode(null);
    setIsDirty(false);
  };

  // 删除工作流
  const handleDeleteWorkflow = async (workflowId: string) => {
    setConfirmDeleteId(workflowId);
  };

  // 创建新工作流
  const handleCreateNewWorkflow = () => {
    if (isDirty && currentWorkflow) {
      setConfirmCreateNewOpen(true);
      return;
    }

    const newWorkflow: AgentWorkflow = {
      id: `workflow-${Date.now()}`,
      name: `新工作流 ${workflows.length + 1}`,
      description: '',
      version: '1.0.0',
      nodes: [],
      edges: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setCurrentWorkflow(newWorkflow);
    setSelectedNode(null);
    setIsDirty(false); // 新创建的工作流初始状态为未修改（因为还没有内容）
  };

  // 创建 +DAG工作流（Native 引擎）
  const handleCreateDagWorkflow = () => {
    if (isDirty && currentWorkflow) {
      setConfirmCreateNewOpen(true);
      return;
    }

    const newWorkflow: AgentWorkflow = {
      id: `workflow-${Date.now()}`,
      name: `DAG工作流 ${workflows.length + 1}`,
      description: '',
      version: '1.0.0',
      nodes: [
        {
          id: 'node_input_1',
          type: 'input',
          position: { x: 100, y: 200 },
          data: { 
            label: '用户输入', 
            inputs: [{ name: 'query', type: 'string', required: true, description: '用户问题' }] 
          }
        },
        {
          id: 'node_agent_1',
          type: 'agent',
          position: { x: 400, y: 200 },
          data: { label: 'AI 助手' },
          agentId: '' 
        },
        {
          id: 'node_output_1',
          type: 'output',
          position: { x: 700, y: 200 },
          data: { label: '最终结果' }
        }
      ],
      edges: [
        {
          id: 'edge_1',
          source: 'node_input_1',
          target: 'node_agent_1'
        },
        {
          id: 'edge_2',
          source: 'node_agent_1',
          target: 'node_output_1'
        }
      ],
      engine: 'native',
      metadata: { engine: 'native' },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setCurrentWorkflow(newWorkflow);
    setSelectedNode(null);
    setIsDirty(false);
  };

  // 创建 +LangGraph工作流（LangGraph 引擎）
  const handleCreateLangGraphWorkflow = () => {
    if (isDirty && currentWorkflow) {
      setConfirmCreateNewOpen(true);
      return;
    }

    const newWorkflow: AgentWorkflow = {
      id: `workflow-${Date.now()}`,
      name: `LangGraph工作流 ${workflows.length + 1}`,
      description: '',
      version: '1.0.0',
      nodes: [
        {
          id: 'node_input_1',
          type: 'input',
          position: { x: 50, y: 200 },
          data: { 
            label: '开始',
            inputs: [{ name: 'topic', type: 'string', required: true, description: '主题' }]
          }
        },
        {
          id: 'node_agent_1',
          type: 'agent',
          position: { x: 300, y: 200 },
          data: { label: '生成内容' },
          agentId: ''
        },
        {
          id: 'node_condition_1',
          type: 'condition',
          position: { x: 600, y: 200 },
          data: { 
            label: '检查质量',
            condition: {
              left: 'result.length',
              operator: '>',
              right: 50
            },
            trueLabel: '通过',
            falseLabel: '重试'
          }
        },
        {
          id: 'node_output_1',
          type: 'output',
          position: { x: 900, y: 100 },
          data: { label: '结束任务' }
        }
      ],
      edges: [
        {
          id: 'edge_1',
          source: 'node_input_1',
          target: 'node_agent_1'
        },
        {
          id: 'edge_2',
          source: 'node_agent_1',
          target: 'node_condition_1'
        },
        {
          id: 'edge_3',
          source: 'node_condition_1',
          target: 'node_output_1',
          sourceHandle: 'true',
          label: '通过'
        },
        {
          id: 'edge_4',
          source: 'node_condition_1',
          target: 'node_agent_1',
          sourceHandle: 'false',
          label: '重试'
        }
      ],
      engine: 'langgraph',
      metadata: { engine: 'langgraph' },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setCurrentWorkflow(newWorkflow);
    setSelectedNode(null);
    setIsDirty(false);
  };

  const loadAgents = async () => {
    try {
      const data = await aiRoleService.getAIRoles();
      setAgents(data.filter(a => a.enabled));
    } catch (error: any) {
      // 对于后端未运行的情况，静默处理，不输出错误日志
      const errorStatus = error?.response?.status || 'N/A';
      const errorCode = error?.code;
      if (errorStatus === 500 || errorCode === 'ECONNREFUSED' || errorCode === 'ERR_NETWORK') {
        // 静默失败，保持当前状态
        return;
      }
      console.error('加载Agents失败:', error);
    }
  };

  const handleAddNode = (nodeType: WorkflowNodeType = 'agent') => {
    if (!currentWorkflow) {
      // 如果没有当前工作流，先创建一个
      const newWorkflow: AgentWorkflow = {
        id: `workflow-${Date.now()}`,
        name: `新工作流 ${workflows.length + 1}`,
        description: '',
        version: '1.0.0',
        nodes: [],
        edges: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setCurrentWorkflow(newWorkflow);
      
      // 延迟添加节点，确保工作流已设置
      setTimeout(() => {
        handleAddNode(nodeType);
      }, 0);
      return;
    }

    // 计算新节点的位置（避免重叠，使用网格布局）
    const existingNodes = currentWorkflow.nodes || [];
    const spacing = 250; // 节点间距
    const startX = 100;
    const startY = 100;
    
    // 计算网格布局
    const cols = Math.max(3, Math.ceil(Math.sqrt(existingNodes.length + 1)));
    const row = Math.floor(existingNodes.length / cols);
    const col = existingNodes.length % cols;
    
    // 获取节点类型元数据
    const nodeTypeMeta = getNodeTypeMetadata(nodeType);
    
    // 根据节点类型创建默认节点
    const newNode: AgentWorkflowNode = {
      id: `node_${Date.now()}`,
      type: nodeType,
      position: { 
        x: startX + col * spacing, 
        y: startY + row * spacing 
      },
      data: {
        ...nodeTypeMeta.defaultData,
        label: `${nodeTypeMeta.name} ${existingNodes.length + 1}`,
      },
      // agent类型需要agentId
      ...(nodeType === 'agent' && { agentId: '' }),
    };

    const updatedWorkflow = {
      ...currentWorkflow,
      nodes: [...currentWorkflow.nodes, newNode],
    };

    setCurrentWorkflow(updatedWorkflow);
    setIsDirty(true);
    
    // 选中新添加的节点
    setSelectedNode(newNode);
  };

  const handleSave = async () => {
    if (!currentWorkflow) return;

    setLoading(true);
    try {
      let savedWorkflow: AgentWorkflow;
      if (currentWorkflow.id && workflows.find(w => w.id === currentWorkflow.id)) {
        // 更新现有工作流
        savedWorkflow = await agentWorkflowService.updateWorkflow(currentWorkflow.id, currentWorkflow);
      } else {
        // 创建新工作流
        savedWorkflow = await agentWorkflowService.createWorkflow(currentWorkflow);
      }
      
      // 更新当前工作流为保存后的版本
      setCurrentWorkflow(savedWorkflow);
      setIsDirty(false);
      
      // 重新加载工作流列表
      await loadWorkflows();
      
      toast.success('工作流已保存');
    } catch (error: any) {
      console.error('保存工作流失败:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error('保存失败', { 
        description: errorMessage || '请确保后端服务器正在运行（端口 3003）' 
      });
      throw error; // 抛出错误以便调用者处理
    } finally {
      setLoading(false);
    }
  };

  const handleRun = async () => {
    if (!currentWorkflow) {
      toast.error('请先创建一个工作流');
      return;
    }

    // 验证工作流
    if (!currentWorkflow.nodes || currentWorkflow.nodes.length === 0) {
      toast.error('工作流至少需要一个节点');
      return;
    }

    // 验证所有节点是否配置了Agent
    const unconfiguredNodes = currentWorkflow.nodes.filter(node => !node.agentId || node.agentId.trim() === '');
    if (unconfiguredNodes.length > 0) {
      const nodeNames = unconfiguredNodes.map(n => n.data?.label || n.id).join(', ');
      setUnconfiguredNodeNames(nodeNames);
      setConfirmRunWithUnconfiguredNodesOpen(true);
      return;
    }

    setLoading(true);
    try {
      // 先保存工作流（如果保存失败会抛出错误）
      await handleSave();
      
      // 使用保存后的最新工作流执行
      const latestWorkflow = workflows.find(w => w.id === currentWorkflow.id) || currentWorkflow;
      
      // 验证工作流是否有效
      const validNodes = latestWorkflow.nodes.filter(n => n.agentId && n.agentId.trim() !== '');
      if (validNodes.length === 0) {
        toast.error('工作流中没有配置Agent的节点，无法执行');
        return;
      }

      // 收集所有输入节点的参数
      const inputNodes = latestWorkflow.nodes.filter(n => n.type === 'input');
      const inputParams: InputParameter[] = [];
      
      inputNodes.forEach(node => {
        const nodeData = node.data as any;
        const inputs = nodeData.inputs || [];
        inputs.forEach((input: InputParameter) => {
          inputParams.push(input);
        });
      });
      
      if (inputParams.length > 0) {
        setRunParams(inputParams);
        setRunModalOpen(true);
        return;
      }
      executeWorkflowWithInput({ query: '测试输入' });
      
    } catch (error) {
      console.error('执行工作流失败:', error);
      toast.error('执行失败', { description: error instanceof Error ? error.message : String(error) });
      setLoading(false);
    }
  };
  
  // 执行工作流的辅助函数
  const executeWorkflowWithInput = async (input: any) => {
    if (!currentWorkflow) return;
    
    try {
      const latestWorkflow = workflows.find(w => w.id === currentWorkflow.id) || currentWorkflow;
      const useLangGraph = (latestWorkflow.engine || latestWorkflow.metadata?.engine) === 'langgraph';
      let result: any;
      if (useLangGraph && latestWorkflow.id) {
        const resp = await agentWorkflowService.executeWorkflow(latestWorkflow.id, input, { engine: 'langgraph' });
        result = resp;
      } else {
        const engine = new WorkflowEngine();
        result = await engine.execute(
          latestWorkflow,
          { input, logging: true, continueOnError: true }
        );
      }
      
      console.log('执行结果:', result);
      
      // 显示执行结果
      const successCount = result.nodeResults?.filter((r: any) => r.status === 'completed').length || 0;
      const failCount = result.nodeResults?.filter((r: any) => r.status === 'failed').length || 0;
      toast.success('工作流执行完成', { description: `成功 ${successCount}，失败 ${failCount}` });
    } catch (error) {
      console.error('执行工作流失败:', error);
      toast.error('执行失败', { description: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  };

  const handleNodeClick = useCallback((node: any) => {
    const workflowNode = currentWorkflow?.nodes.find(n => n.id === node.id);
    if (workflowNode) {
      setSelectedNode(workflowNode);
    } else {
      console.warn(`无法找到节点 ${node.id}`);
      setSelectedNode(null);
    }
  }, [currentWorkflow]);

  const handleNodeDelete = (nodeId: string) => {
    if (!currentWorkflow) return;

    const updatedWorkflow = {
      ...currentWorkflow,
      nodes: currentWorkflow.nodes.filter(n => n.id !== nodeId),
      edges: currentWorkflow.edges.filter(e => e.source !== nodeId && e.target !== nodeId),
    };

    setCurrentWorkflow(updatedWorkflow);
    setIsDirty(true);
    
    // 如果删除的是当前选中的节点，取消选择
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  };

  // 复制节点
  const handleDuplicateNode = () => {
    if (!currentWorkflow || !selectedNode) return;

    const nodeToDuplicate = selectedNode;
    const spacing = 50;
    
    const newNode: AgentWorkflowNode = {
      ...nodeToDuplicate,
      id: `node_${Date.now()}`,
      position: {
        x: nodeToDuplicate.position.x + spacing,
        y: nodeToDuplicate.position.y + spacing,
      },
      data: {
        ...nodeToDuplicate.data,
        label: `${nodeToDuplicate.data?.label || '节点'} 副本`,
      },
    };

    const updatedWorkflow = {
      ...currentWorkflow,
      nodes: [...currentWorkflow.nodes, newNode],
    };

    setCurrentWorkflow(updatedWorkflow);
    setIsDirty(true);
    setSelectedNode(newNode);
    toast.success('节点已复制');
  };

  const handleNodeSave = (node: AgentWorkflowNode) => {
    if (!currentWorkflow) {
      console.error('无法保存节点：当前工作流不存在');
      return;
    }

    console.log('handleNodeSave 被调用:', {
      nodeId: node.id,
      nodeType: node.type,
      nodeData: node.data,
    });

    // 查找并更新节点
    const nodeIndex = currentWorkflow.nodes.findIndex(n => n.id === node.id);
    
    if (nodeIndex === -1) {
      console.error(`无法找到节点 ${node.id}`);
      return;
    }

    // 创建新的节点数组，确保深拷贝
    const updatedNodes = currentWorkflow.nodes.map((n, index) => {
      if (index === nodeIndex) {
        // 确保返回的节点包含所有必要字段
        return {
          ...n,
          ...node,
          data: {
            ...n.data,
            ...node.data,
          },
        };
      }
      return n;
    });

    const updatedWorkflow: AgentWorkflow = {
      ...currentWorkflow,
      nodes: updatedNodes,
    };

    console.log('更新工作流:', {
      workflowId: updatedWorkflow.id,
      nodesCount: updatedNodes.length,
      updatedNodeIndex: nodeIndex,
      updatedNode: updatedNodes[nodeIndex],
    });

    setCurrentWorkflow(updatedWorkflow);
    // 更新选中的节点，确保配置面板显示最新数据
    setSelectedNode(updatedNodes[nodeIndex]);
    setIsDirty(true);
    
    // 提示保存成功
    console.log('节点配置已保存:', node);
    
    // 可以添加用户可见的成功提示
    // alert('节点配置已保存');
  };

  const handleConnect = useCallback((connection: Connection) => {
    if (!currentWorkflow) return;
    
    // 检查是否已存在相同的连接
    const edgeExists = currentWorkflow.edges.some(
      e => e.source === connection.source && e.target === connection.target
    );
    
    if (edgeExists) {
      console.warn('连接已存在');
      return;
    }
    
    // 创建新边
    const newEdge: AgentWorkflowEdge = {
      id: `edge-${connection.source}-${connection.target}-${Date.now()}`,
      source: connection.source || '',
      target: connection.target || '',
      sourceHandle: connection.sourceHandle || undefined,
      targetHandle: connection.targetHandle || undefined,
    };
    
    // 更新工作流
    const updatedWorkflow = {
      ...currentWorkflow,
      edges: [...currentWorkflow.edges, newEdge],
    };
    
    setCurrentWorkflow(updatedWorkflow);
    setIsDirty(true);
    console.log('节点连接已添加:', newEdge);
  }, [currentWorkflow]);

  // 开始编辑工作流名称
  const handleStartEditWorkflowName = (workflow: AgentWorkflow, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault(); // 阻止默认行为和事件冒泡
    
    // 如果是当前工作流且有未保存的更改，先询问用户
    if (isDirty && currentWorkflow && currentWorkflow.id === workflow.id) {
      setPendingEditWorkflow(workflow);
      setConfirmEditNameOpen(true);
      return;
    }
    
    // 直接进入编辑模式
    setEditingWorkflowId(workflow.id);
    setEditingWorkflowName(workflow.name);
  };

  // 确认编辑名称（保存后编辑）
  const handleConfirmEditName = async () => {
    if (!pendingEditWorkflow) return;
    setConfirmEditNameOpen(false);
    
    try {
      await handleSave();
      setEditingWorkflowId(pendingEditWorkflow.id);
      setEditingWorkflowName(pendingEditWorkflow.name);
    } catch {
      // 保存失败，仍然允许编辑名称
      setEditingWorkflowId(pendingEditWorkflow.id);
      setEditingWorkflowName(pendingEditWorkflow.name);
    } finally {
      setPendingEditWorkflow(null);
    }
  };

  // 取消编辑名称确认（直接编辑）
  const handleCancelEditName = () => {
    if (!pendingEditWorkflow) return;
    setConfirmEditNameOpen(false);
    setIsDirty(false);
    setEditingWorkflowId(pendingEditWorkflow.id);
    setEditingWorkflowName(pendingEditWorkflow.name);
    setPendingEditWorkflow(null);
  };

  // 保存工作流名称
  const handleSaveWorkflowName = async (workflowId: string) => {
    if (!editingWorkflowName || editingWorkflowName.trim() === '') {
      toast.error('工作流名称不能为空');
      setEditingWorkflowId(null);
      return;
    }

    try {
      const workflow = workflows.find(w => w.id === workflowId);
      if (!workflow) return;

      // 更新工作流名称
      const updated = await agentWorkflowService.updateWorkflow(workflowId, {
        name: editingWorkflowName.trim(),
      });

      // 更新列表中的工作流
      setWorkflows(workflows.map(w => w.id === workflowId ? updated : w));
      
      // 如果当前正在编辑这个工作流，也更新currentWorkflow
      if (currentWorkflow?.id === workflowId) {
        setCurrentWorkflow(updated);
      }

      setEditingWorkflowId(null);
      toast.success('工作流名称已更新');
      console.log('工作流名称已更新:', updated.name);
    } catch (error) {
      console.error('更新工作流名称失败:', error);
      toast.error('更新失败', { 
        description: error instanceof Error ? error.message : String(error) 
      });
    }
  };

  // 取消编辑工作流名称
  const handleCancelEditWorkflowName = () => {
    setEditingWorkflowId(null);
    setEditingWorkflowName('');
  };

  // 处理设置按钮点击
  const handleSettings = () => {
    if (!currentWorkflow) {
      toast.error('请先选择一个工作流');
      return;
    }
    setShowSettingsModal(true);
  };

  const handleCompile = async () => {
    if (!currentWorkflow?.id) return;
    setCompiling(true);
    try {
      const engine = (currentWorkflow.engine || currentWorkflow.metadata?.engine || 'native') as 'native' | 'langgraph';
      const res = await agentWorkflowService.compileWorkflow(currentWorkflow.id, engine);
      setCompileResult(res);
      if (res.isValid) {
        toast.success('编译通过');
      } else {
        toast.error('编译失败', { description: `${res.errors.length} 个问题` });
      }
    } catch (e: any) {
      toast.error('编译失败', { description: e?.message });
    } finally {
      setCompiling(false);
    }
  };

  // 处理保存模版按钮点击
  const handleSaveTemplate = () => {
    if (!currentWorkflow) {
      toast.error('请先选择一个工作流');
      return;
    }
    setShowSaveTemplateModal(true);
  };

  // 处理发布工作流按钮点击
  const handlePublish = async () => {
    if (!currentWorkflow) {
      toast.error('请先选择一个工作流');
      return;
    }

    const newPublishedStatus = !currentWorkflow.published;
    setPendingPublishStatus(newPublishedStatus);
    setConfirmPublishOpen(true);
  };

  // 确认发布/取消发布
  const handleConfirmPublish = async () => {
    if (!currentWorkflow || pendingPublishStatus === null) return;
    
    const action = pendingPublishStatus ? '发布' : '取消发布';
    
    try {
      const updated = await agentWorkflowService.updateWorkflow(currentWorkflow.id, {
        published: pendingPublishStatus,
      });

      // 更新列表中的工作流
      setWorkflows(workflows.map(w => w.id === currentWorkflow.id ? updated : w));
      
      // 更新当前工作流
      setCurrentWorkflow(updated);

      toast.success(`${action}成功`);
      console.log(`工作流已${action}:`, updated.name);
    } catch (error) {
      console.error(`${action}工作流失败:`, error);
      toast.error(`${action}失败`, { 
        description: error instanceof Error ? error.message : String(error) 
      });
    } finally {
      setConfirmPublishOpen(false);
      setPendingPublishStatus(null);
    }
  };

  // 保存工作流设置
  const handleSaveSettings = async (settings: { executionMode: WorkflowExecutionMode; engine?: 'native' | 'langgraph' }) => {
    if (!currentWorkflow) return;

    try {
      const updated = await agentWorkflowService.updateWorkflow(currentWorkflow.id, {
        executionMode: settings.executionMode,
        engine: settings.engine,
        metadata: {
          ...(currentWorkflow.metadata || {}),
          engine: settings.engine || 'native',
        },
      });

      // 更新列表中的工作流
      setWorkflows(workflows.map(w => w.id === currentWorkflow.id ? updated : w));
      
      // 更新当前工作流
      setCurrentWorkflow(updated);

      toast.success('工作流设置已保存');
      console.log('工作流设置已保存:', updated);
    } catch (error) {
      console.error('保存工作流设置失败:', error);
      toast.error('保存失败', { 
        description: error instanceof Error ? error.message : String(error) 
      });
    }
  };

  const handleOpenMultiChat = () => {
    if (!currentWorkflow) {
      toast.error('请先选择一个工作流');
      return;
    }
    setShowMultiChatModal(true);
  };

  const handleCloseMultiChat = () => {
    setShowMultiChatModal(false);
  };

  return (
    <div className="agent-workflow-page">
      <TopNavigation />
      
      <div className="workflow-container">
        <div className="workflow-header">
          <ToolbarPanel
            onAddNode={handleAddNode}
            onSave={handleSave}
            onRun={handleRun}
            onSaveTemplate={handleSaveTemplate}
            onPublish={handlePublish}
            onSettings={handleSettings}
            onOpenMultiChat={handleOpenMultiChat}
            canSave={isDirty}
            canRun={!!currentWorkflow && currentWorkflow.nodes.length > 0}
            loading={loading}
            isPublished={currentWorkflow?.published || false}
          />
          {currentWorkflow && (
            <div className="workflow-status-bar">
              <div className="workflow-status-info">
                <span className="workflow-name">{currentWorkflow.name}</span>
                {isDirty && (
                  <span className="workflow-status-indicator workflow-status-dirty" title="有未保存的更改">
                    ● 未保存
                  </span>
                )}
                {!isDirty && currentWorkflow.updatedAt && (
                  <span className="workflow-status-indicator workflow-status-saved" title="已保存">
                    ✓ 已保存
                  </span>
                )}
                <span className="workflow-status-indicator" style={{ background: '#eef2ff', color: '#3730a3' }}>
                  引擎：{(currentWorkflow.engine || currentWorkflow.metadata?.engine || 'native')}
                </span>
              </div>
              <div>
                <button
                  onClick={handleCompile}
                  className="sidebar-button secondary"
                  disabled={compiling}
                  title="编译工作流"
                >
                  {compiling ? '编译中...' : '编译'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="workflow-content">
          {/* 左侧工作流列表侧边栏 */}
          {showSidebar && (
        <div className="workflow-sidebar">
          <div className="sidebar-header">
            <h2 className="text-lg font-semibold text-gray-800">工作流列表</h2>
            <button
              onClick={() => setShowSidebar(false)}
              className="text-gray-500 hover:text-gray-700"
              title="隐藏侧边栏"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          
          <div className="sidebar-actions">
            <button
              onClick={handleCreateDagWorkflow}
              className="sidebar-button primary"
              title="创建 DAG 工作流"
            >
              <Plus size={18} />
              <span>+DAG工作流</span>
            </button>
            <button
              onClick={handleCreateLangGraphWorkflow}
              disabled={creatingSmartWorkflow}
              className="sidebar-button secondary"
              title="创建 LangGraph 工作流"
            >
              {creatingSmartWorkflow ? (
                <Loader className="animate-spin" size={18} />
              ) : (
                <Sparkles size={18} />
              )}
              <span>+LangGraph工作流</span>
            </button>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  type="text"
                  value={workflowSearch}
                  onChange={(e) => setWorkflowSearch(e.target.value)}
                  placeholder="搜索工作流 (Ctrl/Cmd + F)"
                  className="workflow-search-input"
                  title="搜索工作流 (Ctrl/Cmd + F)"
                />
                {workflowSearch && (
                  <button
                    onClick={() => setWorkflowSearch('')}
                    className="workflow-search-clear"
                    title="清除搜索"
                  >
                    ×
                  </button>
                )}
              </div>
              <select
                value={workflowSort}
                onChange={(e) => setWorkflowSort(e.target.value as any)}
                className="workflow-sort-select"
                title="排序方式"
              >
                <option value="updated">按更新时间</option>
                <option value="nodes">按节点数</option>
              </select>
            </div>
          </div>

          <div className="workflow-list">
            {workflows.length === 0 ? (
              <div className="empty-state">
                <FileText size={32} className="text-gray-400" />
                <p className="text-gray-500 text-sm mt-2">暂无工作流</p>
                <p className="text-gray-400 text-xs mt-1">点击上方按钮创建</p>
              </div>
            ) : workflows.filter(w => !workflowSearch || w.name.toLowerCase().includes(workflowSearch.toLowerCase())).length === 0 ? (
              <div className="empty-state">
                <FileText size={32} className="text-gray-400" />
                <p className="text-gray-500 text-sm mt-2">未找到匹配的工作流</p>
                <p className="text-gray-400 text-xs mt-1">尝试使用其他关键词搜索</p>
              </div>
            ) : (
              workflows
                .filter(w => !workflowSearch || w.name.toLowerCase().includes(workflowSearch.toLowerCase()))
                .sort((a, b) => {
                  if (workflowSort === 'nodes') return (b.nodes?.length || 0) - (a.nodes?.length || 0);
                  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
                })
                .map((workflow) => (
                <div
                  key={workflow.id}
                  className={`workflow-item ${
                    currentWorkflow?.id === workflow.id ? 'active' : ''
                  }`}
                  onClick={(e) => {
                    // 如果正在编辑，不执行切换
                    if (editingWorkflowId) return;
                    // 如果点击的是标题区域（可能是在双击），不切换
                    if ((e.target as HTMLElement).closest('.workflow-item-title')) {
                      return;
                    }
                    handleSwitchWorkflow(workflow);
                  }}
                >
                      <div className="workflow-item-content">
                        {editingWorkflowId === workflow.id ? (
                          <input
                            type="text"
                            className="workflow-item-edit-input"
                            value={editingWorkflowName}
                            onChange={(e) => setEditingWorkflowName(e.target.value)}
                            onBlur={() => handleSaveWorkflowName(workflow.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveWorkflowName(workflow.id);
                              } else if (e.key === 'Escape') {
                                handleCancelEditWorkflowName();
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            autoFocus
                          />
                        ) : (
                          <h3 
                            className="workflow-item-title"
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handleStartEditWorkflowName(workflow, e);
                            }}
                            onMouseDown={(e) => {
                              // 防止双击时触发点击事件
                              if (e.detail > 1) {
                                e.stopPropagation();
                              }
                            }}
                            onClick={(e) => {
                              // 单击时不触发切换，避免双击时误触发
                              e.stopPropagation();
                            }}
                            title="双击重命名 (F2)"
                          >
                            {workflowSearch ? (
                              <span>
                                {workflow.name.split(new RegExp(`(${workflowSearch})`, 'gi')).map((part, i) => 
                                  part.toLowerCase() === workflowSearch.toLowerCase() ? (
                                    <mark key={i} style={{ background: '#fef3c7', padding: '0 2px' }}>{part}</mark>
                                  ) : (
                                    part
                                  )
                                )}
                              </span>
                            ) : (
                              workflow.name
                            )}
                          </h3>
                        )}
                        {workflow.description && (
                          <p className="workflow-item-desc">{workflow.description}</p>
                        )}
                        <div className="workflow-item-meta">
                          <span className="workflow-item-nodes">
                            {workflow.nodes.length} 个节点
                          </span>
                          {workflow.published && (
                            <span className="workflow-item-badge workflow-item-badge-published" title="已发布">已发布</span>
                          )}
                          {currentWorkflow?.id === workflow.id && isDirty && (
                            <span className="workflow-item-badge workflow-item-badge-modified" title="有未保存的更改">未保存</span>
                          )}
                          {workflow.name === '智能工作流' && (
                            <span className="workflow-item-badge">默认</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteWorkflow(workflow.id);
                        }}
                        className="workflow-item-delete"
                        title="删除工作流"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 显示侧边栏按钮（当侧边栏隐藏时） */}
          {!showSidebar && (
            <button
              onClick={() => setShowSidebar(true)}
              className="sidebar-toggle"
              title="显示侧边栏"
            >
              <ChevronRight size={20} />
            </button>
          )}

          <div className="workflow-canvas-wrapper">
            {currentWorkflow ? (
              <WorkflowCanvas
                nodes={currentWorkflow.nodes}
                edges={currentWorkflow.edges}
                onNodesChange={(updatedNodes) => {
                  // 只有当节点真正发生变化时才标记为dirty
                  const nodesChanged = JSON.stringify(updatedNodes) !== JSON.stringify(currentWorkflow.nodes);
                  if (nodesChanged) {
                    setCurrentWorkflow({
                      ...currentWorkflow,
                      nodes: updatedNodes as AgentWorkflowNode[],
                    });
                    setIsDirty(true);
                  }
                }}
                onEdgesChange={(updatedEdges) => {
                  // 只有当边真正发生变化时才标记为dirty
                  const edgesChanged = JSON.stringify(updatedEdges) !== JSON.stringify(currentWorkflow.edges);
                  if (edgesChanged) {
                    setCurrentWorkflow({
                      ...currentWorkflow,
                      edges: updatedEdges.map(edge => ({
                        id: edge.id,
                        source: edge.source,
                        target: edge.target,
                        sourceHandle: edge.sourceHandle || undefined,
                        targetHandle: edge.targetHandle || undefined,
                      })) as AgentWorkflowEdge[],
                    });
                    setIsDirty(true);
                  }
                }}
                onConnect={handleConnect}
                onNodeClick={handleNodeClick}
                onNodeDelete={handleNodeDelete}
              />
            ) : (
              <div className="empty-canvas">
                <FileText size={64} className="text-gray-300" />
                <p className="text-gray-500 mt-4">选择一个工作流或创建新工作流</p>
                <button
                  onClick={handleCreateSmartWorkflow}
                  className="create-smart-workflow-btn"
                  disabled={creatingSmartWorkflow}
                >
                  {creatingSmartWorkflow ? (
                    <>
                      <Loader className="animate-spin" size={20} />
                      <span>创建中...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} />
                      <span>创建智能工作流</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {selectedNode && (
            <NodeConfigPanel
              node={selectedNode}
              agents={agents}
              workflow={currentWorkflow || undefined}
              onClose={() => setSelectedNode(null)}
              onSave={handleNodeSave}
            />
          )}
        </div>
      </div>

      {/* 工作流设置弹窗 */}
      {showSettingsModal && (
        <WorkflowSettingsModal
          workflow={currentWorkflow}
          onClose={() => setShowSettingsModal(false)}
          onSave={handleSaveSettings}
        />
      )}

      {/* 保存模版弹窗 */}
      {showSaveTemplateModal && (
        <SaveTemplateModal
          workflow={currentWorkflow}
          onClose={() => setShowSaveTemplateModal(false)}
          onSuccess={() => {
            console.log('模版保存成功');
          }}
        />
      )}

      {showMultiChatModal && (
        <div className="multi-chat-modal-overlay" onClick={handleCloseMultiChat}>
          <div
            className="multi-chat-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <MultiChatContainer
              embedded
              workflow={currentWorkflow}
              initialWorkflowId={currentWorkflow?.id}
              initialRoles={agents}
              onClose={handleCloseMultiChat}
            />
          </div>
        </div>
      )}

      {confirmDeleteId && (
        <ConfirmDialog
          open={!!confirmDeleteId}
          title="确定要删除此工作流吗？"
          description="此操作不可撤销"
          confirmText="删除"
          cancelText="取消"
          onConfirm={async () => {
            const id = confirmDeleteId;
            setConfirmDeleteId(null);
            try {
              if (id) {
                await agentWorkflowService.deleteWorkflow(id);
                await loadWorkflows();
                if (currentWorkflow?.id === id) {
                  setCurrentWorkflow(null);
                  setSelectedNode(null);
                }
                toast.success('工作流已删除');
              }
            } catch (error: any) {
              toast.error('删除失败', { description: error?.message });
            }
          }}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}

      {confirmSwitchOpen && pendingSwitchWorkflow && (
        <ConfirmDialog
          open={confirmSwitchOpen}
          title="当前工作流有未保存的更改"
          description="是否切换到其他工作流？未保存的更改将丢失"
          confirmText="切换"
          cancelText="取消"
          onConfirm={() => {
            setConfirmSwitchOpen(false);
            if (pendingSwitchWorkflow) {
              setCurrentWorkflow(pendingSwitchWorkflow);
              setSelectedNode(null);
              setIsDirty(false);
              setPendingSwitchWorkflow(null);
            }
          }}
          onCancel={() => {
            setConfirmSwitchOpen(false);
            setPendingSwitchWorkflow(null);
          }}
        />
      )}

      {confirmPublishOpen && pendingPublishStatus !== null && currentWorkflow && (
        <ConfirmDialog
          open={confirmPublishOpen}
          title={pendingPublishStatus ? '发布工作流' : '取消发布工作流'}
          description={`确定要${pendingPublishStatus ? '发布' : '取消发布'}工作流"${currentWorkflow.name}"吗？${pendingPublishStatus ? '发布后，该工作流可以被前端页面绑定使用。' : '取消发布后，前端页面将无法绑定该工作流。'}`}
          confirmText={pendingPublishStatus ? '发布' : '取消发布'}
          cancelText="取消"
          onConfirm={handleConfirmPublish}
          onCancel={() => {
            setConfirmPublishOpen(false);
            setPendingPublishStatus(null);
          }}
        />
      )}

      {confirmCreateSmartWorkflowOpen && (
        <ConfirmDialog
          open={confirmCreateSmartWorkflowOpen}
          title="缺少必需的 Agent"
          description={`缺少以下Agent：${validateSmartWorkflowAgents(agents).missing.join(', ')}\n\n是否仍要创建工作流？缺少的节点将无法配置。`}
          confirmText="仍要创建"
          cancelText="取消"
          onConfirm={async () => {
            setConfirmCreateSmartWorkflowOpen(false);
            await executeCreateSmartWorkflow();
          }}
          onCancel={() => {
            setConfirmCreateSmartWorkflowOpen(false);
            setCreatingSmartWorkflow(false);
          }}
        />
      )}

      {confirmRunWithUnconfiguredNodesOpen && (
        <ConfirmDialog
          open={confirmRunWithUnconfiguredNodesOpen}
          title="未配置 Agent 的节点"
          description={`以下节点未配置Agent：${unconfiguredNodeNames}\n\n这些节点将无法执行。是否继续？`}
          confirmText="继续执行"
          cancelText="取消"
          onConfirm={async () => {
            setConfirmRunWithUnconfiguredNodesOpen(false);
            setLoading(true);
            try {
              await handleSave();
              const latestWorkflow = workflows.find(w => w.id === currentWorkflow?.id) || currentWorkflow;
              if (!latestWorkflow) return;
              
              const validNodes = latestWorkflow.nodes.filter(n => n.agentId && n.agentId.trim() !== '');
              if (validNodes.length === 0) {
                toast.error('工作流中没有配置Agent的节点，无法执行');
                setLoading(false);
                return;
              }

              const inputNodes = latestWorkflow.nodes.filter(n => n.type === 'input');
              const inputParams: InputParameter[] = [];
              
              inputNodes.forEach(node => {
                const nodeData = node.data as any;
                const inputs = nodeData.inputs || [];
                inputs.forEach((input: InputParameter) => {
                  inputParams.push(input);
                });
              });
              
              if (inputParams.length > 0) {
                setRunParams(inputParams);
                setRunModalOpen(true);
                setLoading(false);
                return;
              }
              executeWorkflowWithInput({ query: '测试输入' });
            } catch (error) {
              console.error('执行工作流失败:', error);
              toast.error('执行失败', { description: error instanceof Error ? error.message : String(error) });
              setLoading(false);
            }
          }}
          onCancel={() => {
            setConfirmRunWithUnconfiguredNodesOpen(false);
          }}
        />
      )}

      {confirmEditNameOpen && pendingEditWorkflow && (
        <ConfirmDialog
          open={confirmEditNameOpen}
          title="未保存的更改"
            description="当前工作流有未保存的更改，是否先保存后再编辑名称？点击「确定」保存后编辑，点击「取消」直接编辑（将丢失未保存的更改）"
          confirmText="保存后编辑"
          cancelText="直接编辑"
          onConfirm={handleConfirmEditName}
          onCancel={handleCancelEditName}
        />
      )}

      {confirmCreateNewOpen && (
        <ConfirmDialog
          open={confirmCreateNewOpen}
          title="当前工作流有未保存的更改"
          description="确定要创建新工作流吗？未保存的更改将丢失"
          confirmText="创建"
          cancelText="取消"
          onConfirm={() => {
            setConfirmCreateNewOpen(false);
            const newWorkflow: AgentWorkflow = {
              id: `workflow-${Date.now()}`,
              name: `新工作流 ${workflows.length + 1}`,
              description: '',
              version: '1.0.0',
              nodes: [],
              edges: [],
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            setCurrentWorkflow(newWorkflow);
            setSelectedNode(null);
            setIsDirty(false);
          }}
          onCancel={() => setConfirmCreateNewOpen(false)}
        />
      )}

      {runModalOpen && (
        <WorkflowRunInputModal
          open={runModalOpen}
          params={runParams}
          onCancel={() => {
            setRunModalOpen(false);
            setLoading(false);
          }}
          onSubmit={(values) => {
            setRunModalOpen(false);
            executeWorkflowWithInput(values);
          }}
        />
      )}

      {confirmRestoreOpen && draftWorkflow && (
        <ConfirmDialog
          open={confirmRestoreOpen}
          title="检测到本地草稿"
          description="是否恢复到上次自动保存的工作流草稿"
          confirmText="恢复"
          cancelText="忽略"
          onConfirm={() => {
            setConfirmRestoreOpen(false);
            setCurrentWorkflow(draftWorkflow);
            setSelectedNode(null);
            setIsDirty(false);
          }}
          onCancel={() => {
            setConfirmRestoreOpen(false);
            setDraftWorkflow(null);
            try { localStorage.removeItem('agent-workflow-autosave'); } catch {}
          }}
        />
      )}

      <style>{`
        .agent-workflow-page {
          width: 100%;
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: #f9fafb;
        }
        
        .workflow-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .workflow-header {
          display: flex;
          flex-direction: column;
        }

        .workflow-status-bar {
          padding: 8px 16px;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .workflow-status-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .workflow-name {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
        }

        .workflow-status-indicator {
          font-size: 12px;
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 500;
        }

        .workflow-status-dirty {
          color: #92400e;
          background: #fef3c7;
        }

        .workflow-status-saved {
          color: #065f46;
          background: #d1fae5;
        }
        
        .workflow-content {
          flex: 1;
          display: flex;
          overflow: hidden;
          position: relative;
        }

        .workflow-sidebar {
          width: 280px;
          background: white;
          border-right: 1px solid #e5e7eb;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .sidebar-header {
          padding: 16px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .sidebar-actions {
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          border-bottom: 1px solid #e5e7eb;
        }

        .workflow-search-input {
          flex: 1;
          padding: 6px 8px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 13px;
        }

        .workflow-sort-select {
          padding: 6px 8px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 13px;
        }

        .sidebar-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
          border: none;
          cursor: pointer;
        }

        .sidebar-button.primary {
          background: #3b82f6;
          color: white;
        }

        .sidebar-button.primary:hover {
          background: #2563eb;
        }

        .sidebar-button.secondary {
          background: #f3f4f6;
          color: #374151;
        }

        .sidebar-button.secondary:hover {
          background: #e5e7eb;
        }

        .sidebar-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .workflow-list {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
        }

        .workflow-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          margin-bottom: 8px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid transparent;
        }

        .workflow-item:hover {
          background: #f9fafb;
          border-color: #e5e7eb;
        }

        .workflow-item.active {
          background: #eff6ff;
          border-color: #3b82f6;
        }

        .workflow-item-content {
          flex: 1;
          min-width: 0;
        }

        .workflow-item-title {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 4px 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          cursor: pointer;
          user-select: none;
        }

        .workflow-item-title:hover {
          color: #3b82f6;
        }

        .workflow-item-edit-input {
          width: 100%;
          padding: 4px 8px;
          font-size: 14px;
          font-weight: 600;
          color: #111827;
          border: 2px solid #3b82f6;
          border-radius: 4px;
          background: white;
          outline: none;
          margin: 0 0 4px 0;
        }

        .workflow-item-edit-input:focus {
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .workflow-item-desc {
          font-size: 12px;
          color: #6b7280;
          margin: 0 0 6px 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .workflow-item-meta {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .workflow-item-nodes {
          font-size: 11px;
          color: #9ca3af;
        }

        .workflow-item-badge {
          font-size: 10px;
          padding: 2px 6px;
          background: #dbeafe;
          color: #1e40af;
          border-radius: 4px;
        }

        .workflow-item-badge-published {
          background: #d1fae5;
          color: #065f46;
        }

        .workflow-item-badge-modified {
          background: #fef3c7;
          color: #92400e;
        }

        .workflow-search-clear {
          position: absolute;
          right: 6px;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          font-size: 18px;
          line-height: 1;
          padding: 2px 4px;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .workflow-search-clear:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .workflow-item-delete {
          padding: 4px;
          border: none;
          background: transparent;
          color: #9ca3af;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.2s;
          opacity: 0;
        }

        .workflow-item:hover .workflow-item-delete {
          opacity: 1;
        }

        .workflow-item-delete:hover {
          background: #fee2e2;
          color: #dc2626;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          text-align: center;
        }

        .sidebar-toggle {
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          padding: 8px;
          background: white;
          border: 1px solid #e5e7eb;
          border-left: none;
          border-radius: 0 6px 6px 0;
          cursor: pointer;
          z-index: 10;
          transition: all 0.2s;
        }

        .sidebar-toggle:hover {
          background: #f9fafb;
        }
        
        .workflow-canvas-wrapper {
          flex: 1;
          position: relative;
          background: #ffffff;
        }

        .empty-canvas {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
        }

        .create-smart-workflow-btn {
          margin-top: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .create-smart-workflow-btn:hover {
          background: #2563eb;
        }

        .create-smart-workflow-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .multi-chat-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 11000;
          padding: 32px;
        }

        .multi-chat-modal-content {
          width: min(1200px, 95vw);
          height: min(820px, 90vh);
          background: #f1f5f9;
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(30, 41, 59, 0.6);
          border: 1px solid rgba(148, 163, 184, 0.4);
        }

        @media (max-width: 768px) {
          .multi-chat-modal-overlay {
            padding: 16px;
          }

          .multi-chat-modal-content {
            width: 100%;
            height: 100%;
            border-radius: 12px;
          }
        }
      `}</style>
      {compileResult && (
        <div style={{ position: 'fixed', bottom: 12, right: 12, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, boxShadow: '0 4px 10px rgba(0,0,0,0.06)', maxWidth: 420 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>编译结果</div>
          {compileResult.isValid ? (
            <div style={{ color: '#065f46' }}>✓ 通过</div>
          ) : (
            <div style={{ color: '#92400e' }}>✗ 失败（{compileResult.errors.length}）</div>
          )}
          {!compileResult.isValid && (
            <ul style={{ marginTop: 8, maxHeight: 160, overflow: 'auto', paddingLeft: 18 }}>
              {compileResult.errors.map((e, i) => (
                <li key={i} style={{ fontSize: 12, color: '#6b7280' }}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default AgentWorkflowPage;
