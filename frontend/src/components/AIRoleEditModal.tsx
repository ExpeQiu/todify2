import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Save,
  Eye,
  EyeOff,
  PlusCircle,
  MinusCircle,
  Cpu,
  FileText,
  Layers,
  Wrench,
  Network,
  TestTube,
  MessageSquare,
  Loader,
  Maximize2,
  Minimize2,
  Plus,
  Trash2,
  Layout,
  Settings,
  Bot,
  AlertCircle
} from 'lucide-react';
import { AIRoleConfig, DifyInputField, DirectAgentConfig, PromptVariable, ToolConfig, AgentCallConfig } from '../types/aiRole';
import AIRoleChat from './AIRoleChat';

interface AIRoleEditModalProps {
  isOpen: boolean;
  role: AIRoleConfig | null;
  isNew: boolean;
  onClose: () => void;
  onSave: (role: AIRoleConfig) => Promise<void>;
  onTest?: (role: AIRoleConfig) => Promise<void>;
}

type Section = 'basic' | 'provider' | 'dify-config' | 'llm' | 'prompt' | 'context' | 'tools' | 'agents' | 'advanced';
type DirectAgentTab = 'llm' | 'prompt' | 'context' | 'tools' | 'agents';

const AIRoleEditModal: React.FC<AIRoleEditModalProps> = ({
  isOpen,
  role,
  isNew,
  onClose,
  onSave,
  onTest
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>('basic');
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showChatDialog, setShowChatDialog] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);

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

  // 初始化表单数据
  useEffect(() => {
    if (isOpen) {
      if (role) {
        setFormData(role);
      } else {
        resetForm();
      }
      setActiveSection('basic');
      setErrors({});
    }
  }, [isOpen, role]);

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
  };

  // 表单验证
  const validateForm = (): { isValid: boolean; errors: Record<string, string> } => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = '角色名称不能为空';
    }

    if (!formData.description?.trim()) {
      newErrors.description = '角色描述不能为空';
    }

    if (formData.provider === 'dify' || !formData.provider) {
      if (!formData.difyConfig?.apiUrl?.trim()) {
        newErrors['difyConfig.apiUrl'] = 'API地址不能为空';
      }
      if (!formData.difyConfig?.apiKey?.trim()) {
        newErrors['difyConfig.apiKey'] = 'API密钥不能为空';
      }
    } else if (formData.provider === 'direct-agent') {
      if (!formData.agentConfig?.llm?.apiKey?.trim()) {
        newErrors['agentConfig.llm.apiKey'] = 'API Key不能为空';
      }
      if (!formData.agentConfig?.llm?.model?.trim()) {
        newErrors['agentConfig.llm.model'] = '模型名称不能为空';
      }
      if (!formData.agentConfig?.llm?.apiBaseUrl?.trim()) {
        newErrors['agentConfig.llm.apiBaseUrl'] = 'API地址不能为空';
      }
      if (!formData.agentConfig?.prompt?.systemPrompt?.trim()) {
        newErrors['agentConfig.prompt.systemPrompt'] = '系统提示词不能为空';
      }
    }

    setErrors(newErrors);
    return { isValid: Object.keys(newErrors).length === 0, errors: newErrors };
  };

  // 更新表单字段
  const updateFormField = useCallback((field: string, value: any) => {
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
      const parts = field.split('.');
      if (parts.length === 2) {
        // agentConfig.tools, agentConfig.agentCalls 等
        const agentField = parts[1];
        setFormData(prev => ({
          ...prev,
          agentConfig: {
            ...prev.agentConfig!,
            [agentField]: value
          }
        }));
      } else if (parts.length === 3) {
        // agentConfig.llm.temperature, agentConfig.prompt.systemPrompt 等
        const [_, section, subField] = parts;
        setFormData(prev => ({
          ...prev,
          agentConfig: {
            ...prev.agentConfig!,
            [section]: {
              ...(prev.agentConfig?.[section as keyof DirectAgentConfig] as any) || {},
              [subField]: value
            }
          }
        }));
      } else if (parts.length === 4) {
        // agentConfig.contextStrategy.maxMessages 等
        const [_, section, subSection, subField] = parts;
        setFormData(prev => ({
          ...prev,
          agentConfig: {
            ...prev.agentConfig!,
            [section]: {
              ...(prev.agentConfig?.[section as keyof DirectAgentConfig] as any) || {},
              [subSection]: {
                ...((prev.agentConfig?.[section as keyof DirectAgentConfig] as any)?.[subSection] || {}),
                [subField]: value
              }
            }
          }
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    // 清除该字段的错误
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }, [errors]);

  // 添加输入字段
  const addInputField = () => {
    setFormData(prev => ({
      ...prev,
      difyConfig: {
        ...prev.difyConfig!,
        inputFields: [
          ...(prev.difyConfig?.inputFields || []),
          {
            variable: '',
            label: '',
            type: 'text' as const,
            required: false
          }
        ]
      }
    }));
  };

  // 更新输入字段
  const updateInputField = (index: number, updates: Partial<DifyInputField>) => {
    setFormData(prev => {
      const fields = [...(prev.difyConfig?.inputFields || [])];
      fields[index] = { ...fields[index], ...updates };
      return {
        ...prev,
        difyConfig: {
          ...prev.difyConfig!,
          inputFields: fields
        }
      };
    });
  };

  // 删除输入字段
  const removeInputField = (index: number) => {
    setFormData(prev => {
      const fields = [...(prev.difyConfig?.inputFields || [])];
      fields.splice(index, 1);
      return {
        ...prev,
        difyConfig: {
          ...prev.difyConfig!,
          inputFields: fields
        }
      };
    });
  };

  // 保存角色
  const handleSave = async () => {
    console.log('🔵 [AIRoleEditModal] handleSave 被调用');
    // 清除之前的错误
    setSaveError(null);
    
    // 验证表单
    const validation = validateForm();
    console.log('🔵 [AIRoleEditModal] 验证结果:', validation);
    if (!validation.isValid) {
      // 验证失败，滚动到第一个错误字段
      const firstErrorKey = Object.keys(validation.errors)[0];
      if (firstErrorKey) {
        // 根据错误字段切换到对应的section
        if (firstErrorKey.startsWith('difyConfig')) {
          setActiveSection('dify-config');
        } else if (firstErrorKey.startsWith('agentConfig')) {
          if (firstErrorKey.includes('llm')) {
            setActiveSection('llm');
          } else if (firstErrorKey.includes('prompt')) {
            setActiveSection('prompt');
          }
        } else {
          setActiveSection('basic');
        }
        // 延迟一下让section切换完成
        setTimeout(() => {
          const errorElement = document.querySelector(`[data-error-field="${firstErrorKey}"]`) || 
                               document.querySelector(`input[name="${firstErrorKey}"], textarea[name="${firstErrorKey}"]`);
          if (errorElement) {
            errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            (errorElement as HTMLElement).focus();
          }
        }, 100);
      }
      setSaveError('请检查并填写所有必填字段');
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      // 确保所有字段都被正确合并，保留原有角色的字段作为后备
      const roleToSave: AIRoleConfig = {
        // 保留原有角色的字段作为后备
        ...role,
        // 用 formData 覆盖，确保最新的编辑内容被保存
        ...formData,
        // 确保嵌套对象也被正确合并
        difyConfig: formData.difyConfig || role?.difyConfig || {
          apiUrl: '/api/dify/chat-messages',
          apiKey: '',
          connectionType: 'chatflow',
          inputFields: []
        },
        agentConfig: formData.agentConfig !== undefined ? formData.agentConfig : role?.agentConfig,
        // 确保必需的字段存在
        name: formData.name || role?.name || '',
        description: formData.description || role?.description || '',
        provider: formData.provider || role?.provider || 'dify',
        enabled: formData.enabled !== undefined ? formData.enabled : (role?.enabled !== undefined ? role.enabled : true),
        // 保留或设置元数据字段
        id: role?.id || `role-${Date.now()}`,
        createdAt: role?.createdAt || new Date(),
        updatedAt: new Date(),
        source: formData.source !== undefined ? formData.source : role?.source,
        avatar: formData.avatar !== undefined ? formData.avatar : role?.avatar,
        systemPrompt: formData.systemPrompt !== undefined ? formData.systemPrompt : role?.systemPrompt
      };
      await onSave(roleToSave);
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '保存失败，请稍后重试';
      console.error('保存失败:', error);
      setSaveError(errorMessage);
      // 不关闭模态框，让用户看到错误信息
    } finally {
      setSaving(false);
    }
  };

  // 测试连接
  const handleTest = async () => {
    const validation = validateForm();
    if (!validation.isValid || !onTest) {
      return;
    }

    try {
      const roleToTest: AIRoleConfig = {
        ...formData as AIRoleConfig,
        id: role?.id || `role-${Date.now()}`,
        createdAt: role?.createdAt || new Date(),
        updatedAt: new Date()
      };
      await onTest(roleToTest);
    } catch (error) {
      console.error('测试失败:', error);
    }
  };

  // 键盘快捷键
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isFullscreen) {
        onClose();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFullscreen, formData, role]);

  if (!isOpen) return null;

  const navItems = [
    { id: 'basic', label: '基本信息', icon: FileText },
    { id: 'provider', label: 'Agent类型', icon: Bot },
  ];

  if (formData.provider === 'dify') {
    navItems.push({ id: 'dify-config', label: 'Dify配置', icon: Settings });
  } else if (formData.provider === 'direct-agent') {
    navItems.push(
      { id: 'llm', label: 'LLM配置', icon: Cpu },
      { id: 'prompt', label: 'Prompt配置', icon: MessageSquare },
      { id: 'context', label: '上下文策略', icon: Layers },
      { id: 'tools', label: '工具配置', icon: Wrench },
      { id: 'agents', label: 'Agent协作', icon: Network }
    );
  }
  navItems.push({ id: 'advanced', label: '高级设置', icon: Layout });

  const renderContent = () => {
    switch (activeSection) {
      case 'basic':
        return (
          <div className="space-y-6 max-w-3xl">
            <div>
              <label className="block text-base font-semibold text-gray-800 mb-2">
                角色名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => updateFormField('name', e.target.value)}
                placeholder="例如：AI技术顾问"
                className={`w-full px-4 py-3 text-base border-2 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-800 mb-2">
                角色描述 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => updateFormField('description', e.target.value)}
                placeholder="描述这个AI角色的用途和特点"
                rows={4}
                className={`w-full px-4 py-3 text-base border-2 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors resize-none ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-800 mb-2">
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
        );
      case 'provider':
        return (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">选择Agent类型</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  formData.provider === 'dify' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                }`}>
                  <input
                    type="radio"
                    name="provider"
                    value="dify"
                    checked={formData.provider === 'dify' || !formData.provider}
                    onChange={(e) => {
                      updateFormField('provider', e.target.value);
                      // Auto switch to next section
                      setTimeout(() => setActiveSection('dify-config'), 100);
                    }}
                    className="mt-1 w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-bold text-gray-800 mb-1">Dify驱动</div>
                    <div className="text-sm text-gray-600 leading-relaxed">
                      集成Dify平台的Workflow或Chatflow。适合需要复杂编排或已有Dify应用场景。
                    </div>
                  </div>
                </label>
                <label className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  formData.provider === 'direct-agent' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                }`}>
                  <input
                    type="radio"
                    name="provider"
                    value="direct-agent"
                    checked={formData.provider === 'direct-agent'}
                    onChange={(e) => {
                      updateFormField('provider', e.target.value);
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
                            prompt: { systemPrompt: '', variables: [], templates: [] },
                            contextStrategy: { type: 'window', maxMessages: 10, maxTokens: 4000, includeSystemPrompt: true },
                            tools: [],
                            agentCalls: []
                          }
                        }));
                      }
                      // Auto switch to next section
                      setTimeout(() => setActiveSection('llm'), 100);
                    }}
                    className="mt-1 w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-bold text-gray-800 mb-1">LLM驱动</div>
                    <div className="text-sm text-gray-600 leading-relaxed">
                      直接配置LLM、Prompt和工具。适合快速构建轻量级Agent或完全自定义控制。
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        );
      case 'dify-config':
        return (
          <DifyConfigSection
            formData={formData}
            updateFormField={updateFormField}
            showApiKey={showApiKey}
            setShowApiKey={setShowApiKey}
            addInputField={addInputField}
            updateInputField={updateInputField}
            removeInputField={removeInputField}
            errors={errors}
          />
        );
      case 'advanced':
        return (
          <div className="space-y-6 max-w-3xl">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <input
                type="checkbox"
                checked={formData.enabled || false}
                onChange={(e) => updateFormField('enabled', e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <div>
                <label className="text-base font-semibold text-gray-800 block">
                  启用此角色
                </label>
                <p className="text-sm text-gray-500">
                  禁用后，此角色将不会出现在聊天列表中。
                </p>
              </div>
            </div>
          </div>
        );
      default:
        // Reuse DirectAgentConfigSection but hide its internal tabs
        // We trick it by passing the current section as the active tab
        // Note: DirectAgentConfigSection implementation needs to be adjusted to NOT show tabs
        // For now, let's try to render it with the specific tab active.
        return (
          <DirectAgentConfigSection
            formData={formData}
            updateFormField={updateFormField}
            activeTab={activeSection as any}
            setActiveTab={() => {}} // Disable internal tab switching
            showApiKey={showApiKey}
            setShowApiKey={setShowApiKey}
            errors={errors}
            hideTabs={true} // We will add this prop
          />
        );
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget && !saving) {
            onClose();
          }
        }}
      >
        <div
          className={`bg-white rounded-xl shadow-2xl flex overflow-hidden ${
            isFullscreen
              ? 'w-full h-full max-w-full max-h-full rounded-none'
              : 'w-full max-w-6xl h-[90vh] max-h-[900px]'
          } transition-all duration-300`}
        >
          {/* 左侧侧边栏 */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col flex-shrink-0">
            <div className="p-5 border-b border-gray-200 bg-white">
              <h2 className="text-lg font-bold text-gray-800 truncate" title={formData.name || '新角色'}>
                {isNew ? '新建角色' : (formData.name || '编辑角色')}
              </h2>
            </div>
            
            <div className="flex-1 overflow-y-auto py-4">
              <nav className="space-y-1 px-3">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id as Section)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                        activeSection === item.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <Icon size={18} />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-800 transition-colors w-full"
              >
                {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                {isFullscreen ? '退出全屏' : '全屏模式'}
              </button>
            </div>
          </div>

          {/* 右侧内容区域 */}
          <div className="flex-1 flex flex-col bg-white min-w-0">
            {/* 顶部标题栏 (可选，显示当前部分标题) */}
            <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">
                {navItems.find(i => i.id === activeSection)?.label}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* 内容滚动区 */}
            <div className="flex-1 overflow-y-auto p-8">
              {renderContent()}
            </div>

            {/* 错误提示 */}
            {saveError && (
              <div className="px-8 py-3 bg-red-50 border-t border-red-200">
                <div className="flex items-center gap-2 text-red-700 text-sm">
                  <AlertCircle size={16} />
                  <span>{saveError}</span>
                </div>
              </div>
            )}

            {/* 底部操作栏 */}
            <div className="px-8 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {!isNew && role && (
                  <>
                    <button
                      onClick={() => setShowChatDialog(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm"
                    >
                      <MessageSquare size={16} />
                      对话测试
                    </button>
                    {onTest && (
                      <button
                        onClick={handleTest}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm"
                      >
                        <TestTube size={16} />
                        测试连接
                      </button>
                    )}
                  </>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  disabled={saving}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors text-sm font-medium"
                >
                  取消
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSave();
                  }}
                  disabled={saving}
                  type="button"
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader className="animate-spin" size={16} />
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
        </div>
      </div>

      {/* 对话测试对话框 */}
      {showChatDialog && role && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowChatDialog(false);
            }
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl flex flex-col w-full max-w-4xl h-[85vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{formData.name || role.name}</h3>
                  <p className="text-xs text-gray-500">对话测试环境</p>
                </div>
              </div>
              <button
                onClick={() => setShowChatDialog(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden bg-white">
              <AIRoleChat roleConfig={{ ...formData, ...role } as AIRoleConfig} compact={false} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Dify配置部分组件
const DifyConfigSection: React.FC<{
  formData: Partial<AIRoleConfig>;
  updateFormField: (field: string, value: any) => void;
  showApiKey: boolean;
  setShowApiKey: (show: boolean) => void;
  addInputField: () => void;
  updateInputField: (index: number, updates: Partial<DifyInputField>) => void;
  removeInputField: (index: number) => void;
  errors: Record<string, string>;
}> = ({
  formData,
  updateFormField,
  showApiKey,
  setShowApiKey,
  addInputField,
  updateInputField,
  removeInputField,
  errors
}) => {
  return (
    <>
      <div className="mb-6 rounded-xl border-2 border-blue-200 bg-blue-50 p-5 text-base text-blue-800 leading-relaxed shadow-sm">
        所有 AI 调用已通过后端的 Dify 网关统一处理，此处配置仅用于后台同步记录，请勿填写外部服务的真实凭据。
      </div>
      <div className="space-y-5">
        <div>
          <label className="block text-base font-semibold text-gray-800 mb-2">
            API地址 <span className="text-red-500">*</span>
          </label>
          <input
            type="url"
            value={formData.difyConfig?.apiUrl || ''}
            onChange={(e) => updateFormField('difyConfig.apiUrl', e.target.value)}
            placeholder="/api/dify/chat-messages"
            className={`w-full px-4 py-3 text-base border-2 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors ${
              errors['difyConfig.apiUrl'] ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors['difyConfig.apiUrl'] && (
            <p className="mt-1 text-sm text-red-600">{errors['difyConfig.apiUrl']}</p>
          )}
        </div>

        <div>
          <label className="block text-base font-semibold text-gray-800 mb-2">
            API密钥 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={formData.difyConfig?.apiKey || ''}
              onChange={(e) => updateFormField('difyConfig.apiKey', e.target.value)}
              placeholder="app-xxxxxxxxxx"
              className={`w-full px-4 py-3 pr-12 text-base border-2 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors ${
                errors['difyConfig.apiKey'] ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            <button
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
            >
              {showApiKey ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors['difyConfig.apiKey'] && (
            <p className="mt-1 text-sm text-red-600">{errors['difyConfig.apiKey']}</p>
          )}
        </div>

        <div>
          <label className="block text-base font-semibold text-gray-800 mb-2">
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
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {formData.difyConfig?.connectionType === 'workflow' ? 'Dify工作流输入字段' : 'Dify聊天流输入字段'}
            </h3>
            <button
              onClick={addInputField}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold"
            >
              <PlusCircle size={16} />
              添加字段
            </button>
          </div>
          <div className="space-y-4">
            {formData.difyConfig?.inputFields && formData.difyConfig.inputFields.length > 0 ? (
              formData.difyConfig.inputFields.map((field, index) => (
                <div key={index} className="border-2 border-gray-200 rounded-xl p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-800">字段 #{index + 1}</span>
                    <button
                      onClick={() => removeInputField(index)}
                      className="text-red-600 hover:text-red-700 transition-colors p-1"
                    >
                      <MinusCircle size={18} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">变量名 *</label>
                      <input
                        type="text"
                        value={field.variable}
                        onChange={(e) => updateInputField(index, { variable: e.target.value })}
                        placeholder="例如：Additional_information"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">字段标签 *</label>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => updateInputField(index, { label: e.target.value })}
                        placeholder="例如：补充信息"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">字段类型 *</label>
                      <select
                        value={field.type}
                        onChange={(e) => updateInputField(index, { type: e.target.value as DifyInputField['type'] })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="text">文本 (text)</option>
                        <option value="paragraph">段落 (paragraph)</option>
                        <option value="select">选择 (select)</option>
                        <option value="file-list">文件列表 (file-list)</option>
                        <option value="number">数字 (number)</option>
                      </select>
                    </div>
                    <div className="flex items-center pt-6">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => updateInputField(index, { required: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <label className="ml-2 text-sm text-gray-700">必填</label>
                    </div>
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
    </>
  );
};

// Direct Agent配置部分组件（简化版，完整版需要更多代码）
const DirectAgentConfigSection: React.FC<{
  formData: Partial<AIRoleConfig>;
  updateFormField: (field: string, value: any) => void;
  activeTab: DirectAgentTab;
  setActiveTab: (tab: DirectAgentTab) => void;
  showApiKey: boolean;
  setShowApiKey: (show: boolean) => void;
  errors: Record<string, string>;
  hideTabs?: boolean;
}> = ({
  formData,
  updateFormField,
  activeTab,
  setActiveTab,
  showApiKey,
  setShowApiKey,
  errors,
  hideTabs = false
}) => {
  return (
    <div>
      {/* Tab 导航 */}
      {!hideTabs && (
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
                  onClick={() => setActiveTab(tab.id as DirectAgentTab)}
                  className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors text-sm font-medium ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* Tab 内容 - 这里只实现LLM配置，其他tab可以后续扩展 */}
      {activeTab === 'llm' && (
        <div className="space-y-4">
          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">
              LLM Provider <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.agentConfig?.llm?.provider || 'openai'}
              onChange={(e) => {
                updateFormField('agentConfig.llm.provider', e.target.value);
              }}
              className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
              模型名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.agentConfig?.llm?.model || ''}
              onChange={(e) => updateFormField('agentConfig.llm.model', e.target.value)}
              placeholder="例如：gpt-4, gpt-3.5-turbo"
              className={`w-full px-4 py-2 text-base border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors['agentConfig.llm.model'] ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors['agentConfig.llm.model'] && (
              <p className="mt-1 text-sm text-red-600">{errors['agentConfig.llm.model']}</p>
            )}
          </div>

          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">
              API Key <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={formData.agentConfig?.llm?.apiKey || ''}
                onChange={(e) => updateFormField('agentConfig.llm.apiKey', e.target.value)}
                placeholder="sk-..."
                className={`w-full px-4 py-2 pr-10 text-base border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors['agentConfig.llm.apiKey'] ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              <button
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
              >
                {showApiKey ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors['agentConfig.llm.apiKey'] && (
              <p className="mt-1 text-sm text-red-600">{errors['agentConfig.llm.apiKey']}</p>
            )}
          </div>

          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">
              API 地址 <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={formData.agentConfig?.llm?.apiBaseUrl || ''}
              onChange={(e) => updateFormField('agentConfig.llm.apiBaseUrl', e.target.value)}
              placeholder="https://api.openai.com/v1"
              className={`w-full px-4 py-2 text-base border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors['agentConfig.llm.apiBaseUrl'] ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors['agentConfig.llm.apiBaseUrl'] && (
              <p className="mt-1 text-sm text-red-600">{errors['agentConfig.llm.apiBaseUrl']}</p>
            )}
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
              onChange={(e) => updateFormField('agentConfig.llm.temperature', parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">
              最大 Token 数 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.agentConfig?.llm?.maxTokens || 2000}
              onChange={(e) => updateFormField('agentConfig.llm.maxTokens', parseInt(e.target.value) || 2000)}
              min="1"
              max="32000"
              className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* Prompt 配置 Tab */}
      {activeTab === 'prompt' && (
        <div className="space-y-4">
          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">
              系统提示词 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.agentConfig?.prompt?.systemPrompt || ''}
              onChange={(e) => updateFormField('agentConfig.prompt.systemPrompt', e.target.value)}
              rows={10}
              placeholder="例如：你是一个专业的AI助手，擅长..."
              className={`w-full px-4 py-2 text-base border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono ${
                errors['agentConfig.prompt.systemPrompt'] ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors['agentConfig.prompt.systemPrompt'] && (
              <p className="mt-1 text-sm text-red-600">{errors['agentConfig.prompt.systemPrompt']}</p>
            )}
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
                  const vars = [...(formData.agentConfig?.prompt?.variables || []), newVar];
                  updateFormField('agentConfig.prompt.variables', vars);
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
                          updateFormField('agentConfig.prompt.variables', vars);
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
                          updateFormField('agentConfig.prompt.variables', vars);
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
                            updateFormField('agentConfig.prompt.variables', vars);
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
                            updateFormField('agentConfig.prompt.variables', vars);
                          }}
                          placeholder="user.profile.name"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                        />
                      </div>
                    )}
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-600 mb-1">描述</label>
                      <input
                        type="text"
                        value={variable.description || ''}
                        onChange={(e) => {
                          const vars = [...(formData.agentConfig?.prompt?.variables || [])];
                          vars[index] = { ...vars[index], description: e.target.value };
                          updateFormField('agentConfig.prompt.variables', vars);
                        }}
                        placeholder="变量说明"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div className="col-span-2 flex justify-end">
                      <button
                        onClick={() => {
                          const vars = formData.agentConfig?.prompt?.variables?.filter((_, i) => i !== index) || [];
                          updateFormField('agentConfig.prompt.variables', vars);
                        }}
                        className="text-red-600 hover:text-red-700 text-sm flex items-center gap-1"
                      >
                        <Trash2 size={14} />
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
              策略类型 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.agentConfig?.contextStrategy?.type || 'window'}
              onChange={(e) => updateFormField('agentConfig.contextStrategy.type', e.target.value)}
              className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
              onChange={(e) => updateFormField('agentConfig.contextStrategy.maxMessages', parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">
              最大 Token 数 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.agentConfig?.contextStrategy?.maxTokens || 4000}
              onChange={(e) => updateFormField('agentConfig.contextStrategy.maxTokens', parseInt(e.target.value) || 4000)}
              min="1000"
              max="32000"
              className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {(formData.agentConfig?.contextStrategy?.type === 'summary' || formData.agentConfig?.contextStrategy?.type === 'hybrid') && (
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">
                摘要阈值
              </label>
              <input
                type="number"
                value={formData.agentConfig?.contextStrategy?.summaryThreshold || 20}
                onChange={(e) => updateFormField('agentConfig.contextStrategy.summaryThreshold', parseInt(e.target.value) || 20)}
                min="5"
                className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">当消息数超过此值时，触发摘要生成</p>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.agentConfig?.contextStrategy?.includeSystemPrompt ?? true}
              onChange={(e) => updateFormField('agentConfig.contextStrategy.includeSystemPrompt', e.target.checked)}
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
                const tools = [...(formData.agentConfig?.tools || []), newTool];
                updateFormField('agentConfig.tools', tools);
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
                            updateFormField('agentConfig.tools', tools);
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
                        updateFormField('agentConfig.tools', tools);
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
                          updateFormField('agentConfig.tools', tools);
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
                          updateFormField('agentConfig.tools', tools);
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
                          updateFormField('agentConfig.tools', tools);
                        }}
                        rows={2}
                        placeholder="描述这个工具的功能和用途"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                      />
                    </div>

                    {/* API/Workflow/Agent 类型工具的特殊配置 */}
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
                                  updateFormField('agentConfig.tools', tools);
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
                                  updateFormField('agentConfig.tools', tools);
                                }}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                              >
                                <option value="GET">GET</option>
                                <option value="POST">POST</option>
                                <option value="PUT">PUT</option>
                                <option value="DELETE">DELETE</option>
                                <option value="PATCH">PATCH</option>
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
                                updateFormField('agentConfig.tools', tools);
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
                                updateFormField('agentConfig.tools', tools);
                              }}
                              placeholder="agent-id"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
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
                  targetAgentId: '',
                  targetWorkflowId: '',
                  inputMapping: {},
                  outputMapping: {}
                };
                const calls = [...(formData.agentConfig?.agentCalls || []), newCall];
                updateFormField('agentConfig.agentCalls', calls);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              <Plus size={16} />
              添加 Agent 调用
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
                        updateFormField('agentConfig.agentCalls', calls);
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
                          updateFormField('agentConfig.agentCalls', calls);
                        }}
                        placeholder="例如：调用搜索Agent"
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
                          updateFormField('agentConfig.agentCalls', calls);
                        }}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                      >
                        <option value="auto">自动触发</option>
                        <option value="manual">手动触发</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-600 mb-1">描述</label>
                      <input
                        type="text"
                        value={call.description}
                        onChange={(e) => {
                          const calls = [...(formData.agentConfig?.agentCalls || [])];
                          calls[index] = { ...calls[index], description: e.target.value };
                          updateFormField('agentConfig.agentCalls', calls);
                        }}
                        placeholder="调用描述"
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
                          updateFormField('agentConfig.agentCalls', calls);
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
                          updateFormField('agentConfig.agentCalls', calls);
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
                                updateFormField('agentConfig.agentCalls', calls);
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
                                updateFormField('agentConfig.agentCalls', calls);
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
              <div className="text-center py-8 text-gray-500 text-sm">
                暂无 Agent 调用配置，点击上方按钮添加
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIRoleEditModal;
