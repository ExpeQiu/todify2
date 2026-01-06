import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { ExpertSelector } from './ExpertSelector';
import { CreateBrainstormSessionDTO, BrainstormSessionConfig } from '@/types/brainstorm';
import aiRoleService from '@/services/aiRoleService';
import { AIRoleConfig } from '@/types/aiRole';

interface BrainstormSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateBrainstormSessionDTO) => Promise<void>;
  initialData?: Partial<CreateBrainstormSessionDTO>;
}

export const BrainstormSetupModal: React.FC<BrainstormSetupModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
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

  useEffect(() => {
    if (isOpen) {
      loadRoles();
    }
  }, [isOpen]);

  const loadRoles = async () => {
    try {
      const roles = await aiRoleService.getAIRoles();
      setAvailableRoles(roles.filter(role => role.enabled));
    } catch (error) {
      console.error('加载AI角色失败:', error);
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

