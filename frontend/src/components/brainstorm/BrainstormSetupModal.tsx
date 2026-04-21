import React, { useState, useEffect } from 'react';
import { X, Loader2, ChevronDown, ChevronUp, Settings } from 'lucide-react';
import { ExpertSelector } from './ExpertSelector';
import { CreateBrainstormSessionDTO, BrainstormSessionConfig } from '@/types/brainstorm';
import aiRoleService from '@/services/aiRoleService';
import { AIRoleConfig } from '@/types/aiRole';
import sourceService, { SourceInformation } from '@/services/sourceService';

interface BrainstormSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateBrainstormSessionDTO) => Promise<void>;
  initialData?: Partial<CreateBrainstormSessionDTO>;
  projectId?: number;
}

export const BrainstormSetupModal: React.FC<BrainstormSetupModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  projectId,
}) => {
  const [topic, setTopic] = useState(initialData?.topic || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>(
    initialData?.participantRoleIds || []
  );
  const [maxRounds, setMaxRounds] = useState<number | ''>(
    initialData?.config?.stopConditions?.maxRounds ?? 5
  );
  const [consensusDetection, setConsensusDetection] = useState(
    initialData?.config?.stopConditions?.consensusDetection ?? false
  );
  const [discussionMode, setDiscussionMode] = useState<'parallel' | 'round-robin' | 'debate'>(
    initialData?.config?.discussionMode ?? 'parallel'
  );
  const [moderatorEnabled, setModeratorEnabled] = useState(
    initialData?.config?.moderatorConfig?.enabled ?? false
  );
  const [moderatorRoleId, setModeratorRoleId] = useState(
    initialData?.config?.moderatorConfig?.moderatorRoleId ?? ''
  );
  const [loading, setLoading] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<AIRoleConfig[]>([]);
  const [loadingSourcesInfo, setLoadingSourcesInfo] = useState(false);
  const [projectSources, setProjectSources] = useState<SourceInformation[]>([]);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  
  // 高级配置状态
  const [showAdvancedConfig, setShowAdvancedConfig] = useState(false);
  
  // 结构化上下文配置
  const [structuredContextEnabled, setStructuredContextEnabled] = useState(
    initialData?.config?.structuredContext?.enabled ?? true
  );
  const [summaryFrequency, setSummaryFrequency] = useState(
    initialData?.config?.structuredContext?.summaryFrequency ?? 3
  );
  const [extractKeyPoints, setExtractKeyPoints] = useState(
    initialData?.config?.structuredContext?.extractKeyPoints ?? true
  );
  const [detectDisagreements, setDetectDisagreements] = useState(
    initialData?.config?.structuredContext?.detectDisagreements ?? true
  );
  
  // 评审-反思循环配置
  const [reflectionLoopEnabled, setReflectionLoopEnabled] = useState(
    initialData?.config?.reflectionLoop?.enabled ?? false
  );
  const [maxIterations, setMaxIterations] = useState(
    initialData?.config?.reflectionLoop?.maxIterations ?? 3
  );
  const [qualityThreshold, setQualityThreshold] = useState(
    initialData?.config?.reflectionLoop?.qualityThreshold ?? 0.7
  );
  const [reflectionFrequency, setReflectionFrequency] = useState(
    initialData?.config?.reflectionLoop?.reflectionFrequency ?? 3
  );
  
  // 共识检测详细配置
  const [consensusMethod, setConsensusMethod] = useState<'semantic' | 'voting' | 'hybrid'>(
    initialData?.config?.stopConditions?.consensusConfig?.method ?? 'hybrid'
  );
  const [consensusThreshold, setConsensusThreshold] = useState(
    initialData?.config?.stopConditions?.consensusConfig?.threshold ?? 0.7
  );
  const [minAgreementRatio, setMinAgreementRatio] = useState(
    initialData?.config?.stopConditions?.consensusConfig?.minAgreementRatio ?? 0.7
  );
  
  // 辩论模式配置
  const [debateEnabled, setDebateEnabled] = useState(
    initialData?.config?.debateConfig?.enabled ?? false
  );
  const [proRoleIds, setProRoleIds] = useState<string[]>(
    initialData?.config?.debateConfig?.proRoleIds ?? []
  );
  const [conRoleIds, setConRoleIds] = useState<string[]>(
    initialData?.config?.debateConfig?.conRoleIds ?? []
  );
  const [judgeRoleId, setJudgeRoleId] = useState(
    initialData?.config?.debateConfig?.judgeRoleId ?? ''
  );

  useEffect(() => {
    if (isOpen) {
      loadRoles();
      loadProjectSources();
    }
  }, [isOpen, projectId]);

  const loadRoles = async () => {
    try {
      const roles = await aiRoleService.getAIRoles();
      setAvailableRoles(roles.filter(role => role.enabled));
    } catch (error) {
      console.error('加载AI角色失败:', error);
    }
  };


  const loadProjectSources = async () => {
    if (!projectId) {
      setProjectSources([]);
      return;
    }
    try {
      setLoadingSourcesInfo(true);
      const response = await sourceService.loadSourceInformationByProjectId(projectId);
      if (response.success && response.data) {
        setProjectSources(response.data);
        if (projectId) {
          try {
            const raw = localStorage.getItem(`project-${projectId}-selected-source-ids`);
            if (raw) {
              const storedIds = JSON.parse(raw) as string[];
              const validIds = storedIds.filter((id) => response.data!.some((source) => source.source_id === id));
              setSelectedSourceIds(validIds);
            } else {
              setSelectedSourceIds([]);
            }
          } catch (error) {
            console.warn('读取项目管理页来源勾选缓存失败:', error);
            setSelectedSourceIds([]);
          }
        }
      } else {
        setProjectSources([]);
        setSelectedSourceIds([]);
      }
    } catch (error) {
      console.error('加载来源信息失败:', error);
      setProjectSources([]);
      setSelectedSourceIds([]);
    } finally {
      setLoadingSourcesInfo(false);
    }
  };

  const toggleSourceSelection = (sourceId: string) => {
    setSelectedSourceIds((prev) => {
      if (prev.includes(sourceId)) {
        return prev.filter((id) => id !== sourceId);
      }
      return [...prev, sourceId];
    });
  };


  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!topic.trim()) {
      alert('请输入讨论话题');
      return;
    }

    // 验证：辩论模式需要正反方都有Agent
    if (discussionMode === 'debate' && debateEnabled) {
      if (proRoleIds.length === 0 || conRoleIds.length === 0) {
        alert('辩论模式需要至少选择一个正方Agent和一个反方Agent');
        return;
      }
    } else if (selectedRoleIds.length === 0) {
      alert('请至少选择一个专家角色');
      return;
    }

    const config: Partial<BrainstormSessionConfig> = {
      stopConditions: {
        manualStop: true,
        maxRounds: maxRounds === '' ? null : Number(maxRounds),
        consensusDetection,
        consensusConfig: consensusDetection ? {
          enabled: true,
          method: consensusMethod,
          threshold: consensusThreshold,
          minAgreementRatio,
          recentRounds: 3,
        } : undefined,
      },
      discussionMode,
      moderatorConfig: moderatorEnabled && moderatorRoleId ? {
        enabled: true,
        moderatorRoleId,
      } : undefined,
      summaryConfig: {
        enabled: true,
        provider: 'same-as-agents',
      },
      structuredContext: structuredContextEnabled ? {
        enabled: true,
        summaryFrequency,
        extractKeyPoints,
        detectDisagreements,
        maxContextTokens: 8000,
      } : undefined,
      reflectionLoop: reflectionLoopEnabled ? {
        enabled: true,
        maxIterations,
        qualityThreshold,
        reflectionFrequency,
      } : undefined,
      debateConfig: discussionMode === 'debate' && debateEnabled ? {
        enabled: true,
        proRoleIds,
        conRoleIds,
        judgeRoleId: judgeRoleId || undefined,
        rounds: 5,
        judgeAfterRounds: 1,
      } : undefined,
    };

    // 辩论模式下，participantRoleIds应该包含所有选中的Agent（正反方+裁判）
    let finalParticipantRoleIds = selectedRoleIds;
    if (discussionMode === 'debate' && debateEnabled) {
      finalParticipantRoleIds = [...new Set([...proRoleIds, ...conRoleIds, ...(judgeRoleId ? [judgeRoleId] : [])])];
    }

    const data: CreateBrainstormSessionDTO = {
      title: topic.trim().slice(0, 40),
      topic: topic.trim(),
      description: description.trim() || undefined,
      projectId: projectId,
      config,
      participantRoleIds: finalParticipantRoleIds,
    };

    try {
      setLoading(true);
      await onSubmit(data);
      handleClose();
    } catch (error) {
      console.error('创建会话失败:', error);
      alert(error instanceof Error ? error.message : '创建会话失败');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTopic('');
    setDescription('');
    setProjectSources([]);
    setSelectedSourceIds([]);
    setSelectedRoleIds([]);
    setMaxRounds(5);
    setConsensusDetection(false);
    setDiscussionMode('parallel');
    setModeratorEnabled(false);
    setModeratorRoleId('');
    setShowAdvancedConfig(false);
    setStructuredContextEnabled(true);
    setSummaryFrequency(3);
    setExtractKeyPoints(true);
    setDetectDisagreements(true);
    setReflectionLoopEnabled(false);
    setMaxIterations(3);
    setQualityThreshold(0.7);
    setReflectionFrequency(3);
    setConsensusMethod('hybrid');
    setConsensusThreshold(0.7);
    setMinAgreementRatio(0.7);
    setDebateEnabled(false);
    setProRoleIds([]);
    setConRoleIds([]);
    setJudgeRoleId('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">创建头脑风暴会话</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容 */}
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-hidden p-6 flex">
          <div className="flex-1 min-h-0 flex gap-6">
            <aside className="w-72 h-full min-h-0 flex-shrink-0 border border-gray-200 rounded-lg bg-gray-50 flex flex-col">
              <div className="px-4 py-3 border-b border-gray-200 bg-white rounded-t-lg">
                <h3 className="text-sm font-semibold text-gray-900">来源信息</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {projectId ? `当前项目来源 ${projectSources.length} 条，已勾选 ${selectedSourceIds.length} 条` : '当前为非项目场景'}
                </p>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
                {loadingSourcesInfo ? (
                  <div className="text-sm text-gray-500 flex items-center justify-center py-8">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    加载来源中...
                  </div>
                ) : !projectId ? (
                  <div className="text-xs text-gray-500 text-center py-8">
                    无项目上下文，暂无来源信息
                  </div>
                ) : projectSources.length === 0 ? (
                  <div className="text-xs text-gray-500 text-center py-8">
                    暂无来源信息
                  </div>
                ) : (
                  <>
                    {projectSources.slice(0, 30).map((source) => (
                      <div
                        key={source.source_id}
                        className={`p-2.5 rounded border bg-white ${
                          selectedSourceIds.includes(source.source_id)
                            ? 'border-blue-400 bg-blue-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            checked={selectedSourceIds.includes(source.source_id)}
                            onChange={() => toggleSourceSelection(source.source_id)}
                            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-gray-900 line-clamp-2">
                              {source.title || '未命名来源'}
                            </p>
                            <div className="mt-1 flex items-center gap-2">
                              <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] bg-blue-50 text-blue-700">
                                {source.type === 'knowledge_base' ? '知识库' : '外部'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {projectSources.length > 30 && (
                      <div className="text-center text-xs text-gray-500 py-1">
                        仅展示前 30 条
                      </div>
                    )}
                  </>
                )}
              </div>
            </aside>

            <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-6">
          {/* 讨论话题 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              讨论话题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="例如：如何提升用户体验"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* 话题描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              话题描述（可选）
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="详细描述讨论的背景、目标等信息..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 选择专家 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择参与专家 <span className="text-red-500">*</span>
            </label>
            <ExpertSelector
              selectedRoleIds={selectedRoleIds}
              onChange={setSelectedRoleIds}
            />
          </div>

          {/* 讨论模式配置 */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-4">讨论模式</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="mode-parallel"
                  name="discussionMode"
                  value="parallel"
                  checked={discussionMode === 'parallel'}
                  onChange={(e) => setDiscussionMode(e.target.value as 'parallel' | 'round-robin')}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="mode-parallel" className="text-sm text-gray-700">
                  <div className="font-medium">并行模式</div>
                  <div className="text-xs text-gray-500">所有专家同时发言，讨论更高效</div>
                </label>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="mode-round-robin"
                  name="discussionMode"
                  value="round-robin"
                  checked={discussionMode === 'round-robin'}
                  onChange={(e) => {
                    setDiscussionMode(e.target.value as 'parallel' | 'round-robin' | 'debate');
                    if (e.target.value !== 'debate') {
                      setDebateEnabled(false);
                    }
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="mode-round-robin" className="text-sm text-gray-700">
                  <div className="font-medium">轮流发言模式</div>
                  <div className="text-xs text-gray-500">专家按顺序依次发言，讨论更有条理</div>
                </label>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="mode-debate"
                  name="discussionMode"
                  value="debate"
                  checked={discussionMode === 'debate'}
                  onChange={(e) => {
                    setDiscussionMode(e.target.value as 'parallel' | 'round-robin' | 'debate');
                    if (e.target.value === 'debate') {
                      setDebateEnabled(true);
                    }
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="mode-debate" className="text-sm text-gray-700">
                  <div className="font-medium">辩论模式</div>
                  <div className="text-xs text-gray-500">正反方交替发言，裁判评判，深度辩论</div>
                </label>
              </div>
            </div>
            
            {/* 辩论模式配置 */}
            {discussionMode === 'debate' && (
              <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-4">
                  <input
                    type="checkbox"
                    id="debateEnabled"
                    checked={debateEnabled}
                    onChange={(e) => setDebateEnabled(e.target.checked)}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="debateEnabled" className="text-sm font-medium text-gray-900">
                    启用辩论模式
                  </label>
                </div>
                {debateEnabled && (
                  <div className="space-y-4 ml-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        正方Agent（支持多选）
                      </label>
                      <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2 space-y-1">
                        {availableRoles.map((role) => {
                          const isInCon = conRoleIds.includes(role.id);
                          return (
                            <label key={role.id} className={`flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded ${isInCon ? 'opacity-50' : ''}`}>
                              <input
                                type="checkbox"
                                checked={proRoleIds.includes(role.id)}
                                disabled={isInCon}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setProRoleIds([...proRoleIds, role.id]);
                                  } else {
                                    setProRoleIds(proRoleIds.filter(id => id !== role.id));
                                  }
                                }}
                                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 disabled:opacity-50"
                              />
                              <span className="text-sm text-gray-700">
                                {role.name}
                                {isInCon && <span className="text-xs text-gray-400 ml-1">(已在反方)</span>}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        反方Agent（支持多选）
                      </label>
                      <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2 space-y-1">
                        {availableRoles.map((role) => {
                          const isInPro = proRoleIds.includes(role.id);
                          return (
                            <label key={role.id} className={`flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded ${isInPro ? 'opacity-50' : ''}`}>
                              <input
                                type="checkbox"
                                checked={conRoleIds.includes(role.id)}
                                disabled={isInPro}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setConRoleIds([...conRoleIds, role.id]);
                                  } else {
                                    setConRoleIds(conRoleIds.filter(id => id !== role.id));
                                  }
                                }}
                                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 disabled:opacity-50"
                              />
                              <span className="text-sm text-gray-700">
                                {role.name}
                                {isInPro && <span className="text-xs text-gray-400 ml-1">(已在正方)</span>}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        裁判Agent（可选）
                      </label>
                      <select
                        value={judgeRoleId}
                        onChange={(e) => setJudgeRoleId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">不设置裁判</option>
                        {availableRoles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-xs text-gray-500">
                        裁判将在每轮辩论后进行评判，给出评分和改进建议
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 主持人配置 */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center space-x-2 mb-4">
              <input
                type="checkbox"
                id="moderatorEnabled"
                checked={moderatorEnabled}
                onChange={(e) => {
                  setModeratorEnabled(e.target.checked);
                  if (!e.target.checked) {
                    setModeratorRoleId('');
                  }
                }}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="moderatorEnabled" className="text-sm font-medium text-gray-900">
                启用主持人模式
              </label>
            </div>
            {moderatorEnabled && (
              <div className="ml-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择主持人角色
                </label>
                <select
                  value={moderatorRoleId}
                  onChange={(e) => setModeratorRoleId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">请选择主持人角色</option>
                  {availableRoles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  主持人将在每轮讨论开始时发言，协调讨论流程
                </p>
              </div>
            )}
          </div>

          {/* 终止条件配置 */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-4">终止条件配置</h3>
            
            <div className="space-y-4">
              {/* 最大轮次 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  最大轮次（留空表示无限制）
                </label>
                <input
                  type="number"
                  value={maxRounds}
                  onChange={(e) => setMaxRounds(e.target.value === '' ? '' : Number(e.target.value))}
                  min="1"
                  placeholder="例如：5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  每个专家每轮发言一次，达到指定轮次后自动结束讨论
                </p>
              </div>

              {/* 共识检测 */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="consensusDetection"
                    checked={consensusDetection}
                    onChange={(e) => setConsensusDetection(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="consensusDetection" className="text-sm text-gray-700">
                    启用共识检测（检测到共识后自动结束）
                  </label>
                </div>
                {consensusDetection && (
                  <div className="ml-6 space-y-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        检测方法
                      </label>
                      <select
                        value={consensusMethod}
                        onChange={(e) => setConsensusMethod(e.target.value as 'semantic' | 'voting' | 'hybrid')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="semantic">语义分析</option>
                        <option value="voting">投票机制</option>
                        <option value="hybrid">混合模式（推荐）</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        共识阈值: {consensusThreshold.toFixed(1)}
                      </label>
                      <input
                        type="range"
                        min="0.5"
                        max="1"
                        step="0.1"
                        value={consensusThreshold}
                        onChange={(e) => setConsensusThreshold(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        最小同意比例: {minAgreementRatio.toFixed(1)}
                      </label>
                      <input
                        type="range"
                        min="0.5"
                        max="1"
                        step="0.1"
                        value={minAgreementRatio}
                        onChange={(e) => setMinAgreementRatio(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* 高级配置 */}
          <div className="border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={() => setShowAdvancedConfig(!showAdvancedConfig)}
              className="flex items-center space-x-2 text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>高级配置</span>
              {showAdvancedConfig ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {showAdvancedConfig && (
              <div className="mt-4 space-y-6">
                {/* 结构化上下文配置 */}
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-4">
                    <input
                      type="checkbox"
                      id="structuredContextEnabled"
                      checked={structuredContextEnabled}
                      onChange={(e) => setStructuredContextEnabled(e.target.checked)}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <label htmlFor="structuredContextEnabled" className="text-sm font-medium text-gray-900">
                      启用结构化上下文（推荐，可减少Token消耗50-70%）
                    </label>
                  </div>
                  {structuredContextEnabled && (
                    <div className="ml-6 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          摘要频率：每 {summaryFrequency} 轮生成一次
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={summaryFrequency}
                          onChange={(e) => setSummaryFrequency(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="extractKeyPoints"
                          checked={extractKeyPoints}
                          onChange={(e) => setExtractKeyPoints(e.target.checked)}
                          className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                        <label htmlFor="extractKeyPoints" className="text-sm text-gray-700">
                          提取关键观点
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="detectDisagreements"
                          checked={detectDisagreements}
                          onChange={(e) => setDetectDisagreements(e.target.checked)}
                          className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                        <label htmlFor="detectDisagreements" className="text-sm text-gray-700">
                          检测分歧点
                        </label>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* 评审-反思循环配置 */}
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-4">
                    <input
                      type="checkbox"
                      id="reflectionLoopEnabled"
                      checked={reflectionLoopEnabled}
                      onChange={(e) => setReflectionLoopEnabled(e.target.checked)}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <label htmlFor="reflectionLoopEnabled" className="text-sm font-medium text-gray-900">
                      启用评审-反思循环（可提升质量20-30%）
                    </label>
                  </div>
                  {reflectionLoopEnabled && (
                    <div className="ml-6 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          最大迭代次数
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={maxIterations}
                          onChange={(e) => setMaxIterations(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          质量阈值: {qualityThreshold.toFixed(1)}
                        </label>
                        <input
                          type="range"
                          min="0.5"
                          max="1"
                          step="0.05"
                          value={qualityThreshold}
                          onChange={(e) => setQualityThreshold(Number(e.target.value))}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          反思频率：每 {reflectionFrequency} 轮进行一次
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={reflectionFrequency}
                          onChange={(e) => setReflectionFrequency(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
            </div>
          </div>
        </form>

        {/* 底部按钮 */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '创建中...' : '创建会话'}
          </button>
        </div>
      </div>
    </div>
  );
};

