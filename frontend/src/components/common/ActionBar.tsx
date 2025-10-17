import React from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';

export interface ActionBarProps {
  // 左侧操作
  onRegenerate?: () => void;
  regenerateText?: string;
  showRegenerate?: boolean;
  hasContent?: boolean; // 新增：是否已有内容生成
  
  // 右侧操作
  onSaveDraft?: () => void;
  onSaveContent?: () => void;
  saveDraftText?: string;
  saveContentText?: string;
  saveContentIcon?: React.ReactNode;
  
  // 状态控制
  disabled?: boolean;
  isGenerating?: boolean;
  
  // 自定义样式
  className?: string;
  
  // 额外的左侧和右侧按钮
  leftActions?: React.ReactNode;
  rightActions?: React.ReactNode;
}

const ActionBar: React.FC<ActionBarProps> = ({
  onRegenerate,
  regenerateText = '重新生成',
  showRegenerate = true,
  hasContent = false,
  
  onSaveDraft,
  onSaveContent,
  saveDraftText = '保存草稿',
  saveContentText = '保存内容',
  saveContentIcon = <Sparkles className="w-4 h-4" />,
  
  disabled = false,
  isGenerating = false,
  
  className = '',
  
  leftActions,
  rightActions
}) => {
  // 根据是否有内容动态设置按钮文本
  const getRegenerateButtonText = () => {
    if (isGenerating) return '生成中...';
    if (hasContent) return '再次生成';
    return 'AI辅助生成';
  };

  return (
    <div className={`bg-white border-t border-gray-200 px-6 py-4 ${className}`}>
      <div className="flex items-center justify-between">
        {/* 左侧操作区域 */}
        <div className="flex items-center gap-4">
          {showRegenerate && onRegenerate && (
            <button 
              onClick={onRegenerate}
              disabled={disabled || isGenerating}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              {getRegenerateButtonText()}
            </button>
          )}
          {leftActions}
        </div>
        
        {/* 右侧操作区域 */}
        <div className="flex items-center gap-3">
          {onSaveDraft && (
            <button 
              onClick={onSaveDraft}
              disabled={disabled}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saveDraftText}
            </button>
          )}
          
          {onSaveContent && (
            <button 
              onClick={onSaveContent}
              disabled={disabled}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saveContentIcon}
              {saveContentText}
            </button>
          )}
          
          {rightActions}
        </div>
      </div>
    </div>
  );
};

export default ActionBar;