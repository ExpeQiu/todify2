import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronDown, 
  ChevronRight, 
  ArrowLeft, 
  Clock, 
  User, 
  Bot, 
  Copy, 
  Search, 
  Filter,
  ChevronUp,
  X
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import ChatHistoryService, { ConversationRecord, ChatMessageRecord } from '../services/chatHistoryService';

interface DetailData {
  id: string;
  title: string;
  date: string;
  time: string;
  type: string;
  query: string;
  result: string;
  tokens: number;
  duration: number;
  messages: {
    id: string;
    type: 'user' | 'assistant';
    content: string;
    timestamp: number;
  }[];
}

const SearchHistoryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [detailData, setDetailData] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'assistant'>('all');

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError('无效的对话ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const conversationResponse = await ChatHistoryService.getConversationById(id);
        const messagesResponse = await ChatHistoryService.getConversationMessages(id);
        
        if (conversationResponse.success && messagesResponse.success && 
            conversationResponse.data && messagesResponse.data) {
          const conversation = conversationResponse.data;
          const messages = messagesResponse.data;
          
          const formattedData: DetailData = {
            id: conversation.conversation_id,
            title: conversation.session_name || '未命名对话',
            date: new Date(conversation.created_at || '').toLocaleDateString('zh-CN'),
            time: new Date(conversation.created_at || '').toLocaleTimeString('zh-CN'),
            type: 'conversation',
            query: '',
            result: '',
            tokens: 0,
            duration: 0,
            messages: messages.map((msg: ChatMessageRecord) => ({
              id: msg.message_id,
              type: msg.message_type,
              content: msg.content,
              timestamp: new Date(msg.created_at || '').getTime()
            }))
          };
          setDetailData(formattedData);
        } else {
          setError(conversationResponse.error || messagesResponse.error || '未找到对话数据');
        }
      } catch (err) {
        console.error('获取对话详情失败:', err);
        setError('获取对话详情失败');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const toggleMessage = (messageId: string) => {
    console.log('toggleMessage called with:', messageId);
    console.log('Current expandedMessages:', expandedMessages);
    
    setExpandedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
        console.log('Removing message from expanded set');
      } else {
        newSet.add(messageId);
        console.log('Adding message to expanded set');
      }
      console.log('New expandedMessages:', newSet);
      return newSet;
    });
  };

  const copyToClipboard = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const formatContent = (content: string) => {
    return content.length > 100 ? content.substring(0, 100) + '...' : content;
  };

  const filteredMessages = detailData?.messages.filter(message => {
    const matchesSearch = searchTerm === '' || 
      message.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = roleFilter === 'all' || message.type === roleFilter;
    return matchesSearch && matchesFilter;
  }) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <X className="h-12 w-12 mx-auto" />
          </div>
          <p className="text-red-800 font-medium mb-2">加载失败</p>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  if (!detailData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">未找到对话数据</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 顶部导航栏 */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/history')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="hidden sm:inline">返回历史记录</span>
              </button>
              <div className="h-6 w-px bg-gray-300 hidden sm:block" />
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                对话详情
              </h1>
            </div>

            {/* 搜索框 */}
            <div className="flex-1 max-w-md mx-4 hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索消息内容..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* 筛选器 */}
            <div className="flex items-center space-x-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as 'all' | 'user' | 'assistant')}
                className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">全部</option>
                <option value="user">用户</option>
                <option value="assistant">助手</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 对话信息卡片 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                {detailData.title}
              </h2>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {detailData.date} {detailData.time}
                </span>
                <span className="flex items-center">
                  <Filter className="h-4 w-4 mr-1" />
                  {filteredMessages.length} 条消息
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 消息列表 */}
        <div className="space-y-4">
          {filteredMessages.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium mb-2">没有找到匹配的消息</p>
              <p className="text-gray-500 text-sm">
                {searchTerm || roleFilter !== 'all' 
                  ? '尝试调整搜索条件或筛选器' 
                  : '这个对话还没有任何消息'}
              </p>
            </div>
          ) : (
            filteredMessages.map((message) => (
              <div
                key={message.id}
                className={`group relative bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md ${
                  searchTerm && message.content.toLowerCase().includes(searchTerm.toLowerCase())
                    ? 'ring-2 ring-yellow-200 bg-yellow-50'
                    : ''
                }`}
              >
                {/* 消息头部 */}
                <div 
                  className={`flex items-center justify-between p-4 transition-all duration-200 ${
                    message.type === 'user' 
                      ? 'bg-blue-50 hover:bg-blue-100' 
                      : 'bg-green-50 hover:bg-green-100'
                  }`}
                >
                  <div className="flex items-center">
                    {message.type === 'user' ? (
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-4">
                        <User className="w-5 h-5 text-white" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-4">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold text-gray-800 text-lg">
                        {message.type === 'user' ? '用户' : 'AI助手'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {new Date(message.timestamp).toLocaleString('zh-CN')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(message.content, message.id);
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white hover:bg-opacity-50 rounded-lg transition-colors"
                        title="复制内容"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleMessage(message.id)}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors duration-200 font-medium"
                      >
                        {expandedMessages.has(message.id) ? (
                          <>
                            <ChevronUp className="w-4 h-4 transition-transform duration-200" />
                            收起
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4 transition-transform duration-200" />
                            展开
                          </>
                        )}
                      </button>
                    </div>
                </div>

                {/* 展开的消息内容 */}
                 <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                   expandedMessages.has(message.id) 
                     ? 'max-h-screen opacity-100' 
                     : 'max-h-0 opacity-0'
                 }`}>
                   <div className="p-6 border-t bg-white">
                     <div className="prose prose-sm max-w-none">
                       <ReactMarkdown
                         rehypePlugins={[rehypeHighlight]}
                         components={{
                           code: ({ className, children, ...props }) => {
                             const match = /language-(\w+)/.exec(className || '');
                             const isInline = !match;
                             
                             return isInline ? (
                               <code className="bg-gray-100 text-red-600 px-1 py-0.5 rounded text-sm font-mono" {...props}>
                                 {children}
                               </code>
                             ) : (
                               <code className={className} {...props}>
                                 {children}
                               </code>
                             );
                           },
                           blockquote: ({ children }) => (
                             <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 my-4">
                               {children}
                             </blockquote>
                           ),
                         }}
                       >
                         {message.content}
                       </ReactMarkdown>
                     </div>
                     {copiedMessageId === message.id && (
                       <div className="mt-3 text-sm text-green-600 font-medium animate-fade-in">
                         ✓ 已复制到剪贴板
                       </div>
                     )}
                   </div>
                 </div>

                {/* 收起状态下的预览 */}
                <div className={`transition-all duration-300 ease-in-out ${
                  expandedMessages.has(message.id) 
                    ? 'max-h-0 opacity-0 overflow-hidden' 
                    : 'max-h-screen opacity-100'
                }`}>
                  <div className="p-6 bg-gray-50">
                    <div className="text-gray-600 text-sm line-clamp-3">
                      {formatContent(message.content)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchHistoryDetailPage;