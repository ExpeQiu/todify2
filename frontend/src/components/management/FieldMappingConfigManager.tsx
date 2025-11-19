import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Plus, Settings, Loader2, AlertCircle, CheckCircle, X, Eye, Target, Grid3x3, Megaphone, Video as VideoIcon, Languages, Presentation, FileText } from 'lucide-react';
import { aiSearchService } from '../../services/aiSearchService';
import { agentWorkflowService } from '../../services/agentWorkflowService';
import aiRoleService from '../../services/aiRoleService';
import { AgentWorkflow } from '../../types/agentWorkflow';
import { FieldMappingConfig } from '../../types/aiSearch';
import FieldMappingConfigModal from '../ai-search/FieldMappingConfigModal';

interface FieldMappingListItem {
  workflowId: string;
  config: FieldMappingConfig;
  createdAt: string;
  updatedAt: string;
  workflowName?: string;
  pageName?: string;
  featureType?: string;
  featureLabel?: string;
}

const FieldMappingConfigManager: React.FC = () => {
  const [mappings, setMappings] = useState<FieldMappingListItem[]>([]);
  const [workflows, setWorkflows] = useState<AgentWorkflow[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingMapping, setEditingMapping] = useState<FieldMappingListItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [editingMappingForAgent, setEditingMappingForAgent] = useState<FieldMappingListItem | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedFeatureType, setSelectedFeatureType] = useState<string>('');
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('');
  const [selectedPageType, setSelectedPageType] = useState<'tech-package' | 'tech-strategy' | 'tech-article' | 'press-release'>('tech-package');
  const [showCustomModuleForm, setShowCustomModuleForm] = useState(false);
  const [customFeatureId, setCustomFeatureId] = useState<string>('');
  const [customFeatureLabel, setCustomFeatureLabel] = useState<string>('');
  const [selectedFeatureTypes, setSelectedFeatureTypes] = useState<string[]>([]);

  const toggleFeatureChecked = (key: string) => {
    setSelectedFeatureTypes(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const isFeatureChecked = (key: string) => selectedFeatureTypes.includes(key);

  useEffect(() => {
    loadData();
  }, []);

  // 排除AI对话框的标签映射
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

  const FEATURE_PAGE_MAP: Record<string, string> = {
    'five-view-analysis': '技术包装',
    'three-fix-analysis': '技术包装',
    'tech-matrix': '技术包装',
    'propagation-strategy': '技术策略',
    'exhibition-video': '技术包装',
    'translation': '技术包装',
    'ppt-outline': '技术通稿',
    'script': '技术包装',
    'speech': '发布会稿',
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
      const rows: FieldMappingListItem[] = [];
      for (const mapping of mappingsData) {
        const featureObjects = Array.isArray(mapping.config.featureObjects)
          ? mapping.config.featureObjects
          : [];
        if (featureObjects.length > 0) {
          for (const feature of featureObjects) {
            // 排除AI对话框
            if (feature.featureType === 'ai-dialog') {
              continue;
            }
            const workflowId = feature.workflowId || mapping.workflowId;
            const workflow = workflowsData.find((w) => w.id === workflowId);
            rows.push({
              ...mapping,
              workflowId,
              workflowName: workflow?.name || '未知工作流',
              pageName: feature.pageType ? (PAGE_LABELS[feature.pageType as keyof typeof PAGE_LABELS] || PAGE_LABELS['tech-package']) : (FEATURE_PAGE_MAP[feature.featureType] || '技术包装'),
              featureType: feature.featureType,
              featureLabel: (feature as any).label || FEATURE_LABELS[feature.featureType] || feature.featureType,
              config: {
                ...mapping.config,
                inputMappings: feature.inputMappings || [],
                outputMappings: feature.outputMappings || [],
              },
            });
          }
        }
      }
      setMappings(rows);
      setWorkflows(workflowsData);
      setRoles(rolesData);
    } catch (error) {
      console.error('加载数据失败:', error);
      setMessage({ type: 'error', text: '加载数据失败，请稍后重试' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (mapping: FieldMappingListItem) => {
    setEditingMapping(mapping);
    setShowEditModal(true);
  };

  const handleDelete = async (workflowId: string) => {
    if (!confirm('确定要删除此字段映射配置吗？')) {
      return;
    }

    try {
      setDeletingId(workflowId);
      await aiSearchService.deleteFieldMappingConfig(workflowId);
      setMessage({ type: 'success', text: '删除成功' });
      await loadData();
    } catch (error) {
      console.error('删除失败:', error);
      setMessage({ type: 'error', text: '删除失败，请稍后重试' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSave = async () => {
    setMessage({ type: 'success', text: '保存成功' });
    setShowEditModal(false);
    setEditingMapping(null);
    await loadData();
  };

  const openAgentModal = (mapping: FieldMappingListItem) => {
    setEditingMappingForAgent(mapping);
    // 从配置中获取当前关联的agentId
    const featureObjects = Array.isArray(mapping.config.featureObjects) ? mapping.config.featureObjects : [];
    const currentFeature = featureObjects.find(f => f.featureType === mapping.featureType);
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

      const featureObjects = Array.isArray(existing.featureObjects) ? existing.featureObjects.slice() : [];
      const featureIndex = featureObjects.findIndex(f => f.featureType === editingMappingForAgent.featureType);
      
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
          pageType: (editingMappingForAgent.pageName === '技术包装' ? 'tech-package' :
                    editingMappingForAgent.pageName === '技术策略' ? 'tech-strategy' :
                    editingMappingForAgent.pageName === '技术通稿' ? 'tech-article' :
                    editingMappingForAgent.pageName === '发布稿' || editingMappingForAgent.pageName === '发布会稿' ? 'press-release' : undefined) as 'tech-package' | 'tech-strategy' | 'tech-article' | 'press-release' | undefined,
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
    <div className="field-mapping-config-manager">
      {/* 标题和操作栏 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">字段映射管理</h2>
          <p className="text-sm text-gray-500 mt-1">按独立页面与Agent维度管理工作流映射</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新增配置
        </button>
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
          <p className="text-sm text-gray-400 mt-2">点击"新增配置"创建字段映射配置</p>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">更新时间</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mappings.map((mapping) => (
                  <tr key={`${mapping.workflowId}-${mapping.featureType}`} className="hover:bg-gray-50">
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
                          onClick={() => handleEdit(mapping)}
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                        >
                          <Edit2 className="w-4 h-4" />
                          编辑
                        </button>
                        <button
                          onClick={() => openAgentModal(mapping)}
                          className="text-gray-700 hover:text-gray-900 flex items-center gap-1"
                        >
                          <Settings className="w-4 h-4" />
                          配置Agent角色
                        </button>
                        <button
                          onClick={() => handleDelete(mapping.workflowId)}
                          disabled={deletingId === mapping.workflowId}
                          className="text-red-600 hover:text-red-900 flex items-center gap-1 disabled:opacity-50"
                        >
                          {deletingId === mapping.workflowId ? (
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

      {/* 编辑弹窗 */}
      {showEditModal && editingMapping && (
        <FieldMappingConfigModal
          workflowId={editingMapping.workflowId}
          featureType={editingMapping.featureType as any}
          mappingsOnly={true}
          onClose={() => {
            setShowEditModal(false);
            setEditingMapping(null);
          }}
          onSave={handleSave}
        />
      )}

      {/* 创建配置弹窗 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-lg border border-gray-200 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-lg font-semibold text-gray-900">新增配置</h3>
              <button 
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedWorkflowId('');
                  setSelectedPageType('tech-package');
                  setSelectedFeatureType('');
                  setSelectedFeatureTypes([]);
                  setCustomFeatureId('');
                  setCustomFeatureLabel('');
                  setShowCustomModuleForm(false);
                  setMessage(null);
                }} 
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm text-gray-600 mb-2">选择工作流</label>
                <select
                  value={selectedWorkflowId}
                  onChange={(e) => setSelectedWorkflowId(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                >
                  <option value="">请选择工作流</option>
                  {workflows.map((workflow) => (
                    <option key={workflow.id} value={workflow.id}>
                      {workflow.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-2">技术独立页</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { key: 'tech-package', label: '技术包装' },
                    { key: 'tech-strategy', label: '技术策略' },
                    { key: 'tech-article', label: '技术通稿' },
                    { key: 'press-release', label: '发布稿' },
                  ].map(item => (
                    <button
                      key={item.key}
                      onClick={() => setSelectedPageType(item.key as any)}
                      className={`px-3 py-2 border rounded-md text-sm transition-colors ${
                        selectedPageType === item.key 
                          ? 'bg-blue-50 border-blue-500 text-blue-700' 
                          : 'bg-white border-gray-300 hover:bg-gray-50 hover:border-blue-500'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-2">选择AI模块</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {/* 排除AI对话框，只显示其他AI模块 */}
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
                        setSelectedFeatureType(item.key); 
                        setShowCustomModuleForm(false); 
                      }}
                      className={`relative flex flex-col items-center justify-center p-4 border rounded-lg transition-all ${
                        selectedFeatureType === item.key 
                          ? 'bg-blue-50 border-blue-500' 
                          : 'bg-white border-gray-300 hover:bg-gray-50 hover:border-blue-500'
                      }`}
                      title={item.label}
                    >
                      {item.icon}
                      <span className="text-xs text-gray-700 text-center">{item.label}</span>
                      <div
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          toggleFeatureChecked(item.key); 
                        }}
                        className={`absolute left-3 bottom-3 w-4 h-4 rounded-full border cursor-pointer ${
                          isFeatureChecked(item.key) 
                            ? 'border-blue-500 bg-blue-500' 
                            : 'border-gray-300 bg-white'
                        }`}
                        aria-label={isFeatureChecked(item.key) ? '取消选择' : '选择模块'}
                      />
                    </button>
                  ))}
                  {/* 新增AI模块按钮 */}
                  <button
                    onClick={() => { 
                      setShowCustomModuleForm(true); 
                      setSelectedFeatureType(customFeatureId || ''); 
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
                    {customFeatureId && (
                      <div
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          toggleFeatureChecked(customFeatureId); 
                          setSelectedFeatureType(customFeatureId); 
                        }}
                        className={`absolute left-3 bottom-3 w-4 h-4 rounded-full border cursor-pointer ${
                          isFeatureChecked(customFeatureId) 
                            ? 'border-blue-500 bg-blue-500' 
                            : 'border-gray-300 bg-white'
                        }`}
                        aria-label={isFeatureChecked(customFeatureId) ? '取消选择' : '选择模块'}
                      />
                    )}
                  </button>
                </div>
                {showCustomModuleForm && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
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
                          setSelectedFeatureType(customFeatureId.trim());
                          setSelectedFeatureTypes(prev => prev.includes(customFeatureId.trim()) ? prev : [...prev, customFeatureId.trim()]);
                          setMessage(null);
                        }}
                        className="px-3 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700"
                      >
                        使用此模块
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-2 sticky bottom-0 bg-white">
              <button 
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedWorkflowId('');
                  setSelectedPageType('tech-package');
                  setSelectedFeatureType('');
                  setSelectedFeatureTypes([]);
                  setCustomFeatureId('');
                  setCustomFeatureLabel('');
                  setShowCustomModuleForm(false);
                  setMessage(null);
                }} 
                className="px-3 py-2 rounded-md border text-sm hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={async () => {
                  if (!selectedWorkflowId) {
                    setMessage({ type: 'error', text: '请选择工作流' });
                    return;
                  }
                  const featuresToBind = selectedFeatureTypes.length > 0 ? selectedFeatureTypes : (selectedFeatureType ? [selectedFeatureType] : []);
                  if (featuresToBind.length === 0) {
                    setMessage({ type: 'error', text: '请选择至少一个AI模块（点击圆圈勾选）' });
                    return;
                  }
                  const workflowIdToUse = selectedWorkflowId;
                  if (!workflowIdToUse) {
                    setMessage({ type: 'error', text: '没有可用的工作流，请先创建工作流' });
                    return;
                  }
                  try {
                    const existing = await aiSearchService.getFieldMappingConfig(workflowIdToUse);
                    // 统一使用 press-release
                    const normalizedPageType = selectedPageType;
                    let nextConfig: FieldMappingConfig;
                    if (existing) {
                      const fo = Array.isArray(existing.featureObjects) ? existing.featureObjects.slice() : [];
                      for (const ft of featuresToBind) {
                        // 确保不添加AI对话框
                        if (ft === 'ai-dialog') {
                          continue;
                        }
                        const exists = fo.some(f => f.featureType === ft);
                        if (!exists) {
                          const selectedLabel = FEATURE_LABELS[ft] || (ft === customFeatureId ? (customFeatureLabel || undefined) : undefined);
                          fo.push({ 
                            featureType: ft as any, 
                            workflowId: workflowIdToUse, 
                            inputMappings: [], 
                            outputMappings: [], 
                            pageType: normalizedPageType, 
                            label: selectedLabel 
                          });
                        }
                      }
                      nextConfig = { ...existing, featureObjects: fo };
                    } else {
                      const featureObjects = featuresToBind
                        .filter(ft => ft !== 'ai-dialog') // 确保不包含AI对话框
                        .map(ft => ({
                          featureType: ft as any,
                          workflowId: workflowIdToUse,
                          inputMappings: [],
                          outputMappings: [],
                          pageType: normalizedPageType,
                          label: FEATURE_LABELS[ft] || (ft === customFeatureId ? (customFeatureLabel || undefined) : undefined),
                        }));
                      nextConfig = {
                        workflowId: workflowIdToUse,
                        inputMappings: [],
                        outputMappings: [],
                        featureObjects,
                      } as any;
                    }
                    await aiSearchService.saveFieldMappingConfig(workflowIdToUse, nextConfig);
                    setShowCreateModal(false);
                    setSelectedFeatureTypes([]);
                    setSelectedFeatureType('');
                    setCustomFeatureId('');
                    setCustomFeatureLabel('');
                    setShowCustomModuleForm(false);
                    await loadData();
                    setMessage({ type: 'success', text: '配置创建成功' });
                  } catch (error) {
                    console.error('创建配置失败:', error);
                    setMessage({ type: 'error', text: '创建配置失败，请稍后重试' });
                  }
                }}
                className="px-3 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700"
              >
                创建并配置
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

export default FieldMappingConfigManager;

