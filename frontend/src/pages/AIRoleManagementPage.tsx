import React, { useState, useEffect } from 'react';
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
  MinusCircle
} from 'lucide-react';
import TopNavigation from '../components/TopNavigation';
import aiRoleService, { AIRoleUsage } from '../services/aiRoleService';
import { AIRoleConfig, DifyInputField } from '../types/aiRole';
import migrationService from '../services/migrationService';
import { Upload, ExternalLink, FileText, Workflow, MessageCircle, Trash2 as TrashIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

  // 表单状态
  const [formData, setFormData] = useState<Partial<AIRoleConfig>>({
    name: '',
    description: '',
    avatar: '',
    systemPrompt: '',
    difyConfig: {
      apiUrl: '/api/dify/chat-messages',
      apiKey: '',
      connectionType: 'chatflow',
      inputFields: []
    },
    enabled: true
  });

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
      difyConfig: {
        apiUrl: '/api/dify/chat-messages',
        apiKey: '',
        connectionType: 'chatflow',
        inputFields: []
      },
      enabled: true
    });
    setSelectedRole(null);
    setIsEditing(false);
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

  // 选择角色
  const selectRole = (role: AIRoleConfig) => {
    // 如果当前正在编辑且有未保存的更改，提示用户
    if (isEditing && selectedRole) {
      // 简单检查：比较关键字段是否有变化
      const hasChanges = 
        formData.name !== selectedRole.name ||
        formData.description !== selectedRole.description ||
        formData.difyConfig?.apiUrl !== selectedRole.difyConfig?.apiUrl ||
        formData.difyConfig?.apiKey !== selectedRole.difyConfig?.apiKey;
      
      if (hasChanges && !confirm('当前角色有未保存的更改，确定要切换吗？')) {
        return;
      }
    }
    
    setSelectedRole(role);
    setFormData(role);
    setIsEditing(false);
    // 加载使用情况
    loadRoleUsage(role.id);
  };

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

    if (!formData.difyConfig?.apiUrl || !formData.difyConfig?.apiKey) {
      setMessage({ type: 'error', text: '请填写Dify API地址和密钥' });
      return;
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
  const deleteRole = async () => {
    if (!selectedRole) return;
    if (!confirm(`确定要删除AI角色"${selectedRole.name}"吗？此操作不可恢复！`)) return;

    const roleIdToDelete = selectedRole.id;
    
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
        
        // 重新加载角色列表
        await loadRoles();
        
        // 重置表单和选中状态
        resetForm();
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
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNavigation />
        <div className="flex items-center justify-center h-96">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation />
      
      {/* 消息提示 */}
      {message && (
        <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-800">AI角色管理</h1>
            <p className="text-gray-600 mt-1">创建和管理您的AI对话角色</p>
            {/* 快速导航 */}
            <div className="flex items-center gap-2 mt-3">
              <a
                href="/agent-workflow"
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                → 管理工作流
              </a>
              <span className="text-gray-300">|</span>
              <a
                href="/ai-chat-multi"
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                → 多窗口对话
              </a>
              <span className="text-gray-300">|</span>
              <a
                href="/public-page-configs"
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                → 公开页面配置
              </a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* 后端连接状态指示 */}
            {migrationStatus && migrationStatus.backendAvailable === false && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-lg text-sm">
                <AlertCircle size={16} />
                <span>后端未连接</span>
              </div>
            )}
            {migrationStatus && migrationStatus.backendAvailable === true && roles.length > 0 && (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-800 rounded-lg text-sm">
                  <CheckCircle size={16} />
                  <span>已连接 ({roles.length}个角色)</span>
                </div>
                {duplicateInfo && duplicateInfo.totalDuplicates > 0 && (
                  <button
                    onClick={handleRemoveDuplicates}
                    disabled={removingDuplicates}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={!migrationStatus.backendAvailable ? '请先启动后端服务器' : ''}
              >
                {migrating ? (
                  <>
                    <Loader className="animate-spin" size={20} />
                    <span>迁移中...</span>
                  </>
                ) : (
                  <>
                    <Upload size={20} />
                    <span>导入现有配置 ({migrationStatus.smartWorkflowCount + migrationStatus.independentPageCount}个)</span>
                  </>
                )}
              </button>
            )}
            <button
              onClick={() => {
                resetForm();
                setIsEditing(false);
                setSelectedRole(null);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              <span>新建角色</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：角色列表 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3">
                <h2 className="text-white font-semibold flex items-center gap-2">
                  <MessageSquare size={20} />
                  已创建的角色
                </h2>
              </div>
              <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                {roles.length === 0 && (!localStorageConfigs || (localStorageConfigs.smartWorkflowConfigs.length === 0 && localStorageConfigs.independentPageConfigs.length === 0)) ? (
                  <div className="p-6 text-center text-gray-500">
                    <Bot size={48} className="mx-auto mb-2 opacity-50" />
                    <p>暂无AI角色，点击上方按钮创建</p>
                    {migrationStatus && migrationStatus.backendAvailable === false && (
                      <p className="text-xs text-yellow-600 mt-2">
                        {migrationStatus.errorMessage || '后端服务未连接'}
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    {/* 显示localStorage中的待迁移配置 */}
                    {localStorageConfigs && (localStorageConfigs.smartWorkflowConfigs.length > 0 || localStorageConfigs.independentPageConfigs.length > 0) && migrationStatus && !migrationStatus.backendAvailable && (
                      <div className="p-4 bg-yellow-50 border-b-2 border-yellow-200">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle size={16} className="text-yellow-600" />
                          <span className="text-sm font-semibold text-yellow-800">
                            待迁移配置（localStorage）
                          </span>
                        </div>
                        <div className="space-y-2 text-xs text-yellow-700">
                          {localStorageConfigs.smartWorkflowConfigs.length > 0 && (
                            <div>智能工作流配置: {localStorageConfigs.smartWorkflowConfigs.length}个</div>
                          )}
                          {localStorageConfigs.independentPageConfigs.length > 0 && (
                            <div>独立页面配置: {localStorageConfigs.independentPageConfigs.length}个</div>
                          )}
                          <div className="text-yellow-600 mt-2">
                            启动后端服务器后可以迁移这些配置
                          </div>
                        </div>
                      </div>
                    )}
                    {/* 显示已创建的角色 */}
                    {roles.length > 0 && roles.map((role) => (
                      <div
                        key={role.id}
                        onClick={() => selectRole(role)}
                        className={`p-4 cursor-pointer transition-colors ${
                          selectedRole?.id === role.id
                            ? 'bg-blue-50 border-l-4 border-blue-600'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            {role.avatar ? (
                              <img
                                src={role.avatar}
                                alt={role.name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <Bot className="w-6 h-6 text-blue-600" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-gray-800 truncate">{role.name}</h3>
                                {role.source && (
                                  <span className={`text-xs px-2 py-0.5 rounded flex-shrink-0 ${
                                    role.source === 'smart-workflow' 
                                      ? 'bg-blue-100 text-blue-700' 
                                      : role.source === 'independent-page'
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-gray-100 text-gray-700'
                                  }`}>
                                    {role.source === 'smart-workflow' ? '智能工作流' : 
                                     role.source === 'independent-page' ? '独立页面' : '自定义'}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {role.description}
                              </p>
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <span
                                  className={`text-xs px-2 py-0.5 rounded ${
                                    role.enabled
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-gray-100 text-gray-600'
                                  }`}
                                >
                                  {role.enabled ? '启用' : '禁用'}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {role.difyConfig.connectionType}
                                </span>
                                {/* 使用情况徽章 */}
                                {roleUsages.has(role.id) && (() => {
                                  const usage = roleUsages.get(role.id)!;
                                  if (usage.totalUsageCount > 0) {
                                    return (
                                      <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700 flex items-center gap-1">
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
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 右侧：角色配置 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-white font-semibold flex items-center gap-2">
                    <Settings size={20} />
                    {isEditing ? '编辑角色' : '角色配置'}
                  </h2>
                  {selectedRole && !isEditing && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        <Edit2 size={16} />
                        编辑
                      </button>
                      <button
                        onClick={deleteRole}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                      >
                        <Trash2 size={16} />
                        删除
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* 使用情况显示 */}
                {selectedRole && !isEditing && roleUsages.has(selectedRole.id) && (() => {
                  const usage = roleUsages.get(selectedRole.id)!;
                  return (
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <FileText size={20} className="text-purple-600" />
                        使用情况
                      </h3>
                      {usage.totalUsageCount === 0 ? (
                        <p className="text-gray-600 text-sm">此角色未在任何功能页面中使用</p>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm text-gray-700 mb-3">
                            此角色在 <span className="font-semibold text-purple-700">{usage.totalUsageCount}</span> 个位置使用：
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
                                      <div className="font-medium text-gray-800 text-sm">
                                        {location.name}
                                      </div>
                                      {location.description && (
                                        <div className="text-xs text-gray-600 mt-0.5">
                                          {location.description}
                                        </div>
                                      )}
                                      {location.path && (
                                        <button
                                          onClick={() => navigate(location.path!)}
                                          className="text-xs text-blue-600 hover:text-blue-800 mt-1 flex items-center gap-1"
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
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">基本信息</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        角色名称
                      </label>
                      <input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => updateFormField('name', e.target.value)}
                        placeholder="例如：AI技术顾问"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        角色描述
                      </label>
                      <textarea
                        value={formData.description || ''}
                        onChange={(e) => updateFormField('description', e.target.value)}
                        placeholder="描述这个AI角色的用途和特点"
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        头像URL（可选）
                      </label>
                      <input
                        type="url"
                        value={formData.avatar || ''}
                        onChange={(e) => updateFormField('avatar', e.target.value)}
                        placeholder="https://example.com/avatar.png"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Dify配置 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Dify配置</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        API地址
                      </label>
                      <input
                        type="url"
                        value={formData.difyConfig?.apiUrl || ''}
                        onChange={(e) => updateFormField('difyConfig.apiUrl', e.target.value)}
                        placeholder="/api/dify/chat-messages"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        API密钥
                      </label>
                      <div className="relative">
                        <input
                          type={showApiKey ? 'text' : 'password'}
                          value={formData.difyConfig?.apiKey || ''}
                          onChange={(e) => updateFormField('difyConfig.apiKey', e.target.value)}
                          placeholder="app-xxxxxxxxxx"
                          className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        连接类型
                      </label>
                      <select
                        value={formData.difyConfig?.connectionType || 'chatflow'}
                        onChange={(e) => updateFormField('difyConfig.connectionType', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="chatflow">Chatflow（聊天流）</option>
                        <option value="workflow">Workflow（工作流）</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 输入字段配置 */}
                {(formData.difyConfig?.connectionType === 'workflow' || formData.difyConfig?.connectionType === 'chatflow') && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {formData.difyConfig?.connectionType === 'workflow' ? 'Dify工作流输入字段' : 'Dify聊天流输入字段'}
                      </h3>
                      <button
                        onClick={addInputField}
                        className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        <PlusCircle size={18} />
                        添加字段
                      </button>
                    </div>
                    <div className="space-y-4">
                      {formData.difyConfig?.inputFields && formData.difyConfig.inputFields.length > 0 ? (
                        formData.difyConfig.inputFields.map((field, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium text-gray-700">字段 #{index + 1}</span>
                              <button
                                onClick={() => removeInputField(index)}
                                className="text-red-600 hover:text-red-700 transition-colors"
                              >
                                <MinusCircle size={18} />
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  变量名 *
                                </label>
                                <input
                                  type="text"
                                  value={field.variable}
                                  onChange={(e) => updateInputField(index, { variable: e.target.value })}
                                  placeholder="例如：Additional_information"
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  字段标签 *
                                </label>
                                <input
                                  type="text"
                                  value={field.label}
                                  onChange={(e) => updateInputField(index, { label: e.target.value })}
                                  placeholder="例如：补充信息"
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  字段类型 *
                                </label>
                                <select
                                  value={field.type}
                                  onChange={(e) => updateInputField(index, { type: e.target.value as DifyInputField['type'] })}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                  <option value="text">文本 (text)</option>
                                  <option value="paragraph">段落 (paragraph)</option>
                                  <option value="select">选择 (select)</option>
                                  <option value="file-list">文件列表 (file-list)</option>
                                  <option value="number">数字 (number)</option>
                                </select>
                              </div>
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={field.required}
                                  onChange={(e) => updateInputField(index, { required: e.target.checked })}
                                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <label className="ml-2 text-xs text-gray-600">必填</label>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-3">
                              {['paragraph', 'text'].includes(field.type) && (
                                <>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                      最大长度
                                    </label>
                                    <input
                                      type="number"
                                      value={field.maxLength || ''}
                                      onChange={(e) => updateInputField(index, { maxLength: parseInt(e.target.value) || undefined })}
                                      placeholder="例如：5000"
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                      占位符
                                    </label>
                                    <input
                                      type="text"
                                      value={field.placeholder || ''}
                                      onChange={(e) => updateInputField(index, { placeholder: e.target.value })}
                                      placeholder="占位符文本"
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
                                </>
                              )}
                              {field.type === 'file-list' && (
                                <>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                      最大文件数
                                    </label>
                                    <input
                                      type="number"
                                      value={field.maxFiles || ''}
                                      onChange={(e) => updateInputField(index, { maxFiles: parseInt(e.target.value) || undefined })}
                                      placeholder="例如：5"
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                      允许的文件类型
                                    </label>
                                    <input
                                      type="text"
                                      value={field.allowedFileTypes?.join(', ') || ''}
                                      onChange={(e) => updateInputField(index, { allowedFileTypes: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                      placeholder="例如：image, document"
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
                                </>
                              )}
                            </div>
                            <div className="mt-3">
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                提示信息
                              </label>
                              <input
                                type="text"
                                value={field.hint || ''}
                                onChange={(e) => updateInputField(index, { hint: e.target.value })}
                                placeholder="字段的说明或提示"
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500 text-sm">
                          暂无输入字段，点击上方按钮添加
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 状态和操作 */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.enabled || false}
                      onChange={(e) => updateFormField('enabled', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label className="text-sm font-medium text-gray-700">启用此角色</label>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedRole && (
                      <button
                        onClick={testConnection}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <TestTube size={18} />
                        测试连接
                      </button>
                    )}
                    <button
                      onClick={saveRole}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                    className={`p-4 rounded-lg ${
                      testResults[selectedRole.id].success
                        ? 'bg-green-50 text-green-800'
                        : 'bg-red-50 text-red-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {testResults[selectedRole.id].success ? (
                        <CheckCircle size={20} />
                      ) : (
                        <AlertCircle size={20} />
                      )}
                      <span>{testResults[selectedRole.id].message}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIRoleManagementPage;

