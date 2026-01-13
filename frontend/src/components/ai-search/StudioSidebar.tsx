import React, { useState, useMemo, useEffect } from "react";
import { MoreVertical, Eye, Target, Grid, Megaphone, Video, Languages, Presentation, FileText, MessageSquare, Trash2, X, Settings, AlertCircle, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import StudioTools from "./StudioTools";
import { OutputContent, Conversation, Message, FieldMappingConfig } from "../../types/aiSearch";
import ConversationDetailModal from "./ConversationDetailModal";
import { aiSearchService } from "../../services/aiSearchService";
import aiRoleService from "../../services/aiRoleService";

interface StudioSidebarProps {
  outputs?: OutputContent[];
  conversations?: Conversation[]; // 对话记录列表
  onShowConversationList?: () => void;
  onTriggerFeature: (featureType: string) => void;
  executingFeatureId?: string | null;
  statusMessage?: string;
  studioTitle?: string;
  featureLabelMap?: Record<string, string>;
  enabledToolIds?: string[]; // 启用的工具ID列表
  pageType?: string; // 当前页面类型，用于跳转到字段映射管理页面时过滤
  onDeleteConversation?: (id: string) => void; // 删除对话的回调
  onClose?: () => void; // 关闭边栏的回调
  currentConversationId?: string; // 当前选中的对话ID
  onSelectConversation?: (conversation: Conversation) => void; // 选择对话的回调
}

const StudioSidebar: React.FC<StudioSidebarProps> = ({
  outputs = [],
  conversations = [],
  onShowConversationList,
  onTriggerFeature,
  executingFeatureId,
  statusMessage,
  studioTitle = "更多工具箱",
  featureLabelMap = {},
  enabledToolIds,
  pageType,
  onDeleteConversation,
  onClose,
  currentConversationId,
  onSelectConversation,
}) => {
  const navigate = useNavigate();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // 字段映射配置弹窗相关状态
  const [showFieldMappingModal, setShowFieldMappingModal] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);
  const [selectedFeatureType, setSelectedFeatureType] = useState<string>('');
  const [selectedFeatureTypes, setSelectedFeatureTypes] = useState<string[]>([]);
  const [showCustomModuleForm, setShowCustomModuleForm] = useState(false);
  const [customFeatureId, setCustomFeatureId] = useState<string>('');
  const [customFeatureLabel, setCustomFeatureLabel] = useState<string>('');
  const [customModules, setCustomModules] = useState<Array<{ id: string; label: string }>>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const CUSTOM_MODULES_STORAGE_KEY = 'field-mapping-custom-modules';

  const formatDaysAgo = (date: Date) => {
    const now = new Date();
    const d = date instanceof Date ? date : new Date(date);
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days < 1) return "今天";
    if (days < 30) return `${days}天前`;
    if (days < 365) return `${Math.floor(days / 30)}个月前`;
    return `${Math.floor(days / 365)}年前`;
  };

  // 获取对话的首个问题作为标题
  const getFirstQuestion = (conversation: Conversation): string => {
    // 优先从消息中获取首个用户问题
    if (conversation.messages && conversation.messages.length > 0) {
      const firstUserMsg = conversation.messages.find((msg) => msg.role === "user");
      if (firstUserMsg && firstUserMsg.content) {
        // 截取前50个字符作为标题
        const content = firstUserMsg.content.trim();
        if (content) {
          return content.length > 50 ? content.substring(0, 50) + "..." : content;
        }
      }
    }
    // 如果没有用户消息，尝试从标题中提取（如果标题不是默认的时间戳格式）
    if (conversation.title && !conversation.title.startsWith("对话 ")) {
      return conversation.title;
    }
    // 最后的后备方案
    return "新对话";
  };

  const handleConversationClick = (conversation: Conversation) => {
    if (onSelectConversation) {
      onSelectConversation(conversation);
    } else {
      setSelectedConversation(conversation);
      setShowDetailModal(true);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation(); // 阻止触发对话点击事件
    if (window.confirm("确定要删除此对话吗？")) {
      onDeleteConversation?.(conversationId);
    }
  };

  const getOutputIcon = (type: string) => {
    switch (type) {
      case 'ppt':
        return <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />;
      case 'script':
        return <FileText className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />;
      case 'mindmap':
        return <Grid className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />;
    }
  };

  const getOutputTypeLabel = (type: string) => {
    switch (type) {
      case 'ppt':
        return '技术讲稿';
      case 'script':
        return '脚本';
      case 'mindmap':
        return '发布会场景化';
      default:
        return '其他';
    }
  };

  // 字段映射配置相关函数
  const loadCustomModulesFromStorage = (): Array<{ id: string; label: string }> => {
    try {
      const stored = localStorage.getItem(CUSTOM_MODULES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter((m: any) => m && m.id && m.label);
        }
      }
    } catch (error) {
      console.warn('加载自定义模块失败:', error);
    }
    return [];
  };

  const saveCustomModulesToStorage = (modules: Array<{ id: string; label: string }>) => {
    try {
      localStorage.setItem(CUSTOM_MODULES_STORAGE_KEY, JSON.stringify(modules));
    } catch (error) {
      console.warn('保存自定义模块失败:', error);
    }
  };

  const toggleFeatureChecked = (key: string) => {
    setSelectedFeatureTypes(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const isFeatureChecked = (key: string) => selectedFeatureTypes.includes(key);

  const FEATURE_LABELS: Record<string, string> = {
    'five-view-analysis': '五看',
    'three-fix-analysis': '三定',
    'tech-matrix': '技术矩阵',
    'propagation-strategy': '传播',
    'exhibition-video': '展具与视频',
    'translation': '翻译',
    'ppt-outline': '技术通稿',
    'script': '脚本',
  };

  const PAGE_LABELS: Record<'tech-package', string> = {
    'tech-package': '技术包装',
  };

  // 加载AI角色列表和自定义模块
  useEffect(() => {
    if (showFieldMappingModal) {
      const loadRoles = async () => {
        try {
          const rolesData = await aiRoleService.getAIRoles();
          setRoles(rolesData.filter((r: any) => r.enabled));
        } catch (error) {
          console.error('加载AI角色失败:', error);
        }
      };
      loadRoles();
      
      const savedModules = loadCustomModulesFromStorage();
      if (savedModules.length > 0) {
        setCustomModules(savedModules);
      }
    }
  }, [showFieldMappingModal]);

  // 加载已配置的字段映射
  useEffect(() => {
    if (showFieldMappingModal && roles.length > 0) {
      const loadExistingConfig = async () => {
        try {
          const enabledRoles = roles.filter((r: any) => r.enabled);
          if (enabledRoles.length === 0) return;

          const roleId = enabledRoles[0].id;
          const mappingsData = await aiSearchService.getAllFieldMappingConfigs();
          
          for (const mapping of mappingsData) {
            const featureObjects = Array.isArray(mapping.config?.featureObjects) 
              ? mapping.config.featureObjects 
              : [];
            
            const hasMatchingPageType = featureObjects.some((f: any) => 
              f.pageType === 'tech-package'
            );
            
            if (hasMatchingPageType) {
              const configuredFeatures = featureObjects
                .filter((f: any) => f.pageType === 'tech-package')
                .map((f: any) => f.featureType);
              
              if (configuredFeatures.length > 0) {
                setSelectedFeatureTypes(configuredFeatures);
              }
              return;
            }
          }
        } catch (error) {
          console.error('加载配置信息失败:', error);
        }
      };
      loadExistingConfig();
    }
  }, [showFieldMappingModal, roles]);

  const handleSaveFieldMapping = async () => {
    try {
      const selectedPageType = 'tech-package';
      const featuresToBind = selectedFeatureTypes.length > 0 
        ? selectedFeatureTypes.filter(ft => ft !== 'ai-dialog')
        : (selectedFeatureType && selectedFeatureType !== 'ai-dialog' ? [selectedFeatureType] : []);
      
      if (featuresToBind.length === 0) {
        setMessage({ type: 'error', text: '请选择至少一个AI模块（点击⭕️勾选，AI对话框除外）' });
        return;
      }

      const enabledRoles = roles.filter((r: any) => r.enabled);
      const roleIdToUse = enabledRoles.length > 0 ? enabledRoles[0].id : '';
      if (!roleIdToUse) {
        setMessage({ type: 'error', text: '没有可用的AI角色，请先创建AI角色' });
        return;
      }

      const existing = await aiSearchService.getFieldMappingConfig(roleIdToUse);
      const normalizedPageType = selectedPageType;
      let nextConfig: FieldMappingConfig;
      
      if (existing) {
        const fo = Array.isArray(existing.featureObjects) ? existing.featureObjects.slice() : [];
        const otherPageTypeFeatures = fo.filter((f: any) => {
          if (!f.pageType) return true;
          return f.pageType !== normalizedPageType;
        });
        
        const newFeaturesMap = new Map<string, any>();
        for (const ft of featuresToBind) {
          const existingFeature = fo.find((f: any) => 
            f.featureType === ft && f.pageType === normalizedPageType
          );
          const customModule = customModules.find(m => m.id === ft);
          const moduleLabel = customModule?.label || existingFeature?.label || FEATURE_LABELS[ft] || undefined;
          
          newFeaturesMap.set(ft, {
            featureType: ft as any,
            workflowId: roleIdToUse,
            inputMappings: existingFeature?.inputMappings || [],
            outputMappings: existingFeature?.outputMappings || [],
            pageType: normalizedPageType,
            label: moduleLabel,
            agentId: existingFeature?.agentId,
          });
        }
        
        const newFeatures = Array.from(newFeaturesMap.values());
        nextConfig = { 
          ...existing, 
          featureObjects: [...otherPageTypeFeatures, ...newFeatures]
        };
      } else {
        const featureObjects = featuresToBind.map(ft => {
          const customModule = customModules.find(m => m.id === ft);
          const moduleLabel = customModule?.label || FEATURE_LABELS[ft] || undefined;
          return {
            featureType: ft as any,
            workflowId: roleIdToUse,
            inputMappings: [],
            outputMappings: [],
            pageType: normalizedPageType,
            label: moduleLabel,
          };
        });
        
        nextConfig = {
          workflowId: roleIdToUse,
          inputMappings: [],
          outputMappings: [],
          featureObjects,
        } as any;
      }

      await aiSearchService.saveFieldMappingConfig(roleIdToUse, nextConfig);
      setMessage({ type: 'success', text: `配置修改成功：已为 ${PAGE_LABELS[normalizedPageType]} 页面更新为 ${featuresToBind.length} 个AI模块` });
      setTimeout(() => {
        setShowFieldMappingModal(false);
        setSelectedFeatureTypes([]);
        setSelectedFeatureType('');
        setCustomFeatureId('');
        setCustomFeatureLabel('');
        setShowCustomModuleForm(false);
        setMessage(null);
      }, 1500);
    } catch (error: any) {
      console.error('保存配置失败:', error);
      const errorMessage = error?.response?.data?.error || error?.response?.data?.message || error?.message || '创建配置失败，请稍后重试';
      setMessage({ type: 'error', text: errorMessage });
    }
  };

  // 使用 useMemo 优化工具项的计算，避免每次渲染都重新计算
  const toolItems = useMemo(() => {
    // 所有可用的工具项
    const allToolItems = [
      {
        id: 'five-view-analysis',
        label: featureLabelMap['five-view-analysis'] || '技术转译',
        icon: Eye,
      },
      {
        id: 'three-fix-analysis',
        label: featureLabelMap['three-fix-analysis'] || '用户场景挖掘',
        icon: Target,
      },
      {
        id: 'tech-matrix',
        label: featureLabelMap['tech-matrix'] || '发布会场景化',
        icon: Grid,
      },
      {
        id: 'propagation-strategy',
        label: featureLabelMap['propagation-strategy'] || '领导人口语化',
        icon: Megaphone,
      },
      {
        id: 'exhibition-video',
        label: featureLabelMap['exhibition-video'] || '展具与视频',
        icon: Video,
      },
      {
        id: 'translation',
        label: featureLabelMap['translation'] || '翻译',
        icon: Languages,
      },
      {
        id: 'ppt-outline',
        label: featureLabelMap['ppt-outline'] || '技术讲稿',
        icon: Presentation,
      },
      {
        id: 'script',
        label: featureLabelMap['script'] || '脚本',
        icon: FileText,
      },
    ];

    // 扩展：为未在静态列表中的启用ID生成通用工具项
    const staticFiltered = enabledToolIds
      ? allToolItems.filter(item => enabledToolIds.includes(item.id))
      : allToolItems;

    const unknownIds = (enabledToolIds || []).filter(id => !allToolItems.some(item => item.id === id));
    const unknownItems = unknownIds.map(id => ({
      id,
      label: featureLabelMap[id] || id,
      icon: FileText,
    }));

    return enabledToolIds ? [...staticFiltered, ...unknownItems] : staticFiltered;
  }, [enabledToolIds, featureLabelMap]);

  return (
    <div className="w-80 h-full bg-white border-l border-gray-200 flex flex-col">
      {/* 标题 - 仅在有工具时显示 */}
      {toolItems.length > 0 && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200 h-[76px]">
          <div className="flex-1 flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900">{studioTitle}</h2>
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="关闭"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              )}
            </div>
            {statusMessage ? (
              <p className="text-xs text-gray-500 mt-1">{statusMessage}</p>
            ) : (
              <div className="text-xs text-transparent mt-1">占位</div>
            )}
          </div>
          {/* 更多按钮 */}
          {pageType === 'tech-package' && (
            <button
              onClick={() => setShowFieldMappingModal(true)}
              className="p-1.5 hover:bg-gray-100 rounded-md transition-colors text-gray-500 hover:text-gray-700"
              title="字段映射配置"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* 工具网格 - 仅在有工具时显示 */}
      {toolItems.length > 0 && (
        <div className="p-4 border-b border-gray-200">
          <StudioTools
            items={toolItems}
            onTrigger={onTriggerFeature}
            executingId={executingFeatureId}
          />
        </div>
      )}

      {/* 对话记录 */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {/* 当没有工具时，在顶部显示对话记录标题 */}
        {toolItems.length === 0 && (
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">对话记录</h2>
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="关闭"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              )}
            </div>
          </div>
        )}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            {toolItems.length > 0 && (
              <h3 className="text-sm font-medium text-gray-700 mb-3">对话记录</h3>
            )}
            {conversations.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                暂无对话记录
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conversation) => {
                  const firstQuestion = getFirstQuestion(conversation);
                  const messageCount = conversation.messages?.length || 0;
                  const isCurrent = currentConversationId === conversation.id;
                  return (
                    <div
                      key={conversation.id}
                      className={`flex items-start gap-3 p-3 rounded-lg transition-colors group cursor-pointer ${
                        isCurrent
                          ? "bg-blue-50 border border-blue-200"
                          : "hover:bg-gray-50 border border-transparent"
                      }`}
                      onClick={() => handleConversationClick(conversation)}
                    >
                      <MessageSquare className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                        isCurrent ? "text-blue-600" : "text-gray-400"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${
                          isCurrent ? "text-blue-900 font-medium" : "text-gray-900"
                        }`}>{firstQuestion}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {messageCount} 条消息 · {formatDaysAgo(conversation.updatedAt)}
                        </p>
                      </div>
                      {onDeleteConversation && (
                        <button
                          onClick={(e) => handleDeleteClick(e, conversation.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-100 rounded transition-all flex-shrink-0"
                          title="删除对话"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 对话详情弹窗 */}
      {showDetailModal && selectedConversation && (
        <ConversationDetailModal
          conversation={selectedConversation}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedConversation(null);
          }}
        />
      )}

      {/* 字段映射配置弹窗 */}
      {showFieldMappingModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-lg border border-gray-200 w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">修改配置</h3>
              <button onClick={() => {
                setShowFieldMappingModal(false);
                setSelectedFeatureTypes([]);
                setSelectedFeatureType('');
                setCustomFeatureId('');
                setCustomFeatureLabel('');
                setShowCustomModuleForm(false);
                setMessage(null);
              }} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* 消息提示 */}
              {message && (
                <div
                  className={`p-4 rounded-lg flex items-center gap-2 ${
                    message.type === 'success'
                      ? 'bg-green-50 text-green-800 border border-green-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {message.type === 'success' ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                  <span>{message.text}</span>
                  <button
                    onClick={() => setMessage(null)}
                    className="ml-auto text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              
              <div>
                <div className="text-sm text-gray-600 mb-2">技术独立页</div>
                <div className="px-3 py-2 border rounded-md text-sm bg-blue-50 border-blue-500 text-gray-900">
                  技术包装
                </div>
                <p className="text-xs text-gray-500 mt-1">字段映射管理仅关联技术包装页面</p>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-2">选择AI模块</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { key: 'five-view-analysis', label: '五看', icon: <Eye className="w-6 h-6 mb-2 text-gray-600" /> },
                    { key: 'three-fix-analysis', label: '三定', icon: <Target className="w-6 h-6 mb-2 text-gray-600" /> },
                    { key: 'tech-matrix', label: '技术矩阵', icon: <Grid className="w-6 h-6 mb-2 text-gray-600" /> },
                    { key: 'propagation-strategy', label: '传播', icon: <Megaphone className="w-6 h-6 mb-2 text-gray-600" /> },
                    { key: 'exhibition-video', label: '展具与视频', icon: <Video className="w-6 h-6 mb-2 text-gray-600" /> },
                    { key: 'translation', label: '翻译', icon: <Languages className="w-6 h-6 mb-2 text-gray-600" /> },
                    { key: 'ppt-outline', label: '技术通稿', icon: <Presentation className="w-6 h-6 mb-2 text-gray-600" /> },
                    { key: 'script', label: '脚本', icon: <FileText className="w-6 h-6 mb-2 text-gray-600" /> },
                  ].map(item => (
                    <button
                      key={item.key}
                      onClick={() => { setSelectedFeatureType(item.key); setShowCustomModuleForm(false); }}
                      className={`relative flex flex-col items-center justify-center p-4 border rounded-lg transition-all ${selectedFeatureType === item.key ? 'bg-blue-50 border-blue-500' : 'bg-white border-gray-300 hover:bg-gray-50 hover:border-blue-500'}`}
                      title={item.label}
                    >
                      {item.icon}
                      <span className="text-xs text-gray-700 text-center">{item.label}</span>
                      <div
                        onClick={(e) => { e.stopPropagation(); toggleFeatureChecked(item.key); }}
                        className={`absolute left-3 bottom-3 w-4 h-4 rounded-full border cursor-pointer ${isFeatureChecked(item.key) ? 'border-red-500 bg-red-500' : 'border-red-500 bg-white'}`}
                        aria-label={isFeatureChecked(item.key) ? '取消选择' : '选择模块'}
                      />
                    </button>
                  ))}
                  {/* 显示已添加的自定义模块 */}
                  {customModules.map((module) => (
                    <button
                      key={module.id}
                      onClick={() => { setSelectedFeatureType(module.id); setShowCustomModuleForm(false); }}
                      className={`relative flex flex-col items-center justify-center p-4 border rounded-lg transition-all ${selectedFeatureType === module.id ? 'bg-blue-50 border-blue-500' : 'bg-white border-purple-300 hover:bg-gray-50 hover:border-purple-500'}`}
                      title={module.label}
                    >
                      <Settings className="w-6 h-6 mb-2 text-purple-600" />
                      <span className="text-xs text-gray-700 text-center">{module.label}</span>
                      <div
                        onClick={(e) => { e.stopPropagation(); toggleFeatureChecked(module.id); }}
                        className={`absolute left-3 bottom-3 w-4 h-4 rounded-full border cursor-pointer ${isFeatureChecked(module.id) ? 'border-red-500 bg-red-500' : 'border-red-500 bg-white'}`}
                        aria-label={isFeatureChecked(module.id) ? '取消选择' : '选择模块'}
                      />
                    </button>
                  ))}
                  <button
                    onClick={() => { setShowCustomModuleForm(true); setSelectedFeatureType(customFeatureId || ''); }}
                    className={`relative flex flex-col items-center justify-center p-4 border rounded-lg transition-all ${showCustomModuleForm ? 'bg-blue-50 border-blue-500' : 'bg-white border-red-400 hover:bg-gray-50 hover:border-blue-500'}`}
                    title="新增AI模块"
                  >
                    <span className="text-2xl text-red-500">+</span>
                    <span className="mt-2 text-xs text-gray-700">新增AI模块</span>
                    {customFeatureId && (
                      <div
                        onClick={(e) => { e.stopPropagation(); toggleFeatureChecked(customFeatureId); setSelectedFeatureType(customFeatureId); }}
                        className={`absolute left-3 bottom-3 w-4 h-4 rounded-full border ${isFeatureChecked(customFeatureId) ? 'border-red-500 bg-red-500' : 'border-red-500 bg-white'}`}
                        aria-label={isFeatureChecked(customFeatureId) ? '取消选择' : '选择模块'}
                      />
                    )}
                  </button>
                </div>
                {showCustomModuleForm && (
                  <div className="mt-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">模块标识</label>
                        <input
                          type="text"
                          className="w-full border rounded-md px-3 py-2 text-sm"
                          placeholder="如 custom-module"
                          value={customFeatureId}
                          onChange={(e) => setCustomFeatureId(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">显示名称</label>
                        <input
                          type="text"
                          className="w-full border rounded-md px-3 py-2 text-sm"
                          placeholder="如 自定义模块"
                          value={customFeatureLabel}
                          onChange={(e) => setCustomFeatureLabel(e.target.value)}
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={() => {
                            if (!customFeatureId.trim()) {
                              setMessage({ type: 'error', text: '请输入模块标识' });
                              return;
                            }
                            if (customModules.some(m => m.id === customFeatureId.trim())) {
                              setMessage({ type: 'error', text: '该模块标识已存在' });
                              return;
                            }
                            const newModule = {
                              id: customFeatureId.trim(),
                              label: customFeatureLabel.trim() || customFeatureId.trim()
                            };
                            const updatedModules = [...customModules, newModule];
                            setCustomModules(updatedModules);
                            saveCustomModulesToStorage(updatedModules);
                            setSelectedFeatureTypes(prev => prev.includes(newModule.id) ? prev : [...prev, newModule.id]);
                            setCustomFeatureId('');
                            setCustomFeatureLabel('');
                            setMessage(null);
                          }}
                          className="px-3 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700"
                        >
                          添加模块
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-2">
              <button 
                onClick={() => {
                  setShowFieldMappingModal(false);
                  setSelectedFeatureTypes([]);
                  setSelectedFeatureType('');
                  setCustomFeatureId('');
                  setCustomFeatureLabel('');
                  setShowCustomModuleForm(false);
                  setMessage(null);
                }} 
                className="px-3 py-2 rounded-md border text-sm"
              >
                取消
              </button>
              <button
                onClick={handleSaveFieldMapping}
                className="px-3 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700"
              >
                保存修改
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudioSidebar;

