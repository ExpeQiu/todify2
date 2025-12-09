import React from 'react';
import { Trash2, Power, PowerOff, Download, X, Check } from 'lucide-react';
import { AIRoleConfig } from '../types/aiRole';

interface BulkActionsBarProps {
  selectedRoles: Set<string>;
  roles: AIRoleConfig[];
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkEnable: () => void;
  onBulkDisable: () => void;
  onBulkDelete: () => void;
  onBulkExport?: () => void;
  isProcessing?: boolean;
}

const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedRoles,
  roles,
  onSelectAll,
  onDeselectAll,
  onBulkEnable,
  onBulkDisable,
  onBulkDelete,
  onBulkExport,
  isProcessing = false
}) => {
  const selectedCount = selectedRoles.size;
  const allSelected = selectedCount > 0 && selectedCount === roles.length;
  const someSelected = selectedCount > 0 && selectedCount < roles.length;

  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 flex items-center justify-between flex-wrap gap-3 animate-in slide-in-from-top-2">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={allSelected ? onDeselectAll : onSelectAll}
            className={`p-1.5 rounded transition-colors ${
              allSelected
                ? 'bg-blue-600 text-white'
                : someSelected
                ? 'bg-blue-200 text-blue-700'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
            title={allSelected ? '取消全选' : '全选'}
          >
            {allSelected ? <Check size={18} /> : <X size={18} />}
          </button>
          <span className="text-sm font-semibold text-gray-900">
            已选择 <span className="text-blue-600">{selectedCount}</span> 个角色
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={onBulkEnable}
          disabled={isProcessing}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Power size={16} />
          批量启用
        </button>
        <button
          onClick={onBulkDisable}
          disabled={isProcessing}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PowerOff size={16} />
          批量禁用
        </button>
        {onBulkExport && (
          <button
            onClick={onBulkExport}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={16} />
            导出
          </button>
        )}
        <button
          onClick={onBulkDelete}
          disabled={isProcessing}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 size={16} />
          批量删除
        </button>
        <button
          onClick={onDeselectAll}
          disabled={isProcessing}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-semibold disabled:opacity-50"
        >
          取消选择
        </button>
      </div>
    </div>
  );
};

export default BulkActionsBar;
