import React, { useState, useEffect } from 'react';
import { X, MessageSquare, User, Bot, Clock } from 'lucide-react';
import { ConversationRecord, ChatMessageRecord } from '../../services/chatHistoryService';
import { ChatHistoryService } from '../../services/chatHistoryService';

interface ConversationDetailPanelProps {
  conversation: ConversationRecord;
  onClose?: () => void;
}

const ConversationDetailPanel: React.FC<ConversationDetailPanelProps> = ({
  conversation,
  onClose
}) => {
  const [messages, setMessages] = useState<ChatMessageRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMessages();
  }, [conversation.conversation_id]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await ChatHistoryService.getConversationMessages(conversation.conversation_id);
      if (response.success && response.data) {
        setMessages(response.data);
      }
    } catch (error) {
      console.error('加载消息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('zh-CN');
    } catch {
      return '';
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 头部 */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-purple-600" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {conversation.session_name && conversation.session_name.trim() && conversation.session_name.toLowerCase() !== 'unknown'
                ? conversation.session_name
                : conversation.created_at 
                  ? `${conversation.app_type || '对话'} ${new Date(conversation.created_at).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}`
                  : '对话详情'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">{conversation.app_type}</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">加载中...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <MessageSquare className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-sm">暂无消息</p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((message) => (
              <div
                key={message.message_id}
                className={`flex gap-3 ${message.message_type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.message_type === 'assistant' && (
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-purple-600" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.message_type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  {message.created_at && (
                    <div
                      className={`text-xs mt-2 ${
                        message.message_type === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}
                    >
                      {formatDate(message.created_at)}
                    </div>
                  )}
                </div>
                {message.message_type === 'user' && (
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationDetailPanel;

