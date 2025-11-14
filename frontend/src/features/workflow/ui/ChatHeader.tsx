import React from 'react';
import { Plus, Search, Edit3, FileText } from 'lucide-react';

interface ChatHeaderProps {
  onResetConversation: () => void;
  onOpenHistory: () => void;
  onSave: () => void;
  onExport: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  onResetConversation,
  onOpenHistory,
  onSave,
  onExport,
}) => (
  <div className="chat-header">
    <div className="chat-status">
      <div className="status-indicator online" />
      <span>AI助手在线</span>
    </div>
    <div className="chat-actions">
      <button
        onClick={onResetConversation}
        className="flex items-center space-x-2 px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200 shadow-sm text-sm"
      >
        <Plus className="w-4 h-4" />
        <span>提一个新问题</span>
      </button>

      <button
        onClick={onOpenHistory}
        className="flex items-center space-x-2 px-3 py-1.5 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200 shadow-sm text-sm"
      >
        <Search className="w-4 h-4" />
        <span>搜索历史记录</span>
      </button>

      <button className="chat-action-btn" onClick={onSave}>
        <Edit3 size={16} />
        保存
      </button>
      <button className="chat-action-btn" onClick={onExport}>
        <FileText size={16} />
        导出
      </button>
    </div>
  </div>
);
