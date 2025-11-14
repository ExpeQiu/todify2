import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Copy, RotateCcw, ThumbsUp, ThumbsDown } from 'lucide-react';
import aiRoleService from '../services/aiRoleService';
import { AIRoleConfig, ConversationMessage } from '../types/aiRole';

interface AIRoleChatProps {
  roleConfig: AIRoleConfig;
  conversationId?: string;
  onConversationUpdate?: (conversationId: string) => void;
  onClose?: () => void;
  compact?: boolean;
}

const AIRoleChat: React.FC<AIRoleChatProps> = ({
  roleConfig,
  conversationId: initialConversationId,
  onConversationUpdate,
  onClose,
  compact = false
}) => {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(
    initialConversationId
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 当外部传入的conversationId变化时更新
  useEffect(() => {
    if (initialConversationId) {
      setCurrentConversationId(initialConversationId);
    }
  }, [initialConversationId]);

  // 自动滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ConversationMessage = {
      id: Date.now().toString(),
      content: inputMessage.trim(),
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    try {
      const result = await aiRoleService.chatWithRole(
        roleConfig.id,
        currentInput,
        {},
        currentConversationId
      );

      let responseContent = '抱歉，我无法处理您的请求。';

      if (result.success && result.data) {
        responseContent = result.data.answer || result.data.result || responseContent;

        // 更新conversationId以支持多轮对话
        if (result.data.conversation_id && result.data.conversation_id !== currentConversationId) {
          setCurrentConversationId(result.data.conversation_id);
          onConversationUpdate?.(result.data.conversation_id);
        }
      } else if (result.error) {
        responseContent = `处理请求时出现问题：${result.error}`;
      }

      const aiMessage: ConversationMessage = {
        id: (Date.now() + 1).toString(),
        content: responseContent,
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI角色对话失败:', error);

      const errorMessage: ConversationMessage = {
        id: (Date.now() + 1).toString(),
        content: `抱歉，服务暂时不可用。错误信息：${
          error instanceof Error ? error.message : '未知错误'
        }`,
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      console.log('消息已复制到剪贴板');
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  const handleRegenerate = async (messageId: string) => {
    const messageToRegenerate = messages.find(msg => msg.id === messageId);
    if (!messageToRegenerate || messageToRegenerate.role !== 'assistant') return;

    setMessages(prev =>
      prev.map(msg => (msg.id === messageId ? { ...msg, isRegenerating: true } : msg))
    );

    try {
      const result = await aiRoleService.chatWithRole(
        roleConfig.id,
        messageToRegenerate.content,
        {},
        currentConversationId
      );

      let responseContent = '抱歉，我无法处理您的请求。';

      if (result.success && result.data) {
        responseContent = result.data.answer || result.data.result || responseContent;
      } else if (result.error) {
        responseContent = `处理请求时出现问题：${result.error}`;
      }

      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId
            ? { ...msg, content: responseContent, isRegenerating: false, timestamp: new Date() }
            : msg
        )
      );
    } catch (error) {
      console.error('重新生成消息失败:', error);
      setMessages(prev =>
        prev.map(msg => (msg.id === messageId ? { ...msg, isRegenerating: false } : msg))
      );
    }
  };

  const handleLike = (messageId: string) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, liked: true, disliked: false } : msg
      )
    );
  };

  const handleDislike = (messageId: string) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, disliked: true, liked: false } : msg
      )
    );
  };

  return (
    <div className={`flex flex-col h-full ${compact ? 'bg-white' : 'bg-gray-50'} rounded-lg overflow-hidden`}>
      {/* 消息区域 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            {roleConfig.avatar ? (
              <img
                src={roleConfig.avatar}
                alt={roleConfig.name}
                className="w-16 h-16 rounded-full mb-4"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <Bot className="w-8 h-8 text-blue-600" />
              </div>
            )}
            <h3 className="text-lg font-medium text-gray-800 mb-2">{roleConfig.name}</h3>
            <p className="text-gray-600 text-sm max-w-md">{roleConfig.description}</p>
          </div>
        ) : (
          <>
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg group relative ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-800'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {message.role === 'assistant' && (
                      <Bot className="w-4 h-4 mt-1 text-blue-600 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <p
                          className={`text-xs ${
                            message.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                          }`}
                        >
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* AI消息的快捷操作 */}
                  {message.role === 'assistant' && (
                    <div className="absolute -right-2 top-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-white border border-gray-200 rounded-lg shadow-md p-0.5 z-10">
                      <button
                        onClick={() => handleCopy(message.content)}
                        className="flex items-center justify-center w-7 h-7 hover:bg-gray-100 rounded-md transition-colors"
                        title="复制"
                      >
                        <Copy className="w-3.5 h-3.5 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleRegenerate(message.id)}
                        disabled={message.isRegenerating}
                        className="flex items-center justify-center w-7 h-7 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="重新生成"
                      >
                        <RotateCcw
                          className={`w-3.5 h-3.5 text-gray-600 ${
                            message.isRegenerating ? 'animate-spin' : ''
                          }`}
                        />
                      </button>
                      <button
                        onClick={() => handleLike(message.id)}
                        className={`flex items-center justify-center w-7 h-7 hover:bg-gray-100 rounded-md transition-colors ${
                          message.liked ? 'bg-green-50 text-green-600' : 'text-gray-600'
                        }`}
                        title="点赞"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDislike(message.id)}
                        className={`flex items-center justify-center w-7 h-7 hover:bg-gray-100 rounded-md transition-colors ${
                          message.disliked ? 'bg-red-50 text-red-600' : 'text-gray-600'
                        }`}
                        title="点踩"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <Bot className="w-4 h-4 text-blue-600" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.1s' }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.2s' }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* 输入区域 */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入消息..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIRoleChat;

