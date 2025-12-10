import React from 'react';
import {
  Bot,
  Edit2,
  Trash2,
  Power,
  PowerOff,
  TestTube,
  MessageSquare,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Workflow,
  Cpu,
  FileText,
  ExternalLink
} from 'lucide-react';
import { AIRoleConfig } from '../types/aiRole';
import { AIRoleUsage } from '../services/aiRoleService';

interface RoleCardProps {
  role: AIRoleConfig;
  isSelected: boolean;
  onSelect: (roleId: string) => void;
  onEdit: (role: AIRoleConfig) => void;
  onDelete: (role: AIRoleConfig) => void;
  onToggleEnable: (role: AIRoleConfig) => void;
  onTest?: (role: AIRoleConfig) => void;
  onChat?: (role: AIRoleConfig) => void;
  usage?: AIRoleUsage;
  showUsage?: boolean;
}

const RoleCard: React.FC<RoleCardProps> = ({
  role,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onToggleEnable,
  onTest,
  onChat,
  usage,
  showUsage = false
}) => {
  const providerIcon = role.provider === 'direct-agent' ? Cpu : Workflow;
  const ProviderIcon = providerIcon;

  return (
    <div
      className={`bg-white rounded-lg border-2 shadow-sm hover:shadow-md transition-all duration-200 ${
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-200'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* 卡片头部 */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* 选择框 */}
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(role.id)}
              className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            />

            {/* 头像 */}
            {role.avatar ? (
              <img
                src={role.avatar}
                alt={role.name}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-200 flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center ring-2 ring-gray-200 flex-shrink-0">
                <Bot className="w-7 h-7 text-white" />
              </div>
            )}

            {/* 信息 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900 truncate text-base">
                  {role.name}
                </h3>
                {role.enabled ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                )}
              </div>
              <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                {role.description || '暂无描述'}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                {/* 类型标签 */}
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                    role.provider === 'direct-agent'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  <ProviderIcon size={12} />
                  {role.provider === 'direct-agent' ? '独立Agent' : 'Dify工作流'}
                </span>

                {/* 状态标签 */}
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    role.enabled
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {role.enabled ? '启用' : '禁用'}
                </span>

                {/* 来源标签 */}
                {role.source && (
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      role.source === 'smart-workflow'
                        ? 'bg-blue-100 text-blue-700'
                        : role.source === 'independent-page'
                        ? 'bg-green-100 text-green-700'
                        : role.source === 'agent-workflow'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {role.source === 'smart-workflow'
                      ? '智能工作流'
                      : role.source === 'independent-page'
                      ? '独立页面'
                      : role.source === 'agent-workflow'
                      ? '自编工作流'
                      : '自定义'}
                  </span>
                )}

                {/* 使用情况 */}
                {showUsage && usage && usage.totalUsageCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                    <FileText size={12} />
                    {usage.totalUsageCount}处使用
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 使用情况详情 */}
      {showUsage && usage && usage.totalUsageCount > 0 && (
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
          <div className="text-xs text-gray-600 mb-1">使用位置：</div>
          <div className="flex flex-wrap gap-1">
            {usage.locations.slice(0, 3).map((location, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-gray-200 rounded text-xs text-gray-700"
              >
                {location.type === 'agent-workflow' && <Workflow size={10} />}
                {location.type === 'multi-chat' && <MessageSquare size={10} />}
                {location.name}
              </span>
            ))}
            {usage.locations.length > 3 && (
              <span className="text-xs text-gray-500">
                +{usage.locations.length - 3} 更多
              </span>
            )}
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="p-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(role)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
            title="编辑"
          >
            <Edit2 size={14} />
            编辑
          </button>
          {onChat && (
            <button
              onClick={() => onChat(role)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors font-medium"
              title="对话测试"
            >
              <MessageSquare size={14} />
              测试
            </button>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onToggleEnable(role)}
            className={`p-2 rounded-lg transition-colors ${
              role.enabled
                ? 'text-yellow-600 hover:bg-yellow-50'
                : 'text-green-600 hover:bg-green-50'
            }`}
            title={role.enabled ? '禁用' : '启用'}
          >
            {role.enabled ? <PowerOff size={16} /> : <Power size={16} />}
          </button>
          <button
            onClick={() => onDelete(role)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="删除"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleCard;
