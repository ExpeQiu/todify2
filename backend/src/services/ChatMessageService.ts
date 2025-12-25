/**
 * ChatMessageService 占位符
 * 在项目瘦身后，聊天消息保存功能已移除
 * 此服务仅提供接口兼容性，不实际保存数据
 */

interface ConversationData {
  conversation_id: string;
  app_type?: string;
  session_name?: string;
  status?: string;
}

interface ChatMessageData {
  message_id: string;
  conversation_id: string;
  message_type: string;
  content: string;
  query?: string;
  app_type?: string;
  status?: string;
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

interface WorkflowResponseData {
  result: any;
  query: string;
  category: string;
  inputs?: any;
  conversationId?: string;
}

export class ChatMessageService {
  /**
   * 创建或更新对话会话（占位符，不实际保存）
   */
  static async upsertConversation(data: ConversationData): Promise<void> {
    // 已移除聊天功能，此方法仅用于兼容性
    return Promise.resolve();
  }

  /**
   * 保存聊天消息（占位符，不实际保存）
   */
  static async saveChatMessage(data: ChatMessageData): Promise<void> {
    // 已移除聊天功能，此方法仅用于兼容性
    return Promise.resolve();
  }

  /**
   * 获取对话消息（占位符，返回空数组）
   */
  static async getConversationMessages(
    conversationId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<any[]> {
    // 已移除聊天功能，返回空数组
    return Promise.resolve([]);
  }

  /**
   * 保存 Dify 工作流响应（占位符，不实际保存）
   */
  static async saveDifyWorkflowResponse(
    result: any,
    query: string,
    category: string,
    inputs?: any,
    conversationId?: string
  ): Promise<void> {
    // 已移除聊天功能，此方法仅用于兼容性
    return Promise.resolve();
  }

  /**
   * 保存 Dify 聊天响应（占位符，不实际保存）
   */
  static async saveDifyChatResponse(
    result: any,
    query: string,
    category: string,
    inputs?: any
  ): Promise<void> {
    // 已移除聊天功能，此方法仅用于兼容性
    return Promise.resolve();
  }
}

