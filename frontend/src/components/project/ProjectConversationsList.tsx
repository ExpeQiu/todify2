import React, { useState, useEffect } from 'react';
import { MessageSquare, Clock, Bot, User, ChevronRight } from 'lucide-react';
import ProjectConversationService from '../../services/projectConversationService';
import { ConversationRecord } from '../../services/chatHistoryService';

interface ProjectConversationsListProps {
  projectId: number;
  onConversationClick?: (conversation: ConversationRecord) => void;
}

const ProjectConversationsList: React.FC<ProjectConversationsListProps> = ({
  projectId,
  onConversationClick
}) => {
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);

  useEffect(() => {
    loadConversations();
  }, [projectId]);

  const loadConversations = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      const data = await ProjectConversationService.getProjectConversations(projectId, 50, 0);
      setConversations(data);
    } catch (error) {
      console.error('加载项目对话记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (days === 0) {
        return date.toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit'
        });
      } else if (days === 1) {
        return '昨天';
      } else if (days < 7) {
        return `${days}天前`;
      } else {
        return date.toLocaleDateString('zh-CN', {
          month: '2-digit',
          day: '2-digit'
        });
      }
    } catch {
      return '';
    }
  };

  const getAppTypeLabel = (appType: string) => {
    const labels: Record<string, string> = {
      'ai-search': 'AI问答',
      'tech-package': '技术包装',
      'tech-strategy': '技术策略',
      'tech-article': '技术文章',
      'brainstorm': '头脑风暴'
    };
    return labels[appType] || appType;
  };

  const getAppTypeColor = (appType: string) => {
    const colors: Record<string, string> = {
      'ai-search': 'bg-blue-100 text-blue-700',
      'tech-package': 'bg-purple-100 text-purple-700',
      'tech-strategy': 'bg-green-100 text-green-700',
      'tech-article': 'bg-orange-100 text-orange-700',
      'brainstorm': 'bg-pink-100 text-pink-700'
    };
    return colors[appType] || 'bg-gray-100 text-gray-700';
  };

  // 生成对话标题
  const getConversationTitle = (conversation: ConversationRecord): string => {
    // 如果 session_name 存在且不是 "unknown"，直接使用
    if (conversation.session_name && conversation.session_name.trim() && conversation.session_name.toLowerCase() !== 'unknown') {
      return conversation.session_name;
    }
    
    // 否则根据 app_type 生成标题
    const appTypeLabel = getAppTypeLabel(conversation.app_type);
    const dateStr = conversation.created_at ? formatDate(conversation.created_at) : '';
    
    return dateStr ? `${appTypeLabel} ${dateStr}` : `${appTypeLabel} 对话`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 pb-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">对话记录</h2>
        <p className="text-sm text-gray-500 mt-1">共 {conversations.length} 条对话</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <MessageSquare className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-sm">暂无对话记录</p>
          </div>
        ) : (
          conversations.map((conversation) => (
            <div
              key={conversation.conversation_id}
              onClick={() => onConversationClick?.(conversation)}
              className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {getConversationTitle(conversation)}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${getAppTypeColor(conversation.app_type)}`}
                    >
                      {getAppTypeLabel(conversation.app_type)}
                    </span>
                    {conversation.status && conversation.status !== 'active' && (
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                        {conversation.status === 'archived' ? '已归档' : '已删除'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(conversation.updated_at || conversation.created_at)}</span>
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProjectConversationsList;

