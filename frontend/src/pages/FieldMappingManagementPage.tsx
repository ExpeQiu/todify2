import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Settings, Loader2, AlertCircle, CheckCircle, X, Eye, Target, Grid3x3, Megaphone, Video as VideoIcon, Languages, Presentation, FileText } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import TopNavigation from '../components/TopNavigation';
import { aiSearchService } from '../services/aiSearchService';
import { agentWorkflowService } from '../services/agentWorkflowService';
import aiRoleService from '../services/aiRoleService';
import { AgentWorkflow } from '../types/agentWorkflow';
import { FieldMappingConfig } from '../types/aiSearch';

interface FieldMappingListItem {
  workflowId: string;
  config: FieldMappingConfig;
  createdAt: string;
  updatedAt: string;
  workflowName?: string;
  pageName?: string;
  pageType?: string; // 页面类型，用于区分相同 featureType 但不同 pageType 的配置
  featureType?: string;
  featureLabel?: string;
}

const FieldMappingManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mappings, setMappings] = useState<FieldMappingListItem[]>([]);
  const [filteredMappings, setFilteredMappings] = useState<FieldMappingListItem[]>([]);
  const [workflows, setWorkflows] = useState<AgentWorkflow[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null); // 格式: workflowId-pageType-featureType
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [editingMappingForAgent, setEditingMappingForAgent] = useState<FieldMappingListItem | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddToolModal, setShowAddToolModal] = useState(false);
  const [selectedFeatureType, setSelectedFeatureType] = useState<string>('ai-dialog');
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('');
  const [selectedRoleIdForMapping, setSelectedRoleIdForMapping] = useState<string>('');
  // 字段映射管理只关联"技术包装"页面
  const [selectedPageType, setSelectedPageType] = useState<'tech-package'>('tech-package');
  const [showCustomModuleForm, setShowCustomModuleForm] = useState(false);
  const [customFeatureId, setCustomFeatureId] = useState<string>('');
  const [customFeatureLabel, setCustomFeatureLabel] = useState<string>('');
  const [selectedFeatureTypes, setSelectedFeatureTypes] = useState<string[]>([]);
  const [addToolSelectedTypes, setAddToolSelectedTypes] = useState<string[]>([]);
  const [customModules, setCustomModules] = useState<Array<{ id: string; label: string }>>([]);

  // localStorage key for custom modules
  const CUSTOM_MODULES_STORAGE_KEY = 'field-mapping-custom-modules';

  // 从localStorage加载自定义模块
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

  // 保存自定义模块到localStorage
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

  useEffect(() => {
    loadData();
    // 加载已保存的自定义模块
    const savedModules = loadCustomModulesFromStorage();
    if (savedModules.length > 0) {
      setCustomModules(savedModules);
    }
  }, []);

  const FEATURE_LABELS: Record<string, string> = {
    'ai-dialog': 'AI对话框',
    'five-view-analysis': '五看',
    'three-fix-analysis': '三定',
    'tech-matrix': '技术矩阵',
    'propagation-strategy': '传播',
    'exhibition-video': '展具与视频',
    'translation': '翻译',
    'ppt-outline': '技术讲稿',
    'script': '脚本',
  };

  const FEATURE_PAGE_MAP: Record<string, string> = {
    'ai-dialog': '技术包装',
    'five-view-analysis': '技术包装',
    'three-fix-analysis': '技术包装',
    'tech-matrix': '技术包装',
    'propagation-strategy': '技术策略',
    'exhibition-video': '技术包装',
    'translation': '技术包装',
    'ppt-outline': '技术通稿',
    'script': '技术包装',
  };

  const PAGE_LABELS: Record<'tech-package' | 'tech-strategy' | 'tech-article' | 'press-release', string> = {
    'tech-package': '技术包装',
    'tech-strategy': '技术策略',
    'tech-article': '技术通稿',
    'press-release': '发布稿',
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [mappingsData, workflowsData, rolesData] = await Promise.all([
        aiSearchService.getAllFieldMappingConfigs(),
        agentWorkflowService.getAllWorkflows(),
        aiRoleService.getAIRoles(),
      ]);
      
      // 第一步：按 workflowId 合并配置，避免同一个 workflowId 有多个配置记录
      const configMap = new Map<string, { workflowId: string; config: FieldMappingConfig; createdAt: string; updatedAt: string }>();
      
      for (const mapping of mappingsData) {
        const existing = configMap.get(mapping.workflowId);
        if (existing) {
          // 如果已存在，合并 featureObjects（保留最新的）
          const existingFeatureObjects = Array.isArray(existing.config.featureObjects) ? existing.config.featureObjects : [];
          const newFeatureObjects = Array.isArray(mapping.config.featureObjects) ? mapping.config.featureObjects : [];
          
          // 使用 Map 去重 featureObjects（基于 featureType + pageType）
          const featureMap = new Map<string, any>();
          
          // 先添加现有的
          for (const feature of existingFeatureObjects) {
            const key = `${feature.featureType || ''}-${feature.pageType || 'no-page'}`;
            featureMap.set(key, feature);
          }
          
          // 再添加新的（会覆盖重复的）
          for (const feature of newFeatureObjects) {
            const key = `${feature.featureType || ''}-${feature.pageType || 'no-page'}`;
            featureMap.set(key, feature);
          }
          
          // 使用更新的时间戳
          const updatedAt = new Date(mapping.updatedAt) > new Date(existing.updatedAt) 
            ? mapping.updatedAt 
            : existing.updatedAt;
          
          configMap.set(mapping.workflowId, {
            workflowId: mapping.workflowId,
            config: {
              ...existing.config,
              featureObjects: Array.from(featureMap.values()),
            },
            createdAt: existing.createdAt,
            updatedAt,
          });
        } else {
          configMap.set(mapping.workflowId, mapping);
        }
      }
      
      // 第二步：转换为列表项并去重
      const rows: FieldMappingListItem[] = [];
      const seenKeys = new Set<string>(); // 用于去重：workflowId-pageType-featureType
      
      for (const mapping of configMap.values()) {
        const featureObjects = Array.isArray(mapping.config.featureObjects)
          ? mapping.config.featureObjects
          : [];
          
        if (featureObjects.length > 0) {
          for (const feature of featureObjects) {
            const workflowId = feature.workflowId || mapping.workflowId;
            const workflow = workflowsData.find((w) => w.id === workflowId);
            const pageType = feature.pageType;
            const featureType = feature.featureType;
            
            // 创建唯一键：workflowId + pageType + featureType
            const uniqueKey = `${workflowId}-${pageType || 'no-page'}-${featureType}`;
            
            // 如果已经存在相同的配置，跳过（去重）
            if (seenKeys.has(uniqueKey)) {
              console.warn('[FieldMappingManagementPage] 发现重复配置，已跳过:', {
                workflowId,
                pageType,
                featureType,
                uniqueKey
              });
              continue;
            }
            
            seenKeys.add(uniqueKey);
            
            // 尝试从工作流或AI角色中获取名称
            let displayName = workflow?.name;
            if (!displayName) {
              // 如果找不到工作流，尝试从AI角色中查找
              const role = rolesData.find((r: any) => r.id === workflowId);
              displayName = role?.name || '未知配置';
            }
            
            rows.push({
              ...mapping,
              workflowId,
              workflowName: displayName,
              pageName: pageType ? (PAGE_LABELS[pageType as keyof typeof PAGE_LABELS] || PAGE_LABELS['tech-package']) : (FEATURE_PAGE_MAP[featureType] || '技术包装'),
              pageType: pageType, // 添加 pageType 字段
              featureType: featureType,
              featureLabel: (feature as any).label || FEATURE_LABELS[featureType] || featureType,
              config: {
                ...mapping.config,
                inputMappings: feature.inputMappings || [],
                outputMappings: feature.outputMappings || [],
              },
            });
          }
        } else {
          const workflow = workflowsData.find((w) => w.id === mapping.workflowId);
          const uniqueKey = `${mapping.workflowId}-no-page-ai-dialog`;
          
          // 如果已经存在相同的配置，跳过（去重）
          if (seenKeys.has(uniqueKey)) {
            continue;
          }
          
          seenKeys.add(uniqueKey);
          
          // 尝试从工作流或AI角色中获取名称
          let displayName = workflow?.name;
          if (!displayName) {
            // 如果找不到工作流，尝试从AI角色中查找
            const role = rolesData.find((r: any) => r.id === mapping.workflowId);
            displayName = role?.name || '未知配置';
          }
          
          rows.push({
            ...mapping,
            workflowName: displayName,
            pageName: FEATURE_PAGE_MAP['ai-dialog'],
            pageType: undefined, // 向后兼容：没有 pageType 的情况
            featureType: 'ai-dialog',
            featureLabel: FEATURE_LABELS['ai-dialog'],
          });
        }
      }
      
      const mappingsWithWorkflow = rows;

      setMappings(mappingsWithWorkflow);
      setWorkflows(workflowsData);
      setRoles(rolesData);
    } catch (error) {
      console.error('加载数据失败:', error);
      setMessage({ type: 'error', text: '加载数据失败，请稍后重试' });
    } finally {
      setLoading(false);
    }
  };

  // 只显示技术包装页面的映射配置
  useEffect(() => {
    const pageLabel = PAGE_LABELS['tech-package'];
    const filtered = mappings.filter(m => m.pageName === pageLabel);
    setFilteredMappings(filtered);
  }, [mappings]);

  // 当弹窗打开时，加载当前已配置的信息
  useEffect(() => {
    if (!showCreateModal && !showAddToolModal) {
      // 弹窗关闭时，重置表单状态（但保留自定义模块）
      setSelectedFeatureTypes([]);
      setAddToolSelectedTypes([]);
      setSelectedFeatureType('');
      setCustomFeatureId('');
      setCustomFeatureLabel('');
      setShowCustomModuleForm(false);
      // 不重置customModules，因为它们应该持久化显示
      setSelectedRoleIdForMapping('');
      return;
    }
    
    // 当弹窗打开时，加载自定义模块
    if (showCreateModal || showAddToolModal) {
      const savedModules = loadCustomModulesFromStorage();
      if (savedModules.length > 0) {
        setCustomModules(savedModules);
      }
    }

    // 弹窗打开时，从localStorage加载自定义模块
    const savedModules = loadCustomModulesFromStorage();
    if (savedModules.length > 0) {
      setCustomModules(savedModules);
    }

    // 如果 roles 还没加载，不执行
    if (roles.length === 0) {
      console.log('[FieldMappingManagementPage] 等待AI角色加载...');
      return;
    }

    const loadExistingConfig = async () => {
      try {
        // 字段映射管理只关联技术包装页面
        const targetPageType = 'tech-package';

        // 加载所有映射配置
        const mappingsData = await aiSearchService.getAllFieldMappingConfigs();
        console.log('[FieldMappingManagementPage] 加载的映射配置数量:', mappingsData.length, 'targetPageType:', targetPageType);
        
        console.log('[FieldMappingManagementPage] 查找 pageType:', targetPageType);
        
        // 查找技术包装页面对应的第一个工作流配置
        for (const mapping of mappingsData) {
          const featureObjects = Array.isArray(mapping.config?.featureObjects) 
            ? mapping.config.featureObjects 
            : [];
          
          const hasMatchingPageType = featureObjects.some((f: any) => 
            f.pageType === targetPageType
          );
          
          if (hasMatchingPageType) {
            console.log('[FieldMappingManagementPage] 找到匹配的配置:', mapping.workflowId);
            setSelectedWorkflowId(mapping.workflowId);
            // 尝试将workflowId匹配到AI角色
            const matchingRole = roles.find((r: any) => r.id === mapping.workflowId);
            if (matchingRole && matchingRole.enabled) {
              setSelectedRoleIdForMapping(mapping.workflowId);
            }
            // 如果找不到匹配的角色，保持workflowId不变，但selectedRoleIdForMapping为空，用户需要手动选择
            
            // 加载技术包装页面已配置的 AI 模块
            const configuredFeatures = featureObjects
              .filter((f: any) => f.pageType === targetPageType)
              .map((f: any) => f.featureType);
            
            console.log('[FieldMappingManagementPage] 已配置的 AI 模块:', configuredFeatures);
            
            if (configuredFeatures.length > 0) {
              setSelectedFeatureTypes(configuredFeatures);
            }
            return; // 找到配置后直接返回
          }
        }
        
        // 如果没有找到配置，但有AI角色，使用第一个启用的AI角色作为默认值
        const enabledRoles = roles.filter((r: any) => r.enabled);
        if (enabledRoles.length > 0) {
          console.log('[FieldMappingManagementPage] 使用默认AI角色:', enabledRoles[0].id);
          setSelectedRoleIdForMapping(enabledRoles[0].id);
          setSelectedWorkflowId(enabledRoles[0].id);
        }
      } catch (error) {
        console.error('[FieldMappingManagementPage] 加载配置信息失败:', error);
      }
    };

    loadExistingConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCreateModal, roles]);
  
  // 当"添加工具"弹窗打开时，加载已配置的模块信息
  useEffect(() => {
    if (!showAddToolModal) {
      return;
    }
    
    const loadExistingModules = async () => {
      try {
        const enabledRoles = roles.filter((r: any) => r.enabled);
        if (enabledRoles.length === 0) return;

        const roleId = enabledRoles[0].id;
        const mappingsData = await aiSearchService.getAllFieldMappingConfigs();
        
        for (const mapping of mappingsData) {
          if (mapping.workflowId === roleId) {
            const featureObjects = Array.isArray(mapping.config?.featureObjects) 
              ? mapping.config.featureObjects 
              : [];
            
            const configuredFeatures = featureObjects
              .filter((f: any) => f.pageType === 'tech-package')
              .map((f: any) => f.featureType);
            
            // 不自动选中已配置的模块，让用户手动选择要添加的新模块
            return;
          }
        }
      } catch (error) {
        console.error('加载配置信息失败:', error);
      }
    };
    
    if (roles.length > 0) {
      loadExistingModules();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAddToolModal, roles]);

  const handleDelete = async (mapping: FieldMappingListItem) => {
    if (!confirm(`确定要删除"${mapping.pageName}"页面的"${mapping.featureLabel}"配置吗？`)) {
      return;
    }

    try {
      const deleteKey = `${mapping.workflowId}-${mapping.pageType || 'no-page'}-${mapping.featureType}`;
      setDeletingId(deleteKey);
      
      // 获取现有配置
      const existing = await aiSearchService.getFieldMappingConfig(mapping.workflowId);
      
      if (!existing) {
        setMessage({ type: 'error', text: '配置不存在' });
        return;
      }

      const featureObjects = Array.isArray(existing.featureObjects) ? existing.featureObjects.slice() : [];
      
      // 移除匹配的 featureObject（根据 featureType 和 pageType）
      const filteredFeatureObjects = featureObjects.filter((f: any) => {
        // 如果当前配置有 pageType，必须同时匹配 featureType 和 pageType
        if (mapping.pageType) {
          return !(f.featureType === mapping.featureType && f.pageType === mapping.pageType);
        }
        // 如果当前配置没有 pageType（向后兼容），只匹配 featureType
        return f.featureType !== mapping.featureType;
      });

      // 如果还有其他的 featureObjects，更新配置；否则删除整个配置
      if (filteredFeatureObjects.length > 0) {
        const updatedConfig: FieldMappingConfig = {
          ...existing,
          featureObjects: filteredFeatureObjects,
        };
        await aiSearchService.saveFieldMappingConfig(mapping.workflowId, updatedConfig);
        setMessage({ type: 'success', text: '删除成功' });
      } else {
        // 如果没有其他配置了，删除整个配置记录
        await aiSearchService.deleteFieldMappingConfig(mapping.workflowId);
        setMessage({ type: 'success', text: '删除成功' });
      }
      
      await loadData();
    } catch (error) {
      console.error('删除失败:', error);
      setMessage({ type: 'error', text: '删除失败，请稍后重试' });
    } finally {
      setDeletingId(null);
    }
  };

  const openAgentModal = (mapping: FieldMappingListItem) => {
    setEditingMappingForAgent(mapping);
    // 从配置中获取当前关联的agentId
    // 根据 featureType 和 pageType 查找配置，避免匹配到其他 pageType 的配置
    const pageType = mapping.pageName === '技术包装' ? 'tech-package' :
                    mapping.pageName === '技术策略' ? 'tech-strategy' :
                    mapping.pageName === '技术通稿' ? 'tech-article' :
                    mapping.pageName === '发布稿' || mapping.pageName === '发布会稿' ? 'press-release' : undefined;
    
    const featureObjects = Array.isArray(mapping.config.featureObjects) ? mapping.config.featureObjects : [];
    const currentFeature = featureObjects.find((f: any) => 
      f.featureType === mapping.featureType && 
      (pageType ? f.pageType === pageType : true) // 如果提供了 pageType，必须匹配
    );
    setSelectedAgentId(currentFeature?.agentId || '');
    setShowAgentModal(true);
  };

  const saveAgentRole = async () => {
    if (!editingMappingForAgent) return;
    try {
      const existing = await aiSearchService.getFieldMappingConfig(editingMappingForAgent.workflowId);
      if (!existing) {
        setMessage({ type: 'error', text: '配置不存在' });
        return;
      }

      const pageType = editingMappingForAgent.pageName === '技术包装' ? 'tech-package' :
                      editingMappingForAgent.pageName === '技术策略' ? 'tech-strategy' :
                      editingMappingForAgent.pageName === '技术通稿' ? 'tech-article' :
                      editingMappingForAgent.pageName === '发布稿' || editingMappingForAgent.pageName === '发布会稿' ? 'press-release' : undefined;

      const featureObjects = Array.isArray(existing.featureObjects) ? existing.featureObjects.slice() : [];
      // 根据 featureType 和 pageType 查找配置，避免覆盖其他 pageType 的配置
      const featureIndex = featureObjects.findIndex((f: any) => 
        f.featureType === editingMappingForAgent.featureType && 
        (pageType ? f.pageType === pageType : true) // 如果提供了 pageType，必须匹配
      );
      
      if (featureIndex >= 0) {
        // 更新现有featureObject的agentId
        featureObjects[featureIndex] = {
          ...featureObjects[featureIndex],
          agentId: selectedAgentId || undefined,
        };
      } else {
        // 如果不存在，创建一个新的featureObject
        featureObjects.push({
          featureType: editingMappingForAgent.featureType as any,
          workflowId: editingMappingForAgent.workflowId,
          inputMappings: [],
          outputMappings: [],
          pageType: pageType as 'tech-package' | 'tech-strategy' | 'tech-article' | 'press-release' | undefined,
          label: editingMappingForAgent.featureLabel,
          agentId: selectedAgentId || undefined,
        });
      }

      const updatedConfig: FieldMappingConfig = {
        ...existing,
        featureObjects,
      };

      await aiSearchService.saveFieldMappingConfig(editingMappingForAgent.workflowId, updatedConfig);
      setMessage({ type: 'success', text: 'Agent角色配置成功' });
      setShowAgentModal(false);
      setEditingMappingForAgent(null);
      setSelectedAgentId('');
      await loadData();
    } catch (error) {
      console.error('保存Agent角色失败:', error);
      setMessage({ type: 'error', text: '保存Agent角色失败，请稍后重试' });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <TopNavigation currentPageTitle="字段映射管理" />
      
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          {/* 标题和操作栏 */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">字段映射管理</h1>
              <p className="text-sm text-gray-500 mt-1">管理技术包装页面的工作流映射（仅关联技术包装页面）</p>
            </div>
            <div className="flex items-center gap-3">
              {/* 页面类型显示（只关联技术包装） */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">关联页面：</span>
                <div className="px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white">
                  技术包装
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddToolModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                添加工具
              </button>
              <button
                onClick={() => {
                  // 打开弹窗，useEffect 会处理加载已配置信息
                  setShowCreateModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Settings className="w-4 h-4" />
                修改配置
              </button>
            </div>
          </div>

          {/* 消息提示 */}
          {message && (
            <div
              className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
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

          {/* 配置列表 */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : mappings.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">暂无字段映射配置</p>
              <p className="text-sm text-gray-400 mt-2">在AI搜索页面配置字段映射后，将显示在这里</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">独立页面</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI模块</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">输入映射数</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">输出映射数</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">输出更新时间</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredMappings.map((mapping) => (
                      <tr key={`${mapping.workflowId}-${mapping.pageType || mapping.pageName || 'default'}-${mapping.featureType}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {mapping.pageName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {mapping.featureLabel}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {mapping.config.inputMappings?.length || 0}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {mapping.config.outputMappings?.length || 0}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {formatDate(mapping.updatedAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openAgentModal(mapping)}
                              className="text-gray-700 hover:text-gray-900 flex items-center gap-1"
                            >
                              <Settings className="w-4 h-4" />
                              配置Agent角色
                            </button>
                            <button
                              onClick={() => handleDelete(mapping)}
                              disabled={deletingId === `${mapping.workflowId}-${mapping.pageType || 'no-page'}-${mapping.featureType}`}
                              className="text-red-600 hover:text-red-900 flex items-center gap-1 disabled:opacity-50"
                            >
                              {deletingId === `${mapping.workflowId}-${mapping.pageType || 'no-page'}-${mapping.featureType}` ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                              删除
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-6">
          <div className="bg-white rounded-lg border border-gray-200 w-full max-w-3xl">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">修改配置</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <div className="text-sm text-gray-600 mb-2">技术独立页</div>
                <div className="px-3 py-2 border rounded-md text-sm bg-blue-50 border-blue-500 text-gray-900">
                  技术包装
                </div>
                <p className="text-xs text-gray-500 mt-1">字段映射管理仅关联技术包装页面</p>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-2">选择AI模块</div>
                <p className="text-xs text-gray-500 mb-3">选择要关联到技术包装页面的AI模块，这些模块将在前端工具箱中显示</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { key: 'five-view-analysis', label: '五看', icon: <Eye className="w-6 h-6 mb-2 text-gray-600" /> },
                    { key: 'three-fix-analysis', label: '三定', icon: <Target className="w-6 h-6 mb-2 text-gray-600" /> },
                    { key: 'tech-matrix', label: '技术矩阵', icon: <Grid3x3 className="w-6 h-6 mb-2 text-gray-600" /> },
                    { key: 'propagation-strategy', label: '传播', icon: <Megaphone className="w-6 h-6 mb-2 text-gray-600" /> },
                    { key: 'exhibition-video', label: '展具与视频', icon: <VideoIcon className="w-6 h-6 mb-2 text-gray-600" /> },
                    { key: 'translation', label: '翻译', icon: <Languages className="w-6 h-6 mb-2 text-gray-600" /> },
                    { key: 'ppt-outline', label: '技术通稿', icon: <Presentation className="w-6 h-6 mb-2 text-gray-600" /> },
                    { key: 'script', label: '脚本', icon: <FileText className="w-6 h-6 mb-2 text-gray-600" /> },
                  ].map(item => (
                    <button
                      key={item.key}
                      onClick={() => { setSelectedFeatureType(item.key); }}
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
                  {/* 显示已添加的自定义模块（从localStorage加载） */}
                  {customModules.map((module) => (
                    <button
                      key={module.id}
                      onClick={() => { setSelectedFeatureType(module.id); }}
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
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-2">
              <button onClick={() => setShowCreateModal(false)} className="px-3 py-2 rounded-md border text-sm">取消</button>
              <button
                onClick={async () => {
                  try {
                    // 字段映射管理只关联技术包装页面
                    const selectedPageType = 'tech-package';

                    // 获取要绑定的功能类型（排除 ai-dialog）
                    // selectedFeatureTypes 已经包含了所有选中的模块（包括自定义模块）
                    const featuresToBind = selectedFeatureTypes.length > 0 
                      ? selectedFeatureTypes.filter(ft => ft !== 'ai-dialog')
                      : (selectedFeatureType && selectedFeatureType !== 'ai-dialog' ? [selectedFeatureType] : []);
                    
                    if (featuresToBind.length === 0) {
                      setMessage({ type: 'error', text: '请选择至少一个AI模块（点击⭕️勾选，AI对话框除外）' });
                      return;
                    }

                    // 如果没有选择AI角色，使用第一个可用的AI角色
                    const enabledRoles = roles.filter((r: any) => r.enabled);
                    const roleIdToUse = selectedRoleIdForMapping || (enabledRoles.length > 0 ? enabledRoles[0].id : '');
                    const workflowIdToUse = roleIdToUse; // 使用AI角色ID作为workflowId
                    if (!workflowIdToUse) {
                      setMessage({ type: 'error', text: '没有可用的AI角色，请先创建AI角色' });
                      return;
                    }

                    console.log('[FieldMappingManagementPage] 修改配置:', {
                      roleId: roleIdToUse,
                      workflowId: workflowIdToUse,
                      pageType: selectedPageType,
                      features: featuresToBind,
                      association: `为 ${PAGE_LABELS[selectedPageType]} 页面关联 ${featuresToBind.length} 个AI模块，影响前端工具箱显示`,
                    });

                    const existing = await aiSearchService.getFieldMappingConfig(workflowIdToUse);
                    const normalizedPageType = selectedPageType;
                    let nextConfig: FieldMappingConfig;
                    
                    if (existing) {
                      const fo = Array.isArray(existing.featureObjects) ? existing.featureObjects.slice() : [];
                      
                      // 修改逻辑：只修改当前 pageType 的配置，完全保留其他 pageType 的配置
                      // 1. 保留所有其他 pageType 的配置（确保其他页面配置不受影响）
                      const otherPageTypeFeatures = fo.filter((f: any) => {
                        // 保留没有 pageType 的配置（向后兼容）
                        if (!f.pageType) {
                          return true;
                        }
                        // 保留所有不是当前 pageType 的配置
                        return f.pageType !== normalizedPageType;
                      });
                      
                      // 2. 为当前 pageType 创建新的配置（基于用户选择）
                      // 使用Map来确保每个featureType只保留一个配置（去重）
                      const newFeaturesMap = new Map<string, any>();
                      
                      for (const ft of featuresToBind) {
                        // 检查是否已存在相同 featureType 和 pageType 的配置，如果有，保留原有的配置信息
                        const existingFeature = fo.find((f: any) => 
                          f.featureType === ft && f.pageType === normalizedPageType
                        );
                        
                        // 查找自定义模块的标签（从localStorage中的自定义模块列表）
                        const customModule = customModules.find(m => m.id === ft);
                        const moduleLabel = customModule?.label || existingFeature?.label || FEATURE_LABELS[ft] || undefined;
                        
                        // 修改配置：实现AI模块与独立页面的关联，影响前端工具箱显示
                        newFeaturesMap.set(ft, {
                          featureType: ft as any,
                          workflowId: workflowIdToUse,
                          inputMappings: [], // 简化：不涉及字段映射配置
                          outputMappings: [], // 简化：不涉及字段映射配置
                          pageType: normalizedPageType, // 关联到技术包装页面
                          label: moduleLabel,
                          agentId: existingFeature?.agentId, // 保留agentId配置
                        });
                      }
                      
                      // 将Map转换为数组
                      const newFeatures = Array.from(newFeaturesMap.values());
                      
                      // 3. 合并：其他 pageType 的配置 + 当前 pageType 的新配置
                      nextConfig = { 
                        ...existing, 
                        featureObjects: [...otherPageTypeFeatures, ...newFeatures]
                      };
                    } else {
                      // 如果没有现有配置，创建新配置
                      const featureObjects = featuresToBind.map(ft => {
                        // 查找自定义模块的标签（从localStorage中的自定义模块列表）
                        const customModule = customModules.find(m => m.id === ft);
                        const moduleLabel = customModule?.label || FEATURE_LABELS[ft] || undefined;
                        
                        return {
                          featureType: ft as any,
                          workflowId: workflowIdToUse,
                          inputMappings: [],
                          outputMappings: [],
                          pageType: normalizedPageType, // 关联到技术包装页面
                          label: moduleLabel,
                        };
                      });
                      
                      nextConfig = {
                        workflowId: workflowIdToUse,
                        inputMappings: [],
                        outputMappings: [],
                        featureObjects,
                      } as any;
                    }

                    console.log('[FieldMappingManagementPage] 保存配置:', nextConfig);
                    await aiSearchService.saveFieldMappingConfig(workflowIdToUse, nextConfig);
                    
                    setMessage({ type: 'success', text: `配置修改成功：已为 ${PAGE_LABELS[normalizedPageType]} 页面关联 ${featuresToBind.length} 个AI模块，前端工具箱将显示这些模块。请刷新页面查看效果。` });
                    setShowCreateModal(false);
                    // 重置表单状态（但保留自定义模块，因为它们应该持久化显示）
                    setSelectedFeatureTypes([]);
                    setSelectedFeatureType('');
                    // 不重置customModules，因为它们应该持久化显示
                    
                    // 重新加载数据
                    await loadData();
                  } catch (error: any) {
                    console.error('[FieldMappingManagementPage] 创建配置失败:', error);
                    const errorMessage = error?.response?.data?.error || error?.response?.data?.message || error?.message || '创建配置失败，请稍后重试';
                    setMessage({ type: 'error', text: errorMessage });
                  }
                }}
                className="px-3 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700"
              >
                保存修改
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 添加工具弹窗 */}
      {showAddToolModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-lg border border-gray-200 w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">添加工具</h3>
              <button onClick={() => {
                setShowAddToolModal(false);
                setAddToolSelectedTypes([]);
                setCustomFeatureId('');
                setCustomFeatureLabel('');
                setShowCustomModuleForm(false);
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
                <div className="text-sm text-gray-600 mb-2">选择AI模块</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { key: 'five-view-analysis', label: '五看', icon: <Eye className="w-6 h-6 mb-2 text-gray-600" /> },
                    { key: 'three-fix-analysis', label: '三定', icon: <Target className="w-6 h-6 mb-2 text-gray-600" /> },
                    { key: 'tech-matrix', label: '技术矩阵', icon: <Grid3x3 className="w-6 h-6 mb-2 text-gray-600" /> },
                    { key: 'propagation-strategy', label: '传播', icon: <Megaphone className="w-6 h-6 mb-2 text-gray-600" /> },
                    { key: 'exhibition-video', label: '展具与视频', icon: <VideoIcon className="w-6 h-6 mb-2 text-gray-600" /> },
                    { key: 'translation', label: '翻译', icon: <Languages className="w-6 h-6 mb-2 text-gray-600" /> },
                    { key: 'ppt-outline', label: '技术通稿', icon: <Presentation className="w-6 h-6 mb-2 text-gray-600" /> },
                    { key: 'script', label: '脚本', icon: <FileText className="w-6 h-6 mb-2 text-gray-600" /> },
                  ].map(item => (
                    <button
                      key={item.key}
                      onClick={() => {
                        const isSelected = addToolSelectedTypes.includes(item.key);
                        if (isSelected) {
                          setAddToolSelectedTypes(prev => prev.filter(id => id !== item.key));
                        } else {
                          setAddToolSelectedTypes(prev => [...prev, item.key]);
                        }
                        setShowCustomModuleForm(false);
                      }}
                      className={`relative flex flex-col items-center justify-center p-4 border rounded-lg transition-all ${
                        addToolSelectedTypes.includes(item.key)
                          ? 'bg-blue-50 border-blue-500'
                          : 'bg-white border-gray-300 hover:bg-gray-50 hover:border-blue-500'
                      }`}
                      title={item.label}
                    >
                      {item.icon}
                      <span className="text-xs text-gray-700 text-center">{item.label}</span>
                      <div
                        onClick={(e) => { e.stopPropagation(); }}
                        className={`absolute left-3 bottom-3 w-4 h-4 rounded-full border cursor-pointer ${
                          addToolSelectedTypes.includes(item.key)
                            ? 'border-red-500 bg-red-500'
                            : 'border-red-500 bg-white'
                        }`}
                        aria-label={addToolSelectedTypes.includes(item.key) ? '取消选择' : '选择模块'}
                      />
                    </button>
                  ))}
                  {/* 显示已添加的自定义模块 */}
                  {customModules.map((module) => (
                    <button
                      key={module.id}
                      onClick={() => {
                        const isSelected = addToolSelectedTypes.includes(module.id);
                        if (isSelected) {
                          setAddToolSelectedTypes(prev => prev.filter(id => id !== module.id));
                        } else {
                          setAddToolSelectedTypes(prev => [...prev, module.id]);
                        }
                        setShowCustomModuleForm(false);
                      }}
                      className={`relative flex flex-col items-center justify-center p-4 border rounded-lg transition-all ${
                        addToolSelectedTypes.includes(module.id)
                          ? 'bg-blue-50 border-blue-500'
                          : 'bg-white border-purple-300 hover:bg-gray-50 hover:border-purple-500'
                      }`}
                      title={module.label}
                    >
                      <Settings className="w-6 h-6 mb-2 text-purple-600" />
                      <span className="text-xs text-gray-700 text-center">{module.label}</span>
                      <div
                        onClick={(e) => { e.stopPropagation(); }}
                        className={`absolute left-3 bottom-3 w-4 h-4 rounded-full border cursor-pointer ${
                          addToolSelectedTypes.includes(module.id)
                            ? 'border-red-500 bg-red-500'
                            : 'border-red-500 bg-white'
                        }`}
                        aria-label={addToolSelectedTypes.includes(module.id) ? '取消选择' : '选择模块'}
                      />
                    </button>
                  ))}
                  <button
                    onClick={() => { 
                      setShowCustomModuleForm(true);
                      setCustomFeatureId('');
                      setCustomFeatureLabel('');
                    }}
                    className={`relative flex flex-col items-center justify-center p-4 border rounded-lg transition-all ${
                      showCustomModuleForm
                        ? 'bg-blue-50 border-blue-500'
                        : 'bg-white border-red-400 hover:bg-gray-50 hover:border-blue-500'
                    }`}
                    title="新增AI模块"
                  >
                    <span className="text-2xl text-red-500">+</span>
                    <span className="mt-2 text-xs text-gray-700">新增AI模块</span>
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
                            // 自动选中新添加的模块
                            setAddToolSelectedTypes(prev => prev.includes(newModule.id) ? prev : [...prev, newModule.id]);
                            // 清空输入框，但保持表单打开状态，方便继续添加
                            setCustomFeatureId('');
                            setCustomFeatureLabel('');
                            setMessage({ type: 'success', text: `模块"${newModule.label}"已添加并选中` });
                            // 3秒后清除成功消息
                            setTimeout(() => setMessage(null), 3000);
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
                  setShowAddToolModal(false);
                  setAddToolSelectedTypes([]);
                  setCustomFeatureId('');
                  setCustomFeatureLabel('');
                  setShowCustomModuleForm(false);
                }}
                className="px-3 py-2 rounded-md border text-sm"
              >
                取消
              </button>
              <button
                onClick={async () => {
                  try {
                    // 添加工具：功能实现 AI模块的添加（只添加到自定义模块列表）
                    // 注意：这里只处理通过"新增AI模块"添加的自定义模块
                    // 标准模块（五看、三定等）已经存在，不需要通过"添加工具"添加
                    const featuresToAdd = addToolSelectedTypes.filter(ft => ft !== 'ai-dialog');
                    
                    // 检查是否有通过"新增AI模块"添加的自定义模块
                    const customModulesToAdd = featuresToAdd.filter(ft => 
                      customModules.some(m => m.id === ft) // 是自定义模块
                    );
                    
                    if (customModulesToAdd.length === 0 && featuresToAdd.length > 0) {
                      // 如果选中的都是标准模块，提示用户使用"修改配置"来关联页面
                      setMessage({ type: 'info', text: '标准模块已存在。如需关联到页面，请使用"修改配置"功能' });
                      return;
                    }
                    
                    if (featuresToAdd.length === 0) {
                      setMessage({ type: 'error', text: '请先通过"新增AI模块"添加自定义模块，然后选择要添加的模块' });
                      return;
                    }

                    // 添加工具功能：只确认自定义模块已添加到列表
                    // 实际添加操作在"新增AI模块"时已经完成（保存到localStorage）
                    // 这里只是确认操作，不涉及字段映射配置的保存
                    setMessage({ type: 'success', text: `成功添加 ${customModulesToAdd.length} 个自定义AI模块。如需在工具箱中显示，请使用"修改配置"功能关联到技术包装页面` });
                    setShowAddToolModal(false);
                    setAddToolSelectedTypes([]);
                    setCustomFeatureId('');
                    setCustomFeatureLabel('');
                    setShowCustomModuleForm(false);
                    // 不需要重新加载数据，因为只是添加到localStorage
                  } catch (error: any) {
                    console.error('添加工具失败:', error);
                    const errorMessage = error?.response?.data?.error || error?.response?.data?.message || error?.message || '添加工具失败，请稍后重试';
                    setMessage({ type: 'error', text: errorMessage });
                  }
                }}
                className="px-3 py-2 rounded-md bg-green-600 text-white text-sm hover:bg-green-700"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 配置Agent角色弹窗 */}
      {showAgentModal && editingMappingForAgent && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-lg border border-gray-200 w-full max-w-2xl">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">配置Agent角色</h3>
              <button 
                onClick={() => {
                  setShowAgentModal(false);
                  setEditingMappingForAgent(null);
                  setSelectedAgentId('');
                }} 
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <div className="text-sm text-gray-600 mb-2">独立页面</div>
                <div className="text-sm text-gray-900 font-medium">{editingMappingForAgent.pageName}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-2">AI模块</div>
                <div className="text-sm text-gray-900 font-medium">{editingMappingForAgent.featureLabel}</div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">选择AI角色</label>
                <select
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                >
                  <option value="">请选择AI角色（可选）</option>
                  {roles
                    .filter((role: any) => role.enabled)
                    .map((role: any) => (
                      <option key={role.id} value={role.id}>
                        {role.name} {role.description ? `- ${role.description}` : ''}
                      </option>
                    ))}
                </select>
                {roles.length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    暂无可用的AI角色，请先到 <a href="/ai-roles" className="text-blue-600 hover:underline">AI角色管理</a> 创建角色
                  </p>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-2">
              <button 
                onClick={() => {
                  setShowAgentModal(false);
                  setEditingMappingForAgent(null);
                  setSelectedAgentId('');
                }} 
                className="px-3 py-2 rounded-md border text-sm hover:bg-gray-50"
              >
                取消
              </button>
              <button 
                onClick={saveAgentRole} 
                className="px-3 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FieldMappingManagementPage;


