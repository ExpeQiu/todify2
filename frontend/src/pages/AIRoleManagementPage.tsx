import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Bot,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  TestTube,
  Save,
  AlertCircle,
  CheckCircle,
  Loader,
  MessageSquare,
  Settings,
  PlusCircle,
  MinusCircle,
  Cpu,
  FileText,
  Layers,
  Wrench,
  Network,
  Upload,
  ExternalLink,
  Workflow,
  MessageCircle,
  X,
  Maximize2,
  Info,
  BarChart3,
  XCircle
} from 'lucide-react';
import TopNavigation from '../components/TopNavigation';
import aiRoleService, { AIRoleUsage } from '../services/aiRoleService';
import { agentWorkflowService } from '../services/agentWorkflowService';
import { AgentWorkflow } from '../types/agentWorkflow';
import { AIRoleConfig, DifyInputField, DirectAgentConfig, PromptVariable, ToolConfig, AgentCallConfig } from '../types/aiRole';
import migrationService from '../services/migrationService';
import { useNavigate } from 'react-router-dom';
import AIRoleChat from '../components/AIRoleChat';
import AIRoleConfigInfoBox from '../components/AIRoleConfigInfoBox';
import AIRoleEditModal from '../components/AIRoleEditModal';
import SearchAndFilterBar, { FilterType, FilterStatus, FilterSource, SortOption, ViewMode } from '../components/SearchAndFilterBar';
import BulkActionsBar from '../components/BulkActionsBar';
import RoleList from '../components/RoleList';
import RoleCard from '../components/RoleCard';
import { filterRoles, sortRoles } from '../utils/roleFilters';

// 为 Trash2 创建别名以避免冲突
const TrashIcon = Trash2;

const AIRoleManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState<AIRoleConfig[]>([]);
  const [selectedRole, setSelectedRole] = useState<AIRoleConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testResults, setTestResults] = useState<{ [key: string]: any }>({});
  const [isEditing, setIsEditing] = useState(false);
  const [roleUsages, setRoleUsages] = useState<Map<string, AIRoleUsage>>(new Map());
  const [loadingUsages, setLoadingUsages] = useState<Set<string>>(new Set());
  const [duplicateInfo, setDuplicateInfo] = useState<{
    duplicates: Array<{
      key: string;
      roles: AIRoleConfig[];
      keep: AIRoleConfig;
      remove: AIRoleConfig[];
    }>;
    totalDuplicates: number;
  } | null>(null);
  const [removingDuplicates, setRemovingDuplicates] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<{
    hasSmartWorkflowConfigs: boolean;
    hasIndependentPageConfigs: boolean;
    smartWorkflowCount: number;
    independentPageCount: number;
    backendAvailable?: boolean;
    errorMessage?: string;
  } | null>(null);
  const [localStorageConfigs, setLocalStorageConfigs] = useState<{
    smartWorkflowConfigs: any[];
    independentPageConfigs: any[];
  } | null>(null);
  const [migrating, setMigrating] = useState(false);
  const [showChatDialog, setShowChatDialog] = useState(false);

  // 表单状态
  const [formData, setFormData] = useState<Partial<AIRoleConfig>>({
    name: '',
    description: '',
    avatar: '',
    systemPrompt: '',
    provider: 'dify',
    difyConfig: {
      apiUrl: '/api/dify/chat-messages',
      apiKey: '',
      connectionType: 'chatflow',
      inputFields: []
    },
    agentConfig: undefined,
    enabled: true
  });

  // Direct Agent Tab 状态
  const [activeTab, setActiveTab] = useState<'llm' | 'prompt' | 'context' | 'tools' | 'agents'>('llm');
  
  // 主页面Tab状态
  const [mainTab, setMainTab] = useState<'config-status' | 'role-management'>('role-management');

  // 搜索和筛选状态
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterSource, setFilterSource] = useState<FilterSource>('all');
  const [sortOption, setSortOption] = useState<SortOption>('updated-desc');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // 批量操作状态
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // 编辑弹窗状态
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRole, setEditingRole] = useState<AIRoleConfig | null>(null);
  const [isNewRole, setIsNewRole] = useState(false);
  const [publishedWorkflows, setPublishedWorkflows] = useState<AgentWorkflow[]>([]);
  const [debugWorkflows, setDebugWorkflows] = useState<any[]>([]); // Debug state

  useEffect(() => {
    // 先加载localStorage中的配置（用于显示）
    const configs = migrationService.getLocalStorageConfigs();
    setLocalStorageConfigs(configs);
    
    // 然后加载角色和检查迁移状态（合并调用以减少重复请求）
    const initData = async () => {
      let loadedRoles: AIRoleConfig[] = [];
      try {
        // 先尝试加载角色
        loadedRoles = await aiRoleService.getAIRoles();
        // 去重：基于ID去除重复的角色
        const uniqueRoles = Array.from(
          new Map(loadedRoles.map(role => [role.id, role])).values()
        );
        setRoles(uniqueRoles);
      } catch (error) {
        // 如果加载失败（后端未运行），继续检查迁移状态
      }
      // 检查迁移状态（传入已加载的角色，避免重复调用API）
      await checkMigrationStatus(loadedRoles);
      try {
        const wfs = await agentWorkflowService.getAllWorkflows();
        const pubs = wfs.filter(w => w.published);
        setPublishedWorkflows(pubs);
      } catch {}
    };
    
        initData();
        // 加载后检查重复角色
        checkDuplicates();
      }, []);

  // 检查重复角色
  const checkDuplicates = async () => {
    try {
      const duplicates = await aiRoleService.findDuplicates();
      if (duplicates && duplicates.totalDuplicates > 0) {
        setDuplicateInfo(duplicates);
      } else {
        // 没有重复或获取失败时，清除状态
        setDuplicateInfo(null);
      }
    } catch (error) {
      // 静默处理错误，不影响页面正常显示
      setDuplicateInfo(null);
    }
  };

  const loadPublishedWorkflows = async () => {
    try {
      const wfs = await agentWorkflowService.getAllWorkflows();
      setDebugWorkflows(wfs); // Store for debugging
      console.log('Fetched workflows:', wfs);
      const pubs = wfs.filter(w => (
        (w as any).published === true ||
        (w as any).published === 1 ||
        (w as any).published === '1' ||
        (w as any).published === 'true' ||
        (typeof (w as any).published === 'string' && (w as any).published.toLowerCase() === 'true') ||
        (w as any).is_published === true ||
        (w as any).is_published === 1
      ));
      console.log('Filtered published workflows:', pubs);
      setPublishedWorkflows(pubs);
    } catch (error) {
      console.error('Error loading published workflows:', error);
    }
  };

  // 清除重复角色
  const handleRemoveDuplicates = async () => {
    if (!duplicateInfo || duplicateInfo.totalDuplicates === 0) {
      return;
    }

    if (!confirm(`确定要删除 ${duplicateInfo.totalDuplicates} 个重复角色吗？\n\n此操作不可恢复！`)) {
      return;
    }

    setRemovingDuplicates(true);
    try {
      const result = await aiRoleService.removeDuplicates();
      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: result.message || `成功清除 ${duplicateInfo.totalDuplicates} 个重复角色` 
        });
        await loadRoles();
        setDuplicateInfo(null);
      } else {
        setMessage({ type: 'error', text: result.error || '清除重复角色失败' });
      }
    } catch (error) {
      console.error('清除重复角色失败:', error);
      setMessage({ type: 'error', text: '清除重复角色失败' });
    } finally {
      setRemovingDuplicates(false);
    }
  };

  // 检查迁移状态
  const checkMigrationStatus = async (existingRoles?: AIRoleConfig[]) => {
    try {
      const status = await migrationService.checkMigrationStatus(existingRoles);
      setMigrationStatus(status);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      console.error('检查迁移状态失败:', {
        message: errorMessage,
        error
      });
    }
  };

  // 执行迁移
  const handleMigrate = async () => {
    if (!migrationStatus || (!migrationStatus.hasSmartWorkflowConfigs && !migrationStatus.hasIndependentPageConfigs)) {
      return;
    }

    if (!confirm(`确定要迁移 ${migrationStatus.smartWorkflowCount + migrationStatus.independentPageCount} 个Agent配置到AI角色管理系统吗？迁移完成后将删除旧配置。`)) {
      return;
    }

    setMigrating(true);
    try {
      const result = await migrationService.migrateAgents();
      
      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: result.message 
        });
        // 重新加载角色列表
        await loadRoles();
        // 重新检查迁移状态
        await checkMigrationStatus();
      } else {
        setMessage({ 
          type: 'error', 
          text: result.message + (result.errors ? `\n错误详情: ${result.errors.join('; ')}` : '')
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      const errorStatus = (error as any)?.response?.status || 'N/A';
      console.error('迁移失败:', {
        message: errorMessage,
        status: errorStatus,
        url: (error as any)?.config?.url || (error as any)?.response?.config?.url,
        fullError: error
      });
      setMessage({ 
        type: 'error', 
        text: `迁移失败: ${error instanceof Error ? error.message : String(error)}`
      });
    } finally {
      setMigrating(false);
    }
  };

  // 加载角色列表
  const loadRoles = async () => {
    setLoading(true);
    try {
      const roleList = await aiRoleService.getAIRoles();
      // 去重：基于ID去除重复的角色
      const uniqueRoles = Array.from(
        new Map(roleList.map(role => [role.id, role])).values()
      );
      setRoles(uniqueRoles);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || '未知错误';
      const errorStatus = error?.response?.status;
      
      const errorCode = error?.code;
      
      // 对于404、500错误或连接错误（后端未运行），静默处理，不输出控制台错误
      // 只在UI上显示友好的提示消息
      if (errorStatus === 404 || errorStatus === 500 || errorCode === 'ECONNREFUSED' || errorCode === 'ERR_NETWORK') {
        // 不输出控制台日志，只显示UI提示
        setMessage({ 
          type: 'error', 
          text: '后端API未找到，请检查后端服务器是否运行在3003端口'
        });
      } else {
        // 其他错误才输出控制台日志
        console.error('🔵 [AIRoleManagementPage] 加载AI角色列表失败');
        console.error('错误消息:', errorMessage);
        console.error('HTTP状态码:', errorStatus);
        console.error('请求URL:', error?.config?.url || error?.response?.config?.url);
        
        // 区分错误类型，给出更友好的提示
        let errorText = '';
        if (errorStatus === 0 || errorStatus === 'ECONNREFUSED') {
          errorText = '无法连接到后端服务器，请确认后端服务已启动';
        } else {
          errorText = `加载AI角色列表失败: ${errorMessage}`;
        }
        
        setMessage({ 
          type: 'error', 
          text: errorText
        });
      }
      
      // 即使后端失败，也尝试显示localStorage中的配置
      const configs = migrationService.getLocalStorageConfigs();
      if (configs.smartWorkflowConfigs.length > 0 || configs.independentPageConfigs.length > 0) {
        setLocalStorageConfigs(configs);
      }
    } finally {
      setLoading(false);
    }
  };

  // 重置表单
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      avatar: '',
      systemPrompt: '',
      provider: 'dify',
      difyConfig: {
        apiUrl: '/api/dify/chat-messages',
        apiKey: '',
        connectionType: 'chatflow',
        inputFields: []
      },
      agentConfig: undefined,
      enabled: true
    });
    setSelectedRole(null);
    setIsEditing(false);
    setActiveTab('llm');
  };

  // 加载角色使用情况
  const loadRoleUsage = async (roleId: string) => {
    if (loadingUsages.has(roleId)) {
      return; // 正在加载中，避免重复请求
    }

    // 如果有缓存，可以选择是否刷新
    // 为了确保数据准确，每次都重新加载
    setLoadingUsages(prev => new Set(prev).add(roleId));
    try {
      const usage = await aiRoleService.getRoleUsage(roleId);
      if (usage) {
        setRoleUsages(prev => new Map(prev).set(roleId, usage));
      } else {
        // 如果没有使用情况，清除缓存中的旧数据
        setRoleUsages(prev => {
          const next = new Map(prev);
          next.delete(roleId);
          return next;
        });
      }
    } catch (error) {
      console.error(`加载角色 ${roleId} 使用情况失败:`, error);
      // 加载失败时，不清除缓存（可能是网络错误）
    } finally {
      setLoadingUsages(prev => {
        const next = new Set(prev);
        next.delete(roleId);
        return next;
      });
    }
  };

  // 筛选和排序后的角色列表
  const filteredAndSortedRoles = useMemo(() => {
    const filtered = filterRoles(roles, searchQuery, filterType, filterStatus, filterSource);
    return sortRoles(filtered, sortOption);
  }, [roles, searchQuery, filterType, filterStatus, filterSource, sortOption]);

  // 选择角色（用于编辑）
  const selectRole = useCallback((role: AIRoleConfig) => {
    setEditingRole(role);
    setIsNewRole(false);
    setShowEditModal(true);
    loadRoleUsage(role.id);
  }, []);

  // 打开新建角色弹窗
  const handleNewRole = useCallback(() => {
    setEditingRole(null);
    setIsNewRole(true);
    setShowEditModal(true);
  }, []);

  // 打开编辑弹窗
  const handleEditRole = useCallback((role: AIRoleConfig) => {
    selectRole(role);
  }, [selectRole]);

  // 批量选择
  const handleSelectRole = useCallback((roleId: string) => {
    setSelectedRoles(prev => {
      const next = new Set(prev);
      if (next.has(roleId)) {
        next.delete(roleId);
      } else {
        next.add(roleId);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedRoles(new Set(filteredAndSortedRoles.map(r => r.id)));
  }, [filteredAndSortedRoles]);

  const handleDeselectAll = useCallback(() => {
    setSelectedRoles(new Set());
  }, []);

  // 批量操作
  const handleBulkEnable = useCallback(async () => {
    if (selectedRoles.size === 0) return;
    if (!confirm(`确定要启用 ${selectedRoles.size} 个角色吗？`)) return;

    setIsBulkProcessing(true);
    try {
      const promises = Array.from(selectedRoles).map(roleId => {
        const role = roles.find(r => r.id === roleId);
        if (role) {
          return aiRoleService.updateAIRole(roleId, { ...role, enabled: true });
        }
        return Promise.resolve({ success: false });
      });
      await Promise.all(promises);
      setMessage({ type: 'success', text: `成功启用 ${selectedRoles.size} 个角色` });
      await loadRoles();
      setSelectedRoles(new Set());
    } catch (error) {
      setMessage({ type: 'error', text: '批量启用失败' });
    } finally {
      setIsBulkProcessing(false);
    }
  }, [selectedRoles, roles]);

  const handleBulkDisable = useCallback(async () => {
    if (selectedRoles.size === 0) return;
    if (!confirm(`确定要禁用 ${selectedRoles.size} 个角色吗？`)) return;

    setIsBulkProcessing(true);
    try {
      const promises = Array.from(selectedRoles).map(roleId => {
        const role = roles.find(r => r.id === roleId);
        if (role) {
          return aiRoleService.updateAIRole(roleId, { ...role, enabled: false });
        }
        return Promise.resolve({ success: false });
      });
      await Promise.all(promises);
      setMessage({ type: 'success', text: `成功禁用 ${selectedRoles.size} 个角色` });
      await loadRoles();
      setSelectedRoles(new Set());
    } catch (error) {
      setMessage({ type: 'error', text: '批量禁用失败' });
    } finally {
      setIsBulkProcessing(false);
    }
  }, [selectedRoles, roles]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedRoles.size === 0) return;
    if (!confirm(`确定要删除 ${selectedRoles.size} 个角色吗？此操作不可恢复！`)) return;

    setIsBulkProcessing(true);
    try {
      const promises = Array.from(selectedRoles).map(roleId => aiRoleService.deleteAIRole(roleId));
      await Promise.all(promises);
      setMessage({ type: 'success', text: `成功删除 ${selectedRoles.size} 个角色` });
      await loadRoles();
      setSelectedRoles(new Set());
    } catch (error) {
      setMessage({ type: 'error', text: '批量删除失败' });
    } finally {
      setIsBulkProcessing(false);
    }
  }, [selectedRoles]);

  // 切换启用状态
  const handleToggleEnable = useCallback(async (role: AIRoleConfig) => {
    try {
      await aiRoleService.updateAIRole(role.id, { ...role, enabled: !role.enabled });
      setMessage({ type: 'success', text: role.enabled ? '已禁用' : '已启用' });
      await loadRoles();
    } catch (error) {
      setMessage({ type: 'error', text: '操作失败' });
    }
  }, []);

  // 处理角色保存（从弹窗）
  const handleSaveRole = useCallback(async (role: AIRoleConfig) => {
    setSaving(true);
    try {
      let result;
      if (isNewRole) {
        result = await aiRoleService.createAIRole(role as Omit<AIRoleConfig, 'id' | 'createdAt' | 'updatedAt'>);
      } else {
        result = await aiRoleService.updateAIRole(role.id, role);
      }

      if (result.success) {
        setMessage({ type: 'success', text: result.message || '保存成功' });
        await loadRoles();
        setShowEditModal(false);
      } else {
        setMessage({ type: 'error', text: result.error || '保存失败' });
        throw new Error(result.error || '保存失败');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      setMessage({ type: 'error', text: `保存失败: ${errorMessage}` });
      throw error;
    } finally {
      setSaving(false);
    }
  }, [isNewRole]);

  // 处理测试连接
  const handleTestConnection = useCallback(async (role: AIRoleConfig) => {
    try {
      const result = await aiRoleService.testConnection(role.id);
      setTestResults(prev => ({
        ...prev,
        [role.id]: result
      }));
      if (result.success) {
        setMessage({ type: 'success', text: '连接测试成功' });
      } else {
        setMessage({ type: 'error', text: result.message || '连接测试失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '连接测试失败' });
    }
  }, []);

  // 处理对话测试
  const handleChat = useCallback((role: AIRoleConfig) => {
    setSelectedRole(role);
    setShowChatDialog(true);
  }, []);

  // 处理工作流对话测试
  const handleWorkflowChat = useCallback((workflow: AgentWorkflow) => {
    // 构造一个临时的 AIRoleConfig 对象
    const tempRole: AIRoleConfig = {
      id: workflow.id,
      name: workflow.name,
      description: workflow.description || '',
      enabled: true,
      // @ts-ignore - 后端会自动识别 workflow ID 并处理，这里使用 dify 是为了满足类型检查
      provider: 'dify', 
      createdAt: workflow.createdAt || new Date(),
      updatedAt: workflow.updatedAt || new Date(),
    };
    setSelectedRole(tempRole);
    setShowChatDialog(true);
  }, []);

  // 更新表单字段
  const updateFormField = (field: string, value: any) => {
    if (field.startsWith('difyConfig.')) {
      const difyField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        difyConfig: {
          ...prev.difyConfig!,
          [difyField]: value
        }
      }));
    } else if (field.startsWith('agentConfig.')) {
      // 处理 agentConfig 的嵌套字段更新
      const parts = field.split('.');
      if (parts.length === 2) {
        const agentField = parts[1];
        setFormData(prev => ({
          ...prev,
          agentConfig: {
            ...prev.agentConfig!,
            [agentField]: value
          }
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // 添加输入字段
  const addInputField = () => {
    const newField: DifyInputField = {
      variable: '',
      label: '',
      type: 'paragraph',
      required: false
    };
    setFormData(prev => ({
      ...prev,
      difyConfig: {
        ...prev.difyConfig!,
        inputFields: [...(prev.difyConfig?.inputFields || []), newField]
      }
    }));
  };

  // 删除输入字段
  const removeInputField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      difyConfig: {
        ...prev.difyConfig!,
        inputFields: prev.difyConfig?.inputFields?.filter((_, i) => i !== index) || []
      }
    }));
  };

  // 更新输入字段
  const updateInputField = (index: number, field: Partial<DifyInputField>) => {
    setFormData(prev => ({
      ...prev,
      difyConfig: {
        ...prev.difyConfig!,
        inputFields: prev.difyConfig?.inputFields?.map((f, i) => 
          i === index ? { ...f, ...field } : f
        ) || []
      }
    }));
  };

  // 保存角色
  const saveRole = async () => {
    // 验证必填字段
    if (!formData.name || !formData.description) {
      setMessage({ type: 'error', text: '请填写角色名称和描述' });
      return;
    }

    const provider = formData.provider || 'dify';

    // 根据 provider 验证配置
    if (provider === 'dify') {
      if (!formData.difyConfig?.apiUrl || !formData.difyConfig?.apiKey) {
        setMessage({ type: 'error', text: '请填写Dify API地址和密钥' });
        return;
      }
    } else if (provider === 'direct-agent') {
      if (!formData.agentConfig?.llm?.apiKey || !formData.agentConfig?.llm?.apiBaseUrl || !formData.agentConfig?.llm?.model) {
        setMessage({ type: 'error', text: '请填写LLM API密钥、API地址和模型名称' });
        return;
      }
      if (!formData.agentConfig?.prompt?.systemPrompt) {
        setMessage({ type: 'error', text: '请填写系统提示词' });
        return;
      }
      if (!formData.agentConfig?.contextStrategy) {
        setMessage({ type: 'error', text: '请配置上下文策略' });
        return;
      }
    }

    setSaving(true);
    try {
      let result;
      const isUpdate = selectedRole && selectedRole.id;
      
      if (isUpdate) {
        // 更新现有角色 - 使用selectedRole.id确保准确性
        result = await aiRoleService.updateAIRole(selectedRole.id, formData);
      } else {
        // 创建新角色
        result = await aiRoleService.createAIRole(formData as Omit<AIRoleConfig, 'id' | 'createdAt' | 'updatedAt'>);
      }

      if (result.success && result.data) {
        setMessage({ type: 'success', text: result.message || '保存成功' });
        setIsEditing(false);
        
        // 先重新加载角色列表
        await loadRoles();
        
        // 从最新列表中找到保存的角色并选中
        const savedRoleId = result.data.id;
        // 使用useEffect监听roles变化来更新selectedRole，或者直接从result.data获取
        const updatedRole = result.data as AIRoleConfig;
        setSelectedRole(updatedRole);
        setFormData(updatedRole);
        
        // 如果角色被使用，重新加载使用情况
        if (savedRoleId) {
          await loadRoleUsage(savedRoleId);
        }
      } else {
        setMessage({ type: 'error', text: result.error || '保存失败' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : (error as any)?.response?.data?.message || '未知错误';
      const errorStatus = (error as any)?.response?.status || 'N/A';
      console.error('保存角色失败:', {
        message: errorMessage,
        status: errorStatus,
        url: (error as any)?.config?.url || (error as any)?.response?.config?.url,
        fullError: error
      });
      setMessage({ type: 'error', text: '保存角色失败' });
    } finally {
      setSaving(false);
    }
  };

  // 删除角色
  const deleteRole = useCallback(async (role: AIRoleConfig) => {
    if (!confirm(`确定要删除AI角色"${role.name}"吗？此操作不可恢复！`)) return;

    const roleIdToDelete = role.id;
    
    try {
      const result = await aiRoleService.deleteAIRole(roleIdToDelete);
      if (result.success) {
        setMessage({ type: 'success', text: '删除成功' });
        
        // 清除使用情况缓存
        setRoleUsages(prev => {
          const next = new Map(prev);
          next.delete(roleIdToDelete);
          return next;
        });
        
        // 从选中列表中移除
        setSelectedRoles(prev => {
          const next = new Set(prev);
          next.delete(roleIdToDelete);
          return next;
        });
        
        // 重新加载角色列表
        await loadRoles();
        
        // 如果删除的是当前选中的角色，清除选中状态
        if (selectedRole?.id === roleIdToDelete) {
          setSelectedRole(null);
          resetForm();
        }
      } else {
        setMessage({ type: 'error', text: result.error || '删除失败' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : (error as any)?.response?.data?.message || '未知错误';
      const errorStatus = (error as any)?.response?.status || 'N/A';
      console.error('删除角色失败:', {
        message: errorMessage,
        status: errorStatus,
        url: (error as any)?.config?.url || (error as any)?.response?.config?.url,
        fullError: error
      });
      setMessage({ type: 'error', text: '删除角色失败' });
    }
  }, [selectedRole]);

  // 测试连接
  const testConnection = async () => {
    if (!selectedRole) return;

    setTestResults(prev => ({
      ...prev,
      [selectedRole.id]: { success: false, message: '测试中...' }
    }));

    try {
      const result = await aiRoleService.testConnection(selectedRole.id);
      setTestResults(prev => ({
        ...prev,
        [selectedRole.id]: result
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [selectedRole.id]: { success: false, message: '测试失败' }
      }));
    }
  };

  // 清除消息
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 按 / 聚焦搜索框
      if (e.key === '/' && !showEditModal && !showChatDialog) {
        const searchInput = document.querySelector('input[placeholder*="搜索"]') as HTMLInputElement;
        if (searchInput && e.target !== searchInput) {
          e.preventDefault();
          searchInput.focus();
        }
      }
      // 按 n 新建角色
      if ((e.key === 'n' || e.key === 'N') && !showEditModal && !showChatDialog && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        handleNewRole();
      }
      // 按 Delete 删除选中项
      if (e.key === 'Delete' && selectedRoles.size > 0 && !showEditModal && !showChatDialog) {
        e.preventDefault();
        handleBulkDelete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showEditModal, showChatDialog, selectedRoles, handleNewRole, handleBulkDelete]);

  // 骨架屏组件
  const SkeletonCard = () => (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          <div className="flex gap-2">
            <div className="h-6 bg-gray-200 rounded w-20"></div>
            <div className="h-6 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNavigation />
        <div className="container mx-auto px-4 py-10">
          <div className="mb-8">
            <div className="h-10 bg-gray-200 rounded w-64 mb-4 animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded w-96 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-[15px] md:text-base leading-relaxed">
      <TopNavigation />
      
      {/* 消息提示 */}
      {message && (
        <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-5 py-3.5 rounded-xl shadow-lg flex items-center gap-3 text-base font-medium ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="container mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">AI角色管理</h1>
            <p className="text-gray-600 mt-2 text-xl font-medium">创建和管理您的AI对话角色</p>
            {/* 快速导航 */}
            <div className="flex items-center gap-4 mt-5 flex-wrap text-base md:text-lg">
              <a
                href="/agent-workflow"
                className="text-blue-600 hover:text-blue-800 transition-colors font-medium"
              >
                → 管理工作流
              </a>
              <span className="text-gray-300">|</span>
              <a
                href="/ai-chat-multi"
                className="text-blue-600 hover:text-blue-800 transition-colors font-medium"
              >
                → 多窗口对话
              </a>
              <span className="text-gray-300">|</span>
              <a
                href="/public-page-configs"
                className="text-blue-600 hover:text-blue-800 transition-colors font-medium"
              >
                → 公开页面配置
              </a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* 后端连接状态指示 */}
            {migrationStatus && migrationStatus.backendAvailable === false && (
              <div className="flex items-center gap-2.5 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-semibold shadow-sm">
                <AlertCircle size={18} />
                <span>后端未连接</span>
              </div>
            )}
            {migrationStatus && migrationStatus.backendAvailable === true && roles.length > 0 && (
              <>
                <div className="flex items-center gap-2.5 px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-semibold shadow-sm">
                  <CheckCircle size={18} />
                  <span>已连接 ({roles.length}个角色)</span>
                </div>
                {duplicateInfo && duplicateInfo.totalDuplicates > 0 && (
                  <button
                    onClick={handleRemoveDuplicates}
                    disabled={removingDuplicates}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all shadow-md hover:shadow-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                    title={`发现 ${duplicateInfo.totalDuplicates} 个重复角色`}
                  >
                    {removingDuplicates ? (
                      <>
                        <Loader className="animate-spin" size={16} />
                        <span>清除中...</span>
                      </>
                    ) : (
                      <>
                        <TrashIcon size={16} />
                        <span>清除重复 ({duplicateInfo.totalDuplicates})</span>
                      </>
                    )}
                  </button>
                )}
              </>
            )}
            {migrationStatus && (migrationStatus.hasSmartWorkflowConfigs || migrationStatus.hasIndependentPageConfigs) && (
              <button
                onClick={handleMigrate}
                disabled={migrating || !migrationStatus.backendAvailable}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all shadow-md hover:shadow-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                title={!migrationStatus.backendAvailable ? '请先启动后端服务器' : ''}
              >
                {migrating ? (
                  <>
                    <Loader className="animate-spin" size={18} />
                    <span>迁移中...</span>
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    <span>导入现有配置 ({migrationStatus.smartWorkflowCount + migrationStatus.independentPageCount}个)</span>
                  </>
                )}
              </button>
            )}
            <button
              onClick={handleNewRole}
              className="flex items-center gap-2.5 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg text-base font-semibold"
            >
              <Plus size={20} />
              <span>新建角色</span>
            </button>
          </div>
        </div>

        {/* Tab导航 */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setMainTab('role-management')}
                  className={`flex-1 px-6 py-4 text-center font-semibold text-base transition-all ${
                    mainTab === 'role-management'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Settings className="w-5 h-5" />
                    <span>角色管理</span>
                  </div>
                </button>
                <button
                  onClick={() => setMainTab('config-status')}
                  className={`flex-1 px-6 py-4 text-center font-semibold text-base transition-all ${
                    mainTab === 'config-status'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Info className="w-5 h-5" />
                    <span>配置状态</span>
                  </div>
                </button>
              </nav>
            </div>
          </div>
        </div>

        {/* Tab内容 */}
        {mainTab === 'config-status' && (
          <div className="mb-6">
            <AIRoleConfigInfoBox roles={roles} onRefresh={loadRoles} hideHeader={true} />
          </div>
        )}

        {mainTab === 'role-management' && (
          <div className="space-y-6">
            {/* 统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">总角色数</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{roles.length}</p>
                  </div>
                  <Bot className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">已启用</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {roles.filter(r => r.enabled).length}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-gray-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">已禁用</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {roles.filter(r => !r.enabled).length}
                    </p>
                  </div>
                  <XCircle className="w-8 h-8 text-gray-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Dify工作流</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {roles.filter(r => r.provider === 'dify' || !r.provider).length}
                    </p>
                  </div>
                  <Workflow className="w-8 h-8 text-purple-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-indigo-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">自编工作流</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{publishedWorkflows.length}</p>
                  </div>
                  <Workflow className="w-8 h-8 text-indigo-500" />
                </div>
              </div>
            </div>

            {/* 搜索和筛选栏 */}
            <SearchAndFilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              filterType={filterType}
              onFilterTypeChange={setFilterType}
              filterStatus={filterStatus}
              onFilterStatusChange={setFilterStatus}
              filterSource={filterSource}
              onFilterSourceChange={setFilterSource}
              sortOption={sortOption}
              onSortChange={setSortOption}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              resultCount={filteredAndSortedRoles.length}
            />

            {/* 批量操作栏 */}
            <BulkActionsBar
              selectedRoles={selectedRoles}
              roles={filteredAndSortedRoles}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
              onBulkEnable={handleBulkEnable}
              onBulkDisable={handleBulkDisable}
              onBulkDelete={handleBulkDelete}
              isProcessing={isBulkProcessing}
            />

            {/* 角色列表/卡片 */}
            {viewMode === 'list' ? (
              <RoleList
                roles={filteredAndSortedRoles}
                selectedRoles={selectedRoles}
                onSelect={handleSelectRole}
                onSelectAll={handleSelectAll}
                onEdit={handleEditRole}
                onDelete={deleteRole}
                onToggleEnable={handleToggleEnable}
                onChat={handleChat}
                roleUsages={roleUsages}
                showUsage={true}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAndSortedRoles.map(role => (
                  <RoleCard
                    key={role.id}
                    role={role}
                    isSelected={selectedRoles.has(role.id)}
                    onSelect={handleSelectRole}
                    onEdit={handleEditRole}
                    onDelete={deleteRole}
                    onToggleEnable={handleToggleEnable}
                    onChat={handleChat}
                    usage={roleUsages.get(role.id)}
                    showUsage={true}
                  />
                ))}
              </div>
            )}

            {/* Debug info - TEMPORARY */}
            {debugWorkflows.length > 0 && (
              <div className="bg-gray-100 p-4 mb-4 rounded overflow-auto max-h-60 text-xs font-mono border border-gray-300">
                <div className="flex justify-between mb-2 font-bold">
                  <span>Debug Info: Raw Workflows ({debugWorkflows.length})</span>
                  <button onClick={() => setDebugWorkflows([])} className="text-blue-600">Close</button>
                </div>
                <pre>{JSON.stringify(debugWorkflows.slice(0, 3), null, 2)}</pre>
                {debugWorkflows.length > 3 && <p className="mt-2 text-gray-500">...and {debugWorkflows.length - 3} more</p>}
              </div>
            )}

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Workflow className="w-5 h-5 text-indigo-600" />
                  <span>自编工作流（已发布）</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={loadPublishedWorkflows}
                    className="text-sm px-3 py-1.5 border rounded-lg text-gray-700 hover:bg-gray-100"
                    title="刷新列表"
                  >
                    刷新
                  </button>
                  <button
                    onClick={async () => {
                        try {
                          const wfs = await agentWorkflowService.getAllWorkflows();
                          setPublishedWorkflows(wfs);
                        } catch (e) { console.error(e); }
                    }}
                    className="text-sm px-3 py-1.5 border rounded-lg text-gray-700 hover:bg-gray-100 ml-2"
                  >
                    显示所有
                  </button>
                  <a href="/agent-workflow" className="text-blue-600 hover:text-blue-800 text-sm">去管理</a>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {publishedWorkflows.map(wf => (
                  <div key={wf.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-3 flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                            <Workflow className="w-6 h-6 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-900 truncate text-sm">{wf.name}</h3>
                              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                            </div>
                            <p className="text-xs text-gray-600 truncate mt-0.5">{wf.description || '—'}</p>
                          </div>
                        </div>
                        <div className="col-span-2">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-700">
                            {(wf.engine as any) || (wf.metadata?.engine as any) || 'native'}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">已发布</span>
                        </div>
                        <div className="col-span-2">
                          <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">自编</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-xs text-gray-400">—</span>
                        </div>
                        <div className="col-span-1 flex items-center justify-end gap-2">
                          <button
                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                            title="对话测试"
                            onClick={() => handleWorkflowChat(wf)}
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <a className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="编辑" href="/agent-workflow">
                            <Edit2 className="w-4 h-4" />
                          </a>
                          <button
                            className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                            title="取消发布"
                            onClick={async () => {
                              try {
                                await agentWorkflowService.updateWorkflow(wf.id, { published: false });
                                await loadPublishedWorkflows();
                              } catch {}
                            }}
                          >
                            <EyeOff className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {publishedWorkflows.length === 0 && (
                  <div className="px-4 py-6 text-sm text-gray-500">暂无已发布的自编工作流</div>
                )}
              </div>
            </div>

            {/* 空状态 */}
            {filteredAndSortedRoles.length === 0 && (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <Bot size={64} className="mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchQuery || filterType !== 'all' || filterStatus !== 'all' || filterSource !== 'all'
                    ? '没有找到匹配的角色'
                    : '暂无角色'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery || filterType !== 'all' || filterStatus !== 'all' || filterSource !== 'all'
                    ? '尝试调整搜索条件或筛选器'
                    : '点击上方"新建角色"按钮创建您的第一个AI角色'}
                </p>
                {(searchQuery || filterType !== 'all' || filterStatus !== 'all' || filterSource !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setFilterType('all');
                      setFilterStatus('all');
                      setFilterSource('all');
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    清除筛选
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* 旧版布局（已废弃，保留用于兼容） */}
        {false && mainTab === 'role-management-old' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：角色列表 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4">
                <h2 className="text-white font-semibold text-lg flex items-center gap-2.5">
                  <MessageSquare size={22} />
                  已创建的角色
                </h2>
              </div>
              <div className="divide-y divide-gray-200 max-h-[calc(100vh-50px)] overflow-y-auto">
                {roles.length === 0 && (!localStorageConfigs || (localStorageConfigs.smartWorkflowConfigs.length === 0 && localStorageConfigs.independentPageConfigs.length === 0)) ? (
                  <div className="p-8 text-center text-gray-500">
                    <Bot size={56} className="mx-auto mb-3 opacity-50" />
                    <p className="text-base">暂无AI角色，点击上方按钮创建</p>
                    {migrationStatus && migrationStatus.backendAvailable === false && (
                      <p className="text-sm text-yellow-600 mt-2">
                        {migrationStatus.errorMessage || '后端服务未连接'}
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    {/* 显示localStorage中的待迁移配置 */}
                    {localStorageConfigs && (localStorageConfigs.smartWorkflowConfigs.length > 0 || localStorageConfigs.independentPageConfigs.length > 0) && migrationStatus && !migrationStatus.backendAvailable && (
                      <div className="p-5 bg-yellow-50 border-b-2 border-yellow-200">
                        <div className="flex items-center gap-2.5 mb-3">
                          <AlertCircle size={18} className="text-yellow-600" />
                          <span className="font-semibold text-base text-yellow-800">
                            待迁移配置（localStorage）
                          </span>
                        </div>
                        <div className="space-y-1.5 text-sm text-yellow-700 leading-relaxed">
                          {localStorageConfigs.smartWorkflowConfigs.length > 0 && (
                            <div>智能工作流配置: {localStorageConfigs.smartWorkflowConfigs.length}个</div>
                          )}
                          {localStorageConfigs.independentPageConfigs.length > 0 && (
                            <div>独立页面配置: {localStorageConfigs.independentPageConfigs.length}个</div>
                          )}
                          <div className="text-yellow-600 mt-3">
                            启动后端服务器后可以迁移这些配置
                          </div>
                        </div>
                      </div>
                    )}
                    {/* 显示已创建的角色 - 按类型分组 */}
                    {roles.length > 0 && (() => {
                      // 按 provider 分组
                      const difyRoles = roles.filter(role => role.provider === 'dify' || !role.provider);
                      const directAgentRoles = roles.filter(role => role.provider === 'direct-agent');
                      
                      const renderRoleItem = (role: AIRoleConfig) => (
                        <div
                          key={role.id}
                          onClick={() => selectRole(role)}
                          className={`p-5 cursor-pointer transition-all duration-200 ${
                            selectedRole?.id === role.id
                              ? 'bg-blue-50 border-l-4 border-blue-600 shadow-sm'
                              : 'hover:bg-gray-50 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4 flex-1">
                              {role.avatar ? (
                                <img
                                  src={role.avatar}
                                  alt={role.name}
                                  className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-200"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center ring-2 ring-gray-200">
                                  <Bot className="w-7 h-7 text-blue-600" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2.5 mb-1.5">
                                  <h3 className="font-semibold text-gray-900 truncate text-lg">
                                    {role.name}
                                  </h3>
                                  {role.source && (
                                    <span className={`text-sm px-2 py-0.5 rounded flex-shrink-0 ${
                                      role.source === 'smart-workflow' 
                                        ? 'bg-blue-100 text-blue-700' 
                                        : role.source === 'independent-page'
                                        ? 'bg-green-100 text-green-700'
                                        : role.source === 'agent-workflow'
                                        ? 'bg-indigo-100 text-indigo-700'
                                        : 'bg-gray-100 text-gray-700'
                                    }`}>
                                      {role.source === 'smart-workflow' ? '智能工作流' : 
                                       role.source === 'independent-page' ? '独立页面' : 
                                       role.source === 'agent-workflow' ? '自编工作流' : '自定义'}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mt-2.5 line-clamp-2 leading-relaxed">
                                  {role.description}
                                </p>
                                <div className="flex items-center gap-2 mt-3 flex-wrap">
                                  <span
                                    className={`text-sm px-2 py-0.5 rounded ${
                                      role.enabled
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-gray-100 text-gray-600'
                                    }`}
                                  >
                                    {role.enabled ? '启用' : '禁用'}
                                  </span>
                                  {role.provider === 'dify' || !role.provider ? (
                                    <span className="text-sm text-gray-500">
                                      {role.difyConfig?.connectionType || 'chatflow'}
                                    </span>
                                  ) : (
                                    <span className="text-sm text-gray-500">
                                      独立Agent
                                    </span>
                                  )}
                                  {/* 使用情况徽章 */}
                                  {roleUsages.has(role.id) && (() => {
                                    const usage = roleUsages.get(role.id)!;
                                    if (usage.totalUsageCount > 0) {
                                      return (
                                        <span className="text-sm px-2 py-0.5 rounded bg-purple-100 text-purple-700 flex items-center gap-1">
                                          <FileText size={12} />
                                          {usage.totalUsageCount}处使用
                                        </span>
                                      );
                                    }
                                    return null;
                                  })()}
                                  {loadingUsages.has(role.id) && (
                                    <Loader className="w-3 h-3 animate-spin text-gray-400" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );

                      return (
                        <>
                          {/* Dify 工作流分组 */}
                          {difyRoles.length > 0 && (
                            <>
                              <div className="sticky top-0 bg-gray-50 px-5 py-3 border-b-2 border-gray-200 z-10">
                                <div className="flex items-center gap-2">
                                  <Workflow size={18} className="text-blue-600" />
                                  <h3 className="font-semibold text-gray-800 text-base">
                                    Dify 工作流 ({difyRoles.length})
                                  </h3>
                                </div>
                              </div>
                              {difyRoles.map(renderRoleItem)}
                            </>
                          )}
                          
                          {/* 独立 Agent 分组 */}
                          {directAgentRoles.length > 0 && (
                            <>
                              <div className="sticky top-0 bg-gray-50 px-5 py-3 border-b-2 border-gray-200 z-10">
                                <div className="flex items-center gap-2">
                                  <Cpu size={18} className="text-purple-600" />
                                  <h3 className="font-semibold text-gray-800 text-base">
                                    独立 Agent ({directAgentRoles.length})
                                  </h3>
                                </div>
                              </div>
                              {directAgentRoles.map(renderRoleItem)}
                            </>
                          )}
                        </>
                      );
                    })()}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 右侧：角色配置 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-white font-semibold text-lg flex items-center gap-2.5">
                    <Settings size={22} />
                    {isEditing ? '编辑角色' : '角色配置'}
                  </h2>
                  {selectedRole && !isEditing && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg text-sm font-semibold"
                      >
                        <Edit2 size={16} />
                        编辑
                      </button>
                      <button
                        onClick={deleteRole}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all shadow-md hover:shadow-lg text-sm font-semibold"
                      >
                        <Trash2 size={16} />
                        删除
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-8 space-y-8">
                {/* 使用情况显示 */}
                {selectedRole && !isEditing && roleUsages.has(selectedRole.id) && (() => {
                  const usage = roleUsages.get(selectedRole.id)!;
                  return (
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200 shadow-sm">
                      <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2.5">
                        <FileText size={22} className="text-purple-600" />
                        使用情况
                      </h3>
                      {usage.totalUsageCount === 0 ? (
                        <p className="text-gray-700 text-base">此角色未在任何功能页面中使用</p>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-base text-gray-700 mb-4">
                            此角色在 <span className="font-semibold text-purple-700 text-lg">{usage.totalUsageCount}</span> 个位置使用：
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {usage.locations.map((location, index) => (
                              <div
                                key={index}
                                className="bg-white rounded-lg p-3 border border-gray-200 hover:border-purple-300 transition-colors"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start gap-2 flex-1">
                                    {location.type === 'independent-page' && (
                                      <FileText size={16} className="text-green-600 mt-0.5" />
                                    )}
                                    {location.type === 'agent-workflow' && (
                                      <Workflow size={16} className="text-blue-600 mt-0.5" />
                                    )}
                                    {location.type === 'multi-chat' && (
                                      <MessageCircle size={16} className="text-purple-600 mt-0.5" />
                                    )}
                                    <div className="flex-1">
                                    <div className="font-semibold text-gray-800 text-base">
                                        {location.name}
                                      </div>
                                      {location.description && (
                                      <div className="text-sm text-gray-600 mt-1">
                                          {location.description}
                                        </div>
                                      )}
                                      {location.path && (
                                        <button
                                          onClick={() => navigate(location.path!)}
                                        className="text-sm text-blue-600 hover:text-blue-800 mt-2 flex items-center gap-1 font-medium"
                                        >
                                          前往页面
                                          <ExternalLink size={12} />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* 基本信息 */}
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-6">基本信息</h3>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-base font-semibold text-gray-800 mb-2.5">
                        角色名称
                      </label>
                      <input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => updateFormField('name', e.target.value)}
                        placeholder="例如：AI技术顾问"
                        className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-base font-semibold text-gray-800 mb-2.5">
                        角色描述
                      </label>
                      <textarea
                        value={formData.description || ''}
                        onChange={(e) => updateFormField('description', e.target.value)}
                        placeholder="描述这个AI角色的用途和特点"
                        rows={4}
                        className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-base font-semibold text-gray-800 mb-2.5">
                        头像URL（可选）
                      </label>
                      <input
                        type="url"
                        value={formData.avatar || ''}
                        onChange={(e) => updateFormField('avatar', e.target.value)}
                        placeholder="https://example.com/avatar.png"
                        className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Provider 选择器 */}
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-6">Agent类型</h3>
                  <div className="space-y-4">
                    <div className="flex gap-6">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="radio"
                          name="provider"
                          value="dify"
                          checked={formData.provider === 'dify' || !formData.provider}
                          onChange={(e) => {
                            updateFormField('provider', e.target.value);
                            setActiveTab('llm');
                          }}
                          className="w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-base font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">Dify工作流</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="radio"
                          name="provider"
                          value="direct-agent"
                          checked={formData.provider === 'direct-agent'}
                          onChange={(e) => {
                            updateFormField('provider', e.target.value);
                            setActiveTab('llm');
                            // 初始化 Direct Agent 配置
                            if (!formData.agentConfig) {
                              setFormData(prev => ({
                                ...prev,
                                agentConfig: {
                                  llm: {
                                    provider: 'openai',
                                    apiKey: '',
                                    apiBaseUrl: 'https://api.openai.com/v1',
                                    model: 'gpt-3.5-turbo',
                                    temperature: 0.7,
                                    maxTokens: 2000
                                  },
                                  prompt: {
                                    systemPrompt: '',
                                    variables: [],
                                    templates: []
                                  },
                                  contextStrategy: {
                                    type: 'window',
                                    maxMessages: 10,
                                    maxTokens: 4000,
                                    includeSystemPrompt: true
                                  },
                                  tools: [],
                                  agentCalls: []
                                }
                              }));
                            }
                          }}
                          className="w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-base font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">独立Agent</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* 根据 Provider 显示不同的配置 */}
                {(formData.provider === 'dify' || !formData.provider) ? (
                  <div>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-6">Dify配置</h3>
                  <div className="mb-6 rounded-xl border-2 border-blue-200 bg-blue-50 p-5 text-base text-blue-800 leading-relaxed shadow-sm">
                    所有 AI 调用已通过后端的 Dify 网关统一处理，此处配置仅用于后台同步记录，请勿填写外部服务的真实凭据。
                  </div>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-base font-semibold text-gray-800 mb-2.5">
                        API地址
                      </label>
                      <input
                        type="url"
                        value={formData.difyConfig?.apiUrl || ''}
                        onChange={(e) => updateFormField('difyConfig.apiUrl', e.target.value)}
                        placeholder="/api/dify/chat-messages"
                        className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-base font-semibold text-gray-800 mb-2.5">
                        API密钥
                      </label>
                      <div className="relative">
                        <input
                          type={showApiKey ? 'text' : 'password'}
                          value={formData.difyConfig?.apiKey || ''}
                          onChange={(e) => updateFormField('difyConfig.apiKey', e.target.value)}
                          placeholder="app-xxxxxxxxxx"
                          className="w-full px-4 py-3 pr-12 text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                        <button
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
                        >
                          {showApiKey ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-base font-semibold text-gray-800 mb-2.5">
                        连接类型
                      </label>
                      <select
                        value={formData.difyConfig?.connectionType || 'chatflow'}
                        onChange={(e) => updateFormField('difyConfig.connectionType', e.target.value)}
                        className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        <option value="chatflow">Chatflow（聊天流）</option>
                        <option value="workflow">Workflow（工作流）</option>
                      </select>
                    </div>
                  </div>

                  {/* 输入字段配置 */}
                  {(formData.difyConfig?.connectionType === 'workflow' || formData.difyConfig?.connectionType === 'chatflow') && (
                    <div>
                      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                      <h3 className="text-2xl font-semibold text-gray-900">
                        {formData.difyConfig?.connectionType === 'workflow' ? 'Dify工作流输入字段' : 'Dify聊天流输入字段'}
                      </h3>
                      <button
                        onClick={addInputField}
                        className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-md hover:shadow-lg text-sm font-semibold"
                      >
                        <PlusCircle size={18} />
                        添加字段
                      </button>
                    </div>
                    <div className="space-y-5">
                      {formData.difyConfig?.inputFields && formData.difyConfig.inputFields.length > 0 ? (
                        formData.difyConfig.inputFields.map((field, index) => (
                          <div key={index} className="border-2 border-gray-200 rounded-xl p-5 bg-gray-50 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-base font-semibold text-gray-800">字段 #{index + 1}</span>
                              <button
                                onClick={() => removeInputField(index)}
                                className="text-red-600 hover:text-red-700 transition-colors p-1 hover:bg-red-50 rounded"
                              >
                                <MinusCircle size={20} />
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                  变量名 *
                                </label>
                                <input
                                  type="text"
                                  value={field.variable}
                                  onChange={(e) => updateInputField(index, { variable: e.target.value })}
                                  placeholder="例如：Additional_information"
                                  className="w-full px-3 py-2.5 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                  字段标签 *
                                </label>
                                <input
                                  type="text"
                                  value={field.label}
                                  onChange={(e) => updateInputField(index, { label: e.target.value })}
                                  placeholder="例如：补充信息"
                                  className="w-full px-3 py-2.5 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                  字段类型 *
                                </label>
                                <select
                                  value={field.type}
                                  onChange={(e) => updateInputField(index, { type: e.target.value as DifyInputField['type'] })}
                                  className="w-full px-3 py-2.5 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                >
                                  <option value="text">文本 (text)</option>
                                  <option value="paragraph">段落 (paragraph)</option>
                                  <option value="select">选择 (select)</option>
                                  <option value="file-list">文件列表 (file-list)</option>
                                  <option value="number">数字 (number)</option>
                                </select>
                              </div>
                              <div className="flex items-center pt-7">
                                <input
                                  type="checkbox"
                                  checked={field.required}
                                  onChange={(e) => updateInputField(index, { required: e.target.checked })}
                                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <label className="ml-2.5 text-sm font-medium text-gray-700">必填</label>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-4">
                              {['paragraph', 'text'].includes(field.type) && (
                                <>
                                  <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                      最大长度
                                    </label>
                                    <input
                                      type="number"
                                      value={field.maxLength || ''}
                                      onChange={(e) => updateInputField(index, { maxLength: parseInt(e.target.value) || undefined })}
                                      placeholder="例如：5000"
                                      className="w-full px-3 py-2.5 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                      占位符
                                    </label>
                                    <input
                                      type="text"
                                      value={field.placeholder || ''}
                                      onChange={(e) => updateInputField(index, { placeholder: e.target.value })}
                                      placeholder="占位符文本"
                                      className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
                                </>
                              )}
                              {field.type === 'file-list' && (
                                <>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">
                                      最大文件数
                                    </label>
                                    <input
                                      type="number"
                                      value={field.maxFiles || ''}
                                      onChange={(e) => updateInputField(index, { maxFiles: parseInt(e.target.value) || undefined })}
                                      placeholder="例如：5"
                                      className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">
                                      允许的文件类型
                                    </label>
                                    <input
                                      type="text"
                                      value={field.allowedFileTypes?.join(', ') || ''}
                                      onChange={(e) => updateInputField(index, { allowedFileTypes: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                      placeholder="例如：image, document"
                                      className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
                                </>
                              )}
                            </div>
                            <div className="mt-3">
                              <label className="block text-sm font-medium text-gray-600 mb-1">
                                提示信息
                              </label>
                              <input
                                type="text"
                                value={field.hint || ''}
                                onChange={(e) => updateInputField(index, { hint: e.target.value })}
                                placeholder="字段的说明或提示"
                                className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-600 text-base">
                          暂无输入字段，点击上方按钮添加
                        </div>
                      )}
                      </div>
                    </div>
                  )}
                  </div>
                ) : (
                  <div>
                    {/* Tab 导航 */}
                    <div className="border-b border-gray-200 mb-6">
                      <nav className="flex space-x-4">
                        {[
                          { id: 'llm', label: 'LLM配置', icon: Cpu },
                          { id: 'prompt', label: 'Prompt配置', icon: FileText },
                          { id: 'context', label: '上下文策略', icon: Layers },
                          { id: 'tools', label: '工具配置', icon: Wrench },
                          { id: 'agents', label: 'Agent协作', icon: Network }
                        ].map(tab => {
                          const Icon = tab.icon;
                          return (
                            <button
                              key={tab.id}
                              onClick={() => setActiveTab(tab.id as any)}
                              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors text-base font-medium ${
                                activeTab === tab.id
                                  ? 'border-blue-600 text-blue-600'
                                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                              }`}
                            >
                              <Icon size={18} />
                              {tab.label}
                            </button>
                          );
                        })}
                      </nav>
                    </div>

                    {/* Tab 内容 */}
                    <div className="space-y-6">
                      {/* LLM 配置 Tab */}
                      {activeTab === 'llm' && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-base font-medium text-gray-700 mb-2">
                              LLM Provider *
                            </label>
                            <select
                              value={formData.agentConfig?.llm?.provider || 'openai'}
                              onChange={(e) => {
                                setFormData(prev => ({
                                  ...prev,
                                  agentConfig: {
                                    ...prev.agentConfig!,
                                    llm: {
                                      ...prev.agentConfig!.llm,
                                      provider: e.target.value as any
                                    }
                                  }
                                }));
                              }}
                              className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="openai">OpenAI</option>
                              <option value="azure-openai">Azure OpenAI</option>
                              <option value="qwen">通义千问</option>
                              <option value="ernie">文心一言</option>
                              <option value="custom">自定义端点</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-base font-medium text-gray-700 mb-2">
                              模型名称 *
                            </label>
                            <input
                              type="text"
                              value={formData.agentConfig?.llm?.model || ''}
                              onChange={(e) => {
                                setFormData(prev => ({
                                  ...prev,
                                  agentConfig: {
                                    ...prev.agentConfig!,
                                    llm: {
                                      ...prev.agentConfig!.llm,
                                      model: e.target.value
                                    }
                                  }
                                }));
                              }}
                              placeholder="例如：gpt-4, gpt-3.5-turbo, qwen-max"
                              className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-base font-medium text-gray-700 mb-2">
                              API Key *
                            </label>
                            <div className="relative">
                              <input
                                type={showApiKey ? 'text' : 'password'}
                                value={formData.agentConfig?.llm?.apiKey || ''}
                                onChange={(e) => {
                                  setFormData(prev => ({
                                    ...prev,
                                    agentConfig: {
                                      ...prev.agentConfig!,
                                      llm: {
                                        ...prev.agentConfig!.llm,
                                        apiKey: e.target.value
                                      }
                                    }
                                  }));
                                }}
                                placeholder="sk-..."
                                className="w-full px-4 py-2 pr-10 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                              <button
                                onClick={() => setShowApiKey(!showApiKey)}
                                className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
                              >
                                {showApiKey ? <EyeOff size={20} /> : <Eye size={20} />}
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-base font-medium text-gray-700 mb-2">
                              API 地址 *
                            </label>
                            <input
                              type="url"
                              value={formData.agentConfig?.llm?.apiBaseUrl || ''}
                              onChange={(e) => {
                                setFormData(prev => ({
                                  ...prev,
                                  agentConfig: {
                                    ...prev.agentConfig!,
                                    llm: {
                                      ...prev.agentConfig!.llm,
                                      apiBaseUrl: e.target.value
                                    }
                                  }
                                }));
                              }}
                              placeholder="https://api.openai.com/v1"
                              className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <p className="mt-1 text-sm text-gray-500">
                              例如：https://api.openai.com/v1 或 https://api.azure.com/openai/v1
                            </p>
                          </div>

                          <div>
                            <label className="block text-base font-medium text-gray-700 mb-2">
                              Temperature: {formData.agentConfig?.llm?.temperature || 0.7}
                            </label>
                            <input
                              type="range"
                              min="0"
                              max="2"
                              step="0.1"
                              value={formData.agentConfig?.llm?.temperature || 0.7}
                              onChange={(e) => {
                                setFormData(prev => ({
                                  ...prev,
                                  agentConfig: {
                                    ...prev.agentConfig!,
                                    llm: {
                                      ...prev.agentConfig!.llm,
                                      temperature: parseFloat(e.target.value)
                                    }
                                  }
                                }));
                              }}
                              className="w-full"
                            />
                            <div className="flex justify-between text-sm text-gray-500 mt-1">
                              <span>保守 (0)</span>
                              <span>平衡 (1)</span>
                              <span>创新 (2)</span>
                            </div>
                          </div>

                          <div>
                            <label className="block text-base font-medium text-gray-700 mb-2">
                              最大 Token 数 *
                            </label>
                            <input
                              type="number"
                              value={formData.agentConfig?.llm?.maxTokens || 2000}
                              onChange={(e) => {
                                setFormData(prev => ({
                                  ...prev,
                                  agentConfig: {
                                    ...prev.agentConfig!,
                                    llm: {
                                      ...prev.agentConfig!.llm,
                                      maxTokens: parseInt(e.target.value) || 2000
                                    }
                                  }
                                }));
                              }}
                              min="1"
                              max="32000"
                              className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      )}

                      {/* Prompt 配置 Tab */}
                      {activeTab === 'prompt' && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-base font-medium text-gray-700 mb-2">
                              系统提示词 *
                            </label>
                            <textarea
                              value={formData.agentConfig?.prompt?.systemPrompt || ''}
                              onChange={(e) => {
                                setFormData(prev => ({
                                  ...prev,
                                  agentConfig: {
                                    ...prev.agentConfig!,
                                    prompt: {
                                      ...prev.agentConfig!.prompt!,
                                      systemPrompt: e.target.value
                                    }
                                  }
                                }));
                              }}
                              rows={10}
                              placeholder="例如：你是一个专业的AI助手，擅长..."
                              className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                            />
                            <p className="mt-2 text-sm text-gray-500">
                              支持变量替换，使用 {'{{variable}}'} 或 {'{variable}'} 格式
                            </p>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="block text-base font-medium text-gray-700">
                                Prompt 变量
                              </label>
                              <button
                                onClick={() => {
                                  const newVar: PromptVariable = {
                                    name: '',
                                    description: '',
                                    type: 'static',
                                    value: ''
                                  };
                                  setFormData(prev => ({
                                    ...prev,
                                    agentConfig: {
                                      ...prev.agentConfig!,
                                      prompt: {
                                        ...prev.agentConfig!.prompt!,
                                        variables: [...(prev.agentConfig?.prompt?.variables || []), newVar]
                                      }
                                    }
                                  }));
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                              >
                                <Plus size={16} />
                                添加变量
                              </button>
                            </div>
                            <div className="space-y-3">
                              {formData.agentConfig?.prompt?.variables?.map((variable, index) => (
                                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-600 mb-1">变量名 *</label>
                                      <input
                                        type="text"
                                        value={variable.name}
                                        onChange={(e) => {
                                          const vars = [...(formData.agentConfig?.prompt?.variables || [])];
                                          vars[index] = { ...vars[index], name: e.target.value };
                                          setFormData(prev => ({
                                            ...prev,
                                            agentConfig: {
                                              ...prev.agentConfig!,
                                              prompt: {
                                                ...prev.agentConfig!.prompt!,
                                                variables: vars
                                              }
                                            }
                                          }));
                                        }}
                                        placeholder="user_name"
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-600 mb-1">类型 *</label>
                                      <select
                                        value={variable.type}
                                        onChange={(e) => {
                                          const vars = [...(formData.agentConfig?.prompt?.variables || [])];
                                          vars[index] = { ...vars[index], type: e.target.value as any };
                                          setFormData(prev => ({
                                            ...prev,
                                            agentConfig: {
                                              ...prev.agentConfig!,
                                              prompt: {
                                                ...prev.agentConfig!.prompt!,
                                                variables: vars
                                              }
                                            }
                                          }));
                                        }}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                      >
                                        <option value="static">静态值</option>
                                        <option value="dynamic">动态值</option>
                                        <option value="context">上下文</option>
                                      </select>
                                    </div>
                                    {variable.type === 'static' && (
                                      <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-600 mb-1">值</label>
                                        <input
                                          type="text"
                                          value={variable.value || ''}
                                          onChange={(e) => {
                                            const vars = [...(formData.agentConfig?.prompt?.variables || [])];
                                            vars[index] = { ...vars[index], value: e.target.value };
                                            setFormData(prev => ({
                                              ...prev,
                                              agentConfig: {
                                                ...prev.agentConfig!,
                                                prompt: {
                                                  ...prev.agentConfig!.prompt!,
                                                  variables: vars
                                                }
                                              }
                                            }));
                                          }}
                                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                        />
                                      </div>
                                    )}
                                    {variable.type === 'dynamic' && (
                                      <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-600 mb-1">来源路径</label>
                                        <input
                                          type="text"
                                          value={variable.source || ''}
                                          onChange={(e) => {
                                            const vars = [...(formData.agentConfig?.prompt?.variables || [])];
                                            vars[index] = { ...vars[index], source: e.target.value };
                                            setFormData(prev => ({
                                              ...prev,
                                              agentConfig: {
                                                ...prev.agentConfig!,
                                                prompt: {
                                                  ...prev.agentConfig!.prompt!,
                                                  variables: vars
                                                }
                                              }
                                            }));
                                          }}
                                          placeholder="user.profile.name"
                                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                        />
                                      </div>
                                    )}
                                    <div className="col-span-2 flex justify-end">
                                      <button
                                        onClick={() => {
                                          const vars = formData.agentConfig?.prompt?.variables?.filter((_, i) => i !== index) || [];
                                          setFormData(prev => ({
                                            ...prev,
                                            agentConfig: {
                                              ...prev.agentConfig!,
                                              prompt: {
                                                ...prev.agentConfig!.prompt!,
                                                variables: vars
                                              }
                                            }
                                          }));
                                        }}
                                        className="text-red-600 hover:text-red-700 text-sm"
                                      >
                                        删除
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 上下文策略 Tab */}
                      {activeTab === 'context' && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-base font-medium text-gray-700 mb-2">
                              策略类型 *
                            </label>
                            <select
                              value={formData.agentConfig?.contextStrategy?.type || 'window'}
                              onChange={(e) => {
                                setFormData(prev => ({
                                  ...prev,
                                  agentConfig: {
                                    ...prev.agentConfig!,
                                    contextStrategy: {
                                      ...prev.agentConfig!.contextStrategy!,
                                      type: e.target.value as any
                                    }
                                  }
                                }));
                              }}
                              className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="window">窗口策略（保留最近N条消息）</option>
                              <option value="summary">摘要策略（旧消息压缩为摘要）</option>
                              <option value="hybrid">混合策略（Token控制+摘要）</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-base font-medium text-gray-700 mb-2">
                              最大消息数: {formData.agentConfig?.contextStrategy?.maxMessages || 10}
                            </label>
                            <input
                              type="range"
                              min="1"
                              max="100"
                              value={formData.agentConfig?.contextStrategy?.maxMessages || 10}
                              onChange={(e) => {
                                setFormData(prev => ({
                                  ...prev,
                                  agentConfig: {
                                    ...prev.agentConfig!,
                                    contextStrategy: {
                                      ...prev.agentConfig!.contextStrategy!,
                                      maxMessages: parseInt(e.target.value)
                                    }
                                  }
                                }));
                              }}
                              className="w-full"
                            />
                          </div>

                          <div>
                            <label className="block text-base font-medium text-gray-700 mb-2">
                              最大 Token 数 *
                            </label>
                            <input
                              type="number"
                              value={formData.agentConfig?.contextStrategy?.maxTokens || 4000}
                              onChange={(e) => {
                                setFormData(prev => ({
                                  ...prev,
                                  agentConfig: {
                                    ...prev.agentConfig!,
                                    contextStrategy: {
                                      ...prev.agentConfig!.contextStrategy!,
                                      maxTokens: parseInt(e.target.value) || 4000
                                    }
                                  }
                                }));
                              }}
                              min="1000"
                              max="32000"
                              className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          {formData.agentConfig?.contextStrategy?.type === 'summary' && (
                            <div>
                              <label className="block text-base font-medium text-gray-700 mb-2">
                                摘要阈值
                              </label>
                              <input
                                type="number"
                                value={formData.agentConfig?.contextStrategy?.summaryThreshold || 20}
                                onChange={(e) => {
                                  setFormData(prev => ({
                                    ...prev,
                                    agentConfig: {
                                      ...prev.agentConfig!,
                                      contextStrategy: {
                                        ...prev.agentConfig!.contextStrategy!,
                                        summaryThreshold: parseInt(e.target.value) || 20
                                      }
                                    }
                                  }));
                                }}
                                min="5"
                                className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                              <p className="mt-1 text-sm text-gray-500">当消息数超过此值时，触发摘要生成</p>
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={formData.agentConfig?.contextStrategy?.includeSystemPrompt ?? true}
                              onChange={(e) => {
                                setFormData(prev => ({
                                  ...prev,
                                  agentConfig: {
                                    ...prev.agentConfig!,
                                    contextStrategy: {
                                      ...prev.agentConfig!.contextStrategy!,
                                      includeSystemPrompt: e.target.checked
                                    }
                                  }
                                }));
                              }}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <label className="text-base font-medium text-gray-700">每次对话都包含 System Prompt</label>
                          </div>
                        </div>
                      )}

                      {/* 工具配置 Tab */}
                      {activeTab === 'tools' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-semibold text-gray-800">工具列表</h4>
                            <button
                              onClick={() => {
                                const newTool: ToolConfig = {
                                  id: `tool-${Date.now()}`,
                                  name: '',
                                  description: '',
                                  type: 'api',
                                  enabled: true,
                                  parameters: []
                                };
                                setFormData(prev => ({
                                  ...prev,
                                  agentConfig: {
                                    ...prev.agentConfig!,
                                    tools: [...(prev.agentConfig?.tools || []), newTool]
                                  }
                                }));
                              }}
                              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                            >
                              <Plus size={16} />
                              添加工具
                            </button>
                          </div>

                          <div className="space-y-3">
                            {formData.agentConfig?.tools && formData.agentConfig.tools.length > 0 ? (
                              formData.agentConfig.tools.map((tool, index) => (
                                <div key={tool.id || index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <input
                                          type="checkbox"
                                          checked={tool.enabled}
                                          onChange={(e) => {
                                            const tools = [...(formData.agentConfig?.tools || [])];
                                            tools[index] = { ...tools[index], enabled: e.target.checked };
                                            setFormData(prev => ({
                                              ...prev,
                                              agentConfig: {
                                                ...prev.agentConfig!,
                                                tools
                                              }
                                            }));
                                          }}
                                          className="w-4 h-4 text-blue-600 rounded"
                                        />
                                        <span className="font-medium text-gray-700">工具 #{index + 1}</span>
                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                          {tool.type}
                                        </span>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => {
                                        const tools = formData.agentConfig?.tools?.filter((_, i) => i !== index) || [];
                                        setFormData(prev => ({
                                          ...prev,
                                          agentConfig: {
                                            ...prev.agentConfig!,
                                            tools
                                          }
                                        }));
                                      }}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-600 mb-1">工具名称 *</label>
                                      <input
                                        type="text"
                                        value={tool.name}
                                        onChange={(e) => {
                                          const tools = [...(formData.agentConfig?.tools || [])];
                                          tools[index] = { ...tools[index], name: e.target.value };
                                          setFormData(prev => ({
                                            ...prev,
                                            agentConfig: {
                                              ...prev.agentConfig!,
                                              tools
                                            }
                                          }));
                                        }}
                                        placeholder="例如：search_web"
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-600 mb-1">工具类型 *</label>
                                      <select
                                        value={tool.type}
                                        onChange={(e) => {
                                          const tools = [...(formData.agentConfig?.tools || [])];
                                          tools[index] = { ...tools[index], type: e.target.value as any };
                                          setFormData(prev => ({
                                            ...prev,
                                            agentConfig: {
                                              ...prev.agentConfig!,
                                              tools
                                            }
                                          }));
                                        }}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                      >
                                        <option value="search">搜索</option>
                                        <option value="api">API调用</option>
                                        <option value="calculation">计算</option>
                                        <option value="time">时间</option>
                                        <option value="workflow">Workflow调用</option>
                                        <option value="agent">Agent调用</option>
                                        <option value="custom">自定义</option>
                                      </select>
                                    </div>
                                    <div className="col-span-2">
                                      <label className="block text-sm font-medium text-gray-600 mb-1">工具描述 *</label>
                                      <textarea
                                        value={tool.description}
                                        onChange={(e) => {
                                          const tools = [...(formData.agentConfig?.tools || [])];
                                          tools[index] = { ...tools[index], description: e.target.value };
                                          setFormData(prev => ({
                                            ...prev,
                                            agentConfig: {
                                              ...prev.agentConfig!,
                                              tools
                                            }
                                          }));
                                        }}
                                        rows={2}
                                        placeholder="描述这个工具的功能和用途"
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                      />
                                    </div>

                                    {/* 根据工具类型显示不同的配置 */}
                                    {(tool.type === 'api' || tool.type === 'workflow' || tool.type === 'agent') && (
                                      <div className="col-span-2 space-y-2">
                                        {tool.type === 'api' && (
                                          <>
                                            <div>
                                              <label className="block text-sm font-medium text-gray-600 mb-1">API端点</label>
                                              <input
                                                type="url"
                                                value={tool.implementation?.endpoint || ''}
                                                onChange={(e) => {
                                                  const tools = [...(formData.agentConfig?.tools || [])];
                                                  tools[index] = {
                                                    ...tools[index],
                                                    implementation: {
                                                      ...tools[index].implementation,
                                                      endpoint: e.target.value
                                                    }
                                                  };
                                                  setFormData(prev => ({
                                                    ...prev,
                                                    agentConfig: {
                                                      ...prev.agentConfig!,
                                                      tools
                                                    }
                                                  }));
                                                }}
                                                placeholder="https://api.example.com/endpoint"
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                              />
                                            </div>
                                            <div>
                                              <label className="block text-sm font-medium text-gray-600 mb-1">HTTP方法</label>
                                              <select
                                                value={tool.implementation?.method || 'POST'}
                                                onChange={(e) => {
                                                  const tools = [...(formData.agentConfig?.tools || [])];
                                                  tools[index] = {
                                                    ...tools[index],
                                                    implementation: {
                                                      ...tools[index].implementation,
                                                      method: e.target.value
                                                    }
                                                  };
                                                  setFormData(prev => ({
                                                    ...prev,
                                                    agentConfig: {
                                                      ...prev.agentConfig!,
                                                      tools
                                                    }
                                                  }));
                                                }}
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                              >
                                                <option value="GET">GET</option>
                                                <option value="POST">POST</option>
                                                <option value="PUT">PUT</option>
                                                <option value="DELETE">DELETE</option>
                                              </select>
                                            </div>
                                          </>
                                        )}
                                        {tool.type === 'workflow' && (
                                          <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">Workflow ID</label>
                                            <input
                                              type="text"
                                              value={tool.implementation?.workflowId || ''}
                                              onChange={(e) => {
                                                const tools = [...(formData.agentConfig?.tools || [])];
                                                tools[index] = {
                                                  ...tools[index],
                                                  implementation: {
                                                    ...tools[index].implementation,
                                                    workflowId: e.target.value
                                                  }
                                                };
                                                setFormData(prev => ({
                                                  ...prev,
                                                  agentConfig: {
                                                    ...prev.agentConfig!,
                                                    tools
                                                  }
                                                }));
                                              }}
                                              placeholder="workflow-id"
                                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                            />
                                          </div>
                                        )}
                                        {tool.type === 'agent' && (
                                          <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">Agent ID</label>
                                            <input
                                              type="text"
                                              value={tool.implementation?.agentId || ''}
                                              onChange={(e) => {
                                                const tools = [...(formData.agentConfig?.tools || [])];
                                                tools[index] = {
                                                  ...tools[index],
                                                  implementation: {
                                                    ...tools[index].implementation,
                                                    agentId: e.target.value
                                                  }
                                                };
                                                setFormData(prev => ({
                                                  ...prev,
                                                  agentConfig: {
                                                    ...prev.agentConfig!,
                                                    tools
                                                  }
                                                }));
                                              }}
                                              placeholder="agent-id"
                                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                            />
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {/* 参数配置 - 简化版 */}
                                    <div className="col-span-2">
                                      <div className="flex items-center justify-between mb-2">
                                        <label className="block text-sm font-medium text-gray-600">参数定义</label>
                                        <button
                                          onClick={() => {
                                            const tools = [...(formData.agentConfig?.tools || [])];
                                            tools[index] = {
                                              ...tools[index],
                                              parameters: [
                                                ...(tools[index].parameters || []),
                                                {
                                                  name: '',
                                                  type: 'string',
                                                  description: '',
                                                  required: false
                                                }
                                              ]
                                            };
                                            setFormData(prev => ({
                                              ...prev,
                                              agentConfig: {
                                                ...prev.agentConfig!,
                                                tools
                                              }
                                            }));
                                          }}
                                          className="text-xs text-blue-600 hover:text-blue-800"
                                        >
                                          + 添加参数
                                        </button>
                                      </div>
                                      <div className="space-y-2">
                                        {tool.parameters?.map((param, paramIndex) => (
                                          <div key={paramIndex} className="flex gap-2 items-center">
                                            <input
                                              type="text"
                                              value={param.name}
                                              onChange={(e) => {
                                                const tools = [...(formData.agentConfig?.tools || [])];
                                                const params = [...(tools[index].parameters || [])];
                                                params[paramIndex] = { ...params[paramIndex], name: e.target.value };
                                                tools[index] = { ...tools[index], parameters: params };
                                                setFormData(prev => ({
                                                  ...prev,
                                                  agentConfig: {
                                                    ...prev.agentConfig!,
                                                    tools
                                                  }
                                                }));
                                              }}
                                              placeholder="参数名"
                                              className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                                            />
                                            <select
                                              value={param.type}
                                              onChange={(e) => {
                                                const tools = [...(formData.agentConfig?.tools || [])];
                                                const params = [...(tools[index].parameters || [])];
                                                params[paramIndex] = { ...params[paramIndex], type: e.target.value as any };
                                                tools[index] = { ...tools[index], parameters: params };
                                                setFormData(prev => ({
                                                  ...prev,
                                                  agentConfig: {
                                                    ...prev.agentConfig!,
                                                    tools
                                                  }
                                                }));
                                              }}
                                              className="px-2 py-1 text-xs border border-gray-300 rounded"
                                            >
                                              <option value="string">string</option>
                                              <option value="number">number</option>
                                              <option value="boolean">boolean</option>
                                              <option value="array">array</option>
                                              <option value="object">object</option>
                                            </select>
                                            <input
                                              type="checkbox"
                                              checked={param.required}
                                              onChange={(e) => {
                                                const tools = [...(formData.agentConfig?.tools || [])];
                                                const params = [...(tools[index].parameters || [])];
                                                params[paramIndex] = { ...params[paramIndex], required: e.target.checked };
                                                tools[index] = { ...tools[index], parameters: params };
                                                setFormData(prev => ({
                                                  ...prev,
                                                  agentConfig: {
                                                    ...prev.agentConfig!,
                                                    tools
                                                  }
                                                }));
                                              }}
                                              className="w-4 h-4"
                                            />
                                            <span className="text-xs text-gray-500">必填</span>
                                            <button
                                              onClick={() => {
                                                const tools = [...(formData.agentConfig?.tools || [])];
                                                const params = tools[index].parameters?.filter((_, i) => i !== paramIndex) || [];
                                                tools[index] = { ...tools[index], parameters: params };
                                                setFormData(prev => ({
                                                  ...prev,
                                                  agentConfig: {
                                                    ...prev.agentConfig!,
                                                    tools
                                                  }
                                                }));
                                              }}
                                              className="text-red-600 text-xs"
                                            >
                                              删除
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-8 text-gray-500 text-base">
                                暂无工具，点击上方按钮添加
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Agent 协作 Tab */}
                      {activeTab === 'agents' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-semibold text-gray-800">Agent 调用配置</h4>
                            <button
                              onClick={() => {
                                const newCall: AgentCallConfig = {
                                  id: `call-${Date.now()}`,
                                  name: '',
                                  description: '',
                                  trigger: 'auto',
                                  inputMapping: {},
                                  outputMapping: {}
                                };
                                setFormData(prev => ({
                                  ...prev,
                                  agentConfig: {
                                    ...prev.agentConfig!,
                                    agentCalls: [...(prev.agentConfig?.agentCalls || []), newCall]
                                  }
                                }));
                              }}
                              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                            >
                              <Plus size={16} />
                              添加调用
                            </button>
                          </div>

                          <div className="space-y-3">
                            {formData.agentConfig?.agentCalls && formData.agentConfig.agentCalls.length > 0 ? (
                              formData.agentConfig.agentCalls.map((call, index) => (
                                <div key={call.id || index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                  <div className="flex items-start justify-between mb-3">
                                    <span className="font-medium text-gray-700">调用 #{index + 1}</span>
                                    <button
                                      onClick={() => {
                                        const calls = formData.agentConfig?.agentCalls?.filter((_, i) => i !== index) || [];
                                        setFormData(prev => ({
                                          ...prev,
                                          agentConfig: {
                                            ...prev.agentConfig!,
                                            agentCalls: calls
                                          }
                                        }));
                                      }}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-600 mb-1">调用名称 *</label>
                                      <input
                                        type="text"
                                        value={call.name}
                                        onChange={(e) => {
                                          const calls = [...(formData.agentConfig?.agentCalls || [])];
                                          calls[index] = { ...calls[index], name: e.target.value };
                                          setFormData(prev => ({
                                            ...prev,
                                            agentConfig: {
                                              ...prev.agentConfig!,
                                              agentCalls: calls
                                            }
                                          }));
                                        }}
                                        placeholder="例如：调用数据分析Agent"
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-600 mb-1">触发方式 *</label>
                                      <select
                                        value={call.trigger}
                                        onChange={(e) => {
                                          const calls = [...(formData.agentConfig?.agentCalls || [])];
                                          calls[index] = { ...calls[index], trigger: e.target.value as any };
                                          setFormData(prev => ({
                                            ...prev,
                                            agentConfig: {
                                              ...prev.agentConfig!,
                                              agentCalls: calls
                                            }
                                          }));
                                        }}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                      >
                                        <option value="auto">自动触发</option>
                                        <option value="manual">手动触发</option>
                                      </select>
                                    </div>
                                    <div className="col-span-2">
                                      <label className="block text-sm font-medium text-gray-600 mb-1">调用描述 *</label>
                                      <textarea
                                        value={call.description}
                                        onChange={(e) => {
                                          const calls = [...(formData.agentConfig?.agentCalls || [])];
                                          calls[index] = { ...calls[index], description: e.target.value };
                                          setFormData(prev => ({
                                            ...prev,
                                            agentConfig: {
                                              ...prev.agentConfig!,
                                              agentCalls: calls
                                            }
                                          }));
                                        }}
                                        rows={2}
                                        placeholder="描述这个调用的用途"
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-600 mb-1">目标 Agent ID</label>
                                      <input
                                        type="text"
                                        value={call.targetAgentId || ''}
                                        onChange={(e) => {
                                          const calls = [...(formData.agentConfig?.agentCalls || [])];
                                          calls[index] = { ...calls[index], targetAgentId: e.target.value };
                                          setFormData(prev => ({
                                            ...prev,
                                            agentConfig: {
                                              ...prev.agentConfig!,
                                              agentCalls: calls
                                            }
                                          }));
                                        }}
                                        placeholder="agent-id"
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-600 mb-1">目标 Workflow ID</label>
                                      <input
                                        type="text"
                                        value={call.targetWorkflowId || ''}
                                        onChange={(e) => {
                                          const calls = [...(formData.agentConfig?.agentCalls || [])];
                                          calls[index] = { ...calls[index], targetWorkflowId: e.target.value };
                                          setFormData(prev => ({
                                            ...prev,
                                            agentConfig: {
                                              ...prev.agentConfig!,
                                              agentCalls: calls
                                            }
                                          }));
                                        }}
                                        placeholder="workflow-id"
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                      />
                                    </div>
                                    <div className="col-span-2">
                                      <p className="text-xs text-gray-500 mb-2">输入/输出映射配置（JSON格式，键值对）</p>
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <label className="block text-xs font-medium text-gray-600 mb-1">输入映射</label>
                                          <textarea
                                            value={JSON.stringify(call.inputMapping || {}, null, 2)}
                                            onChange={(e) => {
                                              try {
                                                const mapping = JSON.parse(e.target.value);
                                                const calls = [...(formData.agentConfig?.agentCalls || [])];
                                                calls[index] = { ...calls[index], inputMapping: mapping };
                                                setFormData(prev => ({
                                                  ...prev,
                                                  agentConfig: {
                                                    ...prev.agentConfig!,
                                                    agentCalls: calls
                                                  }
                                                }));
                                              } catch (err) {
                                                // 忽略 JSON 解析错误
                                              }
                                            }}
                                            rows={3}
                                            placeholder='{"query": "user_query"}'
                                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded font-mono"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-xs font-medium text-gray-600 mb-1">输出映射</label>
                                          <textarea
                                            value={JSON.stringify(call.outputMapping || {}, null, 2)}
                                            onChange={(e) => {
                                              try {
                                                const mapping = JSON.parse(e.target.value);
                                                const calls = [...(formData.agentConfig?.agentCalls || [])];
                                                calls[index] = { ...calls[index], outputMapping: mapping };
                                                setFormData(prev => ({
                                                  ...prev,
                                                  agentConfig: {
                                                    ...prev.agentConfig!,
                                                    agentCalls: calls
                                                  }
                                                }));
                                              } catch (err) {
                                                // 忽略 JSON 解析错误
                                              }
                                            }}
                                            rows={3}
                                            placeholder='{"result": "output"}'
                                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded font-mono"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-8 text-gray-500 text-base">
                                暂无 Agent 调用配置，点击上方按钮添加
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 状态和操作 */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-200 flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formData.enabled || false}
                      onChange={(e) => updateFormField('enabled', e.target.checked)}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label className="text-base font-semibold text-gray-800 ml-2.5">启用此角色</label>
                  </div>

                  <div className="flex items-center gap-3">
                    {selectedRole && (
                      <>
                        <button
                          onClick={() => setShowChatDialog(true)}
                          className="flex items-center gap-2 px-5 py-2.5 border-2 border-blue-300 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 hover:border-blue-400 transition-all shadow-sm hover:shadow-md text-sm font-semibold"
                        >
                          <MessageSquare size={18} />
                          对话测试
                        </button>
                        <button
                          onClick={testConnection}
                          className="flex items-center gap-2 px-5 py-2.5 border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm hover:shadow-md text-sm font-semibold"
                        >
                          <TestTube size={18} />
                          测试连接
                        </button>
                      </>
                    )}
                    <button
                      onClick={saveRole}
                      disabled={saving}
                      className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                      {saving ? (
                        <>
                          <Loader className="animate-spin" size={18} />
                          保存中...
                        </>
                      ) : (
                        <>
                          <Save size={18} />
                          保存
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* 测试结果 */}
                {selectedRole && testResults[selectedRole.id] && (
                  <div
                    className={`p-5 rounded-xl shadow-sm ${
                      testResults[selectedRole.id].success
                        ? 'bg-green-50 text-green-800 border-2 border-green-200'
                        : 'bg-red-50 text-red-800 border-2 border-red-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 text-base font-semibold">
                      {testResults[selectedRole.id].success ? (
                        <CheckCircle size={22} />
                      ) : (
                        <AlertCircle size={22} />
                      )}
                      <span>{testResults[selectedRole.id].message}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* 编辑弹窗 */}
      <AIRoleEditModal
        isOpen={showEditModal}
        role={editingRole}
        isNew={isNewRole}
        onClose={() => {
          setShowEditModal(false);
          setEditingRole(null);
        }}
        onSave={handleSaveRole}
        onTest={handleTestConnection}
      />

      {/* 对话测试对话框 */}
      {showChatDialog && selectedRole && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowChatDialog(false);
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-2xl flex flex-col w-full max-w-2xl h-[85vh] max-h-[700px] overflow-hidden">
            {/* 对话框标题栏 */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-5 h-5" />
                <span className="font-semibold text-base">{selectedRole.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowChatDialog(false)}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                  title="关闭"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* 对话内容区域 */}
            <div className="flex-1 overflow-hidden bg-white">
              <AIRoleChat roleConfig={selectedRole} compact={false} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIRoleManagementPage;
