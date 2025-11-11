import React, { useState, useEffect, useMemo } from 'react';
import { MessageSquare, Plus, Bot, Settings, X, Workflow, Save, Loader, CheckSquare, Square, Play, ExternalLink, Rocket, ChevronDown, ChevronUp, Search, Filter } from 'lucide-react';
import ChatWindow from './ChatWindow';
import WorkflowExecutionView from './WorkflowExecutionView';
import TopNavigation from './TopNavigation';
import aiRoleService from '../services/aiRoleService';
import { AIRoleConfig } from '../types/aiRole';
import { agentWorkflowService } from '../services/agentWorkflowService';
import { AgentWorkflow, WorkflowExecution } from '../types/agentWorkflow';
import { workflowEngine } from '../services/workflowEngine';

interface OpenChatWindow {
  id: string;
  role: AIRoleConfig;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

const MultiChatContainer: React.FC = () => {
  const [allRoles, setAllRoles] = useState<AIRoleConfig[]>([]); // 所有可用的角色
  const [roles, setRoles] = useState<AIRoleConfig[]>([]); // 实际显示的角色
  const [openWindows, setOpenWindows] = useState<OpenChatWindow[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSidebar, setActiveSidebar] = useState(true);
  
  // 配置相关状态
  const [showConfig, setShowConfig] = useState(false);
  const [workflows, setWorkflows] = useState<AgentWorkflow[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('');
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [configLoading, setConfigLoading] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [displayMode, setDisplayMode] = useState<'all' | 'workflow' | 'custom'>('all');
  
  // Workflow执行相关状态
  const [showExecution, setShowExecution] = useState(false);
  const [currentExecution, setCurrentExecution] = useState<WorkflowExecution | null>(null);
  const [executionLoading, setExecutionLoading] = useState(false);

  useEffect(() => {
    loadAllRoles();
    loadConfig();
    loadWorkflows(); // 初始加载工作流列表
    setupWorkflowEngine();
  }, []);

  // 设置workflow引擎的回调
  const setupWorkflowEngine = () => {
    workflowEngine.onProgress((execution) => {
      setCurrentExecution(execution);
    });
  };

  // 执行workflow
  const handleExecuteWorkflow = async () => {
    if (!selectedWorkflowId) {
      alert('请先选择工作流');
      return;
    }

    const workflow = workflows.find(w => w.id === selectedWorkflowId);
    if (!workflow) {
      alert('工作流不存在');
      return;
    }

    setExecutionLoading(true);
    setShowExecution(true);

    try {
      const execution = await workflowEngine.execute(workflow, {
        input: {},
        continueOnError: true,
        logging: true,
      });
      setCurrentExecution(execution);
    } catch (error) {
      console.error('执行工作流失败:', error);
      alert('执行工作流失败: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setExecutionLoading(false);
    }
  };

  // 从localStorage加载配置
  const loadConfig = () => {
    try {
      const configStr = localStorage.getItem('multiChatWorkflowConfig');
      if (configStr) {
        const config = JSON.parse(configStr);
        setSelectedWorkflowId(config.workflowId || '');
        setSelectedRoleIds(config.roleIds || []);
        setDisplayMode(config.displayMode || 'all');
      }
    } catch (error) {
      console.error('加载配置失败:', error);
    }
  };

  // 当配置或所有角色变化时，更新显示的角色
  useEffect(() => {
    let filteredRoles: AIRoleConfig[] = [];

    if (displayMode === 'all') {
      // 显示所有启用的角色
      filteredRoles = allRoles.filter(r => r.enabled);
    } else if (displayMode === 'workflow' && selectedWorkflowId) {
      // 从工作流中提取角色
      const workflow = workflows.find(w => w.id === selectedWorkflowId);
      if (workflow && workflow.nodes) {
        const workflowAgentIds = workflow.nodes
          .map(node => node.agentId)
          .filter(Boolean);
        filteredRoles = allRoles.filter(r => 
          r.enabled && workflowAgentIds.includes(r.id)
        );
      }
    } else if (displayMode === 'custom' && selectedRoleIds.length > 0) {
      // 只显示选定的角色
      filteredRoles = allRoles.filter(r => 
        r.enabled && selectedRoleIds.includes(r.id)
      );
    }

    setRoles(filteredRoles);
  }, [allRoles, displayMode, selectedWorkflowId, selectedRoleIds, workflows]);
  
  // 加载工作流列表
  const loadWorkflows = async () => {
    setConfigLoading(true);
    try {
      const workflowList = await agentWorkflowService.getAllWorkflows();
      setWorkflows(workflowList);
    } catch (error) {
      console.error('加载工作流列表失败:', error);
    } finally {
      setConfigLoading(false);
    }
  };
  
  // 保存配置
  const saveConfig = async () => {
    setSavingConfig(true);
    try {
      const config = {
        workflowId: selectedWorkflowId,
        roleIds: selectedRoleIds,
        displayMode,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('multiChatWorkflowConfig', JSON.stringify(config));
      setShowConfig(false);
      alert('配置已保存');
    } catch (error) {
      console.error('保存配置失败:', error);
      alert('保存配置失败');
    } finally {
      setSavingConfig(false);
    }
  };
  
  // 打开配置对话框时加载工作流
  const handleOpenConfig = () => {
    setShowConfig(true);
    loadWorkflows();
  };

  const loadAllRoles = async () => {
    setLoading(true);
    try {
      const roleList = await aiRoleService.getAIRoles();
      setAllRoles(roleList);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || '未知错误';
      const errorStatus = error?.response?.status || 'N/A';
      console.error('🟣 [MultiChatContainer] 加载AI角色列表失败');
      console.error('错误消息:', errorMessage);
      console.error('HTTP状态码:', errorStatus);
      console.error('请求URL:', error?.config?.url || error?.response?.config?.url);
      console.error('响应数据:', error?.response?.data);
      console.error('完整错误对象:', error);
    } finally {
      setLoading(false);
    }
  };

  // 切换角色的选中状态
  const toggleRoleSelection = (roleId: string) => {
    setSelectedRoleIds(prev => {
      if (prev.includes(roleId)) {
        return prev.filter(id => id !== roleId);
      } else {
        return [...prev, roleId];
      }
    });
  };

  // 全选/取消全选
  const toggleAllRoles = () => {
    if (selectedRoleIds.length === allRoles.filter(r => r.enabled).length) {
      setSelectedRoleIds([]);
    } else {
      setSelectedRoleIds(allRoles.filter(r => r.enabled).map(r => r.id));
    }
  };

  const openChatWindow = (role: AIRoleConfig) => {
    // 检查是否已经打开
    const existingWindow = openWindows.find(w => w.role.id === role.id);
    if (existingWindow) {
      return;
    }

    // 计算新窗口位置（避免重叠）
    const cols = Math.ceil(Math.sqrt(openWindows.length + 1));
    const colIndex = (openWindows.length) % cols;
    const rowIndex = Math.floor((openWindows.length) / cols);

    const newWindow: OpenChatWindow = {
      id: `window-${Date.now()}-${Math.random()}`,
      role,
      position: {
        x: 100 + colIndex * 50,
        y: 100 + rowIndex * 50
      },
      size: {
        width: 500,
        height: 600
      }
    };

    setOpenWindows(prev => [...prev, newWindow]);
  };

  const closeChatWindow = (windowId: string) => {
    setOpenWindows(prev => prev.filter(w => w.id !== windowId));
  };

  const openWindowsCount = openWindows.length;
  const selectedWorkflow = workflows.find(w => w.id === selectedWorkflowId);

  // 获取角色的来源信息（来自哪个工作流的哪个节点）
  const getRoleSourceInfo = (roleId: string): { workflowName?: string; nodeLabel?: string } => {
    for (const workflow of workflows) {
      const node = workflow.nodes?.find(n => n.agentId === roleId);
      if (node) {
        return {
          workflowName: workflow.name,
          nodeLabel: node.data?.label || '未命名节点'
        };
      }
    }
    return {};
  };

  // 获取角色的显示描述
  const getRoleDisplayInfo = (role: AIRoleConfig) => {
    const sourceInfo = getRoleSourceInfo(role.id);
    const parts: string[] = [];

    // 来源信息：工作流中的节点
    if (sourceInfo.workflowName && sourceInfo.nodeLabel) {
      parts.push(`${sourceInfo.workflowName}中的${sourceInfo.nodeLabel}节点`);
    }

    // 如果直接对接Dify API，显示说明
    if (role.difyConfig?.connectionType === 'chatflow') {
      parts.push('通过后端统一的 Dify 网关支持多轮对话');
    }

    // 如果没有来源信息但有描述，使用描述
    if (parts.length === 0 && role.description) {
      parts.push(role.description);
    }

    return parts.join(' ');
  };

  // 所有启用的角色（用于快捷切换）
  const enabledRoles = useMemo(() => {
    return allRoles.filter(r => r.enabled);
  }, [allRoles]);

  // 状态：展开/收起
  const [expandedRoles, setExpandedRoles] = useState(true);
  
  // 搜索和筛选状态
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'workflow' | 'dify'>('all');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    workflow: true,
    dify: true,
  });

  // 分组角色
  const groupedRoles = useMemo(() => {
    const workflowRoles: AIRoleConfig[] = [];
    const difyRoles: AIRoleConfig[] = [];
    
    enabledRoles.forEach(role => {
      const sourceInfo = getRoleSourceInfo(role.id);
      const isWorkflowRole = sourceInfo.workflowName && sourceInfo.nodeLabel;
      
      if (isWorkflowRole) {
        workflowRoles.push(role);
      } else {
        difyRoles.push(role);
      }
    });
    
    return { workflowRoles, difyRoles };
  }, [enabledRoles]);
  
  // 过滤后的角色
  const filteredRoles = useMemo(() => {
    let roles = enabledRoles;
    
    // 按类型筛选
    if (filterType === 'workflow') {
      roles = groupedRoles.workflowRoles;
    } else if (filterType === 'dify') {
      roles = groupedRoles.difyRoles;
    }
    
    // 搜索过滤
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      roles = roles.filter(role => 
        role.name.toLowerCase().includes(query) ||
        role.description?.toLowerCase().includes(query) ||
        getRoleSourceInfo(role.id).workflowName?.toLowerCase().includes(query) ||
        getRoleSourceInfo(role.id).nodeLabel?.toLowerCase().includes(query)
      );
    }
    
    return roles;
  }, [enabledRoles, searchQuery, filterType, groupedRoles]);
  
  // 切换分组展开状态
  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden">
      {/* 顶部导航栏 */}
      <TopNavigation currentPageTitle="多窗口AI对话" />
      
      {/* 主要内容区域 */}
      <div className="flex flex-1 overflow-hidden">
      {/* 配置对话框 */}
      {showConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
            {/* 对话框头部 */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-lg flex items-center justify-between">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <Settings size={20} />
                页面配置
              </h2>
              <button
                onClick={() => setShowConfig(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* 对话框内容 */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* 显示模式选择 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    AI角色显示模式
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="displayMode"
                        value="all"
                        checked={displayMode === 'all'}
                        onChange={(e) => setDisplayMode(e.target.value as any)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">显示所有角色</p>
                        <p className="text-xs text-gray-600">显示所有已启用的AI角色</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="displayMode"
                        value="workflow"
                        checked={displayMode === 'workflow'}
                        onChange={(e) => setDisplayMode(e.target.value as any)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">从工作流加载</p>
                        <p className="text-xs text-gray-600">显示关联工作流中的所有Agent角色</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="displayMode"
                        value="custom"
                        checked={displayMode === 'custom'}
                        onChange={(e) => setDisplayMode(e.target.value as any)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">自定义选择</p>
                        <p className="text-xs text-gray-600">手动选择要显示的角色</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* 工作流选择（仅在workflow模式下显示） */}
                {displayMode === 'workflow' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      选择Agent工作流
                    </label>
                    {configLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader className="w-6 h-6 animate-spin text-blue-600" />
                      </div>
                    ) : (
                      <select
                        value={selectedWorkflowId}
                        onChange={(e) => setSelectedWorkflowId(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">请选择工作流</option>
                        {workflows.map(workflow => (
                          <option key={workflow.id} value={workflow.id}>
                            {workflow.name}
                          </option>
                        ))}
                      </select>
                    )}
                    {selectedWorkflow && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <Workflow className="w-5 h-5 text-blue-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-medium text-blue-900">{selectedWorkflow.name}</p>
                            {selectedWorkflow.description && (
                              <p className="text-sm text-blue-700 mt-1">{selectedWorkflow.description}</p>
                            )}
                            <p className="text-xs text-blue-600 mt-2">
                              包含 {selectedWorkflow.nodes?.length || 0} 个节点
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 角色选择（仅在custom模式下显示） */}
                {displayMode === 'custom' && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-gray-700">
                        选择要显示的AI角色
                      </label>
                      <button
                        onClick={toggleAllRoles}
                        className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        {selectedRoleIds.length === allRoles.filter(r => r.enabled).length ? '取消全选' : '全选'}
                      </button>
                    </div>
                    <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                      {allRoles.filter(r => r.enabled).length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                          暂无启用的AI角色
                        </div>
                      ) : (
                        allRoles.filter(r => r.enabled).map(role => (
                          <label
                            key={role.id}
                            className="flex items-start gap-3 p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors last:border-b-0"
                          >
                            <div className="mt-1">
                              {selectedRoleIds.includes(role.id) ? (
                                <CheckSquare className="w-5 h-5 text-blue-600" />
                              ) : (
                                <Square className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                {role.avatar ? (
                                  <img
                                    src={role.avatar}
                                    alt={role.name}
                                    className="w-6 h-6 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                                    <Bot className="w-4 h-4 text-blue-600" />
                                  </div>
                                )}
                                <p className="font-medium text-gray-800 truncate">{role.name}</p>
                              </div>
                              <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                                {role.description}
                              </p>
                            </div>
                            <input
                              type="checkbox"
                              checked={selectedRoleIds.includes(role.id)}
                              onChange={() => toggleRoleSelection(role.id)}
                              className="hidden"
                            />
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>提示：</strong>配置完成后，页面将根据您的选择显示对应的AI角色列表。
                  </p>
                </div>
              </div>
            </div>

            {/* 对话框底部 */}
            <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowConfig(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={saveConfig}
                disabled={savingConfig}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingConfig ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    保存配置
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 侧边栏 */}
      {activeSidebar && (
        <div className="w-72 bg-white border-r border-gray-200 flex flex-col shadow-lg z-40">
          {/* 底部操作 */}
          <div className="border-t border-gray-200 bg-gray-50 flex-1 overflow-hidden flex flex-col min-h-0">
            {/* AI角色快捷切换 */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            {/* AI角色快捷切换 */}
            <div className="flex-shrink-0">
              <button
                onClick={() => setExpandedRoles(!expandedRoles)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-100 transition-colors bg-white"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 rounded-md">
                    <Bot className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-800">AI角色快捷切换</span>
                  <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                    {enabledRoles.length}
                  </span>
                </div>
                {expandedRoles ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>
              
              {/* 搜索和筛选栏 */}
              {expandedRoles && (
                <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 space-y-2">
                  {/* 搜索框 */}
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="搜索角色..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-8 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  
                  {/* 筛选按钮组 */}
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setFilterType('all')}
                      className={`flex-1 px-2 py-1 text-xs rounded-md transition-colors ${
                        filterType === 'all'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      全部 ({enabledRoles.length})
                    </button>
                    <button
                      onClick={() => setFilterType('workflow')}
                      className={`flex-1 px-2 py-1 text-xs rounded-md transition-colors ${
                        filterType === 'workflow'
                          ? 'bg-green-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      工作流 ({groupedRoles.workflowRoles.length})
                    </button>
                    <button
                      onClick={() => setFilterType('dify')}
                      className={`flex-1 px-2 py-1 text-xs rounded-md transition-colors ${
                        filterType === 'dify'
                          ? 'bg-purple-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Dify ({groupedRoles.difyRoles.length})
                    </button>
                  </div>
                </div>
              )}
              
              {expandedRoles && (
                <div className="flex-1 overflow-y-auto px-3 py-2 bg-gray-50 min-h-0">
                  {filteredRoles.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <Bot className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-xs text-gray-500 font-medium">
                        {searchQuery ? '未找到匹配的角色' : '暂无启用的AI角色'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* 工作流角色组 */}
                      {filterType !== 'dify' && groupedRoles.workflowRoles.length > 0 && (
                        <div className="space-y-1.5">
                          <button
                            onClick={() => toggleGroup('workflow')}
                            className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                          >
                            <div className="flex items-center gap-1.5">
                              <Workflow className="w-3 h-3 text-green-600" />
                              <span>工作流角色</span>
                              <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full">
                                {groupedRoles.workflowRoles.length}
                              </span>
                            </div>
                            {expandedGroups.workflow ? (
                              <ChevronUp className="w-3 h-3 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-3 h-3 text-gray-400" />
                            )}
                          </button>
                          {expandedGroups.workflow && (
                            <div className="space-y-1.5 pl-4 border-l-2 border-green-200">
                              {groupedRoles.workflowRoles
                                .filter(role => {
                                  if (filterType === 'workflow') return true;
                                  if (!searchQuery) return true;
                                  const query = searchQuery.toLowerCase();
                                  return role.name.toLowerCase().includes(query) ||
                                    role.description?.toLowerCase().includes(query) ||
                                    getRoleSourceInfo(role.id).workflowName?.toLowerCase().includes(query) ||
                                    getRoleSourceInfo(role.id).nodeLabel?.toLowerCase().includes(query);
                                })
                                .map(role => {
                                  const isOpen = openWindows.some(w => w.role.id === role.id);
                                  const sourceInfo = getRoleSourceInfo(role.id);
                                  return (
                                    <button
                                      key={role.id}
                                      onClick={() => openChatWindow(role)}
                                      className={`
                                        w-full group relative
                                        ${isOpen 
                                          ? 'bg-blue-50 border-2 border-blue-300 shadow-sm' 
                                          : 'bg-white border border-gray-200 hover:border-blue-300 hover:shadow-md'
                                        }
                                        rounded-lg p-2.5 text-left transition-all duration-200
                                      `}
                                    >
                                      <div className="flex items-start gap-2.5">
                                        {role.avatar ? (
                                          <img
                                            src={role.avatar}
                                            alt={role.name}
                                            className={`w-9 h-9 rounded-lg object-cover flex-shrink-0 ${isOpen ? 'ring-2 ring-blue-400' : 'group-hover:ring-2 group-hover:ring-blue-200'}`}
                                          />
                                        ) : (
                                          <div className={`w-9 h-9 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center flex-shrink-0 shadow-sm ${isOpen ? 'ring-2 ring-blue-400' : 'group-hover:ring-2 group-hover:ring-green-200'}`}>
                                            <Workflow className="w-4 h-4 text-white" />
                                          </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-1.5 mb-0.5">
                                            <h4 className="font-semibold text-xs text-gray-900 truncate">
                                              {role.name}
                                            </h4>
                                            {isOpen && (
                                              <div className="flex-shrink-0 w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></div>
                                            )}
                                          </div>
                                          {sourceInfo.workflowName && sourceInfo.nodeLabel && (
                                            <div className="flex items-start gap-1 mb-1">
                                              <Workflow className="w-2.5 h-2.5 text-green-500 flex-shrink-0 mt-0.5" />
                                              <span className="text-xs text-gray-600 leading-tight">
                                                <span className="font-medium text-gray-700">{sourceInfo.workflowName}</span>
                                                <span className="mx-0.5">·</span>
                                                <span>{sourceInfo.nodeLabel}</span>
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </button>
                                  );
                                })}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Dify独立角色组 */}
                      {filterType !== 'workflow' && groupedRoles.difyRoles.length > 0 && (
                        <div className="space-y-1.5">
                          <button
                            onClick={() => toggleGroup('dify')}
                            className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                          >
                            <div className="flex items-center gap-1.5">
                              <Bot className="w-3 h-3 text-purple-600" />
                              <span>独立角色</span>
                              <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                                {groupedRoles.difyRoles.length}
                              </span>
                            </div>
                            {expandedGroups.dify ? (
                              <ChevronUp className="w-3 h-3 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-3 h-3 text-gray-400" />
                            )}
                          </button>
                          {expandedGroups.dify && (
                            <div className="space-y-1.5 pl-4 border-l-2 border-purple-200">
                              {groupedRoles.difyRoles
                                .filter(role => {
                                  if (filterType === 'dify') return true;
                                  if (!searchQuery) return true;
                                  const query = searchQuery.toLowerCase();
                                  return role.name.toLowerCase().includes(query) ||
                                    role.description?.toLowerCase().includes(query);
                                })
                                .map(role => {
                                  const isOpen = openWindows.some(w => w.role.id === role.id);
                                  const isDifyChatflow = role.difyConfig?.connectionType === 'chatflow';
                                  return (
                                    <button
                                      key={role.id}
                                      onClick={() => openChatWindow(role)}
                                      className={`
                                        w-full group relative
                                        ${isOpen 
                                          ? 'bg-blue-50 border-2 border-blue-300 shadow-sm' 
                                          : 'bg-white border border-gray-200 hover:border-blue-300 hover:shadow-md'
                                        }
                                        rounded-lg p-2.5 text-left transition-all duration-200
                                      `}
                                    >
                                      <div className="flex items-start gap-2.5">
                                        {role.avatar ? (
                                          <img
                                            src={role.avatar}
                                            alt={role.name}
                                            className={`w-9 h-9 rounded-lg object-cover flex-shrink-0 ${isOpen ? 'ring-2 ring-blue-400' : 'group-hover:ring-2 group-hover:ring-blue-200'}`}
                                          />
                                        ) : (
                                          <div className={`w-9 h-9 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm ${isOpen ? 'ring-2 ring-blue-400' : 'group-hover:ring-2 group-hover:ring-purple-200'}`}>
                                            <Bot className="w-4 h-4 text-white" />
                                          </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-1.5 mb-0.5">
                                            <h4 className="font-semibold text-xs text-gray-900 truncate">
                                              {role.name}
                                            </h4>
                                            {isOpen && (
                                              <div className="flex-shrink-0 w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></div>
                                            )}
                                          </div>
                                          {isDifyChatflow && (
                                            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 border border-blue-200 rounded mb-1">
                                              <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                                              <span className="text-xs text-blue-700 font-medium">支持多轮对话</span>
                                            </div>
                                          )}
                                          {role.description && (
                                            <p className="text-xs text-gray-500 leading-tight line-clamp-1">
                                              {role.description}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </button>
                                  );
                                })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            </div>

            {/* 一键发布 - 固定在底部 */}
            <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
              <button
                onClick={() => (window.location.href = '/public-page-configs')}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-md hover:shadow-lg"
              >
                <Rocket className="w-5 h-5" />
                <span className="font-medium">一键发布</span>
                <ExternalLink className="w-4 h-4 opacity-80" />
              </button>
              <p className="text-xs text-gray-500 text-center mt-2">
                配置公开页面，生成分享链接
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 主内容区域 */}
      <div className="flex-1 relative overflow-hidden">
        {/* 执行视图 */}
        {showExecution ? (
          <div className="h-full overflow-auto p-4">
            <WorkflowExecutionView
              execution={currentExecution}
              onPlay={() => {}}
              onPause={() => workflowEngine.pause()}
              onStop={() => {
                workflowEngine.cancel();
                setShowExecution(false);
              }}
              onResume={() => workflowEngine.resume()}
              isLoading={executionLoading}
            />
          </div>
        ) : (
          <>
            {/* 打开多个窗口时的背景提示 */}
            {openWindows.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-medium text-gray-600 mb-2">多窗口AI对话</h2>
                  <p className="text-gray-500">
                    {activeSidebar
                      ? '从左侧选择一个AI角色开始对话'
                      : '点击左上角菜单打开侧边栏'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0">
                {/* 显示打开的窗口 */}
                {openWindows.map(window => (
                  <ChatWindow
                    key={window.id}
                    role={window.role}
                    onClose={() => closeChatWindow(window.id)}
                    initialPosition={window.position}
                    initialSize={window.size}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* 悬浮的侧边栏切换按钮和配置按钮 */}
        {!activeSidebar && (
          <div className="absolute top-4 left-4 flex items-center gap-2 z-40">
            <button
              onClick={() => setActiveSidebar(true)}
              className="bg-white p-3 rounded-lg shadow-lg hover:bg-gray-50 transition-colors border border-gray-200"
              title="打开侧边栏"
            >
              <svg
                className="w-6 h-6 text-gray-700"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              {openWindowsCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {openWindowsCount}
                </div>
              )}
            </button>
            <button
              onClick={handleOpenConfig}
              className="bg-white p-3 rounded-lg shadow-lg hover:bg-gray-50 transition-colors border border-gray-200"
              title="页面配置"
            >
              <Settings className="w-6 h-6 text-gray-700" />
            </button>
          </div>
        )}

        {/* 悬浮的窗口管理按钮 */}
        {openWindowsCount > 0 && activeSidebar && (
          <div className="absolute top-4 right-4 flex items-center gap-2 z-40">
            <button
              onClick={() => setOpenWindows([])}
              className="bg-white px-3 py-2 rounded-lg shadow-lg hover:bg-gray-50 transition-colors border border-gray-200 text-sm text-gray-700"
            >
              关闭全部 ({openWindowsCount})
            </button>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default MultiChatContainer;


