import React, { useState, useMemo, useEffect, useRef } from "react";
import { MoreVertical, Eye, Target, Grid, Megaphone, Video, Languages, Presentation, FileText, MessageSquare, Trash2, X, Settings, AlertCircle, CheckCircle, Cpu, FlaskConical, Crosshair, Clapperboard, ChevronLeft, Sparkles, Activity, Edit2, Save, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import StudioTools from "./StudioTools";
import { OutputContent, Conversation, Message, FieldMappingConfig } from "../../types/aiSearch";
import ConversationDetailModal from "./ConversationDetailModal";
import { aiSearchService } from "../../services/aiSearchService";
import aiRoleService from "../../services/aiRoleService";
import { AgentRoleConfig } from "../../configs/pageConfigs";

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
  agentRoles?: AgentRoleConfig[]; // 角色配置
  activeToolCall?: { toolName: string; toolId?: string; data?: any } | null; // 当前激活的工具调用
  toolCallOutput?: any; // 工具调用输出结果
  onToolOutputModified?: (toolName: string, modifiedContent: string) => void; // 工具输出修改回调
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
  agentRoles,
  activeToolCall,
  toolCallOutput,
  onToolOutputModified,
}) => {
  const navigate = useNavigate();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Workspace State
  const [viewMode, setViewMode] = useState<'dashboard' | 'workspace'>('dashboard');
  const [activeRole, setActiveRole] = useState<AgentRoleConfig | null>(null);

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
  // 功能模块到AI角色的映射
  const [featureToRoleMapping, setFeatureToRoleMapping] = useState<Record<string, string>>({});
  // 主控工作流ID（技术包装页面的主控Agent）
  const [mainWorkflowId, setMainWorkflowId] = useState<string>('independent-page-tech-package');
  
  // 工具输出编辑状态
  const [isEditingToolOutput, setIsEditingToolOutput] = useState(false);
  const [editedToolOutput, setEditedToolOutput] = useState<string>('');
  
  const CUSTOM_MODULES_STORAGE_KEY = 'field-mapping-custom-modules';

  // 工具名称到角色ID的映射
  const toolToRoleMapping: Record<string, string> = {
    'Consult_Tech': 'tech-fundamentalist',
    'Consult_Scene': 'scene-alchemist',
    'Consult_Market': 'market-sniper',
    'Consult_Content': 'content-director'
  };

  // 工具名称到功能类型的映射（用于匹配工具按钮）
  const toolToFeatureTypeMapping: Record<string, string> = {
    'Consult_Tech': 'five-view-analysis', // 默认使用五看分析
    'Consult_Scene': 'tech-matrix',
    'Consult_Market': 'propagation-strategy',
    'Consult_Content': 'script'
  };

  // 当有工具正在执行时，自动切换到对应的 Agent Workspace
  useEffect(() => {
    if (executingFeatureId && agentRoles) {
      const role = agentRoles.find(r => r.toolIds.includes(executingFeatureId));
      if (role) {
        setActiveRole(role);
        setViewMode('workspace');
      }
    }
  }, [executingFeatureId, agentRoles]);

  // 工具按钮引用（用于滚动）
  const toolButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  // 当主 Agent 调用工具时，自动切换到对应的角色视图
  useEffect(() => {
    if (activeToolCall && agentRoles) {
      const roleId = toolToRoleMapping[activeToolCall.toolName];
      if (roleId) {
        const role = agentRoles.find(r => r.id === roleId);
        if (role) {
          setActiveRole(role);
          setViewMode('workspace');
        }
      }
    }
  }, [activeToolCall, agentRoles]);

  // 当工具激活时，自动滚动到对应的工具按钮
  useEffect(() => {
    if (executingFeatureId && viewMode === 'workspace') {
      const toolButton = toolButtonRefs.current.get(executingFeatureId);
      if (toolButton) {
        setTimeout(() => {
          toolButton.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
      }
    }
  }, [executingFeatureId, viewMode]);

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

  // 功能模块到专家角色的默认映射关系
  const defaultFeatureToRoleMapping: Record<string, string> = {
    'five-view-analysis': 'tech-fundamentalist',
    'three-fix-analysis': 'tech-fundamentalist',
    'tech-matrix': 'scene-alchemist',
    'propagation-strategy': 'market-sniper',
    'exhibition-video': 'content-director',
    'translation': 'content-director',
    'ppt-outline': 'content-director',
    'script': 'content-director',
  };

  // 加载已配置的字段映射
  useEffect(() => {
    if (showFieldMappingModal && pageType === 'tech-package') {
      const loadMappings = async () => {
        try {
          // 获取主控工作流的字段映射配置
          const config = await aiSearchService.getFieldMappingConfig(mainWorkflowId);
          if (config && config.featureObjects && Array.isArray(config.featureObjects)) {
            // 提取已配置的功能模块和对应的AI角色
            const mappings: Record<string, string> = { ...defaultFeatureToRoleMapping };
            const selectedFeatures: string[] = [];
            
            config.featureObjects.forEach((feature: any) => {
              if (feature.pageType === 'tech-package' || (!feature.pageType && pageType === 'tech-package')) {
                if (feature.agentId) {
                  mappings[feature.featureType] = feature.agentId;
                }
                if (!selectedFeatures.includes(feature.featureType)) {
                  selectedFeatures.push(feature.featureType);
                }
                // 如果是自定义模块，添加到自定义模块列表
                const isStandardModule = Object.keys(FEATURE_LABELS).includes(feature.featureType);
                if (!isStandardModule && feature.label) {
                  const existingCustom = customModules.find(m => m.id === feature.featureType);
                  if (!existingCustom) {
                    setCustomModules(prev => [...prev, { id: feature.featureType, label: feature.label }]);
                  }
                }
              }
            });
            
            setFeatureToRoleMapping(mappings);
            setSelectedFeatureTypes(selectedFeatures);
          } else {
            // 如果没有配置，使用默认映射
            setFeatureToRoleMapping(defaultFeatureToRoleMapping);
            setSelectedFeatureTypes([]);
          }
        } catch (error) {
          console.error('加载字段映射失败:', error);
          // 如果加载失败，使用默认映射
          setFeatureToRoleMapping(defaultFeatureToRoleMapping);
          setSelectedFeatureTypes([]);
        }
      };
      loadMappings();
    } else if (showFieldMappingModal) {
      // 如果不是 tech-package 页面，初始化默认映射
      setFeatureToRoleMapping(defaultFeatureToRoleMapping);
      setSelectedFeatureTypes([]);
    }
  }, [showFieldMappingModal, pageType, mainWorkflowId]);

  const handleSaveFieldMapping = async () => {
    if (!pageType) return;
    
    try {
      // 获取现有的字段映射配置
      let existingConfig: FieldMappingConfig;
      try {
        existingConfig = await aiSearchService.getFieldMappingConfig(mainWorkflowId);
      } catch (error) {
        // 如果配置不存在，创建新配置
        existingConfig = {
          workflowId: mainWorkflowId,
          inputMappings: [],
          outputMappings: [],
          featureObjects: [],
        };
      }

      // 构建功能对象配置列表
      const existingFeatureObjects = Array.isArray(existingConfig.featureObjects) 
        ? existingConfig.featureObjects 
        : [];
      
      // 移除当前页面的旧配置
      const filteredFeatureObjects = existingFeatureObjects.filter(
        (f: any) => !(f.pageType === pageType || (!f.pageType && pageType === 'tech-package'))
      );

      // 为每个选中的功能模块创建配置（包括标准模块和自定义模块）
      const newFeatureObjects = selectedFeatureTypes.map((featureType) => {
        const agentId = featureToRoleMapping[featureType] || defaultFeatureToRoleMapping[featureType];
        const customModule = customModules.find(m => m.id === featureType);
        const label = customModule 
          ? customModule.label 
          : (FEATURE_LABELS[featureType] || featureType);
        
        return {
          featureType: featureType as any,
          workflowId: agentId || mainWorkflowId, // 使用专家角色的ID作为workflowId
          inputMappings: [],
          outputMappings: [],
          pageType: pageType as 'tech-package' | 'tech-strategy' | 'tech-article' | 'press-release',
          label: label,
          agentId: agentId, // 关联的专家角色ID
        };
      });

      // 合并配置
      const updatedConfig: FieldMappingConfig = {
        ...existingConfig,
        workflowId: mainWorkflowId,
        featureObjects: [...filteredFeatureObjects, ...newFeatureObjects],
      };

      // 保存配置
      await aiSearchService.saveFieldMappingConfig(mainWorkflowId, updatedConfig);
      
      setMessage({ type: 'success', text: '配置保存成功' });
      setTimeout(() => {
        setMessage(null);
        setShowFieldMappingModal(false);
      }, 2000);
    } catch (error) {
      console.error('保存字段映射失败:', error);
      setMessage({ type: 'error', text: `保存失败: ${error instanceof Error ? error.message : '未知错误'}` });
    }
  };

  // 更新功能模块的AI角色映射
  const handleRoleChange = (featureType: string, roleId: string) => {
    setFeatureToRoleMapping(prev => ({
      ...prev,
      [featureType]: roleId,
    }));
  };

  const handleAddCustomModule = () => {
    if (customFeatureId && customFeatureLabel) {
      const newModule = { id: customFeatureId, label: customFeatureLabel };
      const newModules = [...customModules, newModule];
      setCustomModules(newModules);
      saveCustomModulesToStorage(newModules);
      setCustomFeatureId('');
      setCustomFeatureLabel('');
      setShowCustomModuleForm(false);
    }
  };

  const handleDeleteCustomModule = (id: string) => {
    const newModules = customModules.filter(m => m.id !== id);
    setCustomModules(newModules);
    saveCustomModulesToStorage(newModules);
  };

  const getIconByName = (name: string) => {
    switch (name) {
      case "Eye": return Eye;
      case "Target": return Target;
      case "Grid": return Grid;
      case "Megaphone": return Megaphone;
      case "Video": return Video;
      case "Languages": return Languages;
      case "Presentation": return Presentation;
      case "FileText": return FileText;
      default: return FileText;
    }
  };

  const toolItems = useMemo(() => {
    // 预定义的标准工具配置
    const standardToolConfig: Record<string, { iconName: string; defaultLabel: string }> = {
      "five-view-analysis": { iconName: "Eye", defaultLabel: "五看" },
      "three-fix-analysis": { iconName: "Target", defaultLabel: "三定" },
      "tech-matrix": { iconName: "Grid", defaultLabel: "技术矩阵" },
      "propagation-strategy": { iconName: "Megaphone", defaultLabel: "传播" },
      "exhibition-video": { iconName: "Video", defaultLabel: "展具与视频" },
      "translation": { iconName: "Languages", defaultLabel: "翻译" },
      "ppt-outline": { iconName: "Presentation", defaultLabel: "技术讲稿" },
      "script": { iconName: "FileText", defaultLabel: "脚本" },
    };

    // 构建工具列表：先添加标准工具，再添加自定义工具
    const allItemsMap = new Map<string, { id: string; iconName: string; label: string }>();
    
    // 1. 添加标准工具
    Object.keys(standardToolConfig).forEach(toolId => {
      const config = standardToolConfig[toolId];
      allItemsMap.set(toolId, {
        id: toolId,
        iconName: config.iconName,
        label: featureLabelMap[toolId] || config.defaultLabel,
      });
    });

    // 2. 添加自定义工具（从 enabledToolIds 和 featureLabelMap 中提取）
    if (enabledToolIds) {
      enabledToolIds.forEach(toolId => {
        // 如果不在标准工具列表中，且 featureLabelMap 中有标签，则认为是自定义工具
        // 同时确保不会重复添加已存在的工具
        if (!allItemsMap.has(toolId) && !standardToolConfig[toolId] && featureLabelMap[toolId]) {
          allItemsMap.set(toolId, {
            id: toolId,
            iconName: "Grid", // 自定义工具默认使用 Grid 图标
            label: featureLabelMap[toolId],
          });
        }
      });
    }

    // 3. 如果指定了 enabledToolIds，则只显示启用的工具
    let items = Array.from(allItemsMap.values());
    if (enabledToolIds) {
      items = items.filter(item => enabledToolIds.includes(item.id));
    }

    // 4. 确保去重：按 id 去重，保留第一个出现的
    const uniqueItemsMap = new Map<string, { id: string; iconName: string; label: string }>();
    items.forEach(item => {
      if (!uniqueItemsMap.has(item.id)) {
        uniqueItemsMap.set(item.id, item);
      }
    });

    return Array.from(uniqueItemsMap.values()).map(item => ({
      ...item,
      icon: getIconByName(item.iconName)
    }));
  }, [featureLabelMap, enabledToolIds]);

  const getRoleIcon = (roleId: string) => {
    switch (roleId) {
      case 'tech-fundamentalist': return Cpu;
      case 'scene-alchemist': return FlaskConical;
      case 'market-sniper': return Crosshair;
      case 'content-director': return Clapperboard;
      default: return Grid;
    }
  };

  const renderDashboard = () => (
    <>
      {/* Tools Section */}
      {agentRoles ? (
        <div className="p-4 space-y-4">
          {agentRoles.map(role => {
            const roleTools = toolItems.filter(item => role.toolIds.includes(item.id));
            if (roleTools.length === 0) return null;

            const RoleIcon = getRoleIcon(role.id);

            return (
              <div 
                key={role.id} 
                className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200"
              >
                <div 
                  className="px-4 py-3 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between cursor-pointer"
                  onClick={() => {
                    setActiveRole(role);
                    setViewMode('workspace');
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-white rounded-lg border border-gray-200 shadow-sm">
                      <RoleIcon className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">{role.name}</h3>
                      <p className="text-[10px] text-gray-500 leading-none mt-0.5">{role.description}</p>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-gray-300 rotate-180" />
                </div>
                
                <div className="p-3">
                  <StudioTools
                    items={roleTools}
                    onTrigger={onTriggerFeature}
                    executingId={executingFeatureId}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-4">
          <StudioTools
            items={toolItems}
            onTrigger={onTriggerFeature}
            executingId={executingFeatureId}
          />
        </div>
      )}
    </>
  );

  const renderRoleSpecificContent = (roleId: string, toolLabel: string) => {
    switch (roleId) {
      case 'tech-fundamentalist':
        return (
          <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
              <Cpu className="w-5 h-5 text-blue-600" />
              <h4 className="text-sm font-semibold text-gray-900">技术参数解析</h4>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">核心指标</span>
                <span className="font-mono text-blue-600">Extracting...</span>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-2 items-center">
                    <div className="w-16 h-2 bg-gray-200 rounded animate-pulse" />
                    <div className="flex-1 h-px bg-gray-200" />
                    <div className="w-10 h-2 bg-blue-100 rounded animate-pulse" />
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                正在从技术文档中提取 {toolLabel} 相关的硬核参数...
              </p>
            </div>
          </div>
        );
      
      case 'scene-alchemist':
        return (
          <div className="bg-white rounded-xl border border-purple-100 shadow-sm p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
              <FlaskConical className="w-5 h-5 text-purple-600" />
              <h4 className="text-sm font-semibold text-gray-900">场景炼金</h4>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="aspect-square bg-purple-50 rounded-lg p-2 flex flex-col justify-center items-center gap-2 animate-pulse">
                  <div className="w-8 h-8 bg-purple-100 rounded-full" />
                  <div className="w-12 h-2 bg-purple-200 rounded" />
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3 text-center">
              正在模拟用户在不同环境下的真实体验...
            </p>
          </div>
        );

      case 'market-sniper':
        return (
          <div className="bg-white rounded-xl border border-red-100 shadow-sm p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
              <Crosshair className="w-5 h-5 text-red-600" />
              <h4 className="text-sm font-semibold text-gray-900">市场狙击策略</h4>
            </div>
            <div className="relative h-32 bg-gray-50 rounded-lg flex items-end justify-around p-4 mb-3">
               <div className="w-4 h-12 bg-gray-200 rounded-t animate-pulse" />
               <div className="w-4 h-20 bg-red-200 rounded-t animate-pulse delay-75" />
               <div className="w-4 h-16 bg-gray-200 rounded-t animate-pulse delay-150" />
               <div className="w-4 h-24 bg-red-300 rounded-t animate-pulse delay-200" />
            </div>
            <p className="text-xs text-gray-400">
              正在对比竞品数据，寻找差异化打击点...
            </p>
          </div>
        );

      case 'content-director':
        return (
          <div className="bg-white rounded-xl border border-green-100 shadow-sm p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
              <Clapperboard className="w-5 h-5 text-green-600" />
              <h4 className="text-sm font-semibold text-gray-900">内容生成中</h4>
            </div>
            <div className="space-y-3">
               <div className="flex gap-2">
                 <div className="w-8 h-10 bg-gray-100 rounded border border-gray-200" />
                 <div className="flex-1 space-y-2 py-1">
                   <div className="w-3/4 h-2 bg-green-100 rounded animate-pulse" />
                   <div className="w-1/2 h-2 bg-gray-100 rounded animate-pulse delay-75" />
                 </div>
               </div>
               <div className="flex gap-2">
                 <div className="w-8 h-10 bg-gray-100 rounded border border-gray-200" />
                 <div className="flex-1 space-y-2 py-1">
                   <div className="w-2/3 h-2 bg-green-100 rounded animate-pulse" />
                   <div className="w-1/2 h-2 bg-gray-100 rounded animate-pulse delay-75" />
                 </div>
               </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              正在编排 {toolLabel} 的结构与分镜...
            </p>
          </div>
        );

      default:
        return (
          <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-blue-500 animate-pulse" />
              <h4 className="text-sm font-semibold text-gray-900">
                {toolLabel || 'Agent'} 正在思考...
              </h4>
            </div>
            <div className="space-y-3">
              <div className="h-2 bg-gray-100 rounded-full w-3/4 animate-pulse"></div>
              <div className="h-2 bg-gray-100 rounded-full w-1/2 animate-pulse delay-75"></div>
              <div className="h-2 bg-gray-100 rounded-full w-5/6 animate-pulse delay-150"></div>
            </div>
          </div>
        );
    }
  };

  const renderWorkspace = () => {
    if (!activeRole) return null;
    const RoleIcon = getRoleIcon(activeRole.id);
    const roleTools = toolItems.filter(item => activeRole.toolIds.includes(item.id));
    const activeTool = roleTools.find(t => t.id === executingFeatureId);
    
    // 判断是否有主 Agent 调用的工具
    const isMainAgentToolCall = activeToolCall && toolToRoleMapping[activeToolCall.toolName] === activeRole.id;
    const toolLabel = isMainAgentToolCall 
      ? activeToolCall.toolName.replace('Consult_', '').replace(/_/g, ' ')
      : activeTool?.label || 'Agent';
    
    // 当前激活的工具ID（用于高亮显示）
    const currentActiveToolId = executingFeatureId || (isMainAgentToolCall ? activeToolCall.toolName : null);

    return (
      <div className="flex flex-col h-full bg-gray-50/30">
        {/* Workspace Header */}
        <div className="px-4 py-3 bg-white border-b border-gray-200">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setViewMode('dashboard')}
              className="p-1 -ml-1 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 flex-1">
              <div className={`p-1.5 rounded-lg border transition-all ${
                currentActiveToolId 
                  ? "bg-blue-50 border-blue-200 shadow-sm" 
                  : "bg-blue-50 border-blue-100"
              }`}>
                <RoleIcon className={`w-4 h-4 transition-colors ${
                  currentActiveToolId ? "text-blue-600" : "text-blue-500"
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-gray-900">{activeRole.name}</h3>
                <p className="text-xs text-blue-600 font-medium">
                  {currentActiveToolId ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>执行中: </span>
                      <span className="font-semibold">{toolLabel}</span>
                    </span>
                  ) : (
                    'Expert Workspace'
                  )}
                </p>
              </div>
            </div>
          </div>
          
          {/* 工具关联指示器 */}
          {currentActiveToolId && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                <span>当前工具: {toolLabel}</span>
                <span className="text-gray-300">•</span>
                <span>共 {roleTools.length} 个可用工具</span>
              </div>
            </div>
          )}
        </div>

        {/* Workspace Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {(executingFeatureId || isMainAgentToolCall) ? (
            <>
              {isMainAgentToolCall && toolCallOutput ? (
                // 显示主 Agent 工具调用的结果
                renderToolCallResult(activeRole.id, toolLabel, toolCallOutput)
              ) : (
                // 显示执行状态
                renderRoleSpecificContent(activeRole.id, toolLabel)
              )}
            </>
          ) : (
             <div className="text-center py-12">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 shadow-sm">
                  <RoleIcon className="w-8 h-8 text-gray-300" />
                </div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">准备就绪</h4>
                <p className="text-xs text-gray-500 px-8">
                  点击下方工具，唤醒 {activeRole.name} 开始工作
                </p>
             </div>
          )}

          {/* Quick Tools Access in Workspace */}
          <div className="mt-6">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">可用工具</h4>
            <div className="grid grid-cols-1 gap-2">
              {roleTools.map(tool => {
                // 判断工具是否激活（包括主 Agent 调用的工具）
                // 主 Agent 调用的工具名称（如 Consult_Tech）需要映射到对应的 featureType（如 five-view-analysis）
                const mainAgentToolFeatureType = isMainAgentToolCall && activeToolCall?.toolName 
                  ? toolToFeatureTypeMapping[activeToolCall.toolName] 
                  : null;
                
                const isToolActive = executingFeatureId === tool.id || 
                                   (isMainAgentToolCall && mainAgentToolFeatureType === tool.id);
                const isToolRelated = !isToolActive && currentActiveToolId && 
                                     (tool.id === currentActiveToolId || 
                                      (isMainAgentToolCall && mainAgentToolFeatureType === tool.id));
                
                return (
                  <button
                    key={tool.id}
                    ref={(el) => {
                      if (el) {
                        toolButtonRefs.current.set(tool.id, el);
                      } else {
                        toolButtonRefs.current.delete(tool.id);
                      }
                    }}
                    onClick={() => onTriggerFeature(tool.id)}
                    disabled={executingFeatureId === tool.id}
                    className={`
                      flex items-center gap-3 p-3 rounded-xl border text-left transition-all relative
                      ${isToolActive
                        ? "bg-blue-50 border-blue-200 shadow-inner ring-2 ring-blue-300"
                        : isToolRelated
                        ? "bg-blue-50/50 border-blue-100"
                        : "bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm"
                      }
                    `}
                    title={isToolActive ? `当前正在执行: ${tool.label}` : `点击执行: ${tool.label}`}
                  >
                    {/* 激活指示器 */}
                    {isToolActive && (
                      <div className="absolute top-2 right-2 w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                    )}
                    
                    <div className={`p-2 rounded-lg transition-colors ${
                      isToolActive 
                        ? "bg-white shadow-sm" 
                        : isToolRelated
                        ? "bg-blue-50"
                        : "bg-gray-50"
                    }`}>
                      <tool.icon className={`w-4 h-4 transition-colors ${
                        isToolActive 
                          ? "text-blue-600" 
                          : isToolRelated
                          ? "text-blue-500"
                          : "text-gray-500"
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm font-medium block ${
                        isToolActive 
                          ? "text-blue-900" 
                          : isToolRelated
                          ? "text-blue-700"
                          : "text-gray-700"
                      }`}>
                        {tool.label}
                      </span>
                      {isToolActive && (
                        <span className="text-[10px] text-blue-500 flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          执行中...
                        </span>
                      )}
                      {isToolRelated && !isToolActive && (
                        <span className="text-[10px] text-blue-400">相关工具</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 渲染工具调用结果
  const renderToolCallResult = (roleId: string, toolLabel: string, output: any) => {
    if (output.error) {
      return (
        <div className="bg-white rounded-xl border border-red-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h4 className="text-sm font-semibold text-gray-900">执行失败</h4>
          </div>
          <p className="text-sm text-red-600">{output.error}</p>
        </div>
      );
    }

    // 根据角色类型渲染不同的结果展示
    const content = output.content || output.text || output.answer || JSON.stringify(output, null, 2);
    const displayContent = isEditingToolOutput ? editedToolOutput : (typeof content === 'string' ? content : JSON.stringify(content, null, 2));

    // 初始化编辑内容
    useEffect(() => {
      if (toolCallOutput && !isEditingToolOutput) {
        const initialContent = toolCallOutput.content || toolCallOutput.text || toolCallOutput.answer || JSON.stringify(toolCallOutput, null, 2);
        setEditedToolOutput(typeof initialContent === 'string' ? initialContent : JSON.stringify(initialContent, null, 2));
      }
    }, [toolCallOutput, isEditingToolOutput]);

    const handleSaveEdit = () => {
      if (activeToolCall && onToolOutputModified) {
        onToolOutputModified(activeToolCall.toolName, editedToolOutput);
        setIsEditingToolOutput(false);
        setMessage({ type: 'success', text: '修改已保存，将在下次对话中生效' });
        setTimeout(() => setMessage(null), 3000);
      }
    };

    const handleCancelEdit = () => {
      setIsEditingToolOutput(false);
      // 恢复原始内容
      const originalContent = content;
      setEditedToolOutput(typeof originalContent === 'string' ? originalContent : JSON.stringify(originalContent, null, 2));
    };

    return (
      <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h4 className="text-sm font-semibold text-gray-900">{toolLabel} 执行完成</h4>
          </div>
          {!isEditingToolOutput ? (
            <button
              onClick={() => setIsEditingToolOutput(true)}
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
              title="编辑结果"
            >
              <Edit2 className="w-3.5 h-3.5" />
              编辑
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveEdit}
                className="flex items-center gap-1 px-2 py-1 text-xs text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
                title="保存修改"
              >
                <Save className="w-3.5 h-3.5" />
                保存
              </button>
              <button
                onClick={handleCancelEdit}
                className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                title="取消编辑"
              >
                <X className="w-3.5 h-3.5" />
                取消
              </button>
            </div>
          )}
        </div>
        <div className="space-y-3">
          {isEditingToolOutput ? (
            <textarea
              value={editedToolOutput}
              onChange={(e) => setEditedToolOutput(e.target.value)}
              className="w-full h-64 p-3 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono resize-y"
              placeholder="编辑工具输出内容..."
            />
          ) : (
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-3 rounded-lg border border-gray-200 max-h-96 overflow-y-auto">
                {displayContent}
              </pre>
            </div>
          )}
        </div>
        {message && (
          <div className={`mt-3 p-2 rounded-lg text-xs flex items-center gap-2 ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            {message.text}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-80 border-l border-gray-200 bg-white flex flex-col h-full shadow-lg z-20">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 rounded-lg">
            <Grid className="w-4 h-4 text-blue-600" />
          </div>
          <h2 className="text-sm font-semibold text-gray-900">{studioTitle}</h2>
        </div>
        <div className="flex items-center gap-1">
          {pageType === 'tech-package' && (
            <button
              onClick={() => setShowFieldMappingModal(true)}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              title="字段映射配置"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {viewMode === 'dashboard' ? renderDashboard() : renderWorkspace()}

        {/* History Section (Only visible in Dashboard mode) */}
        {viewMode === 'dashboard' && (
          <div className="border-t border-gray-100 mt-4">
            <div className="p-4 pb-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-gray-400" />
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">历史记录</h3>
                </div>
                <button
                  onClick={onShowConversationList}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline"
                >
                  查看全部
                </button>
              </div>
            </div>
            
            <div className="px-2 pb-4 space-y-1">
              {conversations.slice(0, 5).map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => handleConversationClick(conv)}
                  className={`group flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border border-transparent hover:border-gray-100 ${
                    currentConversationId === conv.id ? "bg-blue-50 border-blue-100" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0 mr-3">
                    <p className={`text-sm font-medium truncate ${
                      currentConversationId === conv.id ? "text-blue-700" : "text-gray-700 group-hover:text-gray-900"
                    }`}>
                      {getFirstQuestion(conv)}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                      <span>{formatDaysAgo(conv.createdAt)}</span>
                      <span className="w-0.5 h-0.5 bg-gray-300 rounded-full"></span>
                      <span>{conv.messages?.length || 0} 条对话</span>
                    </p>
                  </div>
                  
                  <button
                    onClick={(e) => handleDeleteClick(e, conv.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                    title="删除对话"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              
              {conversations.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="w-5 h-5 text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-500">暂无历史记录</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Field Mapping Config Modal */}

      {showFieldMappingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-[800px] max-h-[80vh] flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">字段映射配置</h3>
                <p className="text-sm text-gray-500 mt-1">配置各功能模块对应的AI角色和提示词</p>
              </div>
              <button
                onClick={() => setShowFieldMappingModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {message && (
                <div className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
                  message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {message.type === 'success' ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                  {message.text}
                </div>
              )}

              <div className="space-y-6">
                {/* Default Modules */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <Grid className="w-4 h-4 text-blue-600" />
                    标准功能模块
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    {Object.entries(FEATURE_LABELS).map(([key, defaultLabel]) => {
                      // 使用 featureLabelMap 中的标签，如果没有则使用默认标签
                      const label = featureLabelMap[key] || defaultLabel;
                      const isChecked = isFeatureChecked(key);
                      const currentRoleId = featureToRoleMapping[key] || defaultFeatureToRoleMapping[key] || '';
                      // 优先使用页面配置中的 agentRoles，如果没有则使用数据库中的角色
                      const expertRoles = agentRoles && agentRoles.length > 0
                        ? agentRoles.filter(r => 
                            r.id === 'tech-fundamentalist' || 
                            r.id === 'scene-alchemist' || 
                            r.id === 'market-sniper' || 
                            r.id === 'content-director'
                          )
                        : roles.filter(r => 
                            r.id === 'tech-fundamentalist' || 
                            r.id === 'scene-alchemist' || 
                            r.id === 'market-sniper' || 
                            r.id === 'content-director'
                          );
                      
                      return (
                        <div
                          key={key}
                          className={`
                            relative p-4 rounded-xl border-2 transition-all duration-200
                            ${isChecked
                              ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                              : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                            }
                          `}
                        >
                          <div 
                            className="flex items-center cursor-pointer"
                            onClick={() => toggleFeatureChecked(key)}
                          >
                            <div className={`
                              w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 transition-colors flex-shrink-0
                              ${isChecked
                                ? 'border-blue-500 bg-blue-500'
                                : 'border-gray-300'
                              }
                            `}>
                              {isChecked && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <span className={`font-medium flex-1 ${isChecked ? 'text-blue-900' : 'text-gray-700'}`}>
                              {label}
                            </span>
                          </div>
                          
                          {isChecked && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <label className="block text-xs font-medium text-gray-600 mb-2">
                                关联专家角色
                              </label>
                              <select
                                value={currentRoleId}
                                onChange={(e) => handleRoleChange(key, e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                              >
                                <option value="">请选择专家角色</option>
                                {expertRoles.map((role) => (
                                  <option key={role.id} value={role.id}>
                                    {role.name} - {role.description}
                                  </option>
                                ))}
                              </select>
                              {currentRoleId && (
                                <p className="mt-1 text-xs text-gray-500">
                                  当前配置: {expertRoles.find(r => r.id === currentRoleId)?.name || '未知角色'}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Modules */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                      <Settings className="w-4 h-4 text-purple-600" />
                      自定义功能模块
                    </h4>
                    <button
                      onClick={() => setShowCustomModuleForm(true)}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline flex items-center gap-1"
                    >
                      <span className="text-lg leading-none">+</span> 添加模块
                    </button>
                  </div>

                  {showCustomModuleForm && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-100 animate-in slide-in-from-top-2">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1.5">模块ID (英文)</label>
                          <input
                            type="text"
                            value={customFeatureId}
                            onChange={(e) => setCustomFeatureId(e.target.value)}
                            placeholder="e.g., swot-analysis"
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1.5">模块名称</label>
                          <input
                            type="text"
                            value={customFeatureLabel}
                            onChange={(e) => setCustomFeatureLabel(e.target.value)}
                            placeholder="e.g., SWOT分析"
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setShowCustomModuleForm(false)}
                          className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          取消
                        </button>
                        <button
                          onClick={handleAddCustomModule}
                          disabled={!customFeatureId || !customFeatureLabel}
                          className="px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors"
                        >
                          确认添加
                        </button>
                      </div>
                    </div>
                  )}

                  {customModules.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3">
                      {customModules.map((module) => {
                        const isChecked = isFeatureChecked(module.id);
                        const currentRoleId = featureToRoleMapping[module.id] || '';
                        // 优先使用页面配置中的 agentRoles，如果没有则使用数据库中的角色
                        const expertRoles = agentRoles && agentRoles.length > 0
                          ? agentRoles.filter(r => 
                              r.id === 'tech-fundamentalist' || 
                              r.id === 'scene-alchemist' || 
                              r.id === 'market-sniper' || 
                              r.id === 'content-director'
                            )
                          : roles.filter(r => 
                              r.id === 'tech-fundamentalist' || 
                              r.id === 'scene-alchemist' || 
                              r.id === 'market-sniper' || 
                              r.id === 'content-director'
                            );
                        
                        return (
                          <div
                            key={module.id}
                            className={`
                              relative p-4 rounded-xl border-2 transition-all duration-200 group
                              ${isChecked
                                ? 'border-purple-500 bg-purple-50/50 shadow-sm'
                                : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                              }
                            `}
                          >
                            <div 
                              className="flex items-center justify-between cursor-pointer"
                              onClick={() => toggleFeatureChecked(module.id)}
                            >
                              <div className="flex items-center flex-1">
                                <div className={`
                                  w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 transition-colors flex-shrink-0
                                  ${isChecked
                                    ? 'border-purple-500 bg-purple-500'
                                    : 'border-gray-300'
                                  }
                                `}>
                                  {isChecked && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                                </div>
                                <span className={`font-medium ${isChecked ? 'text-purple-900' : 'text-gray-700'}`}>
                                  {module.label}
                                </span>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCustomModule(module.id);
                                }}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-all ml-2"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            
                            {isChecked && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <label className="block text-xs font-medium text-gray-600 mb-2">
                                  关联专家角色
                                </label>
                                <select
                                  value={currentRoleId}
                                  onChange={(e) => handleRoleChange(module.id, e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                >
                                  <option value="">请选择专家角色</option>
                                  {expertRoles.map((role) => (
                                    <option key={role.id} value={role.id}>
                                      {role.name} - {role.description}
                                    </option>
                                  ))}
                                </select>
                                {currentRoleId && (
                                  <p className="mt-1 text-xs text-gray-500">
                                    当前配置: {expertRoles.find(r => r.id === currentRoleId)?.name || '未知角色'}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      <Settings className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">暂无自定义模块</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50/50 rounded-b-xl flex justify-end gap-3">
              <button
                onClick={() => setShowFieldMappingModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveFieldMapping}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm shadow-blue-200 transition-colors"
              >
                保存配置
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conversation Detail Modal */}
      {selectedConversation && (
        <ConversationDetailModal
          onClose={() => {
            setShowDetailModal(false);
            setSelectedConversation(null);
          }}
          conversation={selectedConversation}
        />
      )}
    </div>
  );
};

export default StudioSidebar;
