import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Loader2 } from 'lucide-react';
import { ExpertSelector } from './ExpertSelector';
import { CreateBrainstormSessionDTO, BrainstormSessionConfig } from '@/types/brainstorm';
import aiRoleService from '@/services/aiRoleService';
import { AIRoleConfig } from '@/types/aiRole';
import { aiSearchService } from '@/services/aiSearchService';
import { Conversation } from '@/types/aiSearch';
import sourceService from '@/services/sourceService';
import { Source } from '@/components/ai-search/SourceSidebar';

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
  const [title, setTitle] = useState(initialData?.title || '');
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
  const [discussionMode, setDiscussionMode] = useState<'parallel' | 'round-robin'>(
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
  const [descriptionSource, setDescriptionSource] = useState<'manual' | 'ai-creation' | 'conversation'>('manual');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [aiSources, setAiSources] = useState<Source[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingAiSources, setLoadingAiSources] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string>('');
  const [selectedSourceId, setSelectedSourceId] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadRoles();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    
    if (descriptionSource === 'conversation') {
      loadConversations();
      setSelectedSourceId('');
    } else if (descriptionSource === 'ai-creation') {
      loadAiSources();
      setSelectedConversationId('');
    } else {
      setSelectedConversationId('');
      setSelectedSourceId('');
      setDescription('');
    }
  }, [descriptionSource, isOpen, projectId]);

  const loadRoles = async () => {
    try {
      const roles = await aiRoleService.getAIRoles();
      setAvailableRoles(roles.filter(role => role.enabled));
    } catch (error) {
      console.error('加载AI角色失败:', error);
    }
  };

  const loadConversations = async () => {
    try {
      setLoadingConversations(true);
      // 获取所有页面的对话记录
      const allConversations = await aiSearchService.getConversationsAcrossPages([
        'tech-package',
        'tech-strategy',
        'tech-article',
        'press-release'
      ]);
      
      // 如果有项目ID，过滤项目相关的对话
      let filteredConversations = allConversations;
      if (projectId) {
        // 这里可以根据实际需求过滤，目前先显示所有对话
        filteredConversations = allConversations;
      }
      
      setConversations(filteredConversations);
    } catch (error) {
      console.error('加载对话记录失败:', error);
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadAiSources = async () => {
    try {
      setLoadingAiSources(true);
      let result;
      
      if (projectId) {
        result = await sourceService.loadSourceInformationByProjectId(projectId);
      } else {
        result = await sourceService.loadSourceInformationByPageType('tech-strategy');
      }
      
      if (result.success && result.data) {
        // 只显示AI共创的信息（排除外部添加的）
        const aiCreatedSources = result.data.filter(source => 
          source.category && 
          source.category !== 'external' &&
          (source.category.includes('qa') || source.category.includes('translation'))
        );
        setAiSources(aiCreatedSources);
      }
    } catch (error) {
      console.error('加载AI共创信息失败:', error);
    } finally {
      setLoadingAiSources(false);
    }
  };

  const handleConversationSelect = async (conversationId: string) => {
    setSelectedConversationId(conversationId);
    if (conversationId) {
      try {
        const conversation = await aiSearchService.getConversation(conversationId);
        if (conversation && conversation.messages && conversation.messages.length > 0) {
          // 提取对话的主要内容作为描述
          const messages = conversation.messages;
          const firstUserMessage = messages.find(m => m.role === 'user');
          const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');
          
          let desc = '';
          if (firstUserMessage) {
            desc += `问题：${firstUserMessage.content}\n\n`;
          }
          if (lastAssistantMessage) {
            desc += `回答：${lastAssistantMessage.content.substring(0, 500)}${lastAssistantMessage.content.length > 500 ? '...' : ''}`;
          }
          
          setDescription(desc.trim());
        }
      } catch (error) {
        console.error('获取对话详情失败:', error);
      }
    } else {
      setDescription('');
    }
  };

  const handleSourceSelect = (sourceId: string) => {
    setSelectedSourceId(sourceId);
    if (sourceId) {
      const source = aiSources.find(s => s.id === sourceId);
      if (source) {
        // 使用来源的标题和描述作为话题描述
        let desc = source.title;
        if (source.description) {
          desc += `\n\n${source.description}`;
        }
        setDescription(desc);
      }
    } else {
      setDescription('');
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('请输入会话标题');
      return;
    }

    if (!topic.trim()) {
      alert('请输入讨论话题');
      return;
    }

    if (selectedRoleIds.length === 0) {
      alert('请至少选择一个专家角色');
      return;
    }

    const config: Partial<BrainstormSessionConfig> = {
      stopConditions: {
        manualStop: true,
        maxRounds: maxRounds === '' ? null : Number(maxRounds),
        consensusDetection,
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
    };

    const data: CreateBrainstormSessionDTO = {
      title: title.trim(),
      topic: topic.trim(),
      description: description.trim() || undefined,
      config,
      participantRoleIds: selectedRoleIds,
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
    setTitle('');
    setTopic('');
    setDescription('');
    setDescriptionSource('manual');
    setSelectedConversationId('');
    setSelectedSourceId('');
    setConversations([]);
    setAiSources([]);
    setSelectedRoleIds([]);
    setMaxRounds(5);
    setConsensusDetection(false);
    setDiscussionMode('parallel');
    setModeratorEnabled(false);
    setModeratorRoleId('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 会话标题 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              会话标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：产品功能设计讨论"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

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
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                话题描述（可选）
              </label>
              <select
                value={descriptionSource}
                onChange={(e) => setDescriptionSource(e.target.value as 'manual' | 'ai-creation' | 'conversation')}
                className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="manual">手动输入</option>
                <option value="ai-creation">AI共创信息</option>
                <option value="conversation">对话记录</option>
              </select>
            </div>
            
            {descriptionSource === 'manual' ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="详细描述讨论的背景、目标等信息..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : descriptionSource === 'conversation' ? (
              <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
                {loadingConversations ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                    加载对话记录中...
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    暂无对话记录
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {conversations.map((conv) => (
                      <div
                        key={conv.id}
                        onClick={() => handleConversationSelect(conv.id)}
                        className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedConversationId === conv.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {conv.title || '未命名对话'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {conv.messages?.length || 0} 条消息 · {new Date(conv.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                          {selectedConversationId === conv.id && (
                            <div className="ml-2 flex-shrink-0">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
                {loadingAiSources ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                    加载AI共创信息中...
                  </div>
                ) : aiSources.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    暂无AI共创信息
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {aiSources.map((source) => (
                      <div
                        key={source.id}
                        onClick={() => handleSourceSelect(source.id)}
                        className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedSourceId === source.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {source.title}
                            </p>
                            {source.description && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {source.description}
                              </p>
                            )}
                          </div>
                          {selectedSourceId === source.id && (
                            <div className="ml-2 flex-shrink-0">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {description && descriptionSource !== 'manual' && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-600 font-medium mb-1">已选内容预览：</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-3">
                  {description}
                </p>
              </div>
            )}
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
                  onChange={(e) => setDiscussionMode(e.target.value as 'parallel' | 'round-robin')}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="mode-round-robin" className="text-sm text-gray-700">
                  <div className="font-medium">轮流发言模式</div>
                  <div className="text-xs text-gray-500">专家按顺序依次发言，讨论更有条理</div>
                </label>
              </div>
            </div>
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

