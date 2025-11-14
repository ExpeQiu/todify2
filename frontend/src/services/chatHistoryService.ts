import api from './api';

// 对话记录接口
export interface ConversationRecord {
  id?: number;
  conversation_id: string;
  user_id?: string;
  session_name?: string;
  app_type: string;
  status?: 'active' | 'archived' | 'deleted';
  metadata?: string;
  created_at?: string;
  updated_at?: string;
}

// 聊天消息接口
export interface ChatMessageRecord {
  id?: number;
  message_id: string;
  conversation_id: string;
  task_id?: string;
  message_type: 'user' | 'assistant';
  content: string;
  query?: string;
  inputs?: string;
  app_type: string;
  dify_event?: string;
  dify_mode?: string;
  dify_answer?: string;
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  total_price?: string;
  currency?: string;
  latency?: number;
  retriever_resources?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  created_at?: string;
  updated_at?: string;
}

// API响应接口
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  error?: string;
}

// 聊天历史服务
export class ChatHistoryService {
  /**
   * 获取用户的对话列表
   */
  static async getUserConversations(
    userId?: string,
    appType?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<ApiResponse<ConversationRecord[]>> {
    try {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (appType) params.append('appType', appType);
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());

      const response = await api.get(`/chat/conversations?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('API请求失败:', error);
      return {
        success: false,
        data: [],
        message: '获取对话列表失败',
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 获取指定对话的消息历史
   */
  static async getConversationMessages(
    conversationId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ApiResponse<ChatMessageRecord[]>> {
    try {
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());

      const response = await api.get(
        `/chat/conversations/${conversationId}/messages?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error('获取消息历史失败:', error);
      throw error;
    }
  }

  /**
   * 获取指定对话的详细信息
   */
  static async getConversationById(
    conversationId: string
  ): Promise<ApiResponse<ConversationRecord>> {
    try {
      const response = await api.get(`/chat/conversations/${conversationId}`);
      return response.data;
    } catch (error) {
      console.error('获取对话信息失败:', error);
      throw error;
    }
  }

  /**
   * 获取指定消息的详细信息
   */
  static async getMessageById(
    messageId: string
  ): Promise<ApiResponse<ChatMessageRecord>> {
    try {
      const response = await api.get(`/chat/messages/${messageId}`);
      return response.data;
    } catch (error) {
      console.error('获取消息信息失败:', error);
      throw error;
    }
  }

  /**
   * 搜索聊天历史
   */
  static async searchChatHistory(
    query: string,
    userId?: string,
    appType?: string,
    limit: number = 20
  ): Promise<ApiResponse<any>> {
    try {
      const response = await api.post('/chat/search', {
        query,
        userId,
        appType,
        limit
      });
      return response.data;
    } catch (error) {
      console.error('搜索聊天历史失败:', error);
      throw error;
    }
  }

  /**
   * 格式化对话记录为搜索历史格式
   */
  static formatConversationsForHistory(conversations: ConversationRecord[]) {
    return conversations.map(conv => ({
      id: conv.conversation_id,
      title: conv.session_name || '未命名对话',
      description: `${conv.app_type} 对话`,
      date: conv.created_at ? new Date(conv.created_at).toLocaleDateString('zh-CN') : '',
      time: conv.created_at ? new Date(conv.created_at).toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }) : '',
      type: conv.app_type,
      status: conv.status || 'active'
    }));
  }

  /**
   * 格式化消息记录为详细历史格式
   */
  static formatMessagesForDetail(messages: ChatMessageRecord[], conversation: ConversationRecord) {
    const userMessages = messages.filter(msg => msg.message_type === 'user');
    const assistantMessages = messages.filter(msg => msg.message_type === 'assistant');
    
    return {
      id: conversation.conversation_id,
      title: conversation.session_name || '未命名对话',
      date: conversation.created_at ? new Date(conversation.created_at).toLocaleDateString('zh-CN') : '',
      time: conversation.created_at ? new Date(conversation.created_at).toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }) : '',
      type: conversation.app_type,
      query: userMessages[0]?.content || '',
      result: assistantMessages[0]?.content || '',
      tokens: assistantMessages[0]?.total_tokens || 0,
      duration: assistantMessages[0]?.latency || 0,
      messages: messages.map(msg => ({
        id: msg.message_id,
        type: msg.message_type,
        content: msg.content,
        timestamp: msg.created_at ? new Date(msg.created_at).getTime() : Date.now()
      }))
    };
  }
}

export default ChatHistoryService;