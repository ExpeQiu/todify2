import React, { useState, useEffect } from 'react';
import { Search, Check, X } from 'lucide-react';
import aiRoleService from '@/services/aiRoleService';
import { AIRoleConfig } from '@/types/aiRole';

interface ExpertSelectorProps {
  selectedRoleIds: string[];
  onChange: (roleIds: string[]) => void;
  disabled?: boolean;
}

export const ExpertSelector: React.FC<ExpertSelectorProps> = ({
  selectedRoleIds,
  onChange,
  disabled = false,
}) => {
  const [roles, setRoles] = useState<AIRoleConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const roles = await aiRoleService.getAIRoles();
      // 只显示已启用的角色
      const enabledRoles = roles.filter(role => role.enabled);
      setRoles(enabledRoles);
    } catch (error) {
      console.error('加载AI角色失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleRole = (roleId: string) => {
    if (disabled) return;
    
    if (selectedRoleIds.includes(roleId)) {
      onChange(selectedRoleIds.filter(id => id !== roleId));
    } else {
      onChange([...selectedRoleIds, roleId]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 搜索框 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="搜索专家角色..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={disabled}
        />
      </div>

      {/* 角色列表 */}
      <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
        {filteredRoles.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {searchTerm ? '未找到匹配的角色' : '暂无可用的AI角色'}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredRoles.map((role) => {
              const isSelected = selectedRoleIds.includes(role.id);
              return (
                <div
                  key={role.id}
                  onClick={() => toggleRole(role.id)}
                  className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                    isSelected ? 'bg-blue-50' : ''
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      {role.avatar ? (
                        <img
                          src={role.avatar}
                          alt={role.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-500 text-sm font-medium">
                            {role.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900">{role.name}</div>
                        {role.description && (
                          <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {role.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="ml-2">
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 已选角色提示 */}
      {selectedRoleIds.length > 0 && (
        <div className="text-sm text-gray-600">
          已选择 {selectedRoleIds.length} 个专家角色
        </div>
      )}
    </div>
  );
};

