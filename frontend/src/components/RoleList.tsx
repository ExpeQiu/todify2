import React from 'react';
import {
  Bot,
  Edit2,
  Trash2,
  Power,
  PowerOff,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Workflow,
  Cpu,
  FileText
} from 'lucide-react';
import { AIRoleConfig } from '../types/aiRole';
import { AIRoleUsage } from '../services/aiRoleService';

interface RoleListProps {
  roles: AIRoleConfig[];
  selectedRoles: Set<string>;
  onSelect: (roleId: string) => void;
  onSelectAll: () => void;
  onEdit: (role: AIRoleConfig) => void;
  onDelete: (role: AIRoleConfig) => void;
  onToggleEnable: (role: AIRoleConfig) => void;
  onChat?: (role: AIRoleConfig) => void;
  roleUsages?: Map<string, AIRoleUsage>;
  showUsage?: boolean;
}

const RoleList: React.FC<RoleListProps> = ({
  roles,
  selectedRoles,
  onSelect,
  onSelectAll,
  onEdit,
  onDelete,
  onToggleEnable,
  onChat,
  roleUsages,
  showUsage = false
}) => {
  const allSelected = roles.length > 0 && selectedRoles.size === roles.length;
  const someSelected = selectedRoles.size > 0 && selectedRoles.size < roles.length;

  // 检查 avatar 是否是有效的 URL
  const isValidAvatarUrl = (avatar: string | undefined): boolean => {
    if (!avatar) return false;
    // 如果包含 emoji 或不是以 http/https/data: 开头，则认为是无效 URL
    const emojiRegex = /[\u{1F300}-\u{1F9FF}]/u;
    if (emojiRegex.test(avatar)) return false;
    try {
      const url = new URL(avatar);
      return url.protocol === 'http:' || url.protocol === 'https:' || url.protocol === 'data:';
    } catch {
      // 如果不是有效的 URL，返回 false
      return false;
    }
  };

  if (roles.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Bot size={48} className="mx-auto mb-3 opacity-50" />
        <p className="text-base">暂无角色</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* 表头 */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-4">
          <input
            type="checkbox"
            checked={allSelected}
            ref={(input) => {
              if (input) input.indeterminate = someSelected;
            }}
            onChange={onSelectAll}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <div className="flex-1 grid grid-cols-12 gap-4 text-sm font-semibold text-gray-700">
            <div className="col-span-3">角色</div>
            <div className="col-span-2">类型</div>
            <div className="col-span-2">状态</div>
            <div className="col-span-2">来源</div>
            {showUsage && <div className="col-span-2">使用情况</div>}
            <div className={`col-span-${showUsage ? '1' : '3'} text-right`}>操作</div>
          </div>
        </div>
      </div>

      {/* 列表项 */}
      <div className="divide-y divide-gray-200">
        {roles.map((role) => {
          const usage = roleUsages?.get(role.id);
          const providerIcon = role.provider === 'direct-agent' ? Cpu : Workflow;
          const ProviderIcon = providerIcon;

          return (
            <div
              key={role.id}
              className={`px-4 py-3 hover:bg-gray-50 transition-colors ${
                selectedRoles.has(role.id) ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={selectedRoles.has(role.id)}
                  onChange={() => onSelect(role.id)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div className="flex-1 grid grid-cols-12 gap-4 items-center">
                  {/* 角色信息 */}
                  <div className="col-span-3 flex items-center gap-3 min-w-0">
                    {role.avatar && isValidAvatarUrl(role.avatar) ? (
                      <img
                        src={role.avatar}
                        alt={role.name}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        onError={(e) => {
                          // 如果图片加载失败，替换为默认图标
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className={`w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 ${role.avatar && isValidAvatarUrl(role.avatar) ? 'hidden' : ''}`}
                    >
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 truncate text-sm">
                          {role.name}
                        </h3>
                        {role.enabled ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600 truncate mt-0.5">
                        {role.description || '暂无描述'}
                      </p>
                    </div>
                  </div>

                  {/* 类型 */}
                  <div className="col-span-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                        role.provider === 'direct-agent'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      <ProviderIcon size={12} />
                      {role.provider === 'direct-agent' ? '独立Agent' : 'Dify工作流'}
                    </span>
                  </div>

                  {/* 状态 */}
                  <div className="col-span-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        role.enabled
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {role.enabled ? '启用' : '禁用'}
                    </span>
                  </div>

                  {/* 来源 */}
                  <div className="col-span-2">
                    {role.source ? (
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          role.source === 'smart-workflow'
                            ? 'bg-blue-100 text-blue-700'
                            : role.source === 'independent-page'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {role.source === 'smart-workflow'
                          ? '智能工作流'
                          : role.source === 'independent-page'
                          ? '独立页面'
                          : '自定义'}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </div>

                  {/* 使用情况 */}
                  {showUsage && (
                    <div className="col-span-2">
                      {usage && usage.totalUsageCount > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700">
                          <FileText size={12} />
                          {usage.totalUsageCount}处使用
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">未使用</span>
                      )}
                    </div>
                  )}

                  {/* 操作 */}
                  <div className={`col-span-${showUsage ? '1' : '3'} flex items-center justify-end gap-2`}>
                    <button
                      onClick={() => onEdit(role)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="编辑"
                    >
                      <Edit2 size={16} />
                    </button>
                    {onChat && (
                      <button
                        onClick={() => onChat(role)}
                        className="p-1.5 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                        title="对话测试"
                      >
                        <MessageSquare size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => onToggleEnable(role)}
                      className={`p-1.5 rounded transition-colors ${
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
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="删除"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RoleList;
