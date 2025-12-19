import React, { useState, useEffect } from 'react';
import { 
  Info, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  AlertCircle, 
  Settings,
  ExternalLink,
  PlusCircle,
  Loader2,
  Brain,
  X,
  Bot
} from 'lucide-react';
import { AIRoleConfig } from '../types/aiRole';
import { aiSearchService } from '../services/aiSearchService';
import { configService } from '../services/configService';
import aiRoleService from '../services/aiRoleService';
import { useNavigate } from 'react-router-dom';
import { createPresetRole, PRESET_ROLES } from '../utils/initPresetRoles';

interface NodeConfigStatus {
  nodeType: string;
  nodeName: string;
  icon: React.ReactNode;
  configured: boolean;
  roleId?: string;
  roleName?: string;
  source: 'independent-page' | 'workflow' | 'field-mapping' | 'project-resources' | 'feature-page';
  path?: string;
}

interface AIRoleConfigInfoBoxProps {
  roles: AIRoleConfig[];
  onRefresh?: () => void;
  hideHeader?: boolean; // 是否隐藏标题栏
}

/**
 * AI角色配置信息框
 * 显示需要配置AI角色的节点及其配置状态
 */
const AIRoleConfigInfoBox: React.FC<AIRoleConfigInfoBoxProps> = ({ roles, onRefresh, hideHeader = false }) => {
  const [expanded, setExpanded] = useState(true);
  const [nodeStatuses, setNodeStatuses] = useState<NodeConfigStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingRole, setCreatingRole] = useState<string | null>(null);
  
  // 角色选择器状态
  const [showSelector, setShowSelector] = useState(false);
  const [selectorTarget, setSelectorTarget] = useState<NodeConfigStatus | null>(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    loadNodeStatuses();
  }, [roles, showSelector]); // 当选择器关闭（配置完成后）也重新加载

  const loadNodeStatuses = async () => {
    setLoading(true);
    try {
      const statuses: NodeConfigStatus[] = [];

      // 1. 独立页面节点（已删除 node/* 功能子页面，不再显示）

      // 2. 功能页面AI助手（技术包装、技术策略、技术通稿、项目资源）
      const featurePages = [
        { type: 'tech-package', name: '技术包装', path: '/tech-package', storageKey: 'tech-package-ai-role-id' },
        { type: 'tech-strategy', name: '技术策略', path: '/tech-strategy', storageKey: 'tech-strategy-ai-role-id' },
        { type: 'tech-article', name: '技术通稿', path: '/tech-article', storageKey: 'tech-article-ai-role-id' },
        { type: 'ai-qa-assistant', name: 'AI问答助手', path: '/project-resources', storageKey: 'project-resources-ai-role-id' },
      ];

      for (const page of featurePages) {
        let configured = false;
        let roleId: string | undefined;
        let roleName: string | undefined;

        if (page.type === 'ai-qa-assistant') {
          // 项目资源AI助手使用 configService
          try {
            const aiQAConfig = await configService.getDifyConfig('smart-workflow-ai-qa');
            configured = !!(aiQAConfig && aiQAConfig.enabled);
            if (configured) {
              // 尝试从 localStorage 获取 roleId
              const storedRoleId = localStorage.getItem(page.storageKey);
              if (storedRoleId) {
                roleId = storedRoleId;
                const matchedRole = roles.find(r => r.id === roleId);
                roleName = matchedRole?.name || aiQAConfig?.name;
              } else {
                roleName = aiQAConfig?.name || 'AI问答助手';
              }
            }
          } catch (error) {
            console.warn(`获取${page.name}配置失败:`, error);
          }
        } else {
          // 其他功能页面从 localStorage 获取
          const storedRoleId = localStorage.getItem(page.storageKey);
          if (storedRoleId) {
            roleId = storedRoleId;
            const matchedRole = roles.find(r => r.id === roleId);
            configured = !!matchedRole;
            roleName = matchedRole?.name;
          }
        }

        statuses.push({
          nodeType: page.type,
          nodeName: page.name,
          icon: <Brain className="w-4 h-4" />,
          configured,
          roleId,
          roleName,
          source: 'feature-page',
          path: page.path
        });
      }

      // 3. 字段映射功能对象 - 动态加载所有已配置的功能对象（包括自定义模块）
      // 预定义功能类型的显示名称映射（用于向后兼容）
      const FEATURE_DISPLAY_NAMES: Record<string, string> = {
        'five-view-analysis': '技术转译（五看）',
        'three-fix-analysis': '用户场景挖掘（三定）',
        'tech-matrix': '技术矩阵',
        'propagation-strategy': '传播策略',
        'exhibition-video': '展具与视频',
        'translation': '翻译',
        'ppt-outline': '技术讲稿',
        'script': '脚本',
      };

      try {
        const fieldMappingConfigs = await aiSearchService.getAllFieldMappingConfigs();
        const allFeatureObjects = fieldMappingConfigs.flatMap(
          config => config.config.featureObjects || []
        );

        // 从localStorage加载自定义模块
        const CUSTOM_MODULES_STORAGE_KEY = 'field-mapping-custom-modules';
        let customModules: Array<{ id: string; label: string }> = [];
        try {
          const stored = localStorage.getItem(CUSTOM_MODULES_STORAGE_KEY);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
              customModules = parsed.filter((m: any) => m && m.id && m.label);
            }
          }
        } catch (error) {
          console.warn('加载自定义模块失败:', error);
        }

        // 收集所有已配置的功能对象（排除 ai-dialog）
        const seenFeatureTypes = new Set<string>();
        const featureObjectsMap = new Map<string, any>();

        // 从字段映射配置中收集所有功能对象
        allFeatureObjects.forEach((fo: any) => {
          if (fo.featureType && fo.featureType !== 'ai-dialog') {
            const featureType = fo.featureType;
            if (!seenFeatureTypes.has(featureType)) {
              seenFeatureTypes.add(featureType);
              featureObjectsMap.set(featureType, fo);
            } else {
              // 如果已存在，优先使用有 agentId 的配置
              const existing = featureObjectsMap.get(featureType);
              if (fo.agentId && !existing?.agentId) {
                featureObjectsMap.set(featureType, fo);
              }
            }
          }
        });

        // 添加自定义模块（即使它们可能还没有在字段映射配置中）
        customModules.forEach(module => {
          if (!seenFeatureTypes.has(module.id)) {
            seenFeatureTypes.add(module.id);
            // 尝试从字段映射配置中查找对应的配置
            const existingConfig = allFeatureObjects.find((fo: any) => fo.featureType === module.id);
            if (existingConfig) {
              featureObjectsMap.set(module.id, existingConfig);
            } else {
              // 如果配置中还没有，创建一个占位符
              featureObjectsMap.set(module.id, {
                featureType: module.id,
                label: module.label,
                agentId: undefined
              });
            }
          }
        });

        // 为每个功能对象创建状态
        featureObjectsMap.forEach((featureConfig, featureType) => {
          const configured = !!featureConfig?.agentId;
          const roleId = featureConfig?.agentId;
          const matchedRole = roleId ? roles.find(r => r.id === roleId) : null;

          // 获取显示名称：优先使用 label，然后是自定义模块的 label，最后是预定义的名称
          let displayName = featureConfig?.label;
          if (!displayName) {
            const customModule = customModules.find(m => m.id === featureType);
            displayName = customModule?.label || FEATURE_DISPLAY_NAMES[featureType] || featureType;
          }

          statuses.push({
            nodeType: featureType,
            nodeName: displayName,
            icon: <Settings className="w-4 h-4" />,
            configured,
            roleId,
            roleName: matchedRole?.name,
            source: 'field-mapping',
            path: '/field-mapping-management'
          });
        });
      } catch (error) {
        // 如果获取字段映射配置失败，显示为未配置
        console.warn('获取字段映射配置失败:', error);
      }

      setNodeStatuses(statuses);
    } catch (error) {
      console.error('加载节点配置状态失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAndAssignRole = async (featureType: string) => {
    setCreatingRole(featureType);
    try {
      let result: { success: boolean; role?: AIRoleConfig; error?: string };
      
      // 检查是否是预设角色
      if (PRESET_ROLES[featureType]) {
        // 1. 创建或获取预设角色
        result = await createPresetRole(featureType);
      } else {
        // 2. 对于自定义模块，创建通用角色
        // 从localStorage加载自定义模块信息
        const CUSTOM_MODULES_STORAGE_KEY = 'field-mapping-custom-modules';
        let customModules: Array<{ id: string; label: string }> = [];
        try {
          const stored = localStorage.getItem(CUSTOM_MODULES_STORAGE_KEY);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
              customModules = parsed.filter((m: any) => m && m.id && m.label);
            }
          }
        } catch (error) {
          console.warn('加载自定义模块失败:', error);
        }
        
        const customModule = customModules.find(m => m.id === featureType);
        const roleName = customModule?.label || featureType;
        const roleDescription = `${roleName}助手，用于处理${roleName}相关的任务。`;
        
        // 检查是否已存在同名角色
        const existingRoles = await aiRoleService.getAIRoles();
        const existingRole = existingRoles.find(r => r.name === roleName);
        
        if (existingRole) {
          result = { success: true, role: existingRole };
        } else {
          // 创建新角色（使用通用配置）
          const response = await aiRoleService.createAIRole({
            name: roleName,
            description: roleDescription,
            provider: 'direct-agent',
            agentConfig: {
              llm: {
                provider: 'openai',
                model: 'gpt-4o',
                temperature: 0.7,
                maxTokens: 2000,
                apiKey: 'sk-placeholder-please-update',
              },
              prompt: {
                systemPrompt: `你是一位专业的${roleName}助手。你的任务是根据用户输入，提供专业、准确、有用的${roleName}相关服务。请仔细分析用户需求，提供结构化的输出。`,
              },
              contextStrategy: {
                type: 'window',
                maxMessages: 20,
                maxTokens: 4000,
                includeSystemPrompt: true
              }
            },
            enabled: true,
            avatar: '🤖'
          } as any);
          
          if (response.success && response.data) {
            const newRole = {
              ...response.data,
              createdAt: new Date(response.data.createdAt),
              updatedAt: new Date(response.data.updatedAt)
            };
            result = { success: true, role: newRole };
          } else {
            result = { success: false, error: response.message || response.error || '创建失败' };
          }
        }
      }
      
      if (!result.success || !result.role) {
        alert(`创建角色失败: ${result.error}`);
        return;
      }

      // 2. 尝试自动分配给第一个字段映射配置
      try {
        const configs = await aiSearchService.getAllFieldMappingConfigs();
        if (configs.length > 0) {
          let updated = false;
          for (const configItem of configs) {
            const featureObjects = configItem.config.featureObjects || [];
            const featureIndex = featureObjects.findIndex((f: any) => f.featureType === featureType);
            
            if (featureIndex >= 0) {
              // 更新现有的 feature object
              featureObjects[featureIndex] = {
                ...featureObjects[featureIndex],
                agentId: result.role.id
              };
              
              await aiSearchService.saveFieldMappingConfig(configItem.workflowId, {
                ...configItem.config,
                featureObjects
              });
              updated = true;
            }
          }
          
          if (updated) {
            if (onRefresh) onRefresh();
            loadNodeStatuses(); // 重新加载状态
          } else {
             alert(`角色 "${result.role.name}" 已创建，但在现有字段映射配置中未找到对应功能项。请前往配置页面手动添加。`);
             if (onRefresh) onRefresh();
          }
        } else {
            alert(`角色 "${result.role.name}" 已创建。由于没有字段映射配置，无法自动分配。`);
            if (onRefresh) onRefresh();
        }
      } catch (e) {
        console.error('分配角色失败:', e);
        alert(`角色 "${result.role.name}" 已创建，但在自动分配时发生错误。请手动配置。`);
        if (onRefresh) onRefresh();
      }

    } catch (error) {
      console.error('操作失败:', error);
      alert('操作失败，请查看控制台日志');
    } finally {
      setCreatingRole(null);
    }
  };

  const handleOpenSelector = (status: NodeConfigStatus) => {
    setSelectorTarget(status);
    setShowSelector(true);
  };

  const handleSelectRole = async (role: AIRoleConfig) => {
    if (!selectorTarget) return;

    try {
      if (selectorTarget.source === 'feature-page') {
        // 功能页面AI助手配置
        if (selectorTarget.nodeType === 'ai-qa-assistant') {
          // 项目资源AI助手：更新 smart-workflow-ai-qa 配置
          if (role.provider === 'dify' && role.difyConfig) {
            const configToSave = {
              id: 'smart-workflow-ai-qa',
              name: role.name,
              description: role.description,
              apiUrl: role.difyConfig.apiUrl,
              apiKey: role.difyConfig.apiKey,
              enabled: true,
              createdAt: new Date(),
              updatedAt: new Date()
            };

            const allConfigs = await configService.getDifyConfigs();
            const index = allConfigs.findIndex(c => c.id === 'smart-workflow-ai-qa');
            
            if (index >= 0) {
              allConfigs[index] = { ...allConfigs[index], ...configToSave };
            } else {
              allConfigs.push(configToSave);
            }
            
            await configService.saveDifyConfigs(allConfigs);
            localStorage.setItem('project-resources-ai-role-id', role.id);
          } else {
            alert('项目资源AI助手仅支持Dify类型的AI角色。请选择一个配置了Dify API的角色。');
            return;
          }
        } else {
          // 其他功能页面：保存到 localStorage
          const storageKeyMap: Record<string, string> = {
            'tech-package': 'tech-package-ai-role-id',
            'tech-strategy': 'tech-strategy-ai-role-id',
            'tech-article': 'tech-article-ai-role-id',
          };
          const storageKey = storageKeyMap[selectorTarget.nodeType];
          if (storageKey) {
            localStorage.setItem(storageKey, role.id);
          }
        }
      } else if (selectorTarget.source === 'field-mapping') {
        try {
          const configs = await aiSearchService.getAllFieldMappingConfigs();
          if (configs.length > 0) {
            let updated = false;
            for (const configItem of configs) {
              const featureObjects = configItem.config.featureObjects || [];
              const featureIndex = featureObjects.findIndex((f: any) => f.featureType === selectorTarget.nodeType);
              if (featureIndex >= 0) {
                featureObjects[featureIndex] = {
                  ...featureObjects[featureIndex],
                  agentId: role.id,
                };
                await aiSearchService.saveFieldMappingConfig(configItem.workflowId, {
                  ...configItem.config,
                  featureObjects,
                });
                updated = true;
              }
            }
            if (!updated) {
              alert('未找到对应的功能对象，请先在字段映射中添加该功能对象。');
            }
          } else {
            alert('未检测到字段映射配置，请先创建字段映射配置。');
          }
        } catch (e) {
          console.error('更新字段映射失败:', e);
          alert('分配角色到字段映射失败，请稍后重试');
          return;
        }
      }
            setShowSelector(false);
      setSelectorTarget(null);
      if (onRefresh) onRefresh();
      loadNodeStatuses(); // 重新加载状态
    } catch (error) {
      console.error('配置角色失败:', error);
      alert('配置角色失败，请重试');
    }
  };

  const handleGoToFieldMapping = () => {
    navigate('/field-mapping-management');
  };

  const configuredCount = nodeStatuses.filter(s => s.configured).length;
  const totalCount = nodeStatuses.length;
  const unconfiguredNodes = nodeStatuses.filter(s => !s.configured);

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-blue-700">
          <Info className="w-5 h-5" />
          <span className="font-medium">正在加载配置状态...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-sm relative">
      {/* 标题栏 */}
      {!hideHeader && (
        <div 
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-blue-100/50 transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Info className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">AI角色配置状态</h3>
              <p className="text-sm text-gray-600">
                已配置 {configuredCount} / {totalCount} 个节点
                {unconfiguredNodes.length > 0 && (
                  <span className="text-orange-600 ml-2">
                    · {unconfiguredNodes.length} 个待配置
                  </span>
                )}
              </p>
            </div>
          </div>
          <button className="text-gray-400 hover:text-gray-600 transition-colors">
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      )}

      {/* 内容区域 */}
      {(hideHeader || expanded) && (
        <div className={`px-4 pb-4 space-y-3 ${hideHeader ? 'pt-4' : ''}`}>
          
          {/* 功能页面AI助手 */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Brain className="w-4 h-4" />
              功能页面AI助手
            </h4>
            <div className="space-y-2">
              {nodeStatuses
                .filter(s => s.source === 'feature-page')
                .map((status, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      status.configured
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`p-1.5 rounded ${
                        status.configured ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        {status.icon}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900">
                          {status.nodeName}
                        </div>
                        {status.configured && status.roleName ? (
                          <div className="text-xs text-gray-600 mt-0.5">
                            已配置: {status.roleName}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-600 mt-0.5">
                            在AI角色管理中配置
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {status.configured && (
                         <CheckCircle2 className="w-5 h-5 text-green-600" />
                      )}
                      <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenSelector(status);
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors flex items-center gap-1"
                      >
                          <Bot className="w-3 h-3" />
                          选择AI角色
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* 字段映射功能对象 - 保持原样 */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              字段映射功能对象
            </h4>
            <div className="space-y-2">
              {nodeStatuses
                .filter(s => s.source === 'field-mapping')
                .map((status, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      status.configured
                        ? 'bg-green-50 border-green-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`p-1.5 rounded ${
                        status.configured ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        {status.icon}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900">
                          {status.nodeName}
                        </div>
                        {status.configured && status.roleName ? (
                          <div className="text-xs text-gray-600 mt-0.5">
                            已配置: {status.roleName}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-600 mt-0.5">
                            在字段映射配置中设置agentId
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {status.configured && (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      )}
                      {!status.configured && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreateAndAssignRole(status.nodeType);
                          }}
                          disabled={creatingRole === status.nodeType}
                          className="px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-md transition-colors flex items-center gap-1 disabled:opacity-50"
                          title={PRESET_ROLES[status.nodeType] ? "使用预设配置创建并自动分配角色" : "创建通用角色并自动分配"}
                        >
                          {creatingRole === status.nodeType ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <PlusCircle className="w-3 h-3" />
                          )}
                          {creatingRole === status.nodeType ? '创建中...' : '一键生成'}
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenSelector(status);
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors flex items-center gap-1"
                      >
                        <Bot className="w-3 h-3" />
                        选择角色
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* 操作提示 */}
          {unconfiguredNodes.length > 0 && (
            <div className="mt-4 p-3 bg-blue-100 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-blue-900">
                    配置提示
                  </div>
                  <div className="text-xs text-blue-700 mt-1">
                    <ul className="list-disc list-inside space-y-1">
                      <li>点击“选择AI角色”按钮，为节点分配一个已创建的AI角色</li>
                      <li>如果没有合适的角色，请先在AI角色管理页面创建</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 角色选择弹窗 */}
      {showSelector && selectorTarget && (
        <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm rounded-lg flex flex-col p-4 animate-in fade-in duration-200">
           <div className="flex items-center justify-between mb-4 pb-2 border-b">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Bot className="w-5 h-5 text-blue-600" />
                为 "{selectorTarget.nodeName}" 选择AI角色
              </h3>
              <button 
                onClick={() => setShowSelector(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
           </div>
           
           <div className="flex-1 overflow-y-auto space-y-2 pr-1">
             {roles.length === 0 ? (
               <div className="text-center py-8 text-gray-500 text-sm">
                 暂无可用角色，请先创建AI角色
               </div>
             ) : (
               roles.map(role => (
                 <button
                   key={role.id}
                   onClick={() => handleSelectRole(role)}
                   className="w-full text-left p-3 rounded-lg border hover:border-blue-300 hover:bg-blue-50 transition-all group"
                 >
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs">
                          {role.avatar ? (
                            <img src={role.avatar} alt={role.name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            role.name.charAt(0)
                          )}
                       </div>
                       <div className="flex-1">
                          <div className="font-medium text-gray-900 group-hover:text-blue-700">
                            {role.name}
                          </div>
                          <div className="text-xs text-gray-500 line-clamp-1">
                            {role.description || '无描述'}
                          </div>
                       </div>
                       {role.provider && (
                         <div className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded border">
                           {role.provider === 'dify' ? 'Dify' : 'Direct'}
                         </div>
                       )}
                    </div>
                 </button>
               ))
             )}
           </div>
           
           <div className="mt-4 pt-2 border-t flex justify-end">
              <button
                onClick={() => navigate('/ai-roles')}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Settings className="w-3 h-3" />
                管理角色
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default AIRoleConfigInfoBox;
